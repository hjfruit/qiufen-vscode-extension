import * as path from 'path'

import { fetchTypeDefs } from '@fruits-chain/qiufen-pro-helpers'
import { json } from 'body-parser'
import cors from 'cors'
import express from 'express'
import portscanner from 'portscanner'

import type { GraphqlKitConfig } from '@/client/interface'
import type { JsonSettingsType } from '@/server/src/utils/getWorkspaceConfig'

import { requestGroupedSdl } from './requestGroupedSdl'
import getIpAddress from './utils/getIpAddress'
import readLocalSchemaTypeDefs from './utils/readLocalSchemaTypeDefs'
import {
  getWorkspaceGqls,
  fillOperationInWorkspace,
  getWorkspaceAllGqlsNameAndData,
} from './utils/syncWorkspaceGqls'

import type { ReturnTypeGetWorkspaceGqlFileInfo } from './utils/syncWorkspaceGqls'
import type { _Connection } from 'vscode-languageserver'

type DocServerParams = {
  qiufenConfig: GraphqlKitConfig
  jsonSettings: JsonSettingsType
  connection: _Connection
  workspaceRootPath: string
}
export async function startDocServer(params: DocServerParams) {
  const { qiufenConfig, jsonSettings, connection, workspaceRootPath } = params
  const { endpoint, port, openGrouped } = qiufenConfig

  const app = express()
  app.use(cors())
  app.use(json({ limit: Infinity }))

  let backendTypeDefs: string
  let localTypeDefs: string
  let workspaceGqlNamesData: string[]
  let workspaceGqlFileInfoData: ReturnTypeGetWorkspaceGqlFileInfo

  if (openGrouped) {
    /** 需要分组 */
    backendTypeDefs = await requestGroupedSdl(endpoint.url)
  } else {
    /** 获取远程schema */
    backendTypeDefs = await fetchTypeDefs(endpoint.url)
  }

  /** 获取本地工作区的schema内容 */
  localTypeDefs = readLocalSchemaTypeDefs({
    filePath: jsonSettings.patternSchemaRelativePath,
    workspaceRootPath,
    connection,
  })
  /** 获取工作区所有 gql接口名称，gql接口ast和相关数据 */
  const { workspaceGqlNames, workspaceGqlFileInfo } =
    getWorkspaceAllGqlsNameAndData({
      connection,
      jsonSettings,
      workspaceRootPath,
    })

  workspaceGqlNamesData = workspaceGqlNames
  workspaceGqlFileInfoData = workspaceGqlFileInfo

  app.get('/operations', async (_, res) => {
    try {
      res.send({
        schemaUrl: endpoint.url,
        isAllAddComment: jsonSettings.isAllAddComment,
        typeDefs: backendTypeDefs,
        maxDepth: jsonSettings.maxDepth,
        localTypeDefs: localTypeDefs,
        workspaceGqlNames: workspaceGqlNamesData,
        workspaceGqlFileInfo: workspaceGqlFileInfoData,
        port,
        IpAddress: getIpAddress(),
      })
    } catch (error) {
      res.status(403).send({ error })
    }
  })

  app.get('/listen', async (_, res) => {
    let lastSdl = ''
    try {
      // 这里再次获取后端sdl，是因为web网页在reload时要及时更新
      if (openGrouped) {
        lastSdl = await requestGroupedSdl(endpoint.url)
      } else {
        /** 获取远程schema */
        lastSdl = await fetchTypeDefs(endpoint.url)
      }

      res.send({
        lastSdl,
        typeDefs: backendTypeDefs,
      })
    } catch (error) {
      res.status(403).send({ error })
    }
  })

  app.get('/reload/operations', async (_, res) => {
    try {
      // 这里再次获取后端sdl，是因为web网页在reload时要及时更新
      if (openGrouped) {
        backendTypeDefs = await requestGroupedSdl(endpoint.url)
      } else {
        /** 获取远程schema */
        backendTypeDefs = await fetchTypeDefs(endpoint.url)
      }
      /** 这里再次获取本地工作区的schema内容 */
      localTypeDefs = readLocalSchemaTypeDefs({
        filePath: jsonSettings.patternSchemaRelativePath,
        workspaceRootPath,
        connection,
      })
      /** 这里再次获取工作区所有 gql接口名称，gql接口ast和相关数据 */
      const {
        workspaceGqlNames: newWorkspaceGqlNames,
        workspaceGqlFileInfo: newWorkspaceGqlFileInfo,
      } = getWorkspaceAllGqlsNameAndData({
        connection,
        jsonSettings,
        workspaceRootPath,
      })

      workspaceGqlNamesData = newWorkspaceGqlNames
      workspaceGqlFileInfoData = newWorkspaceGqlFileInfo

      res.send({
        schemaUrl: endpoint.url,
        isAllAddComment: jsonSettings.isAllAddComment,
        typeDefs: backendTypeDefs,
        maxDepth: jsonSettings.maxDepth,
        localTypeDefs: localTypeDefs,
        workspaceGqlNames: workspaceGqlNamesData,
        workspaceGqlFileInfo: workspaceGqlFileInfoData,
        port,
        IpAddress: getIpAddress(),
      })
    } catch (error) {
      res.status(403).send({ error })
    }
  })

  app.post('/update', async (req, res) => {
    const { operationStr, gqlName } = req.body

    try {
      const workspaceRes = await getWorkspaceGqls({
        patternRelativePath: jsonSettings.patternRelativePath,
        gqlName,
        workspaceRootPath,
        connection,
      })

      if (workspaceRes?.length > 1) {
        // 如果需要更新的gql存在于本地多个文件夹
        res.send({ message: workspaceRes })
      } else {
        // 本地更新时需要全字段comment ---> true，所以传入 true
        fillOperationInWorkspace(
          workspaceRes[0].filename,
          operationStr,
          workspaceRes[0].document,
          true,
        )
        res.send({ message: '一键更新成功' })
      }
    } catch (error) {
      res.status(406).send({ message: error })
    }
  })

  app.post('/multiple', async (req, res) => {
    const { info, gql } = req.body
    info.forEach((infoItm: ReturnTypeGetWorkspaceGqlFileInfo[0]) => {
      // 本地更新时需要全字段comment ---> true，所以传入 true
      fillOperationInWorkspace(infoItm.filename, gql, infoItm.document, true)
    })
    res.send({ message: '一键填入成功' })
  })

  app.use(express.static(path.resolve(__dirname, '../dist-page-view')))
  // 处理所有路由请求，返回React应用的HTML文件
  app.get('*', (_, res) => {
    res.sendFile(path.resolve(__dirname, '../dist-page-view', 'index.html'))
  })

  const newPort = await portscanner.findAPortNotInUse([
    port + 1,
    port + 2,
    5567,
  ])
  const expressServer = app.listen(
    newPort /* , () => {
    console.log(`Server listening on port http://localhost:${newPort}/graphql`)
  } */,
  )
  return { expressServer, resPort: newPort }
}

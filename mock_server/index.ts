import fs from 'fs'
import path from 'path'

import { fetchTypeDefs } from '@fruits-chain/qiufen-pro-helpers'
import { addMocksToSchema } from '@graphql-tools/mock'
import { makeExecutableSchema } from '@graphql-tools/schema'
import BodyParser from 'body-parser'
import nodeFetch from 'cross-fetch'
import express from 'express'
import { graphql, parse } from 'graphql'
import portscanner from 'portscanner'

import type { GraphqlKitConfig } from '@/client/interface'

import type { OperationDefinitionNode } from 'graphql'
import type { _Connection } from 'vscode-languageserver'

type StartMockServerParams = {
  qiufenConfigs: GraphqlKitConfig
  connection: _Connection
  workspaceRootPath: string
}
export async function startMockingServer(params: StartMockServerParams) {
  const { qiufenConfigs, connection, workspaceRootPath } = params

  let typeDefsSDL = ''
  if (qiufenConfigs?.schemaPolicy === 'remote') {
    typeDefsSDL = await fetchTypeDefs(
      qiufenConfigs?.endpoint?.url,
      15000,
      qiufenConfigs?.requestHeaders?.authorization,
    )
  } else {
    const localSchemaFilePath = path.join(
      workspaceRootPath,
      qiufenConfigs?.localSchemaFile || '',
    )
    typeDefsSDL = fs.readFileSync(localSchemaFilePath)?.toString()
  }

  try {
    await portscanner.findAPortNotInUse([qiufenConfigs?.port])
  } catch (error) {
    throw new Error(`Mocking port ${qiufenConfigs?.port} is already in use...`)
  }

  const schema = makeExecutableSchema({ typeDefs: typeDefsSDL })
  const schemaWithMocks = addMocksToSchema({
    schema,
    mocks: qiufenConfigs?.mock?.scalarMap,
    resolvers: qiufenConfigs?.mock?.resolvers,
  })

  const app = express()
  const { json } = BodyParser
  app.use(json({ limit: Infinity }))

  // 添加拦截逻辑
  app.use('/graphql', async (req, res) => {
    const query = req.body.query
    const operationVariables = req.body.variables
    const operationName = req.body.operationName
    const operationType = (
      parse(query).definitions[0] as OperationDefinitionNode
    ).operation

    const queries = qiufenConfigs?.mock?.operations?.query?.map(
      v => `query${v}`,
    )
    const mutations = qiufenConfigs?.mock?.operations?.mutation?.map(
      v => `mutation${v}`,
    )
    const subscriptions = qiufenConfigs?.mock?.operations?.subscription?.map(
      v => `subscription${v}`,
    )
    const requestOperationTypeName = operationType + operationName
    const isTheOperationNeededMocking =
      queries?.includes(requestOperationTypeName) ||
      mutations?.includes(requestOperationTypeName) ||
      subscriptions?.includes(requestOperationTypeName)

    if (
      qiufenConfigs?.mock?.openAllOperationsMocking ||
      isTheOperationNeededMocking
    ) {
      const result = await graphql({
        schema: schemaWithMocks,
        source: query,
        variableValues: operationVariables,
      })

      res.send(result)
    } else {
      const resJson = await nodeFetch(qiufenConfigs?.endpoint?.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          authorization: qiufenConfigs?.requestHeaders?.authorization || '',
        },
        body: JSON.stringify({
          query,
          variables: operationVariables,
        }),
      })

      const resData = await resJson.json()
      res.send(resData)
    }
  })

  const server = app.listen(qiufenConfigs?.port, () => {
    connection.window.showInformationMessage(
      `🚀 Mocking server listening at: http://localhost:${qiufenConfigs?.port}/graphql`,
    )
  })

  return server
}

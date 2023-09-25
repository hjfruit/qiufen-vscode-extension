import fs from 'fs'
import * as path from 'path'

import type { GraphqlKitConfig } from '@/client/interface'

import { defaultQiufenConfig } from '../config'

import type { _Connection } from 'vscode-languageserver'

export type JsonSettingsType = {
  directive: string
  port: number
  endpointUrl: string
  isAllAddComment: boolean
  maxDepth: number
  patternRelativePath: string
  patternSchemaRelativePath: string
}

type GetConfigurationParams = {
  connection: _Connection
  workspaceRootPath: string
  tryCatchCallback?: () => void
}
export async function getConfiguration(params: GetConfigurationParams) {
  const { connection, workspaceRootPath, tryCatchCallback } = params

  const jsonSettings = (await connection.workspace.getConfiguration(
    'graphql-qiufen-pro',
  )) as unknown as JsonSettingsType
  const { port: jsonSettingPort, endpointUrl } = jsonSettings

  const qiufenConfigPath = path.join(workspaceRootPath!, 'qiufen.config.js')
  const qiufenConfigPathOfCjs = path.join(
    workspaceRootPath!,
    'qiufen.config.cjs',
  )

  const isExistConfigFile = fs.existsSync(qiufenConfigPath)
  const isExistConfigFileOfCjs = fs.existsSync(qiufenConfigPathOfCjs)

  let qiufenConfig: GraphqlKitConfig | undefined
  let port: number | undefined
  let url: string | undefined

  // 1. 当两种配置文件都存在时，抛出错误
  if (isExistConfigFile && isExistConfigFileOfCjs) {
    throw 'There are two types of qiufen configurations'
  }

  // 2. 当只存在 .js 后缀配置时
  if (isExistConfigFile && !isExistConfigFileOfCjs) {
    /** 去除require缓存 */
    delete eval('require.cache')[qiufenConfigPath]
    try {
      qiufenConfig = eval('require')(qiufenConfigPath) as GraphqlKitConfig
    } catch (error) {
      tryCatchCallback?.()
      throw error
    }
    port = qiufenConfig.port || jsonSettingPort
    url = qiufenConfig.endpoint?.url || endpointUrl
  }

  // 3. 当只存在 .cjs 后缀配置时
  if (isExistConfigFileOfCjs && !isExistConfigFile) {
    /** 去除require缓存 */
    delete eval('require.cache')[qiufenConfigPathOfCjs]
    try {
      qiufenConfig = eval('require')(qiufenConfigPathOfCjs) as GraphqlKitConfig
    } catch (error) {
      tryCatchCallback?.()
      throw error
    }
    port = qiufenConfig.port || jsonSettingPort
    url = qiufenConfig.endpoint?.url || endpointUrl
  }

  // 4. 两种配置都不存在时
  if (!isExistConfigFile && !isExistConfigFileOfCjs) {
    port = jsonSettingPort
    url = endpointUrl
  }

  if (!port || !url) {
    throw 'Qiufen configuration is not ready'
  }

  // 合并插件的jsonSetting和qiufen.config配置，得到最终的配置内容
  const qiufenConfigResult = {
    port,
    endpoint: {
      url,
    },
    localSchemaFile: qiufenConfig?.localSchemaFile || '',
    schemaPolicy: qiufenConfig?.schemaPolicy || 'remote',
    requestHeaders: qiufenConfig?.requestHeaders || {},
    mock: {
      openAllOperationsMocking:
        qiufenConfig?.mock?.openAllOperationsMocking ||
        defaultQiufenConfig?.mock?.openAllOperationsMocking,
      scalarMap:
        qiufenConfig?.mock?.scalarMap || defaultQiufenConfig?.mock?.scalarMap,
      resolvers:
        qiufenConfig?.mock?.resolvers || defaultQiufenConfig?.mock?.resolvers,
      operations: qiufenConfig?.mock?.operations || {
        query: [],
        mutation: [],
        subscription: [],
      },
    },
  }

  return { qiufenConfigResult, jsonSettingsResult: jsonSettings }
}

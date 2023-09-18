import path from 'path'

import { startMockingServer } from '@fruits-chain/qiufen-pro-graphql-mock'
import portscanner from 'portscanner'

import type { GraphqlKitConfig } from '@fruits-chain/qiufen-pro-graphql-mock'
import type { _Connection } from 'vscode-languageserver'

type StartMockServerParams = {
  qiufenConfigs: GraphqlKitConfig
  connection: _Connection
  workspaceRootPath: string
}
export async function startMockServer(params: StartMockServerParams) {
  const { qiufenConfigs, connection, workspaceRootPath } = params

  try {
    await portscanner.findAPortNotInUse([qiufenConfigs?.port])
  } catch (error) {
    throw new Error(`Mocking port ${qiufenConfigs?.port} is already in use...`)
  }

  const localSchemaFile = path.join(
    workspaceRootPath,
    qiufenConfigs?.localSchemaFile || '',
  )

  const { startStandaloneServer: startStandaloneServer1, server } =
    await startMockingServer(qiufenConfigs, localSchemaFile)
  const url = await startStandaloneServer1()

  connection.window.showInformationMessage(
    `🚀 Mocking server listening at: ${url}`,
  )
  return server
}

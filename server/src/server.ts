import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import { uriToFsPath } from 'vscode-uri/lib/umd/uri'

import {
  Doc_Close,
  Doc_Start,
  Mock_Close,
  Mock_Start,
} from '@/client/eventNames'
import { startDocServer } from '@/doc_server'
import { startMockingServer } from '@/mock_server'

import { getConfiguration } from './utils/getWorkspaceConfig'

import type { JsonSettingsType } from './utils/getWorkspaceConfig'
import type { GraphqlKitConfig } from '@fruits-chain/qiufen-pro-graphql-mock'
import type { Server } from 'http'

let docServer: Server
let mockServer: Server

const connection = createConnection(ProposedFeatures.all)
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)
documents.listen(connection)

connection.onInitialize(() => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
    },
  }
})

connection.onInitialized(async () => {
  connection.onRequest(Doc_Start, async () => {
    const workspaceRootPath = await getWorkspaceRootPath()
    let serverPort: number | undefined
    let qiufenConfig: GraphqlKitConfig | undefined
    let jsonSettings: JsonSettingsType

    try {
      const { qiufenConfigResult, jsonSettingsResult } = await getConfiguration(
        {
          workspaceRootPath,
          connection,
        },
      )
      qiufenConfig = qiufenConfigResult
      jsonSettings = jsonSettingsResult
    } catch (error) {
      connection.window.showErrorMessage(
        (error as Error).message || (error as string),
      )
      return Promise.resolve(false)
    }

    try {
      const { expressServer, resPort } = await startDocServer({
        qiufenConfig,
        jsonSettings,
        connection,
        workspaceRootPath,
      })
      docServer = expressServer
      serverPort = resPort
    } catch (error) {
      connection.window.showErrorMessage(
        (error as Error)?.message || (error as string),
      )
      return Promise.resolve(false)
    }

    return Promise.resolve(serverPort)
  })
  connection.onRequest(Doc_Close, () => {
    return new Promise(resolve => {
      docServer?.close(error => {
        if (error) {
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  })

  connection.onRequest(Mock_Start, async () => {
    const workspaceRootPath = await getWorkspaceRootPath()
    let qiufenConfig: GraphqlKitConfig | undefined

    try {
      const { qiufenConfigResult } = await getConfiguration({
        workspaceRootPath,
        connection,
      })
      qiufenConfig = qiufenConfigResult
    } catch (error) {
      connection.window.showErrorMessage(
        (error as Error).message || (error as string),
      )
      return Promise.resolve(false)
    }

    try {
      mockServer = await startMockingServer({
        qiufenConfigs: qiufenConfig,
        connection,
        workspaceRootPath,
      })
    } catch (error) {
      connection.window.showErrorMessage(
        (error as Error)?.message || (error as string),
      )
      return Promise.resolve(false)
    }

    return Promise.resolve(true)
  })
  connection.onRequest(Mock_Close, async () => {
    await mockServer?.close()
    return Promise.resolve(true)
  })
})

/** 获取工作区根目录路径 */
async function getWorkspaceRootPath() {
  const workspaceFolders = await connection.workspace.getWorkspaceFolders()
  const workspaceRootPathUri = URI.parse(workspaceFolders?.[0].uri || '')
  const workspaceRootPath = uriToFsPath(workspaceRootPathUri, true)
  return workspaceRootPath
}

// documents.onDidSave(evt => {
//   const qiufenConfigFilenameUri = URI.parse(evt.document.uri || '')
//   const qiufenConfigPath = uriToFsPath(qiufenConfigFilenameUri, true)
//   const basename = path.basename(qiufenConfigPath)

//   if (basename === 'qiufen.config.js' || basename === 'qiufen.config.cjs') {
//   }
// })

// connection.onDidChangeWatchedFiles(_change => {})

connection.listen() // Listen on the connection

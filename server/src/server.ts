import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import { uriToFsPath } from 'vscode-uri/lib/umd/uri'

import { Doc_Close, Doc_Start } from '@/client/eventNames'
import { startDocServer } from '@/doc_server'

import { getConfiguration } from './utils/getWorkspaceConfig'

import type { JsonSettingsType } from './utils/getWorkspaceConfig'
import type { GraphqlKitConfig } from '@fruits-chain/qiufen-pro-graphql-mock'
import type { Server } from 'http'

const connection = createConnection(ProposedFeatures.all)
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)
documents.listen(connection)

let docServer: Server

connection.onInitialize(() => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: {
        resolveProvider: true,
      },
    },
  }
})

connection.onInitialized(async () => {
  const workspaceFolders = await connection.workspace.getWorkspaceFolders()
  const workspaceRootPathUri = URI.parse(workspaceFolders?.[0].uri || '')
  const workspaceRootPath = uriToFsPath(workspaceRootPathUri, true)

  connection.onRequest(Doc_Start, async () => {
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
      connection.window.showErrorMessage(error as string)
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

  connection.onRequest(Doc_Close, async () => {
    docServer.close()
    return Promise.resolve(true)
  })
})

// documents.onDidSave(evt => {
// connection.window.showInformationMessage(evt.document.getText())
// })

// connection.onDidChangeWatchedFiles(_change => {})

connection.listen() // Listen on the connection

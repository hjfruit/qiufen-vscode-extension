import * as path from 'path'

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import { uriToFsPath } from 'vscode-uri/lib/umd/uri'

const connection = createConnection(ProposedFeatures.all)
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)
documents.listen(connection)

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
  const qiufenConfigPath = path.join(workspaceRootPath, 'qiufen.config.js')

  delete eval('require.cache')[qiufenConfigPath]
  const config = eval('require')(qiufenConfigPath)

  connection.window.showInformationMessage(
    `🚀wwww listening at: ${config.endpoint.url}`,
  )
  connection.window.showInformationMessage(
    `🚀wwww listening at: ${JSON.stringify(config.mock.scalarMap.Int())}`,
  )

  // connection.onRequest('get/workspaceRootPath', workspaceRoot => {
  //   const qiufenConfigPath = path.join(workspaceRoot, 'qiufen.config.js')
  //   delete eval('require.cache')[qiufenConfigPath]
  //   const config = eval('require')(qiufenConfigPath)

  //   connection.window.showInformationMessage(
  //     `🚀wwww listening at: ${config.endpoint.url}`,
  //   )
  //   connection.window.showInformationMessage(
  //     `🚀wwww listening at: ${JSON.stringify(config.mock.scalarMap.Int())}`,
  //   )

  //   return config
  // })
})

documents.onDidSave(evt => {
  connection.window.showInformationMessage(evt.document.getText())
})

connection.onDidChangeWatchedFiles(_change => {})

// Listen on the connection
connection.listen()

import * as path from 'path'

import {
  workspace,
  window,
  commands,
  env,
  Uri,
  StatusBarAlignment,
} from 'vscode'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'

import type { JsonSettingsType } from 'src/utils/getWorkspaceConfig'
import type { ExtensionContext, StatusBarItem, WebviewPanel } from 'vscode'
import type {
  LanguageClientOptions,
  ServerOptions,
} from 'vscode-languageclient/node'

let client: LanguageClient
let docStatusBarItem: StatusBarItem
let mockStatusBarItem: StatusBarItem

const GraphqlQiufenProCloseDocCommandId = 'graphql-qiufen-pro.qiufenClosed'
const GraphqlQiufenProStartDocCommandId = 'graphql-qiufen-pro.qiufenStart'
const GraphqlQiufenProCloseMockCommandId = 'graphql-qiufen-pro.qiufenMockClosed'
const GraphqlQiufenProStartMockCommandId = 'graphql-qiufen-pro.qiufenMockStart'

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(
    path.join('dist', 'dist_server.js'),
  )

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'javascript' }],
  }

  client = new LanguageClient(
    'QiufenLanguageServer',
    'Qiufen Server',
    serverOptions,
    clientOptions,
  )

  client.start()

  context.subscriptions.push(
    commands.registerCommand(GraphqlQiufenProCloseMockCommandId, () => {}),
    commands.registerCommand(GraphqlQiufenProStartMockCommandId, () => {}),

    commands.registerCommand(GraphqlQiufenProCloseDocCommandId, () => {}),
    commands.registerCommand(GraphqlQiufenProStartDocCommandId, () => {}),
  )

  // 设置底部bar图标
  docStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)
  mockStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)

  updateStatusBarItem(
    GraphqlQiufenProStartDocCommandId,
    `$(play) Qiufen Start`,
    docStatusBarItem,
    'Open Qiufen Doc Server',
  )
  docStatusBarItem.show()

  updateStatusBarItem(
    GraphqlQiufenProStartMockCommandId,
    `$(lightbulb) Mock`,
    mockStatusBarItem,
    'Open Qiufen Mock Server',
  )
  mockStatusBarItem.show()
}

function loadingStatusBarItem(
  statusBarItem: StatusBarItem,
  text: string,
  tooltip: string,
) {
  statusBarItem.text = `$(sync~spin) ${text}...`
  statusBarItem.tooltip = tooltip
  statusBarItem.color = undefined
  statusBarItem.command = undefined
  statusBarItem.show()
}

function updateStatusBarItem(
  commandId: string,
  text: string,
  statusBarItem: StatusBarItem,
  tooltip: string,
  color?: string,
) {
  statusBarItem.command = commandId
  statusBarItem.text = text
  statusBarItem.tooltip = tooltip
  statusBarItem.color = color
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined
  }
  return client.stop()
}

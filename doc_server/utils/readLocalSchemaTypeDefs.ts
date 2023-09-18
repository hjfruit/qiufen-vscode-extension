import fs from 'fs'
import * as path from 'path'

import { buildSchema } from 'graphql'

import type { _Connection } from 'vscode-languageserver'

type ReadLocalSchemaTypeDefsParams = {
  filePath: string
  workspaceRootPath: string
  connection: _Connection
}

function readLocalSchemaTypeDefs(params: ReadLocalSchemaTypeDefsParams) {
  const { filePath, workspaceRootPath, connection } = params
  const localSchemaPath = path.join(workspaceRootPath, filePath)

  let localTypeDefs = ''

  try {
    localTypeDefs = fs.readFileSync(localSchemaPath).toString()
  } catch (err) {
    connection.window.showWarningMessage('read local schema failed')
    localTypeDefs = `#graphql 
    # 自定义一个默认schema
    type Query {
       qiufenNeverW: Int 
    }
    `
  }

  try {
    buildSchema(localTypeDefs)
  } catch (error) {
    connection.window.showWarningMessage((error as Error).message)
    localTypeDefs = `#graphql 
   # 自定义一个默认schema
    type Query {
       qiufenNeverW: Int 
    }
    `
  }

  return localTypeDefs
}

export default readLocalSchemaTypeDefs

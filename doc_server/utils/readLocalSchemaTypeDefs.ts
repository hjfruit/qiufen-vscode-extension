import fs from 'fs'
import * as path from 'path'

import { buildSchema } from 'graphql'

import type { _Connection } from 'vscode-languageserver'

function readLocalSchemaTypeDefs(
  filePath: string,
  workspaceRootPath: string,
  connection: _Connection,
) {
  const qiufenConfigPath = path.join(workspaceRootPath, filePath)
  let localTypeDefs = `#graphql 
    type Query {
       qiufenNeverW: Int 
    }
    `

  try {
    localTypeDefs = fs.readFileSync(qiufenConfigPath).toString()
  } catch (err) {
    connection.window.showWarningMessage('read local schema failed')
    localTypeDefs = `#graphql 
    type Query {
       qiufenNeverW: Int 
    }
    `
  }

  try {
    buildSchema(localTypeDefs)
  } catch (error) {
    connection.window.showWarningMessage((error as any).message)
    localTypeDefs = `#graphql 
    type Query {
       qiufenNeverW: Int 
    }
    `
  }

  return localTypeDefs
}

export default readLocalSchemaTypeDefs

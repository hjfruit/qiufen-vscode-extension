import fs from 'fs'
import path from 'path'

import {
  parseOperationWithDescriptions,
  printWithComments,
  updateOperationDefAst,
} from '@fruits-chain/qiufen-pro-helpers'
import glob from 'glob'
import _ from 'lodash'

import type { JsonSettingsType } from '@/server/src/utils/getWorkspaceConfig'

import type {
  DefinitionNode,
  FieldNode,
  OperationDefinitionNode,
  DocumentNode,
  ExecutableDefinitionNode,
} from 'graphql'
import type { _Connection } from 'vscode-languageserver'

/**
 * 填充远程最新的operation到工作区对应文件里面
 */
export function fillOperationInWorkspace(
  filePath: string,
  gql: string,
  documentAst: DocumentNode,
  isAllAddComment = false,
) {
  const workspaceDocumentAst = _.cloneDeep(documentAst)
  const remoteDocumentAst = parseOperationWithDescriptions(gql)

  // 更新本地AST
  const updatedWorkspaceAst: DocumentNode = {
    ...workspaceDocumentAst,
    definitions: workspaceDocumentAst.definitions
      .map(workspaceDefinition => {
        const remoteDefinition = remoteDocumentAst.definitions.find(
          // eslint-disable-next-line @typescript-eslint/no-shadow
          remoteDefinition => {
            const workspaceDefinitionSelections = (
              workspaceDefinition as ExecutableDefinitionNode
            ).selectionSet.selections as FieldNode[]
            const remoteDefinitionSelections = (
              remoteDefinition as ExecutableDefinitionNode
            ).selectionSet.selections as FieldNode[]
            const isTheWorkspaceDefinitionExist =
              workspaceDefinitionSelections.some(
                itemSelection =>
                  itemSelection.name.value ===
                  remoteDefinitionSelections[0].name.value,
              )
            return (
              remoteDefinition.kind === workspaceDefinition.kind &&
              isTheWorkspaceDefinitionExist
            )
          },
        )

        if (!remoteDefinition) {
          return workspaceDefinition
        }
        return updateOperationDefAst(workspaceDefinition, remoteDefinition)
      })
      .filter(Boolean) as DefinitionNode[],
  }

  // 将AST转换回查询字符串
  const updateWorkspaceDocumentStr = printWithComments(
    updatedWorkspaceAst,
    isAllAddComment,
  )
  fs.writeFileSync(filePath, updateWorkspaceDocumentStr)
}

type GetWorkspaceGqlsParams = {
  gqlName: string
  patternRelativePath: string
  workspaceRootPath: string
  connection: _Connection
}
export async function getWorkspaceGqls(params: GetWorkspaceGqlsParams) {
  const { gqlName, patternRelativePath, workspaceRootPath, connection } = params

  const resolveGqlFiles = getWorkspaceAllGqlsResolveFilePaths(
    patternRelativePath,
    workspaceRootPath,
  )
  const workspaceGqlFileInfo = getWorkspaceGqlFileInfo(
    resolveGqlFiles,
    connection,
  )
  const filteredWorkspaceGqlFileInfo = workspaceGqlFileInfo.filter(gqlFileItm =>
    gqlFileItm.operationNames.includes(gqlName),
  )

  if (!filteredWorkspaceGqlFileInfo.length) {
    return Promise.reject('The operation does not exist in a local file')
  }

  if (filteredWorkspaceGqlFileInfo.length >= 2) {
    // 当该传入的operation在本地存在于多个文件夹时
    return Promise.resolve(filteredWorkspaceGqlFileInfo)
  } else {
    return Promise.resolve(filteredWorkspaceGqlFileInfo)
  }
}

/**
 * 匹配工作区后缀 *.gql 所有文件，返回文件绝对路径
 */
export function getWorkspaceAllGqlsResolveFilePaths(
  patternRelativePath: string,
  workspaceRootPath: string,
) {
  const cwdPath = path.join(workspaceRootPath, patternRelativePath)
  const gqlFiles = glob.sync('**/*.gql', { cwd: cwdPath })
  const resolveGqlFiles = gqlFiles.map(file => path.join(cwdPath, file))
  return resolveGqlFiles
}

export type ReturnTypeGetWorkspaceGqlFileInfo = {
  filename: string
  content: string
  document: DocumentNode
  operationsAsts: readonly DefinitionNode[]
  operationNames: string[]
}[]
export function getWorkspaceGqlFileInfo(
  files: string[],
  connection: _Connection,
): ReturnTypeGetWorkspaceGqlFileInfo {
  const result = files.map(file => {
    const content = fs.readFileSync(file, 'utf8')

    // 这里过滤一下空文件
    if (!content) {
      return {
        filename: file,
        operationsAsts: [],
        operationNames: [],
        document: undefined as unknown as DocumentNode,
        content: '',
      }
    }

    let workspaceDocumentAst: DocumentNode
    try {
      // 这里验证一下本地 gql 接口语法错误没有
      workspaceDocumentAst = parseOperationWithDescriptions(content)
    } catch {
      connection.window.showErrorMessage(`${file}: GraphQL Syntax Error`)
      return {
        filename: file,
        document: undefined as unknown as DocumentNode,
        operationsAsts: [],
        operationNames: [],
        content: '',
      }
    }

    // 得到本地每个gql文件的operations names
    const fileItemOperationNames: string[] = []
    workspaceDocumentAst.definitions.forEach(operationDefNode => {
      const newOperationDefNode = operationDefNode as OperationDefinitionNode
      newOperationDefNode.selectionSet.selections.forEach(selectionNode => {
        const newSelectionNode = selectionNode as FieldNode
        fileItemOperationNames.push(newSelectionNode.name.value)
      })
    })

    return {
      filename: file,
      content,
      document: workspaceDocumentAst,
      operationsAsts: workspaceDocumentAst.definitions,
      operationNames: fileItemOperationNames,
    }
  })

  return result
}

type GetWorkspaceAllGqlsNameAndDataParams = {
  connection: _Connection
  jsonSettings: JsonSettingsType
  workspaceRootPath: string
}
export function getWorkspaceAllGqlsNameAndData(
  params: GetWorkspaceAllGqlsNameAndDataParams,
) {
  const { connection, jsonSettings, workspaceRootPath } = params

  const resolveGqlFiles = getWorkspaceAllGqlsResolveFilePaths(
    jsonSettings.patternRelativePath,
    workspaceRootPath,
  )
  const workspaceGqlFileInfo = getWorkspaceGqlFileInfo(
    resolveGqlFiles,
    connection,
  )
  const workspaceGqlNames = workspaceGqlFileInfo
    .map(itm => itm.operationNames)
    .flat(Infinity) as string[]

  return {
    workspaceGqlNames,
    workspaceGqlFileInfo,
  }
}

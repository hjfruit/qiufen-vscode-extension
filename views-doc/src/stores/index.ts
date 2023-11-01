import { getOperationNodesForFieldAstBySchema } from '@fruits-chain/qiufen-pro-helpers'
import { message } from 'antd'
import { buildSchema, lexicographicSortSchema, printSchema } from 'graphql'
import create from 'zustand'

import type { OperationNodesForFieldAstBySchemaReturnType } from '@fruits-chain/qiufen-pro-helpers'
import type {
  SelectionNode,
  EnumValueNode,
  DefinitionNode,
  GraphQLSchema,
} from 'graphql'
import type { SetState } from 'zustand'

export enum MessageEnum {
  FETCH = 'FETCH',
  REFETCH = 'REFETCH',
  ONE_KEY_FILL = 'ONE_KEY_FILL',
}

export const fillOneKeyMessageSignSuccess = 'fill-success'
export const fillOneKeyMessageSignNull = 'fill-null'

export type WorkspaceGqlFileInfoType = {
  filename: string
  operationsAsts: DefinitionNode[]
  operationNames: string[]
  content: string
}
interface MessageEvent {
  hasUpdateInfo: boolean
  lastSdl: string
  schemaUrl: string
  isNeedGrouped: boolean
  isAllAddComment: boolean
  IpAddress: string
  isDisplaySidebar: boolean
  port: number
  backendTypeDefsGrouped: string
  typeDefs: string
  localTypeDefs: string
  directive: string
  maxDepth: number
  identityValue?: string
  operationNameGroupedFromBackendObj: Record<
    string,
    {
      operation: string
      operationName: string
    }[]
  >
  operationNamesFromGroupOptions: { value: string; label: string }[]
  workspaceGqlNames: string[]
  workspaceGqlFileInfo: WorkspaceGqlFileInfoType[]
}

interface BearState extends MessageEvent {
  fetchRemoteTypeDefs: () => Promise<{
    typeDefs: string
    localTypeDefs: string
  }>
  fetchLastTypeDefs: () => Promise<{
    typeDefs: string
    lastSdl: string
  }>
  captureMessage: () => Promise<boolean>
  reloadOperations: () => Promise<boolean>
  setState: SetState<BearState>
}

const useBearStore = create<BearState>(set => {
  return {
    hasUpdateInfo: false,
    lastSdl: '',
    schemaUrl: '',
    isNeedGrouped: false,
    identityValue: undefined,
    operationNameGroupedFromBackendObj: {},
    port: 9400,
    maxDepth: 2,
    directive: '',
    backendTypeDefsGrouped: '',
    localTypeDefs: '',
    operations: [],
    IpAddress: '',
    typeDefs: '',
    isAllAddComment: false,
    workspaceGqlNames: [],
    workspaceGqlFileInfo: [],
    isDisplaySidebar: true,
    operationNamesFromGroupOptions: [],
    fetchLastTypeDefs() {
      return new Promise(resolve => {
        fetch(`/listen`)
          .then(response => response.json())
          .then(data => {
            resolve({
              typeDefs: data.typeDefs,
              lastSdl: data.lastSdl,
            })
          })
      })
    },
    fetchRemoteTypeDefs() {
      return new Promise(resolve => {
        fetch(`/operations`)
          .then(response => response.json())
          .then(data => {
            resolve({
              typeDefs: data.typeDefs,
              localTypeDefs: data.localTypeDefs,
            })
          })
      })
    },
    captureMessage() {
      return new Promise(resolve => {
        fetch(`/operations`)
          .then(response => response.json())
          .then(data => {
            const schema = buildSchema(data.typeDefs)
            const {
              isNeedGrouped,
              operationNameGroupedFromBackendObj,
              operationNamesFromGroupOptions,
            } = getOperationNameGroupedFromBackendInfo(schema)

            set({
              ...data,
              isNeedGrouped,
              operationNameGroupedFromBackendObj,
              operationNamesFromGroupOptions,
              backendTypeDefsGrouped: data.typeDefs,
              typeDefs: printSchema(lexicographicSortSchema(schema)),
              localTypeDefs: printSchema(
                lexicographicSortSchema(buildSchema(data.localTypeDefs)),
              ),
            })
            resolve(true)
          })
          .catch(error => {
            message.error(error.message)
          })
      })
    },
    setState: set,
    reloadOperations() {
      return new Promise(resolve => {
        fetch(`/reload/operations`)
          .then(response => response.json())
          .then(data => {
            const schema = buildSchema(data.typeDefs)
            const {
              isNeedGrouped,
              operationNameGroupedFromBackendObj,
              operationNamesFromGroupOptions,
            } = getOperationNameGroupedFromBackendInfo(schema)

            set({
              ...data,
              isNeedGrouped,
              operationNameGroupedFromBackendObj,
              operationNamesFromGroupOptions,
              backendTypeDefsGrouped: data.typeDefs,
              typeDefs: printSchema(lexicographicSortSchema(schema)),
              localTypeDefs: printSchema(
                lexicographicSortSchema(buildSchema(data.localTypeDefs)),
              ),
            })
            resolve(true)
          })
          .catch(error => {
            message.error(error.message)
          })
      })
    },
  }
})

/** 获取来自后端分组下拉选项，分组接口数据 */
function getOperationNameGroupedFromBackendInfo(schema: GraphQLSchema) {
  const operationNamesFromGroupOptions = []
  const result: Record<
    string,
    {
      operation: string
      operationName: string
    }[]
  > = {
    All: [],
  }

  const operationAsts = getOperationNodesForFieldAstBySchema(schema)
  /** 这里先判断出该schema能不能进行分组 */
  const isNeedGrouped = isNeededGroupFn(operationAsts[0])

  if (isNeedGrouped) {
    operationAsts.forEach(operationAst => {
      const selectionItem = operationAst.operationDefNodeAst.selectionSet
        .selections[0] as SelectionNode & {
        nameValue: string
      }
      const directives = selectionItem.directives
      const foundDirective = directives?.find(
        itm => itm?.name?.value === 'join__field',
      )
      const foundDirectiveArg = foundDirective?.arguments?.find(
        arg => arg?.name?.value === 'graph',
      )
      const namedFromGroup = (foundDirectiveArg?.value as EnumValueNode)?.value

      if (namedFromGroup) {
        result[namedFromGroup] = [
          ...(result[namedFromGroup] || []),
          {
            operationName: selectionItem.nameValue,
            operation: operationAst.operationDefNodeAst.operation,
          },
        ]
      }

      result['All'] = [
        ...result['All'],
        {
          operationName: selectionItem.nameValue,
          operation: operationAst.operationDefNodeAst.operation,
        },
      ]
    })

    for (const key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        operationNamesFromGroupOptions.push({
          value: key,
          label: key.toLowerCase(),
        })
      }
    }
  }

  return {
    isNeedGrouped,
    operationNamesFromGroupOptions,
    operationNameGroupedFromBackendObj: result,
  }
}

function isNeededGroupFn(
  firstOperationAst: OperationNodesForFieldAstBySchemaReturnType,
) {
  const firstOperationSelectionItem = firstOperationAst.operationDefNodeAst
    .selectionSet.selections[0] as SelectionNode & {
    nameValue: string
  }
  const firstDirectives = firstOperationSelectionItem.directives
  const foundFirstDirectives = firstDirectives?.find(
    itm => itm?.name?.value === 'join__field',
  )

  return !!foundFirstDirectives
}

export default useBearStore

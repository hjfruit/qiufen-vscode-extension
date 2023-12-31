import { buildOperationNodeForField } from '@fruits-chain/qiufen-pro-helpers'
import { Space, message } from 'antd'
import { buildSchema } from 'graphql'
import React, { useMemo } from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer'
import obj2str from 'stringify-object'

import { defaultLocalTypeDefs } from '@/config/const'
import useBearStore from '@/stores'
import { genArgsExample } from '@/utils/operations'
import { printOneOperation } from '@/utils/printBatchOperations'

import styles from './index.module.less'

import type { OperationDefinitionNodeGroupType } from '@fruits-chain/qiufen-pro-helpers'
import type { GraphQLSchema } from 'graphql'
import type { FC } from 'react'

interface IProps {
  isShow: boolean
  operationDefNode: OperationDefinitionNodeGroupType
}

const DiffViewer: FC<IProps> = ({ isShow, operationDefNode }) => {
  const { localTypeDefs, isAllAddComment } = useBearStore(ste => ste)

  const workspaceSchema = useMemo(() => {
    let localSchema: GraphQLSchema | undefined
    try {
      localSchema = buildSchema(localTypeDefs || defaultLocalTypeDefs)
    } catch (error) {
      message.error(`${error}`)
    }

    return localSchema!
  }, [localTypeDefs])

  const workspaceOperationArgsStr = useMemo(() => {
    let workspaceOperationDefAst: OperationDefinitionNodeGroupType | undefined
    try {
      workspaceOperationDefAst = buildOperationNodeForField({
        schema: workspaceSchema,
        kind: operationDefNode?.operation,
        field: operationDefNode?.name!.value,
      })
    } catch {
      workspaceOperationDefAst = undefined
    }

    return obj2str(genArgsExample(workspaceOperationDefAst?.args || []))
  }, [operationDefNode?.name, operationDefNode?.operation, workspaceSchema])

  const remoteOperationArgsStr = useMemo(() => {
    return obj2str(genArgsExample(operationDefNode.args))
  }, [operationDefNode.args])

  const workspaceOperationStr = useMemo(() => {
    let operation
    try {
      operation = printOneOperation(
        buildOperationNodeForField({
          schema: workspaceSchema,
          kind: operationDefNode?.operation,
          field: operationDefNode?.name!.value,
        }),
        isAllAddComment,
      )
    } catch {
      operation = 'null...'
    }

    return operation
  }, [
    isAllAddComment,
    operationDefNode?.name,
    operationDefNode?.operation,
    workspaceSchema,
  ])

  const remoteOperationStr = useMemo(() => {
    return printOneOperation(operationDefNode, isAllAddComment)
  }, [isAllAddComment, operationDefNode])

  return (
    <Space style={{ width: '100%' }} direction="vertical" size={16}>
      <>
        <div className={styles.paramsText}>Params: </div>
        {isShow && (
          <ReactDiffViewer
            oldValue={workspaceOperationArgsStr}
            newValue={remoteOperationArgsStr}
            splitView={true}
            compareMethod={DiffMethod.SENTENCES}
            showDiffOnly={false}
            hideLineNumbers
            leftTitle="Old"
            rightTitle="New"
            renderContent={codeStr => {
              return <div className={styles.diff_viewer_div}>{codeStr}</div>
            }}
          />
        )}
      </>
      <>
        <div className={styles.paramsText}>Response: </div>
        {isShow && (
          <ReactDiffViewer
            oldValue={workspaceOperationStr}
            newValue={remoteOperationStr}
            splitView={true}
            compareMethod={DiffMethod.SENTENCES}
            showDiffOnly={false}
            hideLineNumbers
            leftTitle="Old"
            rightTitle="New"
            renderContent={codeStr => {
              return <div className={styles.diff_viewer_div}>{codeStr}</div>
            }}
          />
        )}
      </>
    </Space>
  )
}

export default DiffViewer

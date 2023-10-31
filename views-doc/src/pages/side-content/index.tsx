import { getOperationNodesForFieldAstBySchema } from '@fruits-chain/qiufen-pro-helpers'
import { useMemoizedFn } from 'ahooks'
import { Spin, message } from 'antd'
import { buildSchema } from 'graphql'
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'

import useBearStore from '@/stores'

import DocSidebar from './components/side-bar/index'

import type { OperationNodesForFieldAstBySchemaReturnType } from '@fruits-chain/qiufen-pro-helpers'
import type { SelectionNode } from 'graphql'
import type { FC } from 'react'

interface IProps {}

const SideContent: FC<IProps> = () => {
  const { id } = useParams<'id'>()
  const {
    captureMessage,
    reloadOperations,
    isDisplaySidebar,
    typeDefs,
    setState,
    identityValue,
    isNeedGrouped,
    operationNameGroupedFromBackendObj,
  } = useBearStore(state => state)
  const [loading, setLoading] = useState(false)

  useLayoutEffect(() => {
    captureMessage()
  }, [captureMessage])

  const operationNodesForFieldAstBySchema = useMemo(() => {
    let result: OperationNodesForFieldAstBySchemaReturnType[] = []

    if (typeDefs) {
      const schema = buildSchema(typeDefs)
      result = getOperationNodesForFieldAstBySchema(schema)
    }

    return result
  }, [typeDefs])

  const operationObjList = useMemo(() => {
    let result: OperationNodesForFieldAstBySchemaReturnType[] = []

    if (
      isNeedGrouped &&
      !!identityValue &&
      operationNameGroupedFromBackendObj[identityValue]
    ) {
      result = operationNodesForFieldAstBySchema?.filter(item => {
        const sameKeyItem = operationNameGroupedFromBackendObj[
          identityValue
        ].find(
          itm =>
            `${itm.operation}${itm.operationName}` ===
            `${item.operationDefNodeAst.operation}${
              (
                item.operationDefNodeAst.selectionSet
                  .selections[0] as SelectionNode & { nameValue: string }
              ).nameValue
            }`,
        )

        return !!sameKeyItem
      })
    } else {
      result = operationNodesForFieldAstBySchema
    }

    return result
  }, [
    identityValue,
    isNeedGrouped,
    operationNameGroupedFromBackendObj,
    operationNodesForFieldAstBySchema,
  ])

  const handleReload = useMemoizedFn(async () => {
    let timer: NodeJS.Timeout | undefined
    setLoading(true)
    try {
      await Promise.race([
        reloadOperations(),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            return reject(new Error('网络异常'))
          }, 20000)
        }),
      ])
    } catch (error) {
      message.error('网络异常')
    }
    setLoading(false)
    clearTimeout(timer)
  })

  useEffect(() => {
    return () => {
      // 这里是为了重置 状态管理的typeDefs的值，这样点击侧边icon切换时不会出现延迟很久的bug
      setState({ typeDefs: '' })
    }
  }, [setState])

  const firstOperationKey = operationObjList.length
    ? operationObjList[0]?.operationDefNodeAst?.operation +
      operationObjList[0]?.operationDefNodeAst?.name?.value
    : ''

  return (
    <Spin spinning={!operationObjList?.length || loading}>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ display: isDisplaySidebar ? 'block' : 'none' }}>
          <DocSidebar
            handleReload={handleReload}
            activeItemKey={id || firstOperationKey}
            operationsDefNodeObjList={operationObjList}
          />
        </div>
        <Outlet />
      </div>
    </Spin>
  )
}

export default SideContent

import { CopyOutlined, CheckCircleTwoTone } from '@ant-design/icons'
import { Tooltip, Space, message } from 'antd'
import classnames from 'classnames'
import ClipboardJS from 'clipboard'
import VirtualList from 'rc-virtual-list'
import React, { useEffect, useRef, memo } from 'react'
import { Link, useParams } from 'react-router-dom'

import useBearStore from '@/stores'
import { useTagsStore } from '@/stores/persist'
import { printBatchOperations } from '@/utils/printBatchOperations'

import styles from './index.module.less'

import type { OperationDefinitionNodeGroupType } from '@fruits-chain/qiufen-pro-helpers'
import type { ListRef } from 'rc-virtual-list'
import type { FC } from 'react'

// 分组大小
const groupCount = 35

// 控制滚动条滚动那部分代码执行一次
let isControllingExecuted = false

const OperationItem = ({
  operation,
  workspaceGqlNames,
  isMoreExist,
  switchBothZhEn,
  active,
  isMakeVirtual,
}: {
  /** 区分是不是走的虚拟列表模式 */
  isMakeVirtual?: boolean
  operation: OperationDefinitionNodeGroupType
  active: boolean
  workspaceGqlNames: string[]
  isMoreExist: boolean
  switchBothZhEn: boolean
}) => {
  const { id: routeId } = useParams<'id'>()
  const groupedId = routeId?.split('&')?.[1] || ''

  useEffect(() => {
    // 一下是不通过虚拟列表实现的时候滚动条滚到当前激活的item位置
    if (!isControllingExecuted && !isMakeVirtual) {
      // 找到当前被激活的分类标题
      const antCollapseContentActive = document.querySelector(
        '.ant-collapse-content-active',
      ) as HTMLDivElement
      // 当前激活的item
      const activeItm = document.querySelector('#activeItem') as HTMLDivElement
      // 滚动条归属的盒子
      const sidebarContent = document.querySelector(
        '#sidebarContent',
      ) as HTMLDivElement

      // 将滚动条滚到当前被激活的分类标题的位置
      sidebarContent?.scrollTo({
        top: Math.max(
          0,
          activeItm?.offsetTop + antCollapseContentActive?.offsetTop - 200,
        ),
      })
      isControllingExecuted = true
    }

    return () => {
      isControllingExecuted = false
    }
  }, [isMakeVirtual])

  const { addATags } = useTagsStore()

  return (
    <div>
      <Link
        onClick={() => {
          const routePath = groupedId
            ? `/docs/${
                operation.operation + operation.name?.value
              }&${groupedId}`
            : `/docs/${operation.operation + operation.name?.value}`

          const operationZhCn =
            getOperationNameValue(operation.operationDefinitionDescription) ||
            ''

          addATags({
            type: operation.operation,
            operationZhCn: operationZhCn,
            operation: operation.name?.value ?? '',
            routePath,
          })
        }}
        to={
          groupedId
            ? `/docs/${
                operation.operation + operation.name?.value
              }&${groupedId}`
            : `/docs/${operation.operation + operation.name?.value}`
        }>
        <div
          id={active ? 'activeItem' : ''}
          className={classnames(styles.operationItem, {
            [styles.active]: active,
          })}>
          <Space direction="horizontal">
            <CheckCircleTwoTone
              style={{
                visibility: workspaceGqlNames.includes(operation.name!.value)
                  ? 'visible'
                  : 'hidden',
              }}
              twoToneColor={isMoreExist ? '#FE9800' : '#52c41a'}
            />
            {switchBothZhEn
              ? operation.name?.value
              : getOperationNameValue(
                  operation.operationDefinitionDescription,
                ) || operation.name?.value}
          </Space>
        </div>
      </Link>
    </div>
  )
}
const OperationItemCom = memo(OperationItem)

interface IProps {
  switchBothZhEn: boolean
  groupName: string
  activeItemKey: string
  operationList: OperationDefinitionNodeGroupType[]
}

const copy = (selector: string) => {
  const clipboard = new ClipboardJS(selector)
  clipboard.on('success', () => {
    message.success('success')
    clipboard.destroy()
  })
  clipboard.on('error', () => {
    message.error('failed')
    clipboard.destroy()
  })
}

const getOperationNameValue = (name = '') => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, val] = name.split(':')
  return val
}

const SiderGroup: FC<IProps> = ({
  switchBothZhEn,
  groupName,
  activeItemKey,
  operationList,
}) => {
  const virtualListRef = useRef<ListRef>(null)
  const { workspaceGqlNames, workspaceGqlFileInfo, isAllAddComment } =
    useBearStore(ste => ste)
  // 这里是将不合法的字符串转为合法使用的 html id
  const id = groupName.replace(/[.\s]+/g, '_')
  const containerHeight = Math.min(operationList.length * 42, 750)

  useEffect(() => {
    // 以下是 虚拟列表滚到到当前激活的item位置
    let index = 0
    operationList.forEach((itm, indey) => {
      if (itm.operation + itm.name?.value === activeItemKey) {
        index = indey
      }
    })

    virtualListRef.current?.scrollTo({
      index,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.operationList}>
      <Tooltip title="Copy GQL">
        <CopyOutlined
          id={id}
          data-clipboard-text={printBatchOperations(
            operationList,
            isAllAddComment,
          )}
          className={styles.copyBtn}
          onClick={() => {
            copy(`#${id}`)
          }}
        />
      </Tooltip>
      {/* 分组小于等于 groupCount 渲染  */}
      {operationList.length <= groupCount &&
        operationList.map(operation => {
          const filtrationWorkspaceGqlFileInfo = workspaceGqlFileInfo.filter(
            item => item.operationNames.includes(operation.name!.value),
          )
          const isMoreExist = filtrationWorkspaceGqlFileInfo?.length > 1

          return (
            <OperationItemCom
              active={
                operation.operation + operation.name?.value === activeItemKey
              }
              key={operation.operation + operation.name?.value}
              operation={operation}
              workspaceGqlNames={workspaceGqlNames}
              isMoreExist={isMoreExist}
              switchBothZhEn={switchBothZhEn}
            />
          )
        })}
      {/* 分组大于 groupCount 渲染  */}
      {operationList.length > groupCount && (
        <VirtualList
          ref={virtualListRef}
          data={operationList}
          height={containerHeight}
          itemHeight={45}
          itemKey={operation => operation.operation + operation.name?.value}>
          {operation => {
            const filtrationWorkspaceGqlFileInfo = workspaceGqlFileInfo.filter(
              item => item.operationNames.includes(operation.name!.value),
            )
            const isMoreExist = filtrationWorkspaceGqlFileInfo?.length > 1

            return (
              <OperationItemCom
                isMakeVirtual
                active={
                  operation.operation + operation.name?.value === activeItemKey
                }
                key={operation.operation + operation.name?.value}
                operation={operation}
                workspaceGqlNames={workspaceGqlNames}
                isMoreExist={isMoreExist}
                switchBothZhEn={switchBothZhEn}
              />
            )
          }}
        </VirtualList>
      )}
    </div>
  )
}

export default memo(SiderGroup)

import {
  SearchOutlined,
  SwapOutlined,
  ReloadOutlined,
  MenuFoldOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { Input, Collapse, Tooltip } from 'antd'
import classnames from 'classnames'
import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { groupOperations as groupOperationsCopy } from '@/utils/operations'

import SiderGroup from './group'
import styles from './index.module.less'

import type {
  NewFieldNodeType,
  OperationDefinitionNodeGroupType,
  OperationNodesForFieldAstBySchemaReturnType,
} from '@fruits-chain/qiufen-pro-helpers'
import type { CollapseProps } from 'antd'
import type { FC } from 'react'

export interface IProps {
  operationsDefNodeObjList: OperationNodesForFieldAstBySchemaReturnType[]
  activeItemKey: string
  groupedId: string
  handleReload: () => void
}

const DocSidebar: FC<IProps> = ({
  activeItemKey,
  groupedId,
  handleReload,
  operationsDefNodeObjList,
}) => {
  const [keyword, setKeyword] = useState<string>('')
  const [activeKey, setActiveKey] = useState([''])
  const [switchBothZhEn, setSwitchBothZhEn] = useState(false)
  const [isFocus, setIsFocus] = useState(false)

  const groupedOperations = useMemo(() => {
    const operationList = operationsDefNodeObjList.map(
      val => val.operationDefNodeAst,
    )
    return groupOperationsCopy(operationList)
  }, [operationsDefNodeObjList])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const activeKey: CollapseProps['defaultActiveKey'] = []
    Object.entries(groupedOperations).some(([groupName, items]) => {
      if (
        items.some(item => item.operation + item.name?.value === activeItemKey)
      ) {
        activeKey.push(groupName)
      }
    })
    setActiveKey(activeKey as string[])
  }, [groupedOperations, activeItemKey])

  const navigate = useNavigate()
  const initPageRef = useRef(false)
  useEffect(() => {
    if (activeItemKey && !initPageRef.current) {
      groupedId
        ? navigate(`/docs/${activeItemKey}&${groupedId}`)
        : navigate(`/docs/${activeItemKey}`)
      initPageRef.current = true
    }
  }, [activeItemKey, groupedId, navigate])

  const contentJSX = useMemo(() => {
    const newKeyword = keyword.trim()
    const groupedOperationsEntries = Object.entries(groupedOperations)

    let exactGroupedOperationsEntries = [] as [
      string,
      OperationDefinitionNodeGroupType[],
    ][]
    if (newKeyword) {
      exactGroupedOperationsEntries = groupedOperationsEntries.filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([groupName, operationData]) => {
          const names = operationData.map(i => i.name?.value)
          return names.includes(newKeyword)
        },
      )
    }

    // 精确匹配operation name
    if (exactGroupedOperationsEntries.length) {
      return exactGroupedOperationsEntries.map(([groupName, operationData]) => {
        let operationList = operationData

        if (newKeyword) {
          operationList = operationData.filter(item => {
            return item.name?.value === newKeyword
          })
        }

        if (!operationList.length) {
          return null
        }

        return (
          <Collapse.Panel
            key={groupName}
            header={groupName}
            className={
              activeKey.includes(groupName) ? styles.collapse_active : ''
            }>
            <SiderGroup
              // 当分组为 "default" 时，接口就是不存在中文备注的所以为了节约渲染直接传 "false" 下去
              switchBothZhEn={groupName === 'default' ? false : switchBothZhEn}
              groupName={groupName}
              operationList={operationList}
              activeItemKey={activeItemKey}
            />
          </Collapse.Panel>
        )
      })
    } else {
      return groupedOperationsEntries.map(([groupName, operationData]) => {
        let operationList = operationData

        // 这行代码是防止输入一些不正规内容导致页面报错白屏
        const escapedInput = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const pattern = new RegExp(escapedInput, 'i')

        // search by group name
        if (pattern.test(groupName)) {
          // break
        } else if (newKeyword) {
          operationList = operationData.filter(item => {
            return (
              // search by name
              pattern.test(item.name!.value) ||
              // search by description
              pattern.test(item.operationDefinitionDescription || '') ||
              // search by arg type
              item.args.some(arg => pattern.test(arg.type.name)) ||
              // search by return type
              pattern.test(
                (item.selectionSet.selections[0] as NewFieldNodeType).type,
              )
            )
          })
        }

        if (!operationList.length) {
          return null
        }

        return (
          <Collapse.Panel
            key={groupName}
            header={groupName}
            className={
              activeKey.includes(groupName) ? styles.collapse_active : ''
            }>
            <SiderGroup
              // 当分组为 "default" 时，接口就是不存在中文备注的所以为了节约渲染直接传 "false" 下去
              switchBothZhEn={groupName === 'default' ? false : switchBothZhEn}
              groupName={groupName}
              operationList={operationList}
              activeItemKey={activeItemKey}
            />
          </Collapse.Panel>
        )
      })
    }
  }, [activeItemKey, activeKey, switchBothZhEn, groupedOperations, keyword])

  const isStorageValueRef = useRef(true)
  /** 用于记录搜索输入框历史记录到session里面 */
  useEffect(() => {
    const searchKeywords = sessionStorage.getItem('searchKeywords') ?? ''
    const timeoutId = setTimeout(() => {
      if (keyword && isStorageValueRef.current) {
        sessionStorage.setItem(
          'searchKeywords',
          searchKeywords ? searchKeywords + '-' + keyword : keyword,
        )
      }
    }, 1000) // 设置防抖延迟时间

    return () => {
      clearTimeout(timeoutId) // 清除之前的定时器
    }
  }, [keyword])

  const inputFocusRef = useRef(false)
  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    const searchKeywords = sessionStorage.getItem('searchKeywords') ?? ''
    const searchKeywordsArr = searchKeywords.split('-') || []
    const length = searchKeywordsArr.length
    isStorageValueRef.current = true

    if (e.key === 'ArrowUp') {
      isStorageValueRef.current = false

      //  处理上键按下时的逻辑
      const startingIndex = !keyword
        ? length - 1
        : searchKeywordsArr.findIndex(val => val === keyword) - 1

      let currentKeyword = ''
      if (startingIndex < 0) {
        currentKeyword = searchKeywordsArr[0]
      } else {
        currentKeyword = searchKeywordsArr[startingIndex]
      }

      setKeyword(currentKeyword)
    } else if (e.key === 'ArrowDown') {
      isStorageValueRef.current = false

      // 处理下键按下时的逻辑
      const startingIndex =
        searchKeywordsArr.findIndex(val => val === keyword) + 1

      let currentKeyword = ''
      if (startingIndex > length - 1) {
        currentKeyword = searchKeywordsArr[length - 1]
      } else if (!keyword) {
        currentKeyword = ''
      } else {
        currentKeyword = searchKeywordsArr[startingIndex]
      }

      setKeyword(currentKeyword)
    }
  }

  return (
    <>
      <div className={styles.wrapper_search}>
        <Input
          className={styles.search}
          onFocus={() => {
            setIsFocus(true)
            inputFocusRef.current = true
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setIsFocus(false)
            inputFocusRef.current = false
          }}
          suffix={
            <SearchOutlined className={isFocus ? styles.icon_color : ''} />
          }
          size="large"
          placeholder="Search by desc/name/type (↑↓ for history)"
          onChange={evt => {
            setKeyword(evt.target.value)
          }}
          value={keyword}
        />
      </div>
      <div
        className={styles.sidebarContent}
        id="sidebarContent" /* onScroll={onScroll.run} */
      >
        <div id="operationContent">
          <Collapse
            className={styles.collapse_box}
            bordered={false}
            activeKey={activeKey}
            onChange={key => {
              if (Array.isArray(key)) {
                setActiveKey(key)
              }
            }}>
            {contentJSX}
          </Collapse>
        </div>

        {/* 侧边栏图标部分 */}
        <div className={styles.iconBox}>
          <Tooltip title="switching operation language">
            <div
              onClick={() => {
                setSwitchBothZhEn(!switchBothZhEn)
              }}>
              <SwapOutlined className={classnames(styles.icon)} />
            </div>
          </Tooltip>
          <Tooltip title="reload doc">
            <ReloadOutlined
              onClick={handleReload}
              className={classnames(styles.icon)}
            />
          </Tooltip>
          <Tooltip title="Collapse all">
            <MenuFoldOutlined
              onClick={() => {
                setActiveKey([])
              }}
              className={classnames(styles.icon)}
            />
          </Tooltip>
          <Tooltip title="Back to top">
            <UpOutlined
              onClick={() => {
                document.getElementById('sidebarContent')?.scrollTo(0, 0)
              }}
              className={classnames(styles.icon)}
            />
          </Tooltip>
        </div>
      </div>
    </>
  )
}

export default memo(DocSidebar)

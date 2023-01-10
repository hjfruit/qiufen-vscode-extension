import React, { memo, useEffect, useMemo, useState } from "react"
import { Input, Collapse, Tooltip, Space, message } from "antd"
import { CopyOutlined, SearchOutlined } from "@ant-design/icons"
import { useThrottleFn } from "@fruits-chain/hooks-laba"
import classnames from "classnames"
import ClipboardJS from "clipboard"
import { genGQLStrInGroup, groupOperations } from "@fruits-chain/qiufen-helpers"
import styles from "./index.module.less"
import type { CollapseProps } from "antd"
import type { TypedOperation } from "@fruits-chain/qiufen-helpers"
import type { FC } from "react"
import "@/webview/assets/images/collapse-all.png"
import "@/webview/assets/images/back-top.png"
import useBearStore from "@/webview/stores"

export const copy = (selector: string) => {
  const clipboard = new ClipboardJS(selector)
  clipboard.on("success", () => {
    message.success("success")
    clipboard.destroy()
  })
  clipboard.on("error", () => {
    message.error("failed")
    clipboard.destroy()
  })
}

export interface IProps {
  operations: TypedOperation[]
  keyword: string
  selectedOperationId: string
  onKeywordChange: (keyword: string) => void
  onSelect: (operation: TypedOperation) => void
}

const DocSidebar: FC<IProps> = ({ keyword, onKeywordChange, operations, onSelect, selectedOperationId }) => {
  const topBackUri = useBearStore((state) => state.topBackUri)
  const collapseAllUri = useBearStore((state) => state.collapseAllUri)
  const [top, setTop] = useState(0)
  const [isFocus, setIsFocus] = useState(false)

  const onScroll = useThrottleFn(
    (evt) => {
      setTop(evt.nativeEvent.target.scrollTop)
    },
    { wait: 100 }
  )

  const groupedOperations = useMemo(() => {
    return groupOperations(operations)
  }, [operations])

  const [activeKey, setActiveKey] = useState([""])
  const [activeItemKey, setActiveItemKey] = useState("")
  useEffect(() => {
    const activeKey: CollapseProps["defaultActiveKey"] = []
    Object.entries(groupedOperations).some(([groupName, items]) => {
      if (items.some((item) => item.operationType + item.name === selectedOperationId)) {
        activeKey.push(groupName)
      }
    })
    setActiveKey(activeKey as string[])
    setActiveItemKey(selectedOperationId)
  }, [selectedOperationId])

  const contentJSX = useMemo(() => {
    return Object.entries(groupedOperations).map(([groupName, operationData]) => {
      let operationList = operationData
      const pattern = new RegExp(keyword, "i")
      // search by group name
      if (pattern.test(groupName)) {
        // break
      } else if (keyword.trim()) {
        operationList = operationData.filter((item) => {
          return (
            // search by name
            pattern.test(item.name) ||
            // search by description
            pattern.test(item.description || "") ||
            // search by arg type
            item.args.some((arg) => pattern.test(arg.type.name)) ||
            // search by return type
            pattern.test(item.output.name)
          )
        })
      }

      if (!operationList.length) {
        return null
      }

      return (
        <Collapse.Panel key={groupName} header={groupName} className={activeKey.includes(groupName) ? styles.collapse_active : ""}>
          <div className={styles.operationList}>
            <Tooltip title="Copy GQL">
              <CopyOutlined
                id={groupName}
                data-clipboard-text={genGQLStrInGroup(groupName, operationList)}
                className={styles.copyBtn}
                onClick={() => {
                  copy(`#${groupName}`)
                }}
              />
            </Tooltip>
            {operationList.map((operation, index) => {
              const deprecatedReason = operation.deprecationReason
              return (
                <div
                  key={index}
                  className={classnames(styles.operationItem, {
                    [styles.active]: operation.operationType + operation.name === activeItemKey,
                  })}
                  onClick={() => {
                    onSelect(operation)
                    setActiveItemKey(operation.operationType + operation.name)
                  }}
                >
                  <div
                    className={classnames({
                      [styles.deprecated]: !!deprecatedReason,
                    })}
                  >
                    <Space direction="vertical">
                      {operation.description || operation.name}
                      {!!deprecatedReason && <span className={styles.warning}>{deprecatedReason}</span>}
                    </Space>
                  </div>
                </div>
              )
            })}
          </div>
        </Collapse.Panel>
      )
    })
  }, [groupedOperations, keyword, onSelect, activeItemKey, activeKey])

  return (
    <div className={styles.sidebar}>
      <div className={styles.wrapper_search}>
        <Input
          className={styles.search}
          onFocus={() => {
            setIsFocus(true)
          }}
          onBlur={() => {
            setIsFocus(false)
          }}
          suffix={<SearchOutlined className={isFocus ? styles.icon_color : ""} />}
          size="large"
          placeholder="Search by group/desc/name/type"
          onChange={(evt) => {
            onKeywordChange(evt.target.value)
          }}
          value={keyword}
        />
      </div>
      <div className={styles.main} id="sideBar" onScroll={onScroll.run}>
        <Collapse
          className={styles.collapse_box}
          bordered={false}
          activeKey={activeKey}
          onChange={(key) => {
            if (Array.isArray(key)) {
              setActiveKey(key)
            }
          }}
        >
          {contentJSX}
        </Collapse>
      </div>
      <Tooltip title="Collapse all">
        <div
          style={{ bottom: 100 }}
          className={classnames(styles.topBtn, {
            [styles.show]: activeKey.length,
          })}
          onClick={() => {
            setActiveKey([])
          }}
        >
          <img src={collapseAllUri.scheme + "://" + collapseAllUri.authority + collapseAllUri.path} alt="全部收集图片" />
        </div>
      </Tooltip>
      <Tooltip title="Back to top">
        <div
          className={classnames(styles.topBtn, {
            [styles.show]: top > 700,
          })}
          onClick={() => {
            document.getElementById("sideBar")?.scrollTo(0, 0)
          }}
        >
          <img src={topBackUri.scheme + "://" + topBackUri.authority + topBackUri.path} alt="返回顶部图片" />
        </div>
      </Tooltip>
    </div>
  )
}

export default memo(DocSidebar)

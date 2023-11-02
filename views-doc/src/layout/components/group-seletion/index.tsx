import { Select, Tooltip } from 'antd'
import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import useBearStore from '@/stores'

import styles from './index.module.less'

import type { FC } from 'react'

interface IProps {}

const GroupSelection: FC<IProps> = () => {
  const navigate = useNavigate()
  const { id: routeId } = useParams<'id'>()
  const [_, groupedId] = routeId?.split('&') || []

  const {
    schemaUrl,
    isNeedGrouped,
    operationNamesFromGroupOptions,
    identityValue,
    operationNameGroupedFromBackendObj,
    setState,
  } = useBearStore(state => state)

  const handleLinkClick: React.MouseEventHandler<HTMLAnchorElement> = event => {
    event.preventDefault()
    if (event.ctrlKey || event.metaKey) {
      window.open(schemaUrl, '_blank') // 在新标签页中打开链接
    }
  }

  useEffect(() => {
    if (!identityValue) setState({ identityValue: groupedId })
  }, [groupedId, identityValue])

  return (
    <>
      {isNeedGrouped && (
        <Select
          placeholder="请选择项目组名称"
          value={identityValue}
          onChange={val => {
            setState({ identityValue: val })
            navigate(
              `/docs/${operationNameGroupedFromBackendObj[val][0].operation}${operationNameGroupedFromBackendObj[val][0].operationName}&${val}`,
            )
          }}
          className={styles.selector}
          options={operationNamesFromGroupOptions || []}
        />
      )}
      <div style={{ marginLeft: isNeedGrouped ? 0 : 24 }}>
        <Tooltip title={<span>Backend Url（'ctrl + click'）</span>}>
          <a
            href={schemaUrl}
            onClick={handleLinkClick}
            style={{ color: '#fff' }}>
            {schemaUrl}
          </a>
        </Tooltip>
      </div>
    </>
  )
}

export default GroupSelection

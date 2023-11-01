import { Select, Tooltip } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import useBearStore from '@/stores'

import styles from './index.module.less'

import type { FC } from 'react'

interface IProps {}

const GroupSelection: FC<IProps> = () => {
  const navigate = useNavigate()

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

  if (!isNeedGrouped) return null

  return (
    <>
      <Select
        placeholder="请选择项目组名称"
        allowClear
        value={identityValue}
        onChange={val => {
          setState({ identityValue: val })
          navigate(
            `/docs/${operationNameGroupedFromBackendObj[val][0].operation}${operationNameGroupedFromBackendObj[val][0].operationName}`,
          )
        }}
        className={styles.selector}
        options={operationNamesFromGroupOptions || []}
      />
      <Tooltip title={<span>Backend Url（'ctrl + click'）</span>}>
        <a href={schemaUrl} onClick={handleLinkClick} style={{ color: '#fff' }}>
          {schemaUrl}
        </a>
      </Tooltip>
    </>
  )
}

export default GroupSelection

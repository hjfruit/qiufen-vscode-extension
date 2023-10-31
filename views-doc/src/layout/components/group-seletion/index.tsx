import { Select } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import useBearStore from '@/stores'

import styles from './index.module.less'

import type { FC } from 'react'

interface IProps {}

const GroupSelection: FC<IProps> = () => {
  const navigate = useNavigate()

  const {
    isNeedGrouped,
    operationNamesFromGroupOptions,
    identityValue,
    operationNameGroupedFromBackendObj,
    setState,
  } = useBearStore(state => state)

  if (!isNeedGrouped) return null

  return (
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
  )
}

export default GroupSelection

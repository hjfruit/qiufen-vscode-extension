import {
  FileOutlined,
  HomeTwoTone,
  HomeOutlined,
  FileTwoTone,
} from '@ant-design/icons'
import { Select } from 'antd'
import classnames from 'classnames'
import React, { useLayoutEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import logo from '@/assets/images/logo.png'
import useBearStore from '@/stores'

import styles from './index.module.less'

import type { FC } from 'react'

interface IProps {}

export enum SideBarIconKey {
  HOME = 'HOME',
  DOCS = 'DOCS',
  NONE = 'NONE',
}

const KEY_MAP: Record<string, SideBarIconKey> = {
  home: SideBarIconKey.HOME,
  docs: SideBarIconKey.DOCS,
  none: SideBarIconKey.NONE,
}

const Layout: FC<IProps> = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const key = location.pathname.split('/')[1]
  const {
    isNeedGrouped,
    operationNamesFromGroupOptions,
    identityValue,
    operationNameGroupedFromBackendObj,
    setState,
  } = useBearStore(state => state)

  const [sideBarActiveKey, setSideBarActiveKey] = useState(KEY_MAP[key])
  const [focusKey, setFocusKey] = useState(KEY_MAP[key])

  useLayoutEffect(() => {
    setSideBarActiveKey(KEY_MAP[key])
  }, [key, location.pathname])

  return (
    <div>
      <div className={styles.topBar}>
        <img src={logo} alt="qiufen logo" className={styles.logo} />
        <p className={styles.title}>QIUFEN</p>
        {isNeedGrouped && (
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
        )}
      </div>
      <div className={styles.section}>
        <div className={styles.sideBar}>
          <Link to="/docs">
            <div
              onMouseEnter={() => {
                setFocusKey(SideBarIconKey.DOCS)
              }}
              onMouseLeave={() => {
                setFocusKey(SideBarIconKey.NONE)
              }}
              className={classnames(styles.icon_item, {
                [styles.active]:
                  sideBarActiveKey === SideBarIconKey.DOCS ||
                  focusKey === SideBarIconKey.DOCS,
              })}>
              {sideBarActiveKey === SideBarIconKey.DOCS ||
              focusKey === SideBarIconKey.DOCS ? (
                <FileTwoTone className={styles.icon} />
              ) : (
                <FileOutlined className={styles.icon} />
              )}
            </div>
          </Link>

          {/* ----------- */}
          <Link to="/home">
            <div
              onMouseEnter={() => {
                setFocusKey(SideBarIconKey.HOME)
              }}
              onMouseLeave={() => {
                setFocusKey(SideBarIconKey.NONE)
              }}
              className={classnames(styles.icon_item, {
                [styles.active]:
                  sideBarActiveKey === SideBarIconKey.HOME ||
                  focusKey === SideBarIconKey.HOME,
              })}>
              {sideBarActiveKey === SideBarIconKey.HOME ||
              focusKey === SideBarIconKey.HOME ? (
                <HomeTwoTone className={styles.icon} />
              ) : (
                <HomeOutlined className={styles.icon} />
              )}
            </div>
          </Link>
        </div>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Layout

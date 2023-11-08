import { BellTwoTone } from '@ant-design/icons'
import { onSchemaDiffToOperationDefs } from '@fruits-chain/qiufen-pro-helpers'
import { Tooltip } from 'antd'
import { buildSchema } from 'graphql'
import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import useBearStore from '@/stores'

import type { FC } from 'react'

interface IProps {}

const ListenSchemaUpdate: FC<IProps> = () => {
  const { fetchLastTypeDefs, setState, hasUpdateInfo } = useBearStore(
    state => state,
  )
  const [graphqlSdl, setGraphqlSdl] = useState({
    typeDefs: '',
    lastSdl: '',
  })

  useMemo(() => {
    if (graphqlSdl.typeDefs && graphqlSdl.lastSdl) {
      const [leftSchema, rightSchema] = [
        buildSchema(graphqlSdl.typeDefs),
        buildSchema(graphqlSdl.lastSdl),
      ]
      const changes = onSchemaDiffToOperationDefs(leftSchema, rightSchema)

      if (changes?.length) {
        setState({ hasUpdateInfo: true })
      }
    }
  }, [graphqlSdl.lastSdl, graphqlSdl.typeDefs, setState])

  useEffect(() => {
    let timer: NodeJS.Timer | undefined
    if (!hasUpdateInfo) {
      timer = setInterval(async () => {
        const res = await fetchLastTypeDefs()
        setGraphqlSdl(res)
      }, 5000)
    } else {
      if (timer) clearInterval(timer)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [hasUpdateInfo])

  const navigate = useNavigate()

  return (
    <div
      style={{ marginLeft: 12 }}
      onClick={() => {
        navigate('/home')
      }}>
      {hasUpdateInfo ? (
        <Tooltip title={<span>有更新（点击跳转到差异对比页面进行查看）</span>}>
          <BellTwoTone twoToneColor="#52c41a" style={{ fontSize: 24 }} />
        </Tooltip>
      ) : null}
    </div>
  )
}

export default ListenSchemaUpdate

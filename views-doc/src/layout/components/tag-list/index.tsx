import { DownOutlined } from '@ant-design/icons'
import { Dropdown, Space } from 'antd'
import React from 'react'
import { Link } from 'react-router-dom'

import { useTagsStore } from '@/stores/persist'

import type { MenuProps } from 'antd'
import type { FC } from 'react'

interface IProps {}

const TagList: FC<IProps> = () => {
  const { tags } = useTagsStore()

  const items: MenuProps['items'] = tags.map(tag => {
    return {
      key: tag.routePath,
      label: (
        <Link to={tag.routePath}>
          {tag.operationZhCn
            ? `${
                tag.operationZhCn.length > 15
                  ? tag.operationZhCn.slice(0, 15)
                  : tag.operationZhCn
              }（${tag.operation}）`
            : `${tag.type} ${tag.operation}`}
        </Link>
      ),
    }
  })

  if (!tags.length) return null

  return (
    <Dropdown menu={{ items }}>
      <a
        onClick={e => e.preventDefault()}
        style={{ marginLeft: 24, color: '#fff' }}>
        <Space>
          Operations for history
          <DownOutlined />
        </Space>
      </a>
    </Dropdown>
  )
}

export default TagList

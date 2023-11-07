import uniqBy from 'lodash/uniqBy'
import create from 'zustand'
import { persist } from 'zustand/middleware'

interface ITags {
  tags: TagItem[]
  addATags: (tag: TagItem) => void
}

type TagItem = {
  operationZhCn: string
  operation: string
  type: string
  routePath: string
}

export const useTagsStore = create<ITags>(
  persist(
    (set, get) => ({
      tags: [],
      addATags: (tagItem: TagItem) => {
        const newTags = [...get().tags, tagItem]
        const uniqTags = uniqBy(newTags, 'routePath')
        if (uniqTags.length > 10) {
          uniqTags.shift()
        }
        set({ tags: uniqTags })
      },
    }),
    {
      name: 'route-tags',
      getStorage: () => sessionStorage,
    },
  ),
)

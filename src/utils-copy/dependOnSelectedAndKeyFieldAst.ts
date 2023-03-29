import { NewFieldNodeType } from './interface'

/**
 * 用于table select选择时对 operation fieldNode ast tree操作格式化的函数
 */
export function dependOnSelectedAndKeyFieldAst(ast: NewFieldNodeType, checked: boolean, key: string, isSelectionSetAction = false) {
  const newAst = { ...ast }

  newAst.checked = isSelectionSetAction ? checked : newAst.checked

  if (newAst.fieldKey === key) {
    newAst.checked = checked
    if (newAst?.children) {
      isSelectionSetAction = true
    }
  }

  if (newAst?.children) {
    newAst.children = newAst?.children?.map((child) => dependOnSelectedAndKeyFieldAst(child, checked, key, isSelectionSetAction)) as NewFieldNodeType[]
  }

  if (newAst?.children) {
    const flag = newAst?.children?.some((itm) => itm.checked)
    if (flag) {
      newAst.checked = true
    } else {
      newAst.checked = false
    }
  }

  return newAst
}

/**
 * 根据table ast tree 的 checked 是true的得到keys
 */
export function getFieldNodeAstCheckedIsTrueKeys(ast: NewFieldNodeType, keys: string[] = []) {
  if (ast.checked) {
    keys.push(ast.fieldKey)

    if (ast?.children) {
      ast.children.forEach((child) => {
        getFieldNodeAstCheckedIsTrueKeys(child, keys)
      })
    }
  }

  return keys
}

/**
 * 根据本地存在的字段keys，格式化现在远程最新的接口对应的字段key上的checked为true
 */
export function dependOnWorkspaceFieldKeysToFieldAstTree(ast: NewFieldNodeType, selectedKeys: string[]) {
  const newAst = { ...ast }

  if (selectedKeys.includes(newAst.fieldKey)) {
    newAst.checked = true
  }

  if (newAst?.children && selectedKeys.length) {
    newAst.children = newAst.children.map((child) => dependOnWorkspaceFieldKeysToFieldAstTree(child, selectedKeys)) as NewFieldNodeType[]
  }

  return newAst
}

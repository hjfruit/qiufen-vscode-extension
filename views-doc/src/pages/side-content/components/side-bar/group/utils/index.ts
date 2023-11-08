/**
 * 判断子元素是否在父元素的可视区范围内
 */
export function isElementInViewport(el: HTMLElement, container: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  return rect.top >= containerRect.top && rect.bottom <= containerRect.bottom
}

export function getDistanceToAncestor(
  child: HTMLElement,
  ancestor: HTMLElement,
) {
  let top = 0
  let currentElement = child

  while (currentElement && currentElement !== ancestor) {
    top += currentElement.offsetTop
    currentElement = currentElement.offsetParent as HTMLElement
  }

  return top
}

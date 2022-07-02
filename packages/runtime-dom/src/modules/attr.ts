/**
 * @param el dom对象
 * @param key 属性名
 * @param nextValue 新的属性值
 */
export function patchAttr(el: Element, key, nextValue) {
  if (nextValue) {
    el.setAttribute(key, nextValue);
  } else {
    el.removeAttribute(key);
  }
}

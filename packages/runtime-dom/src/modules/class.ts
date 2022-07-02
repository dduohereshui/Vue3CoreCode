/**
 * @param el dom对象
 * @param nextValue 新的class名
 */
export function patchClass(el: Element, nextValue) {
  if (nextValue == null) {
    el.removeAttribute("class");
  } else {
    el.className = nextValue;
  }
}

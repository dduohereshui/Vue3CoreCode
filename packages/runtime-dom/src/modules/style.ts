/**
 * @param el dom对象
 * @param prevValue style的旧对象
 * @param nextValue style的新对象
 */
export function patchStyle(el, prevValue, nextValue) {
  for (const key in nextValue) {
    el.style[key] = nextValue[key];
  }
  // 老的有的，但是新的没有，就删掉
  if (prevValue) {
    for (const key in prevValue) {
      if (!nextValue[key]) {
        el.style[key] = null;
      }
    }
  }
}

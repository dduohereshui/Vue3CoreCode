// 比对属性 （创建 修改 移除）
import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

/**
 * @param el 元素
 * @param key class style...
 * @param prevValue 原来的值
 * @param nextValue 新值
 */
export function patchProp(el, key, prevValue, nextValue) {
  // className
  if (key === "class") {
    patchClass(el, nextValue);
  } else if (key === "style") {
    // style
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    //events
    patchEvent(el, key, nextValue);
  } else {
    //普通属性
    patchAttr(el, key, nextValue);
  }
}

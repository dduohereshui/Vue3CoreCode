import { isArray, isObject } from "@vue/shared";
import { createVNode, isVnode } from "./vnode";

export function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (!isArray(propsOrChildren) && isObject(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren); // propsOrChildren是一个对象，就代表是一个属性
    } else {
      // propsOrChildren is Array or String 就代表是子的 集合或者是一个文本
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    } else if (l === 3 && isVnode(children)) {
      // 等于3
      children = [children];
    }
    // 其他情况
    return createVNode(type, propsOrChildren, children);
  }
}

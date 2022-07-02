import { isArray, isObject } from "@vue/shared";
import { createVnode, isVnode } from "./vnode";
/**
 * h('div')
 * h('div',{style:{color:"red"}})
 * h('div',{style:{color:"red"}},'hello')
 * h('div',{style:{color:"red"}},[h('span',{},'gg'),h('p',{},'ll')])
 * @param type //类型
 * @param propsChildren // props 或者children
 * @param children children
 */
export function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    // type + props || type + children
    // h('div','hello')
    // h('div',{style:{color:'red'}})
    // h('div',[h('span',null,'hello'),h('span',null,'world')])
    if (!isArray(propsOrChildren) && isObject(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        // 处理 propsOrChildren 是vnode
        return createVnode(type, null, [propsOrChildren]);
      }
      // 处理propsOrChildren只是属性
      return createVnode(type, propsOrChildren);
    } else {
      // 处理propsOrChildren是文本或者数组
      return createVnode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      // 拿到所有的children
      children = [...arguments].slice(2);
    } else if (l === 3 && isVnode(children)) {
      // h('div',{},h('div','hello'))
      children = [children];
    }
    return createVnode(type, propsOrChildren, children);
  }
}

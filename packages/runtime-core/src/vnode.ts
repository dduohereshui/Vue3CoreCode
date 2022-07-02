import { isString, ShapeFlags, isArray } from "@vue/shared";

export function isVnode(value) {
  return !!(value && value.__v_isVnode);
}
// 组件 元素 文本
export function createVnode(type, props, children = null) {
  // type 是string的话，就表明这是一个元素
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
  const vnode = {
    type,
    props,
    children,
    key: props?.key, // 有key就拿，没有就是undefined
    el: null, // 虚拟节点对应的真实节点
    __v_isVnode: true,
    shapeFlag,
  };
  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      // 字符串
      children = String(children);
      type = ShapeFlags.TEXT_CHILDREN;
    }
    // 这样就可以标识出这个虚拟节点 是元素或字符串，以及是元素的话，这个元素的children是数组还是字符串
    vnode.shapeFlag = vnode.shapeFlag | type;
  }
  return vnode;
}

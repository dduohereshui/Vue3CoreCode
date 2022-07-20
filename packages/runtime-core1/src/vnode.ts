import { isArray, isString, ShapeFlags } from "@vue/shared";
// text类型
export const Text = Symbol("TEXT");
/**
 * @param value any
 * @returns
 */
export function isVnode(value) {
  return value ? value._v_isVnode === true : false;
}
export function isSameVNode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
/**
 * @param type 虚拟节点的类型 例如：'div','span'
 * @param props 虚拟节点上的属性
 * @param children 虚拟节点的子节点
 */
export function createVNode(type, props, children?) {
  // type是一个字符串，就代表是一个标签 如div
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
  // 虚拟节点
  const vnode = {
    _v_isVnode: true,
    shapeFlag,
    el: null, // 虚拟节点对应的真实节点
    type, // div等
    key: props?.key,
    props,
    children,
  };
  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      type = ShapeFlags.TEXT_CHILDREN;
    }
    vnode.shapeFlag |= type;
  }
  return vnode;
}

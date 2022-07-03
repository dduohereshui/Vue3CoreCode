import { isString, ShapeFlags } from "@vue/shared";
import { createVnode, Text } from "./vnode";
export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    remove: hostRemove,
  } = renderOptions;
  const normalize = (child) => {
    if (isString(child)) {
      return createVnode(Text, null, child);
    }
    return child;
  };
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalize(children[i]);
      patch(null, child, container);
    }
  };
  const mountElement = (vnode, container) => {
    let { type, props, children, shapeFlag } = vnode;
    let el = (vnode.el = hostCreateElement(type));
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 数组
      mountChildren(children, el);
    }
    // 将该元素插入到容器里
    hostInsert(el, container);
  };
  const processText = (n1, n2, container) => {
    if (n1 == null) {
      // 初始化
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    }
  };
  const patch = (n1, n2, container) => {
    if (n1 === n2) return;
    const { type, shapeFlag } = n2;
    if (n1 == null) {
      // 老的虚拟节点是null，就挂载
      switch (type) {
        case Text: // h('hello') 希望直接渲染出一个字符串
          processText(n1, n2, container);
          break;
        default:
          if (shapeFlag & ShapeFlags.ELEMENT) {
            mountElement(n2, container);
          }
      }
    } else {
      // 更新
    }
  };
  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };
  const render = (vnode, container) => {
    if (vnode == null) {
      // 卸载
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      // 这里既有初始化的逻辑，又有更新的逻辑
      // conatiner挂载过了就会有_vnode属性，那么就会走更新的逻辑
      patch(container._vnode || null, vnode, container);
    }
    // render的时候，挂了一个_vnode属性
    container._vnode = vnode;
  };
  return {
    render,
  };
}

import { isString, ShapeFlags } from "@vue/shared";
import { createVNode, Text } from "./vnode";
export function createRenderer(renderOptions) {
  // 通过传入的渲染器选项进行渲染
  const {
    insert: hostInsert,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    remove: hostRemove,
    setText: hostSetText,
  } = renderOptions;
  /**
   * 同步Text节点的文本内容，使其和其他vnode保持一致
   * @param child
   * @returns
   */
  const normalize = (child) => {
    if (isString(child)) {
      return createVNode(Text, null, child);
    }
    return child;
  };
  // 挂载儿子
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalize(children[i]);
      patch(null, child, container);
    }
  };
  const mountElement = (vnode, container) => {
    const { type, props, children, shapeFlag } = vnode;
    // 虚拟节点的el属性赋值，后续用于复用节点和更新
    const el = (vnode.el = hostCreateElement(type));
    // 属性赋值
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 下面开始挂载子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 儿子是一个文本
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }

    hostInsert(el, container); // 将节点插入到容器中
  };
  const processText = (n1, n2, container) => {
    if (n1 == null) {
      // 文本第一次挂载
      const el = (n2.el = hostCreateText(n2.children));
      hostInsert(el, container);
    } else {
      // 文本更新
    }
  };
  // 核心方法
  const patch = (n1, n2, container) => {
    const { type, shapeFlag } = n2;
    if (n1 == n2) return;
    if (n1 == null) {
      // 挂载流程
      switch (type) {
        case Text:
          processText(n1, n2, container);
          break;
        default:
          if (shapeFlag & ShapeFlags.ELEMENT) {
            mountElement(n2, container);
          }
      }
    } else {
      // 更新流程
    }
  };
  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };
  const render = (vnode, container) => {
    // console.log(vnode, container);
    if (vnode == null) {
      // vnode为空，卸载
      if (container._vnode) unmount(container._vnode);
    } else {
      // 第一次渲染，container._vnode为null，走挂载流程，之后渲染，container._vnode不为null，走更新流程
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    render,
  };
}

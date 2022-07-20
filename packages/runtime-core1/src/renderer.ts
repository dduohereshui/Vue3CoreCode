import { isString, ShapeFlags } from "@vue/shared";
import { createVNode, isSameVNode, Text } from "./vnode";
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
  /**
   * 元素属性的patch
   * @param oldProps
   * @param newProps
   * @param el
   */
  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (const key in oldProps) {
      // 老的里有，但是新的没有
      if (newProps[key] == null) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };
  /**
   * 比较虚拟节点儿子的差异（diff算法）
   * @param n1
   * @param n2
   * @param el 复用的容器
   */
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;
  };
  /**
   * vue3的diff算法入口
   * @param n1
   * @param n2
   * @param container
   */
  const patchElement = (n1, n2) => {
    const el = (n2.el = n1.el);
    const oldProps = n1.props || {};
    const onewProps = n2.props || {};
    // patch props
    patchProps(oldProps, onewProps, el);
    // patch children
    patchChildren(n1, n2, el);
  };
  const processText = (n1, n2, container) => {
    if (n1 == null) {
      // 文本第一次挂载
      const el = (n2.el = hostCreateText(n2.children));
      hostInsert(el, container);
    } else {
      // 文本更新
      const el = (n2.el = n1.el); //复用老节点，无需重新创建，提高性能
      if (n1.children !== n2.children) {
        // 俩文本不一样，更新文本内容
        hostSetText(el, n2.children);
      }
    }
  };
  const processElement = (n1, n2, container) => {
    if (n1 == null) {
      // 元素挂载
      mountElement(n2, container);
    } else {
      // patch元素
      patchElement(n1, n2);
    }
  };
  // 核心方法
  const patch = (n1, n2, container) => {
    if (n1 == n2) return;
    if (n1 && !isSameVNode(n1, n2)) {
      // 前后都不是一个节点，则删除n1的节点，并挂载n2的节点
      unmount(n1);
      n1 = null; // n1置为null，下面就可以直接创建n2
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container);
        }
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

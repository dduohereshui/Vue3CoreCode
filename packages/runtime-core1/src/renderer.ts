import { ReactiveEffect } from "@vue/reactivity";
import { invokeArrayFns, isNumber, isString, ShapeFlags } from "@vue/shared";
import {
  createComponentInstance,
  hasPropsChange,
  setupComponent,
  updateProps,
} from "./component";
import { getSequence } from "./getSequence";
import { queueJob } from "./scheduler";
import { createVNode, isSameVNode, Text, Fragment } from "./vnode";
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
  const normalize = (children, i) => {
    if (isString(children[i]) || isNumber(children[i])) {
      const vnode = createVNode(Text, null, children[i]);
      children[i] = vnode;
    }
    return children[i];
  };
  // 挂载儿子
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalize(children, i);
      patch(null, child, container);
    }
  };
  const mountElement = (vnode, container, anchor) => {
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

    hostInsert(el, container, anchor); // 将节点插入到容器中
  };
  const mountComponent = (vnode, container, anchor) => {
    // 创建组件实例 (并且给vnode挂载一个component属性，对应这一次的组件实例)
    const instance = (vnode.component = createComponentInstance(vnode));
    // 实例上属性赋值
    setupComponent(instance);
    // 给组件添加响应式（组件的渲染与更新函数）
    setupRenderEffect(instance, container, anchor);
  };
  const shouldUpdateComponent = (n1, n2): boolean => {
    const { props: prevProps, children: prevSlots } = n1; // 组件上传的props
    const { props: nextProps, children: nextSlots } = n2; // 组件上传的props
    if (prevProps === nextProps) return false;
    if (prevSlots || nextSlots) {
      return true;
    }
    if (hasPropsChange(prevProps, nextProps)) {
      return true;
    }
    // updateProps(instance, prevProps, nextProps); // 更新props
  };
  // 两个组件vnode的patch函数
  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component); // 组件复用实例
    // 需要更新的时候去update props slots等
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update(); // 更新组件
    }
  };
  /**
   * 组件真正更新前，先更新props slots等
   * @param instance 组件实例
   * @param next 组件vnode
   */
  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    instance.vnode = next;
    // 更新props instance上的props是上一次的props，next.props是最新传的props
    updateProps(instance.props, next.props);
  };
  /**
   * 组件初次渲染以及后续更新的函数，原理就是effect
   * @param instance
   * @param container
   * @param anchor
   */
  const setupRenderEffect = (instance, container, anchor) => {
    const { render } = instance;
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        //组件 挂载
        console.log("组件挂载");
        const { bm, m } = instance;
        if (bm) {
          invokeArrayFns(bm);
        }
        const subTree = render.call(instance.proxy, instance.proxy); // 这里组件里用到的值会去收集依赖
        patch(null, subTree, container, anchor);
        instance.subTree = subTree;
        instance.isMounted = true;
        if (m) {
          invokeArrayFns(m);
        }
      } else {
        //组件更新
        const { next, bu, u } = instance; // next是组件props或slots更新时在实例上挂的值，执行instance.update时可以拿到
        if (next) {
          // 更新props和slots
          updateComponentPreRender(instance, next);
        }
        if (bu) {
          invokeArrayFns(bu);
        }
        console.log("组件更新", instance);
        const subTree = render.call(instance.proxy, instance.proxy); // 这里组件里用到的值也会去收集依赖
        patch(instance.subTree, subTree, container, anchor); // 走diff等操作
        instance.subTree = subTree;
        if (u) {
          invokeArrayFns(u);
        }
      }
    };
    const effect = new ReactiveEffect(componentUpdateFn, () =>
      queueJob(instance.update)
    ); // schedule调度缓存更新状态
    // instance挂一个强制更新的update方法
    const update = (instance.update = effect.run.bind(effect));
    update();
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
        hostPatchProp(el, key, oldProps[key], undefined);
      }
    }
  };
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };
  /**
   * diff算法
   * @param c1
   * @param c2
   * @param el
   */
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    /* i = 0 e1 = 2 e2 = 3
     * a b c
     * a b d e
     */
    // sync from start
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el); // key和type一样，就去递归patch
      } else {
        break;
      }
      i++;
    }
    // sync from end
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    /**
     * i:0     e1:2     e2:4
     * 经过上面的对比 i:3 e1:2 e2: 4
     * a b c
     * a b c d e
     * 有新增，新增的是i～e2之间的节点 挂载新节点
     */
    // common sequence mount
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          // 判断一下插入前面还是后面
          const nextPos = e2 + 1;
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    }

    // 有需要卸载的
    /**
     * i > e2 && i <= e1
     * a b c
     * a b
     * i:2 e1:2 e2:1
     * 卸载i～e1之间的节点
     */
    // common sequence unmount
    if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    }
    //乱序比对
    /**
     *  a b c d e   f g
     *  a b e c d h f g
     * 经过上面的优化，i:2 e1:4 e2:5
     * c1中下标2～4 c2中下标2～5 互为乱序
     */
    // 新列表做一个映射表，去老列表里面寻找
    // console.log(i, e1, e2);
    const keyToNewIndexMap = new Map();
    let s1 = i;
    let s2 = i; //新列表开始位置 2 ~ 5
    for (let i = s2; i <= e2; i++) {
      keyToNewIndexMap.set(c2[i].key, i); // 将新列表的key和下标映射到表中
    }
    // console.log(keyToNewIndexMap); // {'e' => 2, 'c' => 3, 'd' => 4, 'h' => 5}
    const toBePatched = e2 - s2 + 1; // 待更新的节点长度(也就是s2～e2之间的节点)
    const newIndexToNewIndexArr = new Array(toBePatched).fill(0); // 记录新列表的key有没有在老列表中找到
    // 循环老列表，寻找老节点的key在Map中的位置，有的话就patch，没有就卸载
    for (let i = s1; i <= e1; i++) {
      const oldChild = c1[i];
      const newIndex = keyToNewIndexMap.get(oldChild.key);
      if (newIndex) {
        newIndexToNewIndexArr[newIndex - s2] = i + 1;
        patch(oldChild, c2[newIndex], el);
      } else {
        // 老的有新的没有，卸载老的
        unmount(oldChild);
      }
    }
    // console.log(newIndexToNewIndexArr); //[5, 3, 4, 0]

    const sequence = getSequence(newIndexToNewIndexArr); //[1,2]
    let j = sequence.length - 1; //
    for (let i = toBePatched - 1; i >= 0; i--) {
      const lastIndex = i + s2;
      const current = c2[lastIndex];
      const anchor = lastIndex + 1 < c2.length ? c2[lastIndex + 1].el : null;
      if (newIndexToNewIndexArr[i] === 0) {
        // 该元素在老列表中不存在，需要重新创建
        patch(null, current, el, anchor);
      } else {
        if (i !== sequence[j]) {
          // 复用原来的节点，倒序插入
          hostInsert(current.el, el, anchor);
        } else {
          j--;
        }
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
    // 新老节点都有三种情况 文本 数组 null
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 新的儿子是文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 老的儿子是数组
        unmountChildren(c1);
      }
      // 老的儿子是文本
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 老的儿子是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新的儿子是数组 （diff算法）
          patchKeyedChildren(c1, c2, el); // 比较数组的差异 diff 算法
        } else {
          // 新的儿子是文本或者null
          unmountChildren(c1);
        }
      } else {
        // 老的儿子是文本或者null
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新的儿子是数组
          mountChildren(c2, el);
        }
      }
    }
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
    // n2 = normalize() 更新的时候没有对字符串做处理
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
  const processFragment = (n1, n2, container) => {
    if (n1 == null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 元素挂载
      mountElement(n2, container, anchor);
    } else {
      // patch元素
      patchElement(n1, n2);
    }
  };
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor);
    } else {
      // 组件更新靠的是props和插槽
      updateComponent(n1, n2);
    }
  };
  // 核心方法
  const patch = (n1, n2, container, anchor = null) => {
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
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor);
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

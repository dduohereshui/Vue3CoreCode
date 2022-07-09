import { isNumber, isString, ShapeFlags } from "@vue/shared";
import { getSequence } from "./sequence";
import { createVnode, Text, isSameVnode, Fragment } from "./vnode";
import { createComponentInstance, setupComponent } from "./component";
import { ReactiveEffect } from "@vue/reactivity";
import { queueJob } from "./scheduler";
import { hasPropsChange, updateProps } from "./componentProps";

export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    remove: hostRemove,
    setText: hostSetText,
    nextSibling: hostNextSibling,
  } = renderOptions;
  const normalize = (children, i) => {
    if (isString(children[i]) || isNumber(children[i])) {
      let vnode = createVnode(Text, null, children[i]);
      children[i] = vnode;
    }
    return children[i];
  };
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalize(children, i);
      patch(null, child, container);
    }
  };
  const mountElement = (vnode, container, anchor) => {
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
    hostInsert(el, container, anchor);
  };
  // 处理文本
  const processText = (n1, n2, container) => {
    // console.log(n1, n2, container);
    if (n1 == null) {
      // 初始化
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      // n1 n2 都是文本 复用n1的节点
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  // patch Props
  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (const key in oldProps) {
      if (!newProps[key]) {
        hostPatchProp(el, key, oldProps[key], undefined);
      }
    }
  };
  const unmountChildren = (children: any[]) => {
    // console.log(children);
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };
  // const patchUnkeyedChildren = (c1, c2, el) => {};
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    // sync from start
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    // sync from end
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // common sequence + mount
    // 只要i比e1大，那么i和e2之间的就是新增的
    if (i > e1) {
      // 这是新增的部分
      if (i <= e2) {
        while (i <= e2) {
          // console.log("patch");
          // e2下一个有节点就代表insertBefore，没有就是不appendChild
          const nextPos = e2 + 1;
          // 参照物
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor); //
          i++;
        }
      }
    }
    // common sequence + unmount
    else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]); // 卸载掉多的
          i++;
        }
      }
    } else {
      // 乱序
      const s1 = i;
      const s2 = i;
      // console.log(i, e1, e2);
      // 创建 新序列中key和索引值的映射表
      const keyToNewIndex = new Map();
      for (let i = s2; i <= e2; i++) {
        keyToNewIndex.set(c2[i].key, i);
      }
      // console.log(keyToNewIndex);
      //
      const toBePatched = e2 - s2 + 1;
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

      // 循环老的序列（复用或创建元素）
      for (let i = s1; i <= e1; i++) {
        const oldChild = c1[i];
        // 老元素能在新序列中找到，复用
        const newIndex = keyToNewIndex.get(oldChild.key);
        // 没找到就直接干掉
        if (newIndex == undefined) {
          unmount(oldChild);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          // 对比差异 复用
          patch(oldChild, c2[newIndex], el);
        }
      }
      // 得到最长递增子序列
      const incrementSequence = getSequence(newIndexToOldIndexMap);
      // console.log(newIndexToOldIndexMap);
      let j = incrementSequence.length - 1;
      for (let i = toBePatched - 1; i >= 0; i--) {
        let index = s2 + i;
        let current = c2[index];
        let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          // 在老的序列中不存在 需要创建
          patch(null, current, el, anchor);
        } else {
          if (i !== incrementSequence[j]) {
            hostInsert(current.el, el, anchor);
          } else {
            j--;
          }
        }
      }
    }
  };
  // 比对儿子 ，diff算法核心
  const patchChildren = (n1, n2, el) => {
    // debugger;
    const c1 = n1.children;
    const c2 = n2.children;
    // 文本 null 数组
    // 拿到他们的类型
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    // 1. 文本 数组
    // 2. 文本 文本
    // 3. 数组 数组 （diff算法）
    // 4. 数组 文本
    // 5. null 数组
    // 6. null 文本

    // 新的是一个文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的是一个数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 移除老的所有儿子
        unmountChildren(c1);
      }
      // 老的也是文本
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      // 新的为数组或者是空
      // 之前的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 现在也是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff 算法
          // debugger;
          // patchUnkeyedChildren(c1, c2, el); // 全量更新 没有key
          patchKeyedChildren(c1, c2, el); //
        } else {
          // 现在是文本或者空
          unmountChildren(c1);
        }
      } else {
        // 之前是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 清空文本
          hostSetElementText(el, "");
        }
        // 现在是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 挂载数组
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1, n2) => {
    const el = (n2.el = n1.el);
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    // 处理属性
    patchProps(oldProps, newProps, el);
    // 处理儿子
    patchChildren(n1, n2, el);
  };
  const processElement = (n1, n2, container, anchor) => {
    // 元素挂载
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      // n1 n2 都有 进行更新 （会有儿子的情况，较为复杂）
      patchElement(n1, n2);
    }
  };
  const processFragment = (n1, n2, container) => {
    if (n1 == null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };
  const mountComponent = (vnode, container, anchor) => {
    // 1. 创建一个组件实例
    const instance = (vnode.component = createComponentInstance(vnode));
    // 2. 给组件实例上的属性赋值(处理setup)
    setupComponent(instance);

    // 初始化渲染effect
    setupRenderEffect(instance, container, anchor);
  };
  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    instance.vnode = next;
    updateProps(instance.props, next.props);
  };
  const setupRenderEffect = (instance, container, anchor) => {
    const updateComponent = () => {
      const { render } = instance;
      // 没有挂载 就走挂载逻辑
      if (!instance.isMounted) {
        // 注意，组件是无需挂载的，需要挂载的是组件 render函数返回的vnode，也就是子树
        const subTree = render.call(instance.proxy); // 使用instance.proxy 是想自定义查找顺序，data，props，attrs
        patch(null, subTree, container, anchor); // 将subTree的真实节点挂载到dom上
        instance.subTree = subTree; // 供之后更新用
        instance.isMounted = true;
      } else {
        const { next } = instance;
        if (next) {
          // 更新前要将新属性进行更改
          updateComponentPreRender(instance, next);
        }
        // 更新逻辑
        const subTree = render.call(instance.proxy); // 重新计算得到新树
        patch(instance.subTree, subTree, container, anchor);
        // 更新现在组件实例上的子组件
        instance.subTree = subTree;
      }
    };

    const effect = new ReactiveEffect(
      updateComponent,
      () => {
        // console.log(instance.update, "update");
        queueJob(instance.update);
      } //  将更新缓存，不能同步更新，会出现严重bug
    );

    const update = (instance.update = effect.run.bind(effect));
    // 第一次先执行一次，挂载好组件
    update(); // 组件的更新方法
  };
  const shouldUpdateComponent = (n1, n2) => {
    const { props: prevProps } = n1;
    const { props: nextProps } = n2;
    if (prevProps === nextProps) return false;
    if (hasPropsChange(prevProps, nextProps)) {
      return true;
    }
  };
  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component); // 组件需要复用的是组件实例
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    }
  };
  // 处理组件
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor);
    } else {
      // 组件更新靠的是props，slot以及组件内响应式数据的更改
      updateComponent(n1, n2);
    }
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return;
    // n1 n2 类型 key都不一样
    if (n1 && !isSameVnode(n1, n2)) {
      // 删除老的
      unmount(n1);
      n1 = null;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text: // h('hello') 希望直接渲染出一个字符串
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, anchor);
        }
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
      // console.log(vnode, "vnode");
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

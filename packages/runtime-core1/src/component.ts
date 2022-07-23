import { proxyRefs, reactive } from "@vue/reactivity";
import { hasOwn, isFunction, isObject } from "@vue/shared";
import { initProps, initSlots } from "./componentProps";
// 正在运行的组件instance
export let currentInstance = null;
export const setCurrentInstance = (instance) => {
  currentInstance = instance;
};
export const getCurrentInstance = () => currentInstance;
export function createComponentInstance(vnode, parent) {
  const instance = {
    data: null,
    vnode,
    subTree: null, // 组件真实渲染的内容 就是render函数返回的vnode
    isMounted: false,
    update: null,
    propsOptions: vnode.type.props, //用户的props选项
    props: {},
    attrs: {},
    proxy: null, //渲染上下文，模板中用的data props attrs都是这里来的
    render: null,
    setupState: {}, // setup函数返回的state
    slots: {},
    parent,
    provides: parent ? parent.provides : Object.create(null), // 组件上的provides都是用的父亲的provides
  };
  return instance;
}
const publicPropertyMap = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots,
};
const publicInstanceProxy = {
  get(target, key) {
    // 对于data 会进行收集依赖
    const { data, props, setupState } = target;
    if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    } else if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    }
    // this.$attrs.a
    const getter = publicPropertyMap[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, value) {
    const { data, props, setupState } = target;
    if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value;
    } else if (data && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (props && hasOwn(props, key)) {
      console.warn("Setting props as state is not supported.");
      return false;
    }
    return true;
  },
};
export function setupComponent(instance) {
  // vnode上的props是往组件上传的属性,  这里的type就是组件对象，该对象里面有data props render等属性
  const { props, type, children } = instance.vnode;

  initProps(instance, props);
  initSlots(instance, children);

  instance.proxy = new Proxy(instance, publicInstanceProxy);

  const { data, render, setup } = type;

  if (data && isFunction(data)) {
    // 用户使用的data就是一个赋予了响应式功能的对象
    instance.data = reactive(data.call(instance.proxy));
  }
  if (setup) {
    const setupContext = {
      emit: (event, ...args) => {
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
        // 组件传的函数存储在组件上的props中
        const handler = props[eventName];
        if (handler) {
          handler(...args);
        }
      },
      attrs: instance.attrs,
      slots: instance.slots,
    };
    setCurrentInstance(instance);
    const setupResult = setup(instance.props, setupContext);
    setCurrentInstance(null);
    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      instance.setupState = proxyRefs(setupResult);
      // console.log(instance.setupState);
    }
  }
  if (!instance.render) {
    // 实例上挂载render方法，template解析成的方法
    instance.render = render;
  }
}

export function updateProps(prevProps, nextProps) {
  // 组件props更新与否从两个维度判断  props长度以及值是否相等
  if (hasPropsChange(prevProps, nextProps)) {
    // console.log("更新了");
    for (const key in nextProps) {
      //因为复用了老的instance，所以实例上拥有props属性，并且props属性是一个响应式对象
      prevProps[key] = nextProps[key];
    }
    // 删掉之前有的但是现在没有的
    for (const key in prevProps) {
      if (!hasOwn(nextProps, key)) {
        delete prevProps[key];
      }
    }
  }
}

export function hasPropsChange(prevProps = {}, nextProps = {}): boolean {
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true; // 表示props发生了变化
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}

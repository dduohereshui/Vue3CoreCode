import { hasOwn, isFunction, isObject } from "@vue/shared";
import { reactive, proxyRefs } from "@vue/reactivity";
import { initProps, initSlots } from "./componentProps";

export let currentInstance = null;
// 暴露出现在的组件实例
export const setCurrentInstance = (instance) => {
  currentInstance = instance;
};
export const getCurrentInstance = () => currentInstance;

// 公开属性映射表
const publicPropertyMap = {
  $attrs: (i) => i.attrs,
  $slots: (i) => i.slots,
};
/**
 *
 * @param vnode 该组件的虚拟node
 * @param parent 该组件的父组件
 * @returns
 */
export function createComponentInstance(vnode) {
  const instance = {
    ctx: {}, // 实例的上下文
    data: null,
    vnode, // 组件
    subTree: null, //渲染组件的内容
    isMounted: false,
    update: null,
    propsOptions: vnode.type.props, // 用户在组件里接收的props
    props: {},
    attrs: {},
    proxy: null,
    setupState: {}, // setup返回的数据
    slots: {}, // 插槽
  };
  return instance;
}
const publicInstanceProxy = {
  get(target, key) {
    const { data, props, setupState } = target;
    if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    } else if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    }
    const getter = publicPropertyMap[key]; // this.$attrs
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, newVal) {
    const { data, props, setupState } = target;
    if (setupState && hasOwn(setupState, key)) {
      setupState[key] = newVal;
    } else if (data && hasOwn(data, key)) {
      data[key] = newVal;
      return true;
    } else if (props && hasOwn(props, key)) {
      console.warn("props is readonly");
      return false;
    }
    return true;
  },
};
export function setupComponent(instance) {
  // children 可能是插槽
  const { props, type, children } = instance.vnode;
  // 初始化props（给组件的实例的props和attrs赋值）
  initProps(instance, props);
  // 初始化插槽
  initSlots(instance, children);
  // 用户在页面取值都会走到这里面来
  instance.proxy = new Proxy(instance, publicInstanceProxy);

  const { data } = type;
  if (data) {
    // 给用户传入的数据做响应式
    instance.data = reactive(data.call(instance.proxy));
  }
  const setup = type.setup;
  if (setup) {
    // emit的实现就是发布订阅模式
    const setupContext = {
      emit: (event, ...args) => {
        // onClick emit('click')
        const eventName = "on" + event[0].toUpperCase() + event.slice(1);
        // 通过组件props传过来的
        const handler = props[eventName];
        handler && handler(...args);
      },
      attrs: instance.attrs,
      slots: instance.slots,
    };
    // 设置currentInstance
    setCurrentInstance(instance);
    const setupResult = setup(instance.props, setupContext);
    // 该setup执行完 currentInstance要置为null，以便与其他的setup使用
    setCurrentInstance(null);

    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      // 解包方法
      instance.setupState = proxyRefs(setupResult);
    }
  }
  if (!instance.render) {
    instance.render = type.render;
  }
}

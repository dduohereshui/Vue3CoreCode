import { hasOwn, isFunction, isObject } from "@vue/shared";
import { reactive, proxyRefs } from "@vue/reactivity";
import { initProps } from "./componentProps";
// 公开属性映射表
const publicPropertyMap = {
  $attrs: (i) => i.attrs,
};
export function createComponentInstance(vnode) {
  const instance = {
    data: null,
    vnode, // 组件
    subTree: null, //渲染组件的内容
    isMounted: false,
    update: null,
    propsOptions: vnode.type.props, // 用户在组件里接收的props
    props: {},
    attrs: {},
    proxy: null,
    setupState: {},
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
  const { props, type } = instance.vnode;
  initProps(instance, props);
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
    };
    const setupResult = setup(instance.props, setupContext);
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

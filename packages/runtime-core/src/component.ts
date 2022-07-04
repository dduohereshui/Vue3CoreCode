import { hasOwn } from "@vue/shared";
import { reactive } from "@vue/reactivity";
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
  };
  return instance;
}
const publicInstanceProxy = {
  get(target, key) {
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
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
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
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
  instance.render = type.render;
}

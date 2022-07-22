import { reactive } from "@vue/reactivity";
import { hasOwn, isFunction } from "@vue/shared";
import { initProps } from "./componentProps";

export function createComponentInstance(vnode) {
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
  };
  return instance;
}
const publicPropertyMap = {
  $attrs: (instance) => instance.attrs,
};
const publicInstanceProxy = {
  get(target, key) {
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
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
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
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
  const { props, type } = instance.vnode;

  initProps(instance, props);
  instance.proxy = new Proxy(instance, publicInstanceProxy);

  const { data, render } = type;
  if (data && isFunction(data)) {
    instance.data = reactive(data.call(instance.proxy));
  }
  // 实例上挂载render方法，template解析成的方法
  instance.render = render;
}

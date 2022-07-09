import { reactive } from "@vue/reactivity";
import { hasOwn, ShapeFlags } from "@vue/shared";
/**
 * @param instance 组件实例
 * @param rawProps 用户在组件上穿的数据
 */
export function initProps(instance, rawProps) {
  const props = {};
  const attrs = {};
  // 在实例上接收了的就是props，否则就是attrs
  const options = instance.propsOptions || {};
  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key];
      if (hasOwn(options, key)) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  instance.props = reactive(props); // props赋予响应式功能 但是源码中只是shallowReactive
  instance.attrs = attrs;
}
export function hasPropsChange(prevProps = {}, nextProps = {}) {
  const nextKeys = Object.keys(nextProps);
  // 前后props对象长度不一致
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (prevProps[key] !== nextProps[key]) {
      return true;
    }
  }
  return false;
}
export function updateProps(prevProps, nextProps) {
  // 看属性有没有变化（值，属性个数）
  const isChange = hasPropsChange(prevProps, nextProps);
  if (isChange) {
    // 覆盖新属性
    for (const key in nextProps) {
      prevProps[key] = nextProps[key]; // 重新赋值props中的属性引起页面的更新
    }
    // 删掉多的属性
    for (const key in prevProps) {
      if (!hasOwn(nextProps, key)) {
        delete prevProps[key];
      }
    }
  }
}

export function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    // 将插槽赋值到实例上
    instance.slots = children;
  }
}

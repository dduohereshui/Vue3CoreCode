import { reactive } from "@vue/reactivity";
import { hasOwn } from "@vue/shared";
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
  instance.props = reactive(props);
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
  // console.log(prevProps, nextProps);

  // console.log(isChange);
  if (isChange) {
    // 覆盖新属性
    for (const key in nextProps) {
      prevProps[key] = nextProps[key];
    }
    // 删掉多的属性
    for (const key in prevProps) {
      if (!hasOwn(nextProps, key)) {
        delete prevProps[key];
      }
    }
  }
}
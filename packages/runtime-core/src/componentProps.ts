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

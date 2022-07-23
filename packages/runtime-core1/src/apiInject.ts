import { hasOwn } from "@vue/shared";
import { currentInstance } from "./component";
export function provide(key, value) {
  if (!currentInstance)
    return console.warn("provide() can only be used inside setup()");
  const parentProvides =
    currentInstance.parent && currentInstance.parent.provides;
  let provides = currentInstance.provides; // 自己的provides属性
  // 防止多次提供，多次创建provides对象浪费性能
  if (parentProvides === provides) {
    // 因为父子组件的provides是一样的，直接赋值的话父亲也能拿到子提供的数据
    provides = currentInstance.provides = Object.create(provides);
  }
  provides[key] = value;
}
export function inject(key, defaultVal) {
  if (!currentInstance)
    return console.warn("inject() can only be used inside setup()");
  const provides = currentInstance.parent && currentInstance.parent.provides;
  if (provides && hasOwn(provides, key)) {
    return provides[key];
  } else {
    return defaultVal;
  }
}

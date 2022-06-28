import { isObject } from "@vue/shared";
import { mutableHandler, ReactiveFlags } from "./baseHandler";
// 只能做对象的代理
const reactiveMap = new WeakMap(); // 同一个原始对象被reactive两次，应返回同一个代理对象
export function reactive(target) {
  if (!isObject(target)) return;
  // 同一个对象被多次代理的解决方案
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }
  // 代理对象再代理也要做优化
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  const targetProxy = new Proxy(target, mutableHandler);

  reactiveMap.set(target, targetProxy);
  return targetProxy;
}

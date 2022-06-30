import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";
function traversal(value, set = new Set()) {
  // 考虑循环引用
  if (!isObject(value)) return value;
  if (set.has(value)) return value;
  set.add(value);
  for (const key in value) {
    traversal(value[key], set);
  }
  return value;
}
export function watch(source, cb) {
  let getter;
  if (isReactive(source)) {
    // 这里要进行对对象的遍历取值，不然根本没有取该对象中的值，就不会有响应式
    getter = () => traversal(source);
  } else if (isFunction(source)) {
    getter = source;
  } else {
    return "不是函数或对象";
  }
  let oldValue;
  let cleanup;
  //  辅助函数
  const onCleanUp = (fn) => {
    cleanup = fn;
  };
  const job = () => {
    if (cleanup) {
      cleanup();
    }
    const newValue = effect.run();
    cb(newValue, oldValue, onCleanUp);
    oldValue = newValue;
  };
  const effect = new ReactiveEffect(getter, job);
  oldValue = effect.run();
}

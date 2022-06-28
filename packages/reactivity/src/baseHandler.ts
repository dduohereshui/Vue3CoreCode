import { activeEffect, track, trigger } from "./effect";
export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
export const mutableHandler = {
  get(target, key, receiver) {
    // 代理普通对象，不会走这里，因为普通对象取值时不会走get，如果是代理过的对象，就会走这里
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // effect回调执行，拿到代理对象值渲染到页面，也会走这个get函数
    console.log(activeEffect, key, "activeEffect");
    // 拿到activeEffect，收集依赖
    track(target, "get", key);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, newVal, receiver) {
    // 修改值，那么该值对应的effect就应该重新执行
    let oldVal = target[key];
    let result = Reflect.set(target, key, newVal, receiver);
    if (oldVal !== newVal) {
      // 更新
      trigger(target, "set", key, newVal, oldVal);
    }
    return result;
  },
};

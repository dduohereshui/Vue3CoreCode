export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
export const mutableHandler = {
  get(target, key, receiver) {
    // 代理普通对象，不会走这里，因为普通对象取值时不会走get，如果是代理过的对象，就会走这里
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    return Reflect.get(target, key, receiver);
  },
  set(target, key, newVal, receiver) {
    return Reflect.set(target, key, newVal, receiver);
  },
};

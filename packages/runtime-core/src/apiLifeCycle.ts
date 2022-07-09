import { currentInstance, setCurrentInstance } from "./component";
export const enum LifeCycle {
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
  BEFORE_UPDATE = "bu",
  UPDATED = "u",
}
function createHook(type) {
  // hook需要绑到实例上
  return (hook, target = currentInstance) => {
    // 只有现在的instance有值，也就是说该钩子是在setup中使用的，才会有效
    if (target) {
      const hooks = target[type] || (target[type] = []);
      const wrappedHook = () => {
        setCurrentInstance(target);
        hook();
        setCurrentInstance(null);
      };
      hooks.push(wrappedHook);
    }
  };
}
export const onBeforeMount = createHook(LifeCycle.BEFORE_MOUNT);
export const onMounted = createHook(LifeCycle.MOUNTED);
export const onBeforeUpdate = createHook(LifeCycle.BEFORE_UPDATE);
export const onUpdated = createHook(LifeCycle.UPDATED);

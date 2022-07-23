import { currentInstance } from "./component";

export const enum LifecycleHooks {
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
  BEFORE_UPDATE = "bu",
  UPDATED = "u",
}
function createHook(type) {
  return (hook, target = currentInstance) => {
    if (target) {
      function wrappedHook() {}
      const hooks = target[type] || (target[type] = []);
      hooks.push(hook);
    }
  };
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifecycleHooks.UPDATED);

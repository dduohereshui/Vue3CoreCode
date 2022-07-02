function createInvoker(callback) {
  const invoker = (e) => invoker.value(e);
  invoker.value = callback;
  return invoker;
}
/**
 * @param el dom对象
 * @param eventName 事件名
 * @param nextValue 事件处理函数
 */
export function patchEvent(el, eventName, nextValue) {
  let invokers = el._vei || (el._vei = {});
  // 看该事件原来存不存在
  let exits = invokers[eventName];

  if (exits && nextValue) {
    exits.value = nextValue;
  } else {
    let event = eventName.slice(2).toLowerCase();
    if (nextValue) {
      const invoker = (invokers[eventName] = createInvoker(nextValue));
      el.addEventListener(event, invoker);
    } else if (exits) {
      el.removeEventListener(event, exits);
      invokers[eventName] = undefined;
    }
  }
}

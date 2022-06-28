export let activeEffect = undefined;
class ReactiveEffect {
  public active = true; // 默认激活状态

  public parent = null; // 为了做effect嵌套的activeEffect对应，老版本使用的栈实现
  public deps = []; // activeEffect也要记录有多少属性依赖他
  constructor(public fn) {
    this.active = true;
  }
  run() {
    if (!this.active) {
      // 非激活状态就不需要进行依赖收集,直接执行函数
      this.fn();
    }
    // 是活跃状态就依赖收集
    try {
      this.parent = activeEffect;
      //逻辑如下，this.fn执行，(effect 函数中用到了代理对象)走对象的sget，这时候就可以在get时进行依赖收集（拿到activeEffect）
      activeEffect = this;
      this.fn();
    } finally {
      activeEffect = this.parent;
      // 这一句不是那么重要
      this.parent = null;
    }
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
// 收集依赖，值对应activeEffect
// 一个属性对应多个effect，一个effect对应多个属性
const targetMap = new WeakMap();
export function track(target, type, key) {
  // debugger;
  if (!activeEffect) return;
  // debugger;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map())); // 对象对应一个Map
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  // 收集过的 activeEffect不用重复收集
  let shouldTrack = !dep.has(activeEffect);
  if (shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep); // activeEffect记录下依赖他的dep
  }
}
// console.log(targetMap);

// 值变化，触发更新
export function trigger(target, type, key, oldVal, newVal) {
  const depsMap = targetMap.get(target);
  // 触发的值没有在map中
  if (!depsMap) return;
  // 找到属性对应的effect: Set
  const effects = depsMap.get(key);
  // 有effects就执行
  effects &&
    effects.forEach((effect) => {
      effect.run();
    });
}

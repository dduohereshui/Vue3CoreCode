import { activeEffectScope, recordEffectScope } from "./effectScope";
export let activeEffect = undefined;
function cleanupEffect(effect) {
  const { deps } = effect;
  for (let i = 0; i < deps.length; i++) {
    // 值对应的effect删除掉
    deps[i].delete(effect);
  }
  effect.deps.length = 0;
}
export class ReactiveEffect {
  public active = true; // 默认激活状态
  public parent = null; // 为了做effect嵌套的activeEffect对应，老版本使用的栈实现
  public deps = []; // activeEffect也要记录有多少属性依赖他
  constructor(public fn, public scheduler?) {
    // 一执行 effect 作用域effect才会收集这个effect
    if (activeEffectScope) recordEffectScope(this);
    // this.active = true;
  }
  run() {
    if (!this.active) {
      // 非激活状态就不需要进行依赖收集,直接执行函数
      return this.fn();
    }
    // 是活跃状态就依赖收集
    try {
      this.parent = activeEffect;
      //逻辑如下，this.fn执行，(effect 函数中用到了代理对象)走对象的sget，这时候就可以在get时进行依赖收集（拿到activeEffect）
      activeEffect = this;
      // 执行用户函数之前，需要将已有的effect清除
      cleanupEffect(this);
      return this.fn();
    } finally {
      activeEffect = this.parent;
      // 这一句不是那么重要
      this.parent = null;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      cleanupEffect(this); // 停止effect的收集
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
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
  trackEffects(dep);
}

export function trackEffects(dep) {
  if (activeEffect) {
    let shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep); // activeEffect记录下依赖他的dep
    }
  }
}
// console.log(targetMap);

// 值变化，触发更新
export function trigger(target, type, key, oldVal, newVal) {
  const depsMap = targetMap.get(target);
  // 触发的值没有在map中
  if (!depsMap) return;
  // 找到属性对应的effect: Set
  let effects = depsMap.get(key);
  // 有effects就执行
  if (effects) {
    triggerEffects(effects);
  }
}

export function triggerEffects(effects) {
  // 引用隔离，避免同时add delete导致死循环
  effects = new Set(effects);
  effects.forEach((effect) => {
    // trigger执行effect，可能又会去执行track，会导致无限循环，
    if (activeEffect !== effect) {
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run();
      }
    }
  });
}

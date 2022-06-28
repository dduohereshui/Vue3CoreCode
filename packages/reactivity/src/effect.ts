export let activeEffect = undefined;
class ReactiveEffect {
  public active = true; // 默认激活状态
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
      //逻辑如下，this.fn执行，走对象的set，这时候就可以在set时进行依赖收集（拿到activeEffect）
      activeEffect = this;
      this.fn();
    } finally {
      activeEffect = undefined;
    }
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}

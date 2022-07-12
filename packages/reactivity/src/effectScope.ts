export let activeEffectScope = null;
class EffectScope {
  public active = true;
  public parent = null;
  public effects = []; // effectScope收集的普通的effect
  public scopes = []; // 该effectScope收集的 子effectScope
  constructor(public detached?) {
    // 不是独立的 父级effectScope才会收集我
    if (!detached && activeEffectScope) {
      activeEffectScope.scopes.push(this); // 此时activeEffectScope还是父级，在run时才会赋值给自己
    }
  }
  run(fn) {
    if (this.active) {
      // run时全局activeEffectScope赋值
      try {
        this.parent = activeEffectScope;
        activeEffectScope = this;
        return fn();
      } finally {
        activeEffectScope = this.parent;
        this.parent = null;
      }
    }
  }
  stop() {
    if (this.active) {
      // 清除 effectScope收集的普通effect
      for (let i = 0; i < this.effects.length; i++) {
        this.effects[i].stop();
      }
      // 清除父级effectScope收集的子effectScope
      for (let i = 0; i < this.scopes.length; i++) {
        this.scopes[i].stop();
      }
      this.active = false;
    }
  }
}
export function recordEffectScope(effect) {
  if (activeEffectScope && activeEffectScope.active) {
    activeEffectScope.effects.push(effect);
  }
}

export function effectScope(detached?) {
  return new EffectScope(detached);
}

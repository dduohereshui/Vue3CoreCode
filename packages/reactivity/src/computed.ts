import { isFunction } from "@vue/shared";
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect";
class ComputedRefImpl {
  public effect;
  public _dirty = true; // 默认会进行取值
  public __v_isReadonly = true;
  public __v_isRef = true;
  public _value;
  public dep = new Set();
  constructor(public getter, public setter) {
    this.effect = new ReactiveEffect(getter, () => {
      // 调度器，取值就会走这里
      if (!this._dirty) {
        this._dirty = true;
        // 触发computed收集的effect
        triggerEffects(this.dep);
      }
    });
  }
  get value() {
    // 这里还得进行依赖收集，才会进行重新渲染
    trackEffects(this.dep);
    // dirty属性是true
    if (this._dirty) {
      // 第一次取完值就把 _dirty 为false，之后依赖的值变化才会重新取值
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }
  set value(newVal) {
    this.setter(newVal);
  }
}
export function computed(getterOptions) {
  let onlyGetter = isFunction(getterOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOptions;
    setter = () => {
      console.warn("no set");
    };
  } else {
    getter = getterOptions.get;
    setter = getterOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

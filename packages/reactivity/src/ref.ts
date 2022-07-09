import { isArray, isObject } from "@vue/shared";
import { trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
class RefImpl {
  public _value;
  public __v_isRef = true;
  public dep = new Set();
  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }
  get value() {
    trackEffects(this.dep);
    return this._value;
  }
  set value(newValue) {
    if (this.rawValue !== newValue) {
      this._value = toReactive(newValue);
      this.rawValue = newValue;
      triggerEffects(this.dep);
    }
  }
}
export function ref(value) {
  return new RefImpl(value);
}

export function toRefs(object) {
  const result = isArray(object) ? new Array(object.length) : {};
  for (const key in object) {
    result[key] = toRef(object, key);
  }
  return result;
}
function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}
class ObjectRefImpl {
  constructor(public object, public key) {}
  get value() {
    // 还是去取原来代理对象上的值，所以会被proxy拦截到
    return this.object[this.key];
  }
  set value(newValue) {
    this.object[this.key] = newValue;
  }
}

const isObject = (val: any): boolean => {
  return typeof val === "object" && val !== null;
};
const isFunction = (value) => {
  return typeof value === "function";
};
const isNumber = (value) => typeof value === "number";
const isString = (value) => typeof value === "string";

const isArray = Array.isArray;
const assign = Object.assign;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (value, key) => hasOwnProperty.call(value, key);
export const enum ShapeFlags {
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
export { isObject, isFunction, isArray, assign, isNumber, isString, hasOwn };

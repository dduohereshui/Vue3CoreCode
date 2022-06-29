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
export { isObject, isFunction, isArray, assign, isNumber, isString };

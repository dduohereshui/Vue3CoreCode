const isObject = (val: any): boolean => {
  return (typeof val === "object" || typeof val === "function") && val !== null;
};

export { isObject };

export function createRenderer(renderOptions) {
  // 通过传入的渲染器选项进行渲染
  const {
    insert: hostInsert,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    remove: hostRemove,
    setText: hostSetText,
  } = renderOptions;
  const render = (vnode, container) => {};
  return {
    render,
  };
}

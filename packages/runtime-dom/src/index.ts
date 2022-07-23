// runtime-dom 只是提供一些渲染的方法（renderOptions），例如我们将虚拟dom渲染到浏览器，就需要操作dom的方法
import { assign } from "@vue/shared";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";
// 重写runtime-core
import { createRenderer } from "@vue/runtime-core1";

const renderOptions = assign(nodeOps, { patchProp });

export function render(vnode, container) {
  createRenderer(renderOptions).render(vnode, container);
}
export * from "@vue/runtime-core1";

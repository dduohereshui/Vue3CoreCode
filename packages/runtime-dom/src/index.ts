// runtime-dom 只是提供一些渲染的方法（renderOptions），例如我们将虚拟dom渲染到浏览器，就需要操作dom的方法
import { assign } from "@vue/shared";
import { createRenderer, h } from "@vue/runtime-core";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";

const renderOptions = assign(nodeOps, { patchProp });

// createRenderer(renderOptions).render(
//   h("div", { class: "aa" }, "我是儿子"),
//   document.getElementById("app")
// );
export function render(vnode, container) {
  createRenderer(renderOptions).render(vnode, container);
}
export * from "@vue/runtime-core";

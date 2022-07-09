// runtime-core 含有渲染器，render方法，h方法，可用于真实的渲染
import { createRenderer } from "./renderer";
import { h } from "./h";
import { Text, Fragment } from "./vnode";
export { createRenderer, h, Text, Fragment };
export * from "@vue/reactivity";
export * from "./apiLifeCycle";
export * from "./component";

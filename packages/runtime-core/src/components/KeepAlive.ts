import { ShapeFlags } from "@vue/shared";
import { onMounted } from "../apiLifeCycle";
import { getCurrentInstance } from "../component";
import { h } from "../h";
import { isVnode } from "../vnode";

export const KeepAliveImpl = {
  __isKeepAlive: true,
  setup(props, { slots }) {
    const keys = new Set();
    const cache = new Map();
    const instance = getCurrentInstance();
    const { createElement, move } = instance.ctx.renderer;
    // 创建一个存储组件的div容器
    const storageContainer = createElement("div");
    let pendingCacheKey = null;
    console.log(instance);

    onMounted(() => {
      console.log(instance);
      cache.set(pendingCacheKey, instance.subTree);
    });
    return () => {
      const vnode = slots.default();
      // 看一下vnode是不是组件，只有组件才能缓存
      if (
        !isVnode(vnode) ||
        !(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)
      ) {
        // 普通元素 文本直接返回
        return vnode;
      }
      // 目前渲染的组件
      const comp = vnode.type;
      const key = vnode.key ? vnode.key : comp;
      const cacheVnode = cache.get(key);
      // 表示该vnode缓存过
      if (cacheVnode) {
      } else {
        keys.add(key);
        pendingCacheKey = key;
      }

      return vnode;
    };
  },
};

export const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;

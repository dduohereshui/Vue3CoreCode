import { ref } from "@vue/reactivity";
import { isFunction, isObject } from "@vue/shared";
import { h } from "./h";

export function defineAsyncComponent(options) {
  if (isFunction(options)) {
    options = { loader: options };
  }
  return {
    setup() {
      const { loader, timeout, delay, errorComponent, loadingComponent } =
        options;
      // console.log(loader, timeout, errorComponent);
      // 是否加载完
      const loaded = ref(false);
      // 是否已失败
      const error = ref(false);
      // 是否显示loading
      const showLoading = ref(false);
      let Comp = null;
      loader()
        .then((c) => {
          Comp = c;
          loaded.value = true;
        })
        .catch((e) => {
          error.value = e;
        })
        .finally(() => {
          showLoading.value = false;
        });
      if (timeout) {
        setTimeout(() => {
          if (!loaded.value) {
            error.value = true;
          }
        }, timeout);
      }

      if (delay) {
        setTimeout(() => {
          showLoading.value = true;
        }, delay);
      }
      return () => {
        if (loaded.value) {
          return h(Comp);
        } else if (error.value && errorComponent) {
          return h(errorComponent);
        } else if (showLoading.value && loadingComponent) {
          return h(loadingComponent);
        }
      };
    },
  };
}

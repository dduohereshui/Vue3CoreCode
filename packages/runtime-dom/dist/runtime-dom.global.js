var VueRuntimeDOM = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Fragment: () => Fragment,
    LifecycleHooks: () => LifecycleHooks,
    ReactiveEffect: () => ReactiveEffect,
    Teleport: () => TeleportImpl,
    Text: () => Text,
    computed: () => computed,
    createRenderer: () => createRenderer,
    defineAsyncComponent: () => defineAsyncComponent,
    effect: () => effect,
    effectScope: () => effectScope,
    getCurrentInstance: () => getCurrentInstance,
    h: () => h,
    inject: () => inject,
    onBeforeMount: () => onBeforeMount,
    onBeforeUpdate: () => onBeforeUpdate,
    onMounted: () => onMounted,
    onUpdated: () => onUpdated,
    provide: () => provide,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    ref: () => ref,
    render: () => render,
    toRefs: () => toRefs,
    watch: () => watch
  });

  // packages/shared/src/index.ts
  var isObject = (val) => {
    return typeof val === "object" && val !== null;
  };
  var isFunction = (value) => {
    return typeof value === "function";
  };
  var isNumber = (value) => typeof value === "number";
  var isString = (value) => typeof value === "string";
  var isArray = Array.isArray;
  var assign = Object.assign;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (value, key) => hasOwnProperty.call(value, key);
  var invokeArrayFns = (arrayFns) => {
    arrayFns.forEach((fn) => fn());
  };

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    remove(child) {
      const parentNode = child.parentNode;
      if (parentNode) {
        parentNode.removeChild(child);
      }
    },
    setElementText(el, text) {
      el.textContent = text;
    },
    setText(node, text) {
      node.nodeValue = text;
    },
    querySelector(selector) {
      return document.querySelector(selector);
    },
    parentNode(node) {
      return node.parentNode;
    },
    nextSibling(node) {
      return node.nextSibling;
    },
    createElement(tagName) {
      return document.createElement(tagName);
    },
    createText(text) {
      return document.createTextNode(text);
    }
  };

  // packages/runtime-dom/src/modules/attr.ts
  function patchAttr(el, key, nextValue) {
    if (nextValue) {
      el.setAttribute(key, nextValue);
    } else {
      el.removeAttribute(key);
    }
  }

  // packages/runtime-dom/src/modules/class.ts
  function patchClass(el, nextValue) {
    if (nextValue == null) {
      el.removeAttribute("class");
    } else {
      el.className = nextValue;
    }
  }

  // packages/runtime-dom/src/modules/event.ts
  function createInvoker(callback) {
    const invoker = (e) => invoker.value(e);
    invoker.value = callback;
    return invoker;
  }
  function patchEvent(el, eventName, nextValue) {
    let invokers = el._vei || (el._vei = {});
    let exits = invokers[eventName];
    if (exits && nextValue) {
      exits.value = nextValue;
    } else {
      let event = eventName.slice(2).toLowerCase();
      if (nextValue) {
        const invoker = invokers[eventName] = createInvoker(nextValue);
        el.addEventListener(event, invoker);
      } else if (exits) {
        el.removeEventListener(event, exits);
        invokers[eventName] = void 0;
      }
    }
  }

  // packages/runtime-dom/src/modules/style.ts
  function patchStyle(el, prevValue, nextValue = {}) {
    for (const key in nextValue) {
      el.style[key] = nextValue[key];
    }
    if (prevValue) {
      for (const key in prevValue) {
        if (!nextValue[key]) {
          delete el.style[key];
        }
      }
    }
  }

  // packages/runtime-dom/src/patchProp.ts
  function patchProp(el, key, prevValue, nextValue) {
    if (key === "class") {
      patchClass(el, nextValue);
    } else if (key === "style") {
      patchStyle(el, prevValue, nextValue);
    } else if (/^on[^a-z]/.test(key)) {
      patchEvent(el, key, nextValue);
    } else {
      patchAttr(el, key, nextValue);
    }
  }

  // packages/reactivity/src/effectScope.ts
  var activeEffectScope = null;
  var EffectScope = class {
    constructor(detached) {
      this.detached = detached;
      this.active = true;
      this.parent = null;
      this.effects = [];
      this.scopes = [];
      if (!detached && activeEffectScope) {
        activeEffectScope.scopes.push(this);
      }
    }
    run(fn) {
      if (this.active) {
        try {
          this.parent = activeEffectScope;
          activeEffectScope = this;
          return fn();
        } finally {
          activeEffectScope = this.parent;
          this.parent = null;
        }
      }
    }
    stop() {
      if (this.active) {
        for (let i = 0; i < this.effects.length; i++) {
          this.effects[i].stop();
        }
        for (let i = 0; i < this.scopes.length; i++) {
          this.scopes[i].stop();
        }
        this.active = false;
      }
    }
  };
  function recordEffectScope(effect2) {
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(effect2);
    }
  }
  function effectScope(detached) {
    return new EffectScope(detached);
  }

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  function cleanupEffect(effect2) {
    const { deps } = effect2;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = 0;
  }
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.active = true;
      this.parent = null;
      this.deps = [];
      if (activeEffectScope)
        recordEffectScope(this);
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
        this.parent = null;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  var targetMap = /* @__PURE__ */ new WeakMap();
  function track(target, type, key) {
    if (!activeEffect)
      return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffects(dep);
  }
  function trackEffects(dep) {
    if (activeEffect) {
      let shouldTrack = !dep.has(activeEffect);
      if (shouldTrack) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
      }
    }
  }
  function trigger(target, type, key, oldVal, newVal) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
      return;
    let effects = depsMap.get(key);
    if (effects) {
      triggerEffects(effects);
    }
  }
  function triggerEffects(effects) {
    effects = new Set(effects);
    effects.forEach((effect2) => {
      if (activeEffect !== effect2) {
        if (effect2.scheduler) {
          effect2.scheduler();
        } else {
          effect2.run();
        }
      }
    });
  }

  // packages/reactivity/src/baseHandler.ts
  var mutableHandler = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      track(target, "get", key);
      let res = Reflect.get(target, key, receiver);
      if (isObject(res)) {
        return reactive(res);
      }
      return res;
    },
    set(target, key, newVal, receiver) {
      let oldVal = target[key];
      let result = Reflect.set(target, key, newVal, receiver);
      if (oldVal !== newVal) {
        trigger(target, "set", key, newVal, oldVal);
      }
      return result;
    }
  };

  // packages/reactivity/src/reactive.ts
  function isReactive(value) {
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
  }
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function reactive(target) {
    if (!isObject(target))
      return;
    if (reactiveMap.has(target)) {
      return reactiveMap.get(target);
    }
    if (target["__v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    const targetProxy = new Proxy(target, mutableHandler);
    reactiveMap.set(target, targetProxy);
    return targetProxy;
  }

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.getter = getter;
      this.setter = setter;
      this._dirty = true;
      this.__v_isReadonly = true;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this.effect = new ReactiveEffect(this.getter, () => {
        if (!this._dirty) {
          this._dirty = true;
          triggerEffects(this.dep);
        }
      });
    }
    get value() {
      trackEffects(this.dep);
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(newVal) {
      this.setter(newVal);
    }
  };
  function computed(getterOptions) {
    let onlyGetter = isFunction(getterOptions);
    let getter;
    let setter;
    if (onlyGetter) {
      getter = getterOptions;
      setter = () => {
        console.warn("no set");
      };
    } else {
      getter = getterOptions.get;
      setter = getterOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
  }

  // packages/reactivity/src/watch.ts
  function traversal(value, set = /* @__PURE__ */ new Set()) {
    if (!isObject(value))
      return value;
    if (set.has(value))
      return value;
    set.add(value);
    for (const key in value) {
      traversal(value[key], set);
    }
    return value;
  }
  function watch(source, cb) {
    let getter;
    if (isReactive(source)) {
      getter = () => traversal(source);
    } else if (isFunction(source)) {
      getter = source;
    } else {
      return "\u4E0D\u662F\u51FD\u6570\u6216\u5BF9\u8C61";
    }
    let oldValue;
    let cleanup;
    const onCleanUp = (fn) => {
      cleanup = fn;
    };
    const job = () => {
      if (cleanup) {
        cleanup();
      }
      const newValue = effect2.run();
      cb(newValue, oldValue, onCleanUp);
      oldValue = newValue;
    };
    const effect2 = new ReactiveEffect(getter, job);
    oldValue = effect2.run();
  }

  // packages/reactivity/src/ref.ts
  function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
  }
  var RefImpl = class {
    constructor(rawValue) {
      this.rawValue = rawValue;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
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
  };
  function ref(value) {
    return new RefImpl(value);
  }
  function toRefs(object) {
    const result = isArray(object) ? new Array(object.length) : {};
    for (const key in object) {
      result[key] = toRef(object, key);
    }
    return result;
  }
  function toRef(object, key) {
    return new ObjectRefImpl(object, key);
  }
  var ObjectRefImpl = class {
    constructor(object, key) {
      this.object = object;
      this.key = key;
    }
    get value() {
      return this.object[this.key];
    }
    set value(newValue) {
      this.object[this.key] = newValue;
    }
  };
  function proxyRefs(object) {
    return new Proxy(object, {
      get(target, key, receiver) {
        let r = Reflect.get(target, key, receiver);
        if (r.__v_isRef) {
          return r.value;
        }
        return r;
      },
      set(target, key, newVal, receiver) {
        let oldValue = target[key];
        if (oldValue.__v_isRef) {
          oldValue.value = newVal;
          return true;
        } else {
          return Reflect.set(target, key, newVal, receiver);
        }
      }
    });
  }

  // packages/runtime-core1/src/componentProps.ts
  function initProps(instance, rawProps) {
    const props = {};
    const attrs = {};
    const options = instance.propsOptions || {};
    if (rawProps) {
      for (const key in rawProps) {
        const value = rawProps[key];
        if (hasOwn(options, key)) {
          props[key] = value;
        } else {
          attrs[key] = value;
        }
      }
    }
    instance.props = reactive(props);
    instance.attrs = attrs;
  }
  function initSlots(instance, children) {
    if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
      instance.slots = children;
    }
  }

  // packages/runtime-core1/src/component.ts
  var currentInstance = null;
  var setCurrentInstance = (instance) => {
    currentInstance = instance;
  };
  var getCurrentInstance = () => currentInstance;
  function createComponentInstance(vnode, parent) {
    const instance = {
      data: null,
      vnode,
      subTree: null,
      isMounted: false,
      update: null,
      propsOptions: vnode.type.props,
      props: {},
      attrs: {},
      proxy: null,
      render: null,
      setupState: {},
      slots: {},
      parent,
      provides: parent ? parent.provides : /* @__PURE__ */ Object.create(null)
    };
    return instance;
  }
  var publicPropertyMap = {
    $attrs: (instance) => instance.attrs,
    $slots: (instance) => instance.slots
  };
  var publicInstanceProxy = {
    get(target, key) {
      const { data, props, setupState } = target;
      if (setupState && hasOwn(setupState, key)) {
        return setupState[key];
      } else if (data && hasOwn(data, key)) {
        return data[key];
      } else if (props && hasOwn(props, key)) {
        return props[key];
      }
      const getter = publicPropertyMap[key];
      if (getter) {
        return getter(target);
      }
    },
    set(target, key, value) {
      const { data, props, setupState } = target;
      if (setupState && hasOwn(setupState, key)) {
        setupState[key] = value;
      } else if (data && hasOwn(data, key)) {
        data[key] = value;
        return true;
      } else if (props && hasOwn(props, key)) {
        console.warn("Setting props as state is not supported.");
        return false;
      }
      return true;
    }
  };
  function setupComponent(instance) {
    const { props, type, children } = instance.vnode;
    initProps(instance, props);
    initSlots(instance, children);
    instance.proxy = new Proxy(instance, publicInstanceProxy);
    const { data, render: render2, setup } = type;
    if (data && isFunction(data)) {
      instance.data = reactive(data.call(instance.proxy));
    }
    if (setup) {
      const setupContext = {
        emit: (event, ...args) => {
          const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
          const handler = props[eventName];
          if (handler) {
            handler(...args);
          }
        },
        attrs: instance.attrs,
        slots: instance.slots
      };
      setCurrentInstance(instance);
      const setupResult = setup(instance.props, setupContext);
      setCurrentInstance(null);
      if (isFunction(setupResult)) {
        instance.render = setupResult;
      } else if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
      }
    }
    if (!instance.render) {
      instance.render = render2;
    }
  }
  function updateProps(prevProps, nextProps) {
    if (hasPropsChange(prevProps, nextProps)) {
      for (const key in nextProps) {
        prevProps[key] = nextProps[key];
      }
      for (const key in prevProps) {
        if (!hasOwn(nextProps, key)) {
          delete prevProps[key];
        }
      }
    }
  }
  function hasPropsChange(prevProps = {}, nextProps = {}) {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i];
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }
    return false;
  }

  // packages/runtime-core1/src/getSequence.ts
  function getSequence(arr) {
    const result = [0];
    const p = new Array(arr.length).fill(0);
    let start;
    let end;
    let mid;
    let resultLastIndex;
    for (let i2 = 0; i2 < arr.length; i2++) {
      const arrI = arr[i2];
      if (arrI !== 0) {
        resultLastIndex = result[result.length - 1];
        if (arr[resultLastIndex] < arrI) {
          result.push(i2);
          p[i2] = resultLastIndex;
          continue;
        }
        start = 0;
        end = result.length - 1;
        while (start < end) {
          mid = Math.floor((start + end) / 2);
          if (arr[result[mid]] < arrI) {
            start = mid + 1;
          } else {
            end = mid;
          }
        }
        if (arr[result[end]] > arrI) {
          result[end] = i2;
          p[i2] = result[end - 1];
        }
      }
    }
    let i = result.length;
    let last = result[i - 1];
    while (i-- > 0) {
      result[i] = last;
      last = p[last];
    }
    return result;
  }

  // packages/runtime-core1/src/scheduler.ts
  var queue = [];
  var isflushing = false;
  var resolvepromise = Promise.resolve();
  function queueJob(job) {
    if (!queue.includes(job)) {
      queue.push(job);
    }
    if (!isflushing) {
      isflushing = true;
      resolvepromise.then(() => {
        const copy = queue.slice();
        queue.length = 0;
        copy.forEach((job2) => job2());
        isflushing = false;
        copy.length = 0;
      });
    }
  }

  // packages/runtime-core1/src/components/teleport.ts
  var isTeleport = (type) => type.__isTeleport;
  var TeleportImpl = {
    __isTeleport: true,
    process(n1, n2, container, anchor, internals) {
      const { mountChildren } = internals;
      if (n1 == null) {
        const target = document.querySelector(n2.props.to);
        if (target) {
          mountChildren(n2.children, target);
        }
      }
    }
  };

  // packages/runtime-core1/src/vnode.ts
  var Text = Symbol("TEXT");
  var Fragment = Symbol("FRAGMENT");
  function isVnode(value) {
    return value ? value._v_isVnode === true : false;
  }
  function isSameVNode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  function createVNode(type, props, children) {
    let shapeFlag = isString(type) ? 1 /* ELEMENT */ : isTeleport(type) ? 64 /* TELEPORT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
    const vnode = {
      _v_isVnode: true,
      shapeFlag,
      el: null,
      type,
      key: props == null ? void 0 : props.key,
      props,
      children
    };
    if (children) {
      let type2 = 0;
      if (isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else if (isObject(children)) {
        type2 = 32 /* SLOTS_CHILDREN */;
      } else {
        children = String(children);
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag |= type2;
    }
    return vnode;
  }

  // packages/runtime-core1/src/renderer.ts
  function createRenderer(renderOptions2) {
    const {
      insert: hostInsert,
      setElementText: hostSetElementText,
      patchProp: hostPatchProp,
      createElement: hostCreateElement,
      createText: hostCreateText,
      remove: hostRemove,
      setText: hostSetText
    } = renderOptions2;
    const normalize = (children, i) => {
      if (isString(children[i]) || isNumber(children[i])) {
        const vnode = createVNode(Text, null, children[i]);
        children[i] = vnode;
      }
      return children[i];
    };
    const mountChildren = (children, container, parentComponent) => {
      for (let i = 0; i < children.length; i++) {
        const child = normalize(children, i);
        patch(null, child, container, parentComponent);
      }
    };
    const mountElement = (vnode, container, anchor, parentComponent) => {
      const { type, props, children, shapeFlag } = vnode;
      const el = vnode.el = hostCreateElement(type);
      if (props) {
        for (const key in props) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, children);
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(children, el, parentComponent);
      }
      hostInsert(el, container, anchor);
    };
    const mountComponent = (vnode, container, anchor, parentComponent) => {
      const instance = vnode.component = createComponentInstance(vnode, parentComponent);
      setupComponent(instance);
      setupRenderEffect(instance, container, anchor);
    };
    const shouldUpdateComponent = (n1, n2) => {
      const { props: prevProps, children: prevSlots } = n1;
      const { props: nextProps, children: nextSlots } = n2;
      if (prevProps === nextProps)
        return false;
      if (prevSlots || nextSlots) {
        return true;
      }
      if (hasPropsChange(prevProps, nextProps)) {
        return true;
      }
    };
    const updateComponent = (n1, n2) => {
      const instance = n2.component = n1.component;
      if (shouldUpdateComponent(n1, n2)) {
        instance.next = n2;
        instance.update();
      }
    };
    const updateComponentPreRender = (instance, next) => {
      instance.next = null;
      instance.vnode = next;
      updateProps(instance.props, next.props);
    };
    const setupRenderEffect = (instance, container, anchor) => {
      const { render: render3 } = instance;
      const componentUpdateFn = () => {
        if (!instance.isMounted) {
          console.log("\u7EC4\u4EF6\u6302\u8F7D");
          const { bm, m } = instance;
          if (bm) {
            invokeArrayFns(bm);
          }
          const subTree = render3.call(instance.proxy, instance.proxy);
          patch(null, subTree, container, anchor, instance);
          instance.subTree = subTree;
          instance.isMounted = true;
          if (m) {
            invokeArrayFns(m);
          }
        } else {
          const { next, bu, u } = instance;
          if (next) {
            updateComponentPreRender(instance, next);
          }
          if (bu) {
            invokeArrayFns(bu);
          }
          console.log("\u7EC4\u4EF6\u66F4\u65B0", instance);
          const subTree = render3.call(instance.proxy, instance.proxy);
          patch(instance.subTree, subTree, container, anchor, instance);
          instance.subTree = subTree;
          if (u) {
            invokeArrayFns(u);
          }
        }
      };
      const effect2 = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update));
      const update = instance.update = effect2.run.bind(effect2);
      update();
    };
    const patchProps = (oldProps, newProps, el) => {
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }
      for (const key in oldProps) {
        if (newProps[key] == null) {
          hostPatchProp(el, key, oldProps[key], void 0);
        }
      }
    };
    const unmountChildren = (children) => {
      for (let i = 0; i < children.length; i++) {
        unmount(children[i]);
      }
    };
    const patchKeyedChildren = (c1, c2, el) => {
      let i = 0;
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVNode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        i++;
      }
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSameVNode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        e1--;
        e2--;
      }
      if (i > e1) {
        if (i <= e2) {
          while (i <= e2) {
            const nextPos = e2 + 1;
            const anchor = nextPos < c2.length ? c2[nextPos].el : null;
            patch(null, c2[i], el, anchor);
            i++;
          }
        }
      }
      if (i > e2) {
        if (i <= e1) {
          while (i <= e1) {
            unmount(c1[i]);
            i++;
          }
        }
      }
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      let s1 = i;
      let s2 = i;
      for (let i2 = s2; i2 <= e2; i2++) {
        keyToNewIndexMap.set(c2[i2].key, i2);
      }
      const toBePatched = e2 - s2 + 1;
      const newIndexToNewIndexArr = new Array(toBePatched).fill(0);
      for (let i2 = s1; i2 <= e1; i2++) {
        const oldChild = c1[i2];
        const newIndex = keyToNewIndexMap.get(oldChild.key);
        if (newIndex) {
          newIndexToNewIndexArr[newIndex - s2] = i2 + 1;
          patch(oldChild, c2[newIndex], el);
        } else {
          unmount(oldChild);
        }
      }
      const sequence = getSequence(newIndexToNewIndexArr);
      let j = sequence.length - 1;
      for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
        const lastIndex = i2 + s2;
        const current = c2[lastIndex];
        const anchor = lastIndex + 1 < c2.length ? c2[lastIndex + 1].el : null;
        if (newIndexToNewIndexArr[i2] === 0) {
          patch(null, current, el, anchor);
        } else {
          if (i2 !== sequence[j]) {
            hostInsert(current.el, el, anchor);
          } else {
            j--;
          }
        }
      }
    };
    const patchChildren = (n1, n2, el, parentComponent) => {
      const c1 = n1.children;
      const c2 = n2.children;
      const prevShapeFlag = n1.shapeFlag;
      const shapeFlag = n2.shapeFlag;
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1);
        }
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      } else {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            patchKeyedChildren(c1, c2, el);
          } else {
            unmountChildren(c1);
          }
        } else {
          if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, "");
          }
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(c2, el, parentComponent);
          }
        }
      }
    };
    const patchElement = (n1, n2, parentComponent) => {
      const el = n2.el = n1.el;
      const oldProps = n1.props || {};
      const onewProps = n2.props || {};
      patchProps(oldProps, onewProps, el);
      patchChildren(n1, n2, el, parentComponent);
    };
    const processText = (n1, n2, container) => {
      if (n1 == null) {
        const el = n2.el = hostCreateText(n2.children);
        hostInsert(el, container);
      } else {
        const el = n2.el = n1.el;
        if (n1.children !== n2.children) {
          hostSetText(el, n2.children);
        }
      }
    };
    const processFragment = (n1, n2, container, parentComponent) => {
      if (n1 == null) {
        mountChildren(n2.children, container, parentComponent);
      } else {
        patchChildren(n1, n2, container, parentComponent);
      }
    };
    const processElement = (n1, n2, container, anchor, parentComponent) => {
      if (n1 == null) {
        mountElement(n2, container, anchor, parentComponent);
      } else {
        patchElement(n1, n2, parentComponent);
      }
    };
    const processComponent = (n1, n2, container, anchor, parentComponent) => {
      if (n1 == null) {
        mountComponent(n2, container, anchor, parentComponent);
      } else {
        updateComponent(n1, n2);
      }
    };
    const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
      if (n1 == n2)
        return;
      if (n1 && !isSameVNode(n1, n2)) {
        unmount(n1);
        n1 = null;
      }
      const { type, shapeFlag } = n2;
      switch (type) {
        case Text:
          processText(n1, n2, container);
          break;
        case Fragment:
          processFragment(n1, n2, container, parentComponent);
          break;
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor, parentComponent);
          } else if (shapeFlag & 6 /* COMPONENT */) {
            processComponent(n1, n2, container, anchor, parentComponent);
          } else if (shapeFlag & 64 /* TELEPORT */) {
            type.process(n1, n2, container, anchor, {
              mountChildren,
              patchChildren
            });
          }
      }
    };
    const unmount = (vnode) => {
      if (vnode.type === Fragment) {
        return unmountChildren(vnode.children);
      } else if (vnode.shapeFlag & 6 /* COMPONENT */) {
        return unmount(vnode.component.subTree);
      }
      hostRemove(vnode.el);
    };
    const render2 = (vnode, container) => {
      if (vnode == null) {
        if (container._vnode)
          unmount(container._vnode);
      } else {
        patch(container._vnode || null, vnode, container);
      }
      container._vnode = vnode;
    };
    return {
      render: render2
    };
  }

  // packages/runtime-core1/src/h.ts
  function h(type, propsOrChildren, children) {
    const l = arguments.length;
    if (l === 2) {
      if (!isArray(propsOrChildren) && isObject(propsOrChildren)) {
        if (isVnode(propsOrChildren)) {
          return createVNode(type, null, [propsOrChildren]);
        }
        return createVNode(type, propsOrChildren);
      } else {
        return createVNode(type, null, propsOrChildren);
      }
    } else {
      if (l > 3) {
        children = Array.from(arguments).slice(2);
      } else if (l === 3 && isVnode(children)) {
        children = [children];
      }
      return createVNode(type, propsOrChildren, children);
    }
  }

  // packages/runtime-core1/src/apiLifecycle.ts
  var LifecycleHooks = /* @__PURE__ */ ((LifecycleHooks2) => {
    LifecycleHooks2["BEFORE_MOUNT"] = "bm";
    LifecycleHooks2["MOUNTED"] = "m";
    LifecycleHooks2["BEFORE_UPDATE"] = "bu";
    LifecycleHooks2["UPDATED"] = "u";
    return LifecycleHooks2;
  })(LifecycleHooks || {});
  function createHook(type) {
    return (hook, target = currentInstance) => {
      if (target) {
        let wrappedHook = function() {
          setCurrentInstance(target);
          hook();
          setCurrentInstance(null);
        };
        const hooks = target[type] || (target[type] = []);
        hooks.push(wrappedHook);
      }
    };
  }
  var onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
  var onMounted = createHook("m" /* MOUNTED */);
  var onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
  var onUpdated = createHook("u" /* UPDATED */);

  // packages/runtime-core1/src/apiInject.ts
  function provide(key, value) {
    if (!currentInstance)
      return console.warn("provide() can only be used inside setup()");
    const parentProvides = currentInstance.parent && currentInstance.parent.provides;
    let provides = currentInstance.provides;
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(provides);
    }
    provides[key] = value;
  }
  function inject(key, defaultVal) {
    if (!currentInstance)
      return console.warn("inject() can only be used inside setup()");
    const provides = currentInstance.parent && currentInstance.parent.provides;
    if (provides && hasOwn(provides, key)) {
      return provides[key];
    } else {
      return defaultVal;
    }
  }

  // packages/runtime-core1/src/defineAsyncComponent.ts
  function defineAsyncComponent(options) {
    if (isFunction(options)) {
      options = { loader: options };
    }
    return {
      setup() {
        const { loader, timeout, delay, errorComponent, loadingComponent } = options;
        const loaded = ref(false);
        const error = ref(false);
        const showLoading = ref(false);
        let Comp = null;
        loader().then((c) => {
          Comp = c;
          loaded.value = true;
        }).catch((e) => {
          error.value = e;
        }).finally(() => {
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
      }
    };
  }

  // packages/runtime-dom/src/index.ts
  var renderOptions = assign(nodeOps, { patchProp });
  function render(vnode, container) {
    createRenderer(renderOptions).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.global.js.map

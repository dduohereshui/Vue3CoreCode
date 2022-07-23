export const isTeleport = (type) => type.__isTeleport;
export const TeleportImpl = {
  __isTeleport: true,
  process(n1, n2, container, anchor, internals) {
    const { mountChildren } = internals;
    // console.log(n1, n2, container, anchor, internals);
    if (n1 == null) {
      const target = document.querySelector(n2.props.to);
      if (target) {
        mountChildren(n2.children, target);
      }
    }
  },
};

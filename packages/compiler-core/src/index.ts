import { parse } from "./parse";
function transformElement() {}
function transformText() {}
function transformExpression() {}
function createTransformContext(root) {
  const context = {
    currentNode: root, // 正在转化的节点
    parent: null, // 当前节点的父节点
    helpers: new Map(),
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count);
      return name;
    },
    nodeTransforms: [transformElement, transformText, transformExpression],
  };
  return context;
}
function tranverse(context) {}
function transform(ast) {
  const context = createTransformContext(ast);
  tranverse(context);
}
export function compile(template) {
  const ast = parse(template);
  // 有了语法树要进行代码生成
  transform(ast);
  return ast;
}

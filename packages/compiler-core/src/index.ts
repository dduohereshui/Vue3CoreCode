import { NodeTypes } from "./ast";

function createParserContext(template) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: template,
    originalSource: template,
  };
}
function getCursor(context) {
  let { line, column, offset } = context;
  return { line, column, offset };
}
// 每次截取完都要去更新行列偏移量等信息
function advancePositionWithMutation(context, source, endIndex) {
  let linesCount = 0; // 遇到回车会+1
  let linePos = -1;
  for (let i = 0; i < endIndex; i++) {
    if (source.charCodeAt(i) === 10) {
      linesCount++;
      linePos = i;
    }
  }
  context.line += linesCount;
  context.column =
    linePos === -1 ? context.column + endIndex : endIndex - linePos;
  context.offset += endIndex;
}
function advanceBy(context, endIndex) {
  let source = context.source;
  // 每次删掉内容都需要更新最新的行列信息
  advancePositionWithMutation(context, source, endIndex);
  context.source = source.slice(endIndex);
}

function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex);
  // 删掉字符串
  advanceBy(context, endIndex);
  // debugger;
  return rawText;
}
function getSelection(context, start, end?) {
  end = end || getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset),
  };
}
// 解析文本
function parseText(context) {
  // 解析文本的时候，要看什么时候结束
  const endTokens = ["<", "{{"];
  let endIndex = context.source.length; // 默认文本到最后结束
  for (let i = 0; i < endTokens.length; i++) {
    let index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  // 创建行列信息
  const start = getCursor(context);
  // 取内容
  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start),
  };
}
function isEnd(context) {
  const source = context.source;
  // 字符串为空串就解析完成
  return source.length === 0;
}
function parse(template) {
  // return template;
  const context = createParserContext(template);
  const nodes = [];
  while (!isEnd(context)) {
    let node;
    const source = context.source;
    if (source.startsWith("{{")) {
    } else if (source[0] === "<") {
    }
    // 文本
    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
    break;
  }
  console.log(nodes);
}
export function compile(template) {
  const ast = parse(template);
  return ast;
}

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
  if (context.source.startsWith("</")) {
    return true;
  }
  // 字符串为空串就解析完成
  return source.length === 0;
}
function parseInterpolation(context) {
  const start = getCursor(context);
  const closeIndex = context.source.indexOf("}}", "{{".length);
  advanceBy(context, 2);

  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);

  const rawContentLength = closeIndex - 2;

  let preContent = parseTextData(context, rawContentLength);
  let content = preContent.trim();
  let startOffset = preContent.indexOf(content);
  if (startOffset > 0) {
    // 说明双大括号文本之前有空格
    advancePositionWithMutation(innerStart, preContent, startOffset);
  }
  let endOffset = startOffset + content.length;
  advancePositionWithMutation(innerEnd, preContent, endOffset);

  advanceBy(context, 2);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc: getSelection(context, innerStart, innerEnd),
    },
    loc: getSelection(context, start),
  };
}
function advanceBySpaces(context) {
  // 空格
  const match = /^[ \t\r\n]+/.exec(context.source);
  if (match) {
    // 有空格
    advanceBy(context, match[0].length);
  }
}
function parseAttributeValue(context) {
  const start = getCursor(context);
  const quote = context.source[0];
  let content;
  if (quote === '"' || quote === "'") {
    advanceBy(context, 1);
    // 找到结束的引号
    const endIndex = context.source.indexOf(quote);
    content = parseTextData(context, endIndex);
    advanceBy(context, 1);
  }
  return {
    content,
    loc: getSelection(context, start),
  };
}
function parseAttribute(context) {
  const start = getCursor(context);
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  let name = match[0];
  advanceBy(context, name.length);
  advanceBySpaces(context);
  advanceBy(context, 1);
  // "" ''
  let value = parseAttributeValue(context);
  const loc = getSelection(context, start);
  // debugger;
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: {
      type: NodeTypes.TEXT,
      // content: value.content,
      ...value,
    },
    loc,
  };
}
function parseAttributes(context) {
  const props = [];
  while (context.source.length > 0 && !context.source.startsWith(">")) {
    const prop = parseAttribute(context);
    props.push(prop);
    advanceBySpaces(context);
  }
  return props;
}
function parseTag(context) {
  const start = getCursor(context);
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceBySpaces(context);

  let props = parseAttributes(context);
  //  自闭和标签
  let isSelfClosing = context.source.startsWith("/>");
  advanceBy(context, isSelfClosing ? 2 : 1);
  return {
    type: NodeTypes.ELEMENT,
    tag,
    isSelfClosing,
    props,
    children: [],
    loc: getSelection(context, start),
  };
}
function parseElement(context) {
  // 解析标签 <abc /> <aaa a='1'></aaa>
  let ele = parseTag(context);
  let children = parseChildren(context);
  if (context.source.startsWith("</")) {
    parseTag(context);
  }
  ele.children = children;
  ele.loc = getSelection(context, ele.loc.start);
  return ele;
}
function parseChildren(context) {
  const nodes = [];
  while (!isEnd(context)) {
    let node;
    const source = context.source;
    // 双大括号表达式
    if (source.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (source[0] === "<") {
      // 标签
      node = parseElement(context);
    }
    // 文本
    if (!node) {
      node = parseText(context);
    }
    nodes.forEach((node, i) => {
      if (node.type === NodeTypes.TEXT) {
        if (!/[^\t\r\n\f]/.test(node.content)) {
          nodes[i] = null;
        }
      }
    });
    nodes.push(node);
    // break;
  }
  return nodes.filter(Boolean);
}
function createRoot(children, loc) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc,
  };
}
function parse(template) {
  // return template;
  const context = createParserContext(template);
  const start = getCursor(context);
  const root = createRoot(parseChildren(context), getSelection(context, start));
  return root;
}
export function compile(template) {
  const ast = parse(template);
  return ast;
}

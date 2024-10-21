import * as Yoga from "./yoga/api";
import computeLayout, { ComputedCSSNode, CSSNode } from "./css-layout";
import {
  YGEdge,
  YGPositionType,
  YGFlexDirection,
  YGJustify,
  YGAlign,
  YGWrap,
  YGDisplay,
  YGOverflow,
} from "./yoga/enums";

const PositionTypeMap = Object.fromEntries(
  Object.entries(YGPositionType).map(([key, val]) => [dashCase(key), val])
) as Record<string, YGPositionType>;

const FlexDirectionMap = Object.fromEntries(
  Object.entries(YGFlexDirection).map(([key, val]) => [dashCase(key), val])
) as Record<string, YGFlexDirection>;

const JustifyContentMap = Object.fromEntries(
  Object.entries(YGJustify).map(([key, val]) => [dashCase(key), val])
) as Record<string, YGJustify>;

const AlignItemsMap = Object.fromEntries(
  Object.entries(YGAlign).map(([key, val]) => [dashCase(key), val])
) as Record<string, YGAlign>;

const FlexWrapMap = Object.fromEntries(
  Object.entries(YGWrap).map(([key, val]) => [dashCase(key), val])
) as Record<string, YGWrap>;

const AlignSelfMap = Object.fromEntries(
  Object.entries(YGAlign).map(([key, val]) => [dashCase(key), val])
) as Record<string, YGAlign>;

const OverflowMap = Object.fromEntries(
  Object.entries(YGOverflow).map(([key, val]) => [dashCase(key), val])
) as Record<string, YGOverflow>;

function getPositionType(val: string) {
  return PositionTypeMap[val as keyof typeof PositionTypeMap];
}

function getFlexDirection(val: string) {
  return FlexDirectionMap[val as keyof typeof FlexDirectionMap];
}

function getJustifyContent(val: string) {
  return JustifyContentMap[val as keyof typeof JustifyContentMap];
}

function getAlignItems(val: string) {
  return AlignItemsMap[val as keyof typeof AlignItemsMap];
}
function getOverflow(val: string) {
  return OverflowMap[val as keyof typeof OverflowMap];
}

function getFlexWrap(val: string) {
  const map = {
    ...FlexWrapMap,
    nowrap: YGWrap.NoWrap,
  };
  return map[val as keyof typeof map];
}

function getAlignSelf(val: string) {
  return AlignSelfMap[val as keyof typeof AlignSelfMap];
}
//getFlexWrap
let isLayoutScheduled = false; // 标识符，用于防止重复布局

// 安排重新布局
function scheduleLayout() {
  if (!isLayoutScheduled) {
    isLayoutScheduled = true;
    requestAnimationFrame(() => {
      console.time("applyFlex");
      applyFlex(); // 重新布局
      console.timeEnd("applyFlex");
      isLayoutScheduled = false;
    });
  }
}

type InlineFlexCSSStyle = {
  display: string;
  flex: string;
  "flex-shrink": string;
  "flex-grow": string;
  "align-items": string;
  "justify-content": string;
  "align-content": string;
  "align-self": string;
  "flex-direction": string;
  "flex-wrap": "wrap" | "nowrap";
  "flex-basic": string;
};
function serializeFlexCSS(style: InlineFlexCSSStyle) {
  return Object.entries(style).reduce((a, [key, val], currentIndex, arr) => {
    return `${a}${key}:${val}${currentIndex !== arr.length - 1 ? ";" : ""}`;
  }, "");
}
function parseCSSText(cssText: string) {
  // 创建一个空对象来存储解析结果
  const styleObject: Record<string, string> = {};

  // 移除多余的空格和注释
  cssText = cssText.replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, "").trim(); // 移除注释
  cssText = cssText.replace(/\s*;\s*$/, ""); // 去除末尾的分号

  // 以分号分割各个样式声明
  const declarations = cssText.split(";");

  declarations.forEach((declaration) => {
    // 以冒号分割样式名和样式值
    const [property, value] = declaration.split(":").map((part) => part.trim());

    // 确保属性名和值都存在
    if (property && value) {
      // 将属性和对应的值添加到对象中
      styleObject[property] = value;
    }
  });

  return styleObject as unknown as InlineFlexCSSStyle;
}

function getFlexPropertyValue(dom: HTMLElement, key: keyof InlineFlexCSSStyle) {
  const cssText = dom.getAttribute("data-flex");
  if (!cssText) {
    return "";
  }
  const style = parseCSSText(cssText);
  let obj: Partial<InlineFlexCSSStyle> = {
    "flex-shrink": "1",
    "flex-grow": "0",
  };
  if (style.flex) {
    obj = {
      "flex-shrink": style.flex,
      "flex-grow": style.flex,
      "flex-basic": "0%",
    };
  }
  const merged = {
    ...obj,
    ...style,
  };

  return merged[key] || "";
}

function dashCase(inputStr: string) {
  // 在大写字母前添加一个空格
  return (
    inputStr
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      // 将所有大写字母转为小写字母
      .toLowerCase()
  );
}
const scheduleElements = new Set<HTMLElement>();
const setProperty = CSSStyleDeclaration.prototype.setProperty;
const props = [
  "alignItems",
  "flexDirection",
  "justifyContent",
  "flexWrap",
  "flexBasic",
  "flexShrink",
  "flexGrow",
];

const vm = new WeakMap<CSSStyleDeclaration, HTMLElement>();

const createElement = document.createElement;
document.createElement = function (
  tagName: string,
  options: ElementCreationOptions | undefined
) {
  const ele = createElement.call(this, tagName, options);
  vm.set(ele.style, ele);
  return ele;
};

function applyStyle() {
  ["display", "flex", ...props, ...props.map(dashCase)].forEach((property) => {
    Object.defineProperty(CSSStyleDeclaration.prototype, property, {
      get() {
        const ele = vm.get(this)!;
        const name = dashCase(property);
        if (!ele) {
          return this.getPropertyValue(property);
        }
        const cssText = ele.getAttribute("data-flex") || "";
        if (!cssText) {
          return "";
        }
        const style = parseCSSText(cssText);
        return style[name as keyof typeof style];
      },
      set(val) {
        const ele = vm.get(this)!;
        const _item = dashCase(property);
        if (!ele) {
          setProperty.call(this, _item, val);
          return;
        }
        const cssText = ele.getAttribute("data-flex") || "";
        if (property === "display" && val !== "flex") {
          setProperty.call(this, _item, val);
        } else {
          const serialize = serializeFlexCSS({
            ...parseCSSText(cssText),
            [_item]: val,
          });
          ele.setAttribute("data-flex", serialize);
        }
        scheduleElements.add(ele);
        scheduleLayout();
      },
    });
  });
}

applyStyle();
// 遍历样式表并应用布局
function applyFlex() {
  const flexbox = Array.from(scheduleElements).filter((item) => isFlex(item));
  flexbox.forEach((item) => {
    const ele = item as HTMLElement;
    if (!flexbox.some((item) => item === ele.parentElement)) {
      applyYogaLayout(ele);
    }
  });
}

function isHeightSetByUser(element: HTMLElement): {
  isSet: boolean;
  source: "inline" | "css" | "auto";
} {
  if (element.style.display !== "flex") {
    return { isSet: true, source: "inline" }; // 内联样式中设置了高度
  }
  // 1. 检查内联样式
  if (element.style.height && element.style.height !== "") {
    return { isSet: true, source: "inline" }; // 内联样式中设置了高度
  }

  // 2. 遍历样式表，查找是否通过 CSS 设置了高度
  const stylesheets = document.styleSheets;

  for (const stylesheet of Array.from(stylesheets)) {
    try {
      const rules = stylesheet.cssRules || stylesheet.rules;

      for (const rule of Array.from(rules)) {
        if (
          rule instanceof CSSStyleRule &&
          element.matches(rule.selectorText)
        ) {
          const height = rule.style.height;
          if (height && height !== "auto") {
            return { isSet: true, source: "css" }; // 通过 CSS 样式表设置了高度
          }
        }
      }
    } catch (e) {
      // 某些样式表（尤其是跨域引入的）可能无法访问，跳过这些
    }
  }

  // 4. 如果没有设置高度，返回 'auto' 说明是默认行为
  return { isSet: false, source: "auto" };
}

function setYogaNodeStyle(element: HTMLElement) {
  function parseValue(val: string) {
    if (val === "none") {
      return "auto";
    }
    if (val.endsWith("px")) {
      return parseFloat(val);
    }
    return val;
  }

  const style = window.getComputedStyle(element);
  if (style.display === "inline") {
    element.style.display = "inline-block";
  }
  const yogaNode = Yoga.Node.create();
  yogaNode.setOverflow(getOverflow(style.overflow));
  yogaNode.setDisplay(YGDisplay.Flex);
  try {
    yogaNode.setWidth(parseValue(style.width));
  } catch (e) {
    console.log(parseValue(style.width));
    throw e;
  }
  yogaNode.setHeight(
    isHeightSetByUser(element).isSet ? parseValue(style.height) : "auto"
  );
  style.maxHeight !== "none" &&
    yogaNode.setMaxHeight(parseValue(style.maxHeight));
  style.maxWidth !== "none" && yogaNode.setMaxWidth(parseValue(style.maxWidth));
  style.minWidth !== "none" && yogaNode.setMinWidth(parseValue(style.minWidth));
  style.minHeight !== "none" &&
    yogaNode.setMinHeight(parseValue(style.minHeight));
  yogaNode.setPositionType(getPositionType(style.position));

  style.left !== "auto" && yogaNode.setPosition(YGEdge.Left, style.left);
  style.right !== "auto" && yogaNode.setPosition(YGEdge.Right, style.right);
  style.top !== "auto" && yogaNode.setPosition(YGEdge.Top, style.top);
  style.bottom !== "auto" && yogaNode.setPosition(YGEdge.Bottom, style.bottom);
  yogaNode.setMargin(YGEdge.Left, parseValue(style.marginLeft));
  yogaNode.setMargin(YGEdge.Right, parseValue(style.marginRight));
  yogaNode.setMargin(YGEdge.Top, parseValue(style.marginTop));
  yogaNode.setMargin(YGEdge.Bottom, parseValue(style.marginBottom));

  yogaNode.setPadding(YGEdge.Left, parseValue(style.paddingLeft));
  yogaNode.setPadding(YGEdge.Right, parseValue(style.paddingRight));
  yogaNode.setPadding(YGEdge.Top, parseValue(style.paddingTop));
  yogaNode.setPadding(YGEdge.Bottom, parseValue(style.paddingBottom));

  yogaNode.setBorder(YGEdge.Left, parseFloat(style.borderLeft));
  yogaNode.setBorder(YGEdge.Right, parseFloat(style.borderRight));
  yogaNode.setBorder(YGEdge.Top, parseFloat(style.borderTop));
  yogaNode.setBorder(YGEdge.Bottom, parseFloat(style.borderBottom));
  yogaNode.setFlexDirection(
    getFlexDirection(getFlexPropertyValue(element, "flex-direction") || "row")
  );
  yogaNode.setJustifyContent(
    getJustifyContent(
      getFlexPropertyValue(element, "justify-content") || "flex-start"
    )
  );
  yogaNode.setAlignItems(
    getAlignItems(getFlexPropertyValue(element, "align-items") || "stretch")
  );
  yogaNode.setFlexWrap(
    getFlexWrap(
      (getFlexPropertyValue(element, "flex-wrap") as "wrap" | "nowrap") ||
        "nowrap"
    )
  );

  yogaNode.setFlexBasis(
    parseFloat(getFlexPropertyValue(element, "flex-basic") || "auto")
  );
  yogaNode.setFlexGrow(
    parseFloat(getFlexPropertyValue(element, "flex-grow") || "0")
  );
  yogaNode.setFlexShrink(
    parseFloat(getFlexPropertyValue(element, "flex-shrink") || "1")
  );
  yogaNode.setAlignSelf(
    getAlignSelf(getFlexPropertyValue(element, "align-self") || "auto")
  );
  yogaNode.setFlex(parseFloat(getFlexPropertyValue(element, "flex") || "0"));
  return yogaNode;
}
function createPointerText(rect: { x: number; y: number }) {
  const div = document.createElement("div");
  div.innerText = JSON.stringify({ x: rect.x, y: rect.y });
  div.style.left = rect.x + "px";
  div.style.top = rect.y + "px";
  div.style.position = "fixed";
  document.body.appendChild(div);
}

function getTranslateValues(element: HTMLElement): { x: number; y: number } {
  const style = window.getComputedStyle(element);
  const transform = style.transform;

  if (!transform || transform === "none") {
    return { x: 0, y: 0 }; // 如果没有 transform，默认为 (0, 0)
  }

  // 解析 2D transform matrix，格式如：matrix(a, b, c, d, tx, ty)
  const matrix = transform.match(/^matrix\((.+)\)$/);

  if (matrix) {
    const values = matrix[1].split(",").map(Number); // 提取矩阵中的数值
    return { x: values[4], y: values[5] }; // matrix 中的 tx, ty 对应 x 和 y
  }

  // 解析 3D transform matrix，格式如：matrix3d(a1, a2, ..., tx, ty, tz)
  const matrix3d = transform.match(/^matrix3d\((.+)\)$/);

  if (matrix3d) {
    const values = matrix3d[1].split(",").map(Number);
    return { x: values[12], y: values[13] }; // matrix3d 中的 tx, ty 对应 x 和 y
  }

  return { x: 0, y: 0 }; // 如果不是 matrix 或 matrix3d，则返回默认值
}
// 示例用法
function isFlex(element: HTMLElement) {
  const display = getFlexPropertyValue(element, "display");
  return display === "flex";
}
// 获取元素的布局信息并调用 layoutNode
function applyLayout(element: HTMLElement) {
  const node = setYogaNodeStyle(element);
  // 添加子元素（假设所有子元素都是块级元素）
  const children = element.children;
  Array.from(children).forEach((_child, index) => {
    const child = _child as HTMLElement;
    const childNode = isFlex(child)
      ? applyLayout(child)
      : setYogaNodeStyle(child);
    node.insertChild(childNode, index);
  });
  return node;
}

function applyYogaLayout(element: HTMLElement) {
  const node = applyLayout(element)!;
  node.calculateLayout();
  applyDomStyle(node, element);
}

function applyDomStyle(node: Yoga.Node, element: HTMLElement) {
  element.style.width = node.getComputedWidth() + "px";
  element.style.height = node.getComputedHeight() + "px";
  const rect = element.getBoundingClientRect();
  // 应用布局结果到 DOM
  new Array(node.getChildCount())
    .fill("")
    .map((blank, index) => {
      const item = node.getChild(index);
      const child = element.children[index] as HTMLElement;
      child.style.removeProperty("transform");
      child.style.width = item.getComputedWidth() + "px";
      child.style.height = item.getComputedHeight() + "px";
      return { child, node: item };
    })
    .forEach(({ child, node }) => {
      const clientRect = child.getBoundingClientRect();
      const trans = getTranslateValues(child);
      const diffX = -(clientRect.x - rect.x);
      const diffY = -(clientRect.y - rect.y);
      // 使用 transform 来应用位移
      child.style.transform = `translate(${
        node.getComputedLeft() + diffX + trans.x
      }px, ${node.getComputedTop() + diffY + trans.x}px)`;
      if (isFlex(child)) {
        applyDomStyle(node, child);
      }
    });
}

/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
type SupportCSSProperties = {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  position: "relative" | "absolute";
  left: number;
  right: number;
  top: number;
  bottom: number;
  margin: number;
  marginRight: number;
  marginLeft: number;
  marginTop: number;
  marginBottom: number;
  padding: number;
  paddingRight: number;
  paddingLeft: number;
  paddingTop: number;
  paddingBottom: number;
  borderWidth: number;
  borderLeftWidth: number;
  borderRightWidth: number;
  borderTopWidth: number;
  borderBottomWidth: number;
  marginStart: number;
  marginEnd: number;
  paddingStart: number;
  paddingEnd: number;
  borderStartWidth: number;
  borderEndWidth: number;
  direction: string;
  flex: number;
  flexShrink: number;
  flexGrow: number;
  alignItems: string;
  justifyContent: string;
  alignContent: string;
  alignSelf: string;
  flexDirection: string;
  flexWrap: "wrap" | "nowrap";
  flexBasic: number;
  measure: (val: number) => { width: number; height: number };
};

export type SupportLayout = {
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
  requestedHeight: number;
  requestedWidth: number;
  parentMaxWidth: number;
  direction: string;
};

export type ComputedCSSNode = {
  style: Partial<SupportCSSProperties>;
  isDirty: boolean;
  layout: SupportLayout;
  children: ComputedCSSNode[];
  shouldUpdate: boolean;
  lastLayout: SupportLayout;
  lineIndex: number;
  nextAbsoluteChild: ComputedCSSNode | null;
  nextFlexChild: ComputedCSSNode | null;
};

export type CSSNode = {
  style: Partial<SupportCSSProperties>;
  children: CSSNode[];
};

type Pos = "top" | "right" | "left" | "bottom";
let computeLayout = (function () {
  let CSS_UNDEFINED: number;

  const CSS_DIRECTION_INHERIT = "inherit";
  const CSS_DIRECTION_LTR = "ltr";
  const CSS_DIRECTION_RTL = "rtl";

  const CSS_FLEX_DIRECTION_ROW = "row" as const;
  const CSS_FLEX_DIRECTION_ROW_REVERSE = "row-reverse" as const;
  const CSS_FLEX_DIRECTION_COLUMN = "column" as const;
  const CSS_FLEX_DIRECTION_COLUMN_REVERSE = "column-reverse" as const;

  const CSS_JUSTIFY_FLEX_START = "flex-start" as const;
  const CSS_JUSTIFY_CENTER = "center" as const;
  const CSS_JUSTIFY_FLEX_END = "flex-end" as const;
  const CSS_JUSTIFY_SPACE_BETWEEN = "space-between" as const;
  const CSS_JUSTIFY_SPACE_AROUND = "space-around" as const;

  const CSS_ALIGN_FLEX_START = "flex-start" as const;
  const CSS_ALIGN_CENTER = "center" as const;
  const CSS_ALIGN_FLEX_END = "flex-end" as const;
  const CSS_ALIGN_STRETCH = "stretch" as const;

  const CSS_POSITION_RELATIVE = "relative" as const;
  const CSS_POSITION_ABSOLUTE = "absolute" as const;

  type Axis =
    | typeof CSS_FLEX_DIRECTION_ROW_REVERSE
    | typeof CSS_FLEX_DIRECTION_ROW
    | typeof CSS_FLEX_DIRECTION_COLUMN
    | typeof CSS_FLEX_DIRECTION_COLUMN_REVERSE;

  const leading = {
    row: "left",
    "row-reverse": "right",
    column: "top",
    "column-reverse": "bottom",
  } as const;

  const trailing = {
    row: "right",
    "row-reverse": "left",
    column: "bottom",
    "column-reverse": "top",
  } as const;

  const pos = {
    row: "left",
    "row-reverse": "right",
    column: "top",
    "column-reverse": "bottom",
  } as const;

  const dim = {
    row: "width",
    "row-reverse": "width",
    column: "height",
    "column-reverse": "height",
  } as const;

  // When transpiled to Java / C the node type has layout, children and style
  // properties. For the JavaScript version this function adds these properties
  // if they don't already exist.
  function fillNodes(node: ComputedCSSNode) {
    if (!node.layout || node.isDirty) {
      node.layout = {
        width: undefined as unknown as number,
        height: undefined as unknown as number,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      } as SupportLayout;
    }

    if (!node.style) {
      node.style = {};
    }

    if (!node.children) {
      node.children = [];
    }
    node.children.forEach(fillNodes);
    return node;
  }

  function isUndefined(value: unknown) {
    return value === undefined;
  }

  function isRowDirection(flexDirection: string) {
    return (
      flexDirection === CSS_FLEX_DIRECTION_ROW ||
      flexDirection === CSS_FLEX_DIRECTION_ROW_REVERSE
    );
  }

  function isColumnDirection(flexDirection: string) {
    return (
      flexDirection === CSS_FLEX_DIRECTION_COLUMN ||
      flexDirection === CSS_FLEX_DIRECTION_COLUMN_REVERSE
    );
  }

  function getLeadingMargin(node: ComputedCSSNode, axis: string): number {
    if (node.style.marginStart !== undefined && isRowDirection(axis)) {
      return node.style.marginStart!;
    }

    let value = null;
    switch (axis) {
      case "row":
        value = node.style.marginLeft!;
        break;
      case "row-reverse":
        value = node.style.marginRight!;
        break;
      case "column":
        value = node.style.marginTop!;
        break;
      case "column-reverse":
        value = node.style.marginBottom!;
        break;
    }

    if (value !== undefined) {
      return value!;
    }

    if (node.style.margin !== undefined) {
      return node.style.margin;
    }

    return 0;
  }

  function getTrailingMargin(node: ComputedCSSNode, axis: string) {
    if (node.style.marginEnd !== undefined && isRowDirection(axis)) {
      return node.style.marginEnd;
    }

    let value = null;
    switch (axis) {
      case "row":
        value = node.style.marginRight;
        break;
      case "row-reverse":
        value = node.style.marginLeft;
        break;
      case "column":
        value = node.style.marginBottom;
        break;
      case "column-reverse":
        value = node.style.marginTop;
        break;
    }

    if (value != null) {
      return value;
    }

    if (node.style.margin !== undefined) {
      return node.style.margin;
    }

    return 0;
  }

  function getLeadingPadding(node: ComputedCSSNode, axis: string) {
    if (
      node.style.paddingStart !== undefined &&
      node.style.paddingStart >= 0 &&
      isRowDirection(axis)
    ) {
      return node.style.paddingStart;
    }

    let value = null;
    switch (axis) {
      case "row":
        value = node.style.paddingLeft;
        break;
      case "row-reverse":
        value = node.style.paddingRight;
        break;
      case "column":
        value = node.style.paddingTop;
        break;
      case "column-reverse":
        value = node.style.paddingBottom;
        break;
    }

    if (value != null && value >= 0) {
      return value;
    }

    if (node.style.padding !== undefined && node.style.padding >= 0) {
      return node.style.padding;
    }

    return 0;
  }

  function getTrailingPadding(node: ComputedCSSNode, axis: string) {
    if (
      node.style.paddingEnd !== undefined &&
      node.style.paddingEnd >= 0 &&
      isRowDirection(axis)
    ) {
      return node.style.paddingEnd;
    }

    let value = null;
    switch (axis) {
      case "row":
        value = node.style.paddingRight;
        break;
      case "row-reverse":
        value = node.style.paddingLeft;
        break;
      case "column":
        value = node.style.paddingBottom;
        break;
      case "column-reverse":
        value = node.style.paddingTop;
        break;
    }

    if (value != null && value >= 0) {
      return value;
    }

    if (node.style.padding !== undefined && node.style.padding >= 0) {
      return node.style.padding;
    }

    return 0;
  }

  function getLeadingBorder(node: ComputedCSSNode, axis: string) {
    if (
      node.style.borderStartWidth !== undefined &&
      node.style.borderStartWidth >= 0 &&
      isRowDirection(axis)
    ) {
      return node.style.borderStartWidth;
    }

    let value = null;
    switch (axis) {
      case "row":
        value = node.style.borderLeftWidth;
        break;
      case "row-reverse":
        value = node.style.borderRightWidth;
        break;
      case "column":
        value = node.style.borderTopWidth;
        break;
      case "column-reverse":
        value = node.style.borderBottomWidth;
        break;
    }

    if (value != null && value >= 0) {
      return value;
    }

    if (node.style.borderWidth !== undefined && node.style.borderWidth >= 0) {
      return node.style.borderWidth;
    }

    return 0;
  }

  function getTrailingBorder(node: ComputedCSSNode, axis: string) {
    if (
      node.style.borderEndWidth !== undefined &&
      node.style.borderEndWidth >= 0 &&
      isRowDirection(axis)
    ) {
      return node.style.borderEndWidth;
    }

    let value = null;
    switch (axis) {
      case "row":
        value = node.style.borderRightWidth;
        break;
      case "row-reverse":
        value = node.style.borderLeftWidth;
        break;
      case "column":
        value = node.style.borderBottomWidth;
        break;
      case "column-reverse":
        value = node.style.borderTopWidth;
        break;
    }

    if (value != null && value >= 0) {
      return value;
    }

    if (node.style.borderWidth !== undefined && node.style.borderWidth >= 0) {
      return node.style.borderWidth;
    }

    return 0;
  }

  function getLeadingPaddingAndBorder(node: ComputedCSSNode, axis: string) {
    return getLeadingPadding(node, axis) + getLeadingBorder(node, axis);
  }

  function getTrailingPaddingAndBorder(node: ComputedCSSNode, axis: string) {
    return getTrailingPadding(node, axis) + getTrailingBorder(node, axis);
  }

  function getBorderAxis(node: ComputedCSSNode, axis: string) {
    return getLeadingBorder(node, axis) + getTrailingBorder(node, axis);
  }

  function getMarginAxis(node: ComputedCSSNode, axis: string) {
    return getLeadingMargin(node, axis)! + getTrailingMargin(node, axis);
  }

  function getPaddingAndBorderAxis(node: ComputedCSSNode, axis: string) {
    return (
      getLeadingPaddingAndBorder(node, axis) +
      getTrailingPaddingAndBorder(node, axis)
    );
  }

  function getJustifyContent(node: ComputedCSSNode) {
    if (node.style.justifyContent) {
      return node.style.justifyContent;
    }
    return "flex-start";
  }

  function getAlignContent(node: ComputedCSSNode) {
    if (node.style.alignContent) {
      return node.style.alignContent;
    }
    return "flex-start";
  }

  function getAlignItem(node: ComputedCSSNode, child: ComputedCSSNode) {
    if (child.style.alignSelf) {
      return child.style.alignSelf;
    }
    if (node.style.alignItems) {
      return node.style.alignItems;
    }
    return "stretch";
  }

  function resolveAxis(axis: string, direction: string): Axis {
    if (direction === CSS_DIRECTION_RTL) {
      if (axis === CSS_FLEX_DIRECTION_ROW) {
        return CSS_FLEX_DIRECTION_ROW_REVERSE;
      }
      if (axis === CSS_FLEX_DIRECTION_ROW_REVERSE) {
        return CSS_FLEX_DIRECTION_ROW;
      }
    }

    return axis as Axis;
  }

  function resolveDirection(node: ComputedCSSNode, parentDirection: string) {
    let direction;
    if (node.style.direction) {
      direction = node.style.direction;
    } else {
      direction = CSS_DIRECTION_INHERIT;
    }

    if (direction === CSS_DIRECTION_INHERIT) {
      direction =
        parentDirection === undefined ? CSS_DIRECTION_LTR : parentDirection;
    }

    return direction;
  }

  function getFlexDirection(node: ComputedCSSNode) {
    if (node.style.flexDirection) {
      return node.style.flexDirection;
    }
    return CSS_FLEX_DIRECTION_COLUMN;
  }

  function getCrossFlexDirection(flexDirection: string, direction: string) {
    if (isColumnDirection(flexDirection)) {
      return resolveAxis(CSS_FLEX_DIRECTION_ROW, direction);
    }
    return CSS_FLEX_DIRECTION_COLUMN;
  }

  function getPositionType(node: ComputedCSSNode) {
    if (node.style.position) {
      return node.style.position;
    }
    return "relative";
  }

  function isFlex(node: ComputedCSSNode) {
    return (
      getPositionType(node) === CSS_POSITION_RELATIVE && node.style.flex! > 0
    );
  }

  function isFlexWrap(node: ComputedCSSNode) {
    return node.style.flexWrap === "wrap";
  }

  function getDimWithMargin(node: ComputedCSSNode, axis: Axis) {
    return node.layout[dim[axis]]! + getMarginAxis(node, axis);
  }

  function isDimDefined(node: ComputedCSSNode, axis: Axis) {
    return node.style[dim[axis]]! !== undefined && node.style[dim[axis]]! >= 0;
  }

  function isPosDefined(node: ComputedCSSNode, pos: Pos) {
    return node.style[pos]! !== undefined;
  }

  function isMeasureDefined(node: ComputedCSSNode) {
    return node.style.measure !== undefined;
  }

  function getPosition(node: ComputedCSSNode, pos: Pos) {
    if (node.style[pos] !== undefined) {
      return node.style[pos]!;
    }
    return 0;
  }

  function boundAxis(node: ComputedCSSNode, axis: Axis, value: number) {
    let min = {
      row: node.style.minWidth,
      "row-reverse": node.style.minWidth,
      column: node.style.minHeight,
      "column-reverse": node.style.minHeight,
    }[axis];

    let max = {
      row: node.style.maxWidth,
      "row-reverse": node.style.maxWidth,
      column: node.style.maxHeight,
      "column-reverse": node.style.maxHeight,
    }[axis];

    let boundValue = value;
    if (max !== undefined && max >= 0 && boundValue > max) {
      boundValue = max;
    }
    if (min !== undefined && min >= 0 && boundValue < min) {
      boundValue = min;
    }
    return boundValue;
  }

  function fmaxf(a: number, b: number) {
    if (a > b) {
      return a;
    }
    return b;
  }

  // When the user specifically sets a value for width or height
  function setDimensionFromStyle(node: ComputedCSSNode, axis: Axis) {
    const size = dim[axis];
    // The parent already computed us a width or height. We just skip it
    if (node.layout[size] !== undefined) {
      return;
    }
    // We only run if there's a width or height defined
    if (!isDimDefined(node, axis)) {
      return;
    }

    // The dimensions can never be smaller than the padding and border
    node.layout[size] = fmaxf(
      boundAxis(node, axis, node.style[size]!),
      getPaddingAndBorderAxis(node, axis)
    );
  }

  function setTrailingPosition(
    node: ComputedCSSNode,
    child: ComputedCSSNode,
    axis: Axis
  ) {
    child.layout[trailing[axis]] =
      node.layout[dim[axis]]! -
      child.layout[dim[axis]]! -
      child.layout[pos[axis]]!;
  }

  // If both left and right are defined, then use left. Otherwise return
  // +left or -right depending on which is defined.
  function getRelativePosition(node: ComputedCSSNode, axis: Axis) {
    if (node.style[leading[axis]] !== undefined) {
      return getPosition(node, leading[axis]);
    }
    return -getPosition(node, trailing[axis])!;
  }

  function layoutNodeImpl(
    node: ComputedCSSNode,
    parentMaxWidth: number,
    /*css_direction_t*/ parentDirection: string
  ) {
    const /*css_direction_t*/ direction = resolveDirection(
        node,
        parentDirection
      );
    const /*(c)!css_flex_direction_t*/ /*(java)!int*/ mainAxis = resolveAxis(
        getFlexDirection(node),
        direction
      );
    const /*(c)!css_flex_direction_t*/ /*(java)!int*/ crossAxis =
        getCrossFlexDirection(mainAxis, direction);
    const /*(c)!css_flex_direction_t*/ /*(java)!int*/ resolvedRowAxis =
        resolveAxis(CSS_FLEX_DIRECTION_ROW, direction);

    // Handle width and height style attributes
    setDimensionFromStyle(node, mainAxis);
    setDimensionFromStyle(node, crossAxis);

    // Set the resolved resolution in the node's layout
    node.layout.direction = direction;

    // The position is set by the parent, but we need to complete it with a
    // delta composed of the margin and left/top/right/bottom
    node.layout[leading[mainAxis]] +=
      getLeadingMargin(node, mainAxis) + getRelativePosition(node, mainAxis);
    node.layout[trailing[mainAxis]] +=
      getTrailingMargin(node, mainAxis) + getRelativePosition(node, mainAxis);
    node.layout[leading[crossAxis]] +=
      getLeadingMargin(node, crossAxis) + getRelativePosition(node, crossAxis);
    node.layout[trailing[crossAxis]] +=
      getTrailingMargin(node, crossAxis) + getRelativePosition(node, crossAxis);

    // Inline immutable values from the target node to avoid excessive method
    // invocations during the layout calculation.
    const /*int*/ childCount = node.children.length;
    const /*float*/ paddingAndBorderAxisResolvedRow = getPaddingAndBorderAxis(
        node,
        resolvedRowAxis
      );

    if (isMeasureDefined(node)) {
      let /*bool*/ isResolvedRowDimDefined = !isUndefined(
          node.layout[dim[resolvedRowAxis]]
        );

      let /*float*/ width = CSS_UNDEFINED;
      if (isDimDefined(node, resolvedRowAxis)) {
        width = node.style.width!;
      } else if (isResolvedRowDimDefined) {
        width = node.layout[dim[resolvedRowAxis]];
      } else {
        width = parentMaxWidth - getMarginAxis(node, resolvedRowAxis);
      }
      width -= paddingAndBorderAxisResolvedRow;

      // We only need to give a dimension for the text if we haven't got any
      // for it computed yet. It can either be from the style attribute or because
      // the element is flexible.
      let /*bool*/ isRowUndefined =
          !isDimDefined(node, resolvedRowAxis) && !isResolvedRowDimDefined;
      let /*bool*/ isColumnUndefined =
          !isDimDefined(node, CSS_FLEX_DIRECTION_COLUMN) &&
          isUndefined(node.layout[dim[CSS_FLEX_DIRECTION_COLUMN]]);

      // Let's not measure the text if we already know both dimensions
      if (isRowUndefined || isColumnUndefined) {
        let /*css_dim_t*/ measureDim = node.style.measure!(
            /*(c)!node->context,*/
            /*(java)!layoutContext.measureOutput,*/
            width
          );
        if (isRowUndefined) {
          node.layout.width =
            measureDim.width + paddingAndBorderAxisResolvedRow;
        }
        if (isColumnUndefined) {
          node.layout.height =
            measureDim.height +
            getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_COLUMN);
        }
      }
      if (childCount === 0) {
        return;
      }
    }

    const /*bool*/ isNodeFlexWrap = isFlexWrap(node);

    const /*css_justify_t*/ justifyContent = getJustifyContent(node);

    const /*float*/ leadingPaddingAndBorderMain = getLeadingPaddingAndBorder(
        node,
        mainAxis
      );
    const /*float*/ leadingPaddingAndBorderCross = getLeadingPaddingAndBorder(
        node,
        crossAxis
      );
    const /*float*/ paddingAndBorderAxisMain = getPaddingAndBorderAxis(
        node,
        mainAxis
      );
    const /*float*/ paddingAndBorderAxisCross = getPaddingAndBorderAxis(
        node,
        crossAxis
      );

    const /*bool*/ isMainDimDefined = !isUndefined(node.layout[dim[mainAxis]]);
    const /*bool*/ isCrossDimDefined = !isUndefined(
        node.layout[dim[crossAxis]]
      );
    const /*bool*/ isMainRowDirection = isRowDirection(mainAxis);

    let /*int*/ i;
    let /*int*/ ii;
    let /*css_node_t**/ child:
        | (ComputedCSSNode & { layout: SupportLayout })
        | null;
    let /*(c)!css_flex_direction_t*/ /*(java)!int*/ axis;

    let /*css_node_t**/ firstAbsoluteChild = null;
    let /*css_node_t**/ currentAbsoluteChild = null;

    let /*float*/ definedMainDim = CSS_UNDEFINED;
    if (isMainDimDefined) {
      definedMainDim = node.layout[dim[mainAxis]] - paddingAndBorderAxisMain;
    }

    // We want to execute the next two loops one per line with flex-wrap
    let /*int*/ startLine = 0;
    let /*int*/ endLine = 0;
    // var/*int*/ nextOffset = 0;
    let /*int*/ alreadyComputedNextLayout = 0;
    // We aggregate the total dimensions of the container in those two variables
    let /*float*/ linesCrossDim = 0;
    let /*float*/ linesMainDim = 0;
    let /*int*/ linesCount = 0;
    while (endLine < childCount) {
      // <Loop A> Layout non flexible children and count children by type

      // mainContentDim is accumulation of the dimensions and margin of all the
      // non flexible children. This will be used in order to either set the
      // dimensions of the node if none already exist, or to compute the
      // remaining space left for the flexible children.
      let /*float*/ mainContentDim = 0;

      // There are three kind of children, non flexible, flexible and absolute.
      // We need to know how many there are in order to distribute the space.
      let /*int*/ flexibleChildrenCount = 0;
      let /*float*/ totalFlexible = 0;
      let /*int*/ nonFlexibleChildrenCount = 0;

      // Use the line loop to position children in the main axis for as long
      // as they are using a simple stacking behaviour. Children that are
      // immediately stacked in the initial loop will not be touched again
      // in <Loop C>.
      let /*bool*/ isSimpleStackMain =
          (isMainDimDefined && justifyContent === CSS_JUSTIFY_FLEX_START) ||
          (!isMainDimDefined && justifyContent !== CSS_JUSTIFY_CENTER);
      let /*int*/ firstComplexMain = isSimpleStackMain ? childCount : startLine;

      // Use the initial line loop to position children in the cross axis for
      // as long as they are relatively positioned with alignment STRETCH or
      // FLEX_START. Children that are immediately stacked in the initial loop
      // will not be touched again in <Loop D>.
      let /*bool*/ isSimpleStackCross = true;
      let /*int*/ firstComplexCross = childCount;

      let /*css_node_t**/ firstFlexChild = null;
      let /*css_node_t**/ currentFlexChild = null;

      let /*float*/ mainDim = leadingPaddingAndBorderMain;
      let /*float*/ crossDim = 0;

      let /*float*/ maxWidth: number;
      for (i = startLine; i < childCount; ++i) {
        child = node.children[i];
        child.lineIndex = linesCount;

        child.nextAbsoluteChild = null;
        child.nextFlexChild = null;

        const /*css_align_t*/ alignItem = getAlignItem(node, child);

        // Pre-fill cross axis dimensions when the child is using stretch before
        // we call the recursive layout pass
        if (
          alignItem === CSS_ALIGN_STRETCH &&
          getPositionType(child) === CSS_POSITION_RELATIVE &&
          isCrossDimDefined &&
          !isDimDefined(child, crossAxis)
        ) {
          child.layout[dim[crossAxis]] = fmaxf(
            boundAxis(
              child,
              crossAxis,
              node.layout[dim[crossAxis]] -
                paddingAndBorderAxisCross -
                getMarginAxis(child, crossAxis)
            ),
            // You never want to go smaller than padding
            getPaddingAndBorderAxis(child, crossAxis)
          );
        } else if (getPositionType(child) === CSS_POSITION_ABSOLUTE) {
          // Store a private linked list of absolutely positioned children
          // so that we can efficiently traverse them later.
          if (firstAbsoluteChild === null) {
            firstAbsoluteChild = child;
          }
          if (currentAbsoluteChild !== null) {
            currentAbsoluteChild.nextAbsoluteChild = child;
          }
          currentAbsoluteChild = child;

          // Pre-fill dimensions when using absolute position and both offsets for the axis are defined (either both
          // left and right or top and bottom).
          for (ii = 0; ii < 2; ii++) {
            axis =
              ii !== 0 ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;
            if (
              !isUndefined(node.layout[dim[axis]]) &&
              !isDimDefined(child, axis) &&
              isPosDefined(child, leading[axis]) &&
              isPosDefined(child, trailing[axis])
            ) {
              child.layout[dim[axis]] = fmaxf(
                boundAxis(
                  child,
                  axis,
                  node.layout[dim[axis]] -
                    getPaddingAndBorderAxis(node, axis) -
                    getMarginAxis(child, axis) -
                    getPosition(child, leading[axis]) -
                    getPosition(child, trailing[axis])
                ),
                // You never want to go smaller than padding
                getPaddingAndBorderAxis(child, axis)
              );
            }
          }
        }

        let /*float*/ nextContentDim = 0;

        // It only makes sense to consider a child flexible if we have a computed
        // dimension for the node.
        if (isMainDimDefined && isFlex(child)) {
          flexibleChildrenCount++;
          totalFlexible += child.style.flex!;

          // Store a private linked list of flexible children so that we can
          // efficiently traverse them later.
          if (firstFlexChild === null) {
            firstFlexChild = child;
          }
          if (currentFlexChild !== null) {
            currentFlexChild.nextFlexChild = child;
          }
          currentFlexChild = child;

          // Even if we don't know its exact size yet, we already know the padding,
          // border and margin. We'll use this partial information, which represents
          // the smallest possible size for the child, to compute the remaining
          // available space.
          nextContentDim =
            getPaddingAndBorderAxis(child, mainAxis) +
            getMarginAxis(child, mainAxis);
        } else {
          maxWidth = CSS_UNDEFINED;
          if (!isMainRowDirection) {
            if (isDimDefined(node, resolvedRowAxis)) {
              maxWidth =
                node.layout[dim[resolvedRowAxis]] -
                paddingAndBorderAxisResolvedRow;
            } else {
              maxWidth =
                parentMaxWidth -
                getMarginAxis(node, resolvedRowAxis) -
                paddingAndBorderAxisResolvedRow;
            }
          }

          // This is the main recursive call. We layout non flexible children.
          if (alreadyComputedNextLayout === 0) {
            layoutNode(/*(java)!layoutContext, */ child, maxWidth, direction);
          }

          // Absolute positioned elements do not take part of the layout, so we
          // don't use them to compute mainContentDim
          if (getPositionType(child) === CSS_POSITION_RELATIVE) {
            nonFlexibleChildrenCount++;
            // At this point we know the final size and margin of the element.
            nextContentDim = getDimWithMargin(child, mainAxis);
          }
        }

        // The element we are about to add would make us go to the next line
        if (
          isNodeFlexWrap &&
          isMainDimDefined &&
          mainContentDim + nextContentDim > definedMainDim &&
          // If there's only one element, then it's bigger than the content
          // and needs its own line
          i !== startLine
        ) {
          nonFlexibleChildrenCount--;
          alreadyComputedNextLayout = 1;
          break;
        }

        // Disable simple stacking in the main axis for the current line as
        // we found a non-trivial child. The remaining children will be laid out
        // in <Loop C>.
        if (
          isSimpleStackMain &&
          (getPositionType(child) !== CSS_POSITION_RELATIVE || isFlex(child))
        ) {
          isSimpleStackMain = false;
          firstComplexMain = i;
        }

        // Disable simple stacking in the cross axis for the current line as
        // we found a non-trivial child. The remaining children will be laid out
        // in <Loop D>.
        if (
          isSimpleStackCross &&
          (getPositionType(child) !== CSS_POSITION_RELATIVE ||
            (alignItem !== CSS_ALIGN_STRETCH &&
              alignItem !== CSS_ALIGN_FLEX_START) ||
            isUndefined(child.layout[dim[crossAxis]]))
        ) {
          isSimpleStackCross = false;
          firstComplexCross = i;
        }

        if (isSimpleStackMain) {
          child.layout[pos[mainAxis]] += mainDim;
          if (isMainDimDefined) {
            setTrailingPosition(node, child, mainAxis);
          }

          mainDim += getDimWithMargin(child, mainAxis);
          crossDim = fmaxf(
            crossDim,
            boundAxis(child, crossAxis, getDimWithMargin(child, crossAxis))
          );
        }

        if (isSimpleStackCross) {
          child.layout[pos[crossAxis]] +=
            linesCrossDim + leadingPaddingAndBorderCross;
          if (isCrossDimDefined) {
            setTrailingPosition(node, child, crossAxis);
          }
        }

        alreadyComputedNextLayout = 0;
        mainContentDim += nextContentDim;
        endLine = i + 1;
      }

      // <Loop B> Layout flexible children and allocate empty space

      // In order to position the elements in the main axis, we have two
      // controls. The space between the beginning and the first element
      // and the space between each two elements.
      let /*float*/ leadingMainDim = 0;
      let /*float*/ betweenMainDim = 0;

      // The remaining available space that needs to be allocated
      let /*float*/ remainingMainDim = 0;
      if (isMainDimDefined) {
        remainingMainDim = definedMainDim - mainContentDim;
      } else {
        remainingMainDim = fmaxf(mainContentDim, 0) - mainContentDim;
      }

      // If there are flexible children in the mix, they are going to fill the
      // remaining space
      if (flexibleChildrenCount !== 0) {
        let /*float*/ flexibleMainDim = remainingMainDim / totalFlexible;
        let /*float*/ baseMainDim;
        let /*float*/ boundMainDim;

        // If the flex share of remaining space doesn't meet min/max bounds,
        // remove this child from flex calculations.
        currentFlexChild = firstFlexChild;
        while (currentFlexChild !== null) {
          baseMainDim =
            flexibleMainDim * currentFlexChild.style.flex! +
            getPaddingAndBorderAxis(currentFlexChild, mainAxis);
          boundMainDim = boundAxis(currentFlexChild, mainAxis, baseMainDim);

          if (baseMainDim !== boundMainDim) {
            remainingMainDim -= boundMainDim;
            totalFlexible -= currentFlexChild.style.flex!;
          }

          currentFlexChild = currentFlexChild.nextFlexChild;
        }
        flexibleMainDim = remainingMainDim / totalFlexible;

        // The non flexible children can overflow the container, in this case
        // we should just assume that there is no space available.
        if (flexibleMainDim < 0) {
          flexibleMainDim = 0;
        }

        currentFlexChild = firstFlexChild;
        while (currentFlexChild !== null) {
          // At this point we know the final size of the element in the main
          // dimension
          currentFlexChild.layout[dim[mainAxis]] = boundAxis(
            currentFlexChild,
            mainAxis,
            flexibleMainDim * currentFlexChild.style.flex! +
              getPaddingAndBorderAxis(currentFlexChild, mainAxis)
          );

          maxWidth = CSS_UNDEFINED;
          if (isDimDefined(node, resolvedRowAxis)) {
            maxWidth =
              node.layout[dim[resolvedRowAxis]] -
              paddingAndBorderAxisResolvedRow;
          } else if (!isMainRowDirection) {
            maxWidth =
              parentMaxWidth -
              getMarginAxis(node, resolvedRowAxis) -
              paddingAndBorderAxisResolvedRow;
          }

          // And we recursively call the layout algorithm for this child
          layoutNode(
            /*(java)!layoutContext, */ currentFlexChild,
            maxWidth,
            direction
          );

          child = currentFlexChild;
          currentFlexChild = currentFlexChild.nextFlexChild;
          child.nextFlexChild = null;
        }

        // We use justifyContent to figure out how to allocate the remaining
        // space available
      } else if (justifyContent !== CSS_JUSTIFY_FLEX_START) {
        if (justifyContent === CSS_JUSTIFY_CENTER) {
          leadingMainDim = remainingMainDim / 2;
        } else if (justifyContent === CSS_JUSTIFY_FLEX_END) {
          leadingMainDim = remainingMainDim;
        } else if (justifyContent === CSS_JUSTIFY_SPACE_BETWEEN) {
          remainingMainDim = fmaxf(remainingMainDim, 0);
          if (flexibleChildrenCount + nonFlexibleChildrenCount - 1 !== 0) {
            betweenMainDim =
              remainingMainDim /
              (flexibleChildrenCount + nonFlexibleChildrenCount - 1);
          } else {
            betweenMainDim = 0;
          }
        } else if (justifyContent === CSS_JUSTIFY_SPACE_AROUND) {
          // Space on the edges is half of the space between elements
          betweenMainDim =
            remainingMainDim /
            (flexibleChildrenCount + nonFlexibleChildrenCount);
          leadingMainDim = betweenMainDim / 2;
        }
      }

      // <Loop C> Position elements in the main axis and compute dimensions

      // At this point, all the children have their dimensions set. We need to
      // find their position. In order to do that, we accumulate data in
      // variables that are also useful to compute the total dimensions of the
      // container!
      mainDim += leadingMainDim;

      for (i = firstComplexMain; i < endLine; ++i) {
        child = node.children[i] as ComputedCSSNode & { layout: SupportLayout };

        if (
          getPositionType(child) === CSS_POSITION_ABSOLUTE &&
          isPosDefined(child, leading[mainAxis])
        ) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child.layout[pos[mainAxis]] =
            getPosition(child, leading[mainAxis]) +
            getLeadingBorder(node, mainAxis) +
            getLeadingMargin(child, mainAxis);
        } else {
          // If the child is position absolute (without top/left) or relative,
          // we put it at the current accumulated offset.
          child.layout[pos[mainAxis]] += mainDim;

          // Define the trailing position accordingly.
          if (isMainDimDefined) {
            setTrailingPosition(node, child, mainAxis);
          }

          // Now that we placed the element, we need to update the variables
          // We only need to do that for relative elements. Absolute elements
          // do not take part in that phase.
          if (getPositionType(child) === CSS_POSITION_RELATIVE) {
            // The main dimension is the sum of all the elements dimension plus
            // the spacing.
            mainDim += betweenMainDim + getDimWithMargin(child, mainAxis);
            // The cross dimension is the max of the elements dimension since there
            // can only be one element in that cross dimension.
            crossDim = fmaxf(
              crossDim,
              boundAxis(child, crossAxis, getDimWithMargin(child, crossAxis))
            );
          }
        }
      }

      let /*float*/ containerCrossAxis = node.layout[dim[crossAxis]];
      if (!isCrossDimDefined) {
        containerCrossAxis = fmaxf(
          // For the cross dim, we add both sides at the end because the value
          // is aggregate via a max function. Intermediate negative values
          // can mess this computation otherwise
          boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross),
          paddingAndBorderAxisCross
        );
      }

      // <Loop D> Position elements in the cross axis
      for (i = firstComplexCross; i < endLine; ++i) {
        child = node.children[i];

        if (
          getPositionType(child) === CSS_POSITION_ABSOLUTE &&
          isPosDefined(child, leading[crossAxis])
        ) {
          // In case the child is absolutely positionned and has a
          // top/left/bottom/right being set, we override all the previously
          // computed positions to set it correctly.
          child.layout[pos[crossAxis]] =
            getPosition(child, leading[crossAxis]) +
            getLeadingBorder(node, crossAxis) +
            getLeadingMargin(child, crossAxis);
        } else {
          let /*float*/ leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross axis
          if (getPositionType(child) === CSS_POSITION_RELATIVE) {
            /*eslint-disable */
            // This variable is intentionally re-defined as the code is transpiled to a block scope language
            const /*css_align_t*/ alignItem = getAlignItem(node, child);
            /*eslint-enable */
            if (alignItem === CSS_ALIGN_STRETCH) {
              // You can only stretch if the dimension has not already been set
              // previously.
              if (isUndefined(child.layout[dim[crossAxis]])) {
                child.layout[dim[crossAxis]] = fmaxf(
                  boundAxis(
                    child,
                    crossAxis,
                    containerCrossAxis -
                      paddingAndBorderAxisCross -
                      getMarginAxis(child, crossAxis)
                  ),
                  // You never want to go smaller than padding
                  getPaddingAndBorderAxis(child, crossAxis)
                );
              }
            } else if (alignItem !== CSS_ALIGN_FLEX_START) {
              // The remaining space between the parent dimensions+padding and child
              // dimensions+margin.
              let /*float*/ remainingCrossDim =
                  containerCrossAxis -
                  paddingAndBorderAxisCross -
                  getDimWithMargin(child, crossAxis);

              if (alignItem === CSS_ALIGN_CENTER) {
                leadingCrossDim += remainingCrossDim / 2;
              } else {
                // CSS_ALIGN_FLEX_END
                leadingCrossDim += remainingCrossDim;
              }
            }
          }

          // And we apply the position
          child.layout[pos[crossAxis]] += linesCrossDim + leadingCrossDim;

          // Define the trailing position accordingly.
          if (isCrossDimDefined) {
            setTrailingPosition(node, child, crossAxis);
          }
        }
      }

      linesCrossDim += crossDim;
      linesMainDim = fmaxf(linesMainDim, mainDim);
      linesCount += 1;
      startLine = endLine;
    }

    // <Loop E>
    //
    // Note(prenaux): More than one line, we need to layout the crossAxis
    // according to alignContent.
    //
    // Note that we could probably remove <Loop D> and handle the one line case
    // here too, but for the moment this is safer since it won't interfere with
    // previously working code.
    //
    // See specs:
    // http://www.w3.org/TR/2012/CR-css3-flexbox-20120918/#layout-algorithm
    // section 9.4
    //
    if (linesCount > 1 && isCrossDimDefined) {
      let /*float*/ nodeCrossAxisInnerSize =
          node.layout[dim[crossAxis]] - paddingAndBorderAxisCross;
      let /*float*/ remainingAlignContentDim =
          nodeCrossAxisInnerSize - linesCrossDim;

      let /*float*/ crossDimLead = 0;
      let /*float*/ currentLead = leadingPaddingAndBorderCross;

      let /*css_align_t*/ alignContent = getAlignContent(node);
      if (alignContent === CSS_ALIGN_FLEX_END) {
        currentLead += remainingAlignContentDim;
      } else if (alignContent === CSS_ALIGN_CENTER) {
        currentLead += remainingAlignContentDim / 2;
      } else if (alignContent === CSS_ALIGN_STRETCH) {
        if (nodeCrossAxisInnerSize > linesCrossDim) {
          crossDimLead = remainingAlignContentDim / linesCount;
        }
      }

      let /*int*/ endIndex = 0;
      for (i = 0; i < linesCount; ++i) {
        let /*int*/ startIndex = endIndex;

        // compute the line's height and find the endIndex
        let /*float*/ lineHeight = 0;
        for (ii = startIndex; ii < childCount; ++ii) {
          child = node.children[ii];
          if (getPositionType(child) !== CSS_POSITION_RELATIVE) {
            // eslint-disable-next-line no-continue
            continue;
          }
          if (child.lineIndex !== i) {
            break;
          }
          if (!isUndefined(child.layout[dim[crossAxis]])) {
            lineHeight = fmaxf(
              lineHeight,
              child.layout[dim[crossAxis]] + getMarginAxis(child, crossAxis)
            );
          }
        }
        endIndex = ii;
        lineHeight += crossDimLead;

        for (ii = startIndex; ii < endIndex; ++ii) {
          child = node.children[ii];
          if (getPositionType(child) !== CSS_POSITION_RELATIVE) {
            // eslint-disable-next-line no-continue
            continue;
          }

          let /*css_align_t*/ alignContentAlignItem = getAlignItem(node, child);
          if (alignContentAlignItem === CSS_ALIGN_FLEX_START) {
            child.layout[pos[crossAxis]] =
              currentLead + getLeadingMargin(child, crossAxis);
          } else if (alignContentAlignItem === CSS_ALIGN_FLEX_END) {
            child.layout[pos[crossAxis]] =
              currentLead +
              lineHeight -
              getTrailingMargin(child, crossAxis) -
              child.layout[dim[crossAxis]];
          } else if (alignContentAlignItem === CSS_ALIGN_CENTER) {
            let /*float*/ childHeight = child.layout[dim[crossAxis]];
            child.layout[pos[crossAxis]] =
              currentLead + (lineHeight - childHeight) / 2;
          } else if (alignContentAlignItem === CSS_ALIGN_STRETCH) {
            child.layout[pos[crossAxis]] =
              currentLead + getLeadingMargin(child, crossAxis);
            // TODO(prenaux): Correctly set the height of items with undefined
            //                (auto) crossAxis dimension.
          }
        }

        currentLead += lineHeight;
      }
    }

    let /*bool*/ needsMainTrailingPos = false;
    let /*bool*/ needsCrossTrailingPos = false;

    // If the user didn't specify a width or height, and it has not been set
    // by the container, then we set it via the children.
    if (!isMainDimDefined) {
      node.layout[dim[mainAxis]] = fmaxf(
        // We're missing the last padding at this point to get the final
        // dimension
        boundAxis(
          node,
          mainAxis,
          linesMainDim + getTrailingPaddingAndBorder(node, mainAxis)
        ),
        // We can never assign a width smaller than the padding and borders
        paddingAndBorderAxisMain
      );

      if (
        mainAxis === CSS_FLEX_DIRECTION_ROW_REVERSE ||
        mainAxis === CSS_FLEX_DIRECTION_COLUMN_REVERSE
      ) {
        needsMainTrailingPos = true;
      }
    }

    if (!isCrossDimDefined) {
      node.layout[dim[crossAxis]] = fmaxf(
        // For the cross dim, we add both sides at the end because the value
        // is aggregate via a max function. Intermediate negative values
        // can mess this computation otherwise
        boundAxis(node, crossAxis, linesCrossDim + paddingAndBorderAxisCross),
        paddingAndBorderAxisCross
      );

      if (
        crossAxis === CSS_FLEX_DIRECTION_ROW_REVERSE ||
        crossAxis === CSS_FLEX_DIRECTION_COLUMN_REVERSE
      ) {
        needsCrossTrailingPos = true;
      }
    }

    // <Loop F> Set trailing position if necessary
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (i = 0; i < childCount; ++i) {
        child = node.children[i];

        if (needsMainTrailingPos) {
          setTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          setTrailingPosition(node, child, crossAxis);
        }
      }
    }

    // <Loop G> Calculate dimensions for absolutely positioned elements
    currentAbsoluteChild = firstAbsoluteChild;
    while (currentAbsoluteChild !== null) {
      // Pre-fill dimensions when using absolute position and both offsets for
      // the axis are defined (either both left and right or top and bottom).
      for (ii = 0; ii < 2; ii++) {
        axis = ii !== 0 ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;

        if (
          !isUndefined(node.layout[dim[axis]]) &&
          !isDimDefined(currentAbsoluteChild, axis) &&
          isPosDefined(currentAbsoluteChild, leading[axis]) &&
          isPosDefined(currentAbsoluteChild, trailing[axis])
        ) {
          currentAbsoluteChild.layout[dim[axis]] = fmaxf(
            boundAxis(
              currentAbsoluteChild,
              axis,
              node.layout[dim[axis]] -
                getBorderAxis(node, axis) -
                getMarginAxis(currentAbsoluteChild, axis) -
                getPosition(currentAbsoluteChild, leading[axis]) -
                getPosition(currentAbsoluteChild, trailing[axis])
            ),
            // You never want to go smaller than padding
            getPaddingAndBorderAxis(currentAbsoluteChild, axis)
          );
        }

        if (
          isPosDefined(currentAbsoluteChild, trailing[axis]) &&
          !isPosDefined(currentAbsoluteChild, leading[axis])
        ) {
          currentAbsoluteChild.layout[leading[axis]] =
            node.layout[dim[axis]] -
            currentAbsoluteChild.layout[dim[axis]] -
            getPosition(currentAbsoluteChild, trailing[axis]);
        }
      }

      child = currentAbsoluteChild;
      currentAbsoluteChild = currentAbsoluteChild.nextAbsoluteChild;
      child.nextAbsoluteChild = null;
    }
  }

  function layoutNode(
    node: ComputedCSSNode,
    parentMaxWidth?: number,
    parentDirection?: string
  ) {
    node.shouldUpdate = true;

    let direction = node.style.direction || CSS_DIRECTION_LTR;
    let skipLayout =
      !node.isDirty &&
      node.lastLayout &&
      node.lastLayout.requestedHeight === node.layout.height &&
      node.lastLayout.requestedWidth === node.layout.width &&
      node.lastLayout.parentMaxWidth === parentMaxWidth &&
      node.lastLayout.direction === direction;

    if (skipLayout) {
      node.layout.width = node.lastLayout.width;
      node.layout.height = node.lastLayout.height;
      node.layout.top = node.lastLayout.top;
      node.layout.left = node.lastLayout.left;
    } else {
      if (!node.lastLayout) {
        node.lastLayout = {} as SupportLayout;
      }

      node.lastLayout.requestedWidth = node.layout.width;
      node.lastLayout.requestedHeight = node.layout.height;
      node.lastLayout.parentMaxWidth = parentMaxWidth!;
      node.lastLayout.direction = direction;

      // Reset child layouts
      node.children.forEach(function (child) {
        child.layout.width = undefined as unknown as number;
        child.layout.height = undefined as unknown as number;
        child.layout.top = 0;
        child.layout.left = 0;
      });

      layoutNodeImpl(node, parentMaxWidth!, parentDirection!);

      node.lastLayout.width = node.layout.width;
      node.lastLayout.height = node.layout.height;
      node.lastLayout.top = node.layout.top;
      node.lastLayout.left = node.layout.left;
    }
  }

  return {
    layoutNodeImpl,
    computeLayout: layoutNode,
    fillNodes,
  };
})();

export default function layout(
  node: CSSNode,
  parentMaxWidth?: number,
  parentDirection?: string
) {
  computeLayout.fillNodes(node as ComputedCSSNode);
  computeLayout.computeLayout(
    node as ComputedCSSNode,
    parentMaxWidth,
    parentDirection
  );
}

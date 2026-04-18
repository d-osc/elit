"use strict";
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

// src/client/style/index.ts
var index_exports = {};
__export(index_exports, {
  CreateStyle: () => CreateStyle,
  addAttribute: () => addAttribute,
  addClass: () => addClass,
  addContainer: () => addContainer,
  addId: () => addId,
  addName: () => addName,
  addPseudoClass: () => addPseudoClass,
  addPseudoElement: () => addPseudoElement,
  addStyle: () => addStyle,
  addTag: () => addTag,
  addVar: () => addVar,
  adjacentSibling: () => adjacentSibling,
  attrContains: () => attrContains,
  attrContainsWord: () => attrContainsWord,
  attrEndsWith: () => attrEndsWith,
  attrEquals: () => attrEquals,
  attrStartsWith: () => attrStartsWith,
  childStyle: () => childStyle,
  clearStyle: () => clearStyle,
  container: () => container,
  default: () => index_default,
  descendant: () => descendant,
  fontFace: () => fontFace,
  generalSibling: () => generalSibling,
  getStyleVariables: () => getStyleVariables,
  getVar: () => getVar,
  importStyle: () => importStyle,
  important: () => important,
  injectStyle: () => injectStyle,
  keyframe: () => keyframe,
  keyframeFromTo: () => keyframeFromTo,
  layer: () => layer,
  layerOrder: () => layerOrder,
  mediaDark: () => mediaDark,
  mediaLight: () => mediaLight,
  mediaMaxWidth: () => mediaMaxWidth,
  mediaMinWidth: () => mediaMinWidth,
  mediaPrint: () => mediaPrint,
  mediaReducedMotion: () => mediaReducedMotion,
  mediaScreen: () => mediaScreen,
  mediaStyle: () => mediaStyle,
  multipleStyle: () => multipleStyle,
  nesting: () => nesting,
  renderStyle: () => renderStyle,
  resolveClassStyles: () => resolveClassStyles,
  styles: () => styles,
  supportsStyle: () => supportsStyle
});
module.exports = __toCommonJS(index_exports);
var ELIT_SHARED_STYLE_STORE_KEY = "__elitSharedStyleStore__";
function createStyleStore() {
  return {
    variables: [],
    rules: [],
    mediaRules: [],
    keyframes: [],
    fontFaces: [],
    imports: [],
    containerRules: [],
    supportsRules: [],
    layerRules: [],
    layerOrder: []
  };
}
function getSharedStyleStore() {
  const globalScope = globalThis;
  if (!globalScope[ELIT_SHARED_STYLE_STORE_KEY]) {
    globalScope[ELIT_SHARED_STYLE_STORE_KEY] = createStyleStore();
  }
  return globalScope[ELIT_SHARED_STYLE_STORE_KEY];
}
var CreateStyle = class {
  constructor(store) {
    this.variables = [];
    this.rules = [];
    this.mediaRules = [];
    this.keyframes = [];
    this.fontFaces = [];
    this.imports = [];
    this.containerRules = [];
    this.supportsRules = [];
    this.layerRules = [];
    this._layerOrder = [];
    this.parsedSelectorChainCache = /* @__PURE__ */ new Map();
    if (!store) {
      return;
    }
    this.variables = store.variables;
    this.rules = store.rules;
    this.mediaRules = store.mediaRules;
    this.keyframes = store.keyframes;
    this.fontFaces = store.fontFaces;
    this.imports = store.imports;
    this.containerRules = store.containerRules;
    this.supportsRules = store.supportsRules;
    this.layerRules = store.layerRules;
    this._layerOrder = store.layerOrder;
  }
  // CSS Variables
  addVar(name, value) {
    const cssVar = {
      name: name.startsWith("--") ? name : `--${name}`,
      value,
      toString() {
        return `var(${this.name})`;
      }
    };
    this.variables.push(cssVar);
    return cssVar;
  }
  var(variable, fallback) {
    const varName = typeof variable === "string" ? variable.startsWith("--") ? variable : `--${variable}` : variable.name;
    return fallback ? `var(${varName}, ${fallback})` : `var(${varName})`;
  }
  // Basic Selectors
  addTag(tag, styles2) {
    const rule = { selector: tag, styles: styles2, type: "tag" };
    this.rules.push(rule);
    return rule;
  }
  addClass(name, styles2) {
    const selector = name.startsWith(".") ? name : `.${name}`;
    const rule = { selector, styles: styles2, type: "class" };
    this.rules.push(rule);
    return rule;
  }
  addId(name, styles2) {
    const selector = name.startsWith("#") ? name : `#${name}`;
    const rule = { selector, styles: styles2, type: "id" };
    this.rules.push(rule);
    return rule;
  }
  // Pseudo Selectors
  addPseudoClass(pseudo, styles2, baseSelector) {
    const pseudoClass = pseudo.startsWith(":") ? pseudo : `:${pseudo}`;
    const selector = baseSelector ? `${baseSelector}${pseudoClass}` : pseudoClass;
    const rule = { selector, styles: styles2, type: "pseudo-class" };
    this.rules.push(rule);
    return rule;
  }
  addPseudoElement(pseudo, styles2, baseSelector) {
    const pseudoElement = pseudo.startsWith("::") ? pseudo : `::${pseudo}`;
    const selector = baseSelector ? `${baseSelector}${pseudoElement}` : pseudoElement;
    const rule = { selector, styles: styles2, type: "pseudo-element" };
    this.rules.push(rule);
    return rule;
  }
  // Attribute Selectors
  addAttribute(attr, styles2, baseSelector) {
    const attrSelector = attr.startsWith("[") ? attr : `[${attr}]`;
    const selector = baseSelector ? `${baseSelector}${attrSelector}` : attrSelector;
    const rule = { selector, styles: styles2, type: "attribute" };
    this.rules.push(rule);
    return rule;
  }
  attrEquals(attr, value, styles2, baseSelector) {
    return this.addAttribute(`${attr}="${value}"`, styles2, baseSelector);
  }
  attrContainsWord(attr, value, styles2, baseSelector) {
    return this.addAttribute(`${attr}~="${value}"`, styles2, baseSelector);
  }
  attrStartsWith(attr, value, styles2, baseSelector) {
    return this.addAttribute(`${attr}^="${value}"`, styles2, baseSelector);
  }
  attrEndsWith(attr, value, styles2, baseSelector) {
    return this.addAttribute(`${attr}$="${value}"`, styles2, baseSelector);
  }
  attrContains(attr, value, styles2, baseSelector) {
    return this.addAttribute(`${attr}*="${value}"`, styles2, baseSelector);
  }
  // Combinator Selectors
  descendant(ancestor, descendant2, styles2) {
    return this.createAndAddRule(`${ancestor} ${descendant2}`, styles2);
  }
  child(parent, childSel, styles2) {
    return this.createAndAddRule(`${parent} > ${childSel}`, styles2);
  }
  adjacentSibling(element, sibling, styles2) {
    return this.createAndAddRule(`${element} + ${sibling}`, styles2);
  }
  generalSibling(element, sibling, styles2) {
    return this.createAndAddRule(`${element} ~ ${sibling}`, styles2);
  }
  multiple(selectors, styles2) {
    return this.createAndAddRule(selectors.join(", "), styles2);
  }
  // Nesting (BEM-style)
  addName(name, styles2) {
    const selector = name.startsWith("--") ? `&${name}` : `&--${name}`;
    const rule = { selector, styles: styles2, type: "name" };
    return rule;
  }
  nesting(parentRule, ...childRules) {
    parentRule.nested = childRules;
    return parentRule;
  }
  // @keyframes - Animations
  keyframe(name, steps) {
    const keyframeSteps = Object.entries(steps).map(([step, styles2]) => ({
      step: step === "from" ? "from" : step === "to" ? "to" : `${step}%`,
      styles: styles2
    }));
    const kf = { name, steps: keyframeSteps };
    this.keyframes.push(kf);
    return kf;
  }
  keyframeFromTo(name, from, to) {
    return this.keyframe(name, { from, to });
  }
  // @font-face - Custom Fonts
  fontFace(options) {
    this.fontFaces.push(options);
    return options;
  }
  // @import - Import Stylesheets
  import(url, mediaQuery) {
    const importRule = mediaQuery ? `@import url("${url}") ${mediaQuery};` : `@import url("${url}");`;
    this.imports.push(importRule);
    return importRule;
  }
  // @media - Media Queries
  media(type, condition, rules) {
    const mediaRule = { type, condition, rules: this.rulesToCSSRules(rules) };
    this.mediaRules.push(mediaRule);
    return mediaRule;
  }
  mediaScreen(condition, rules) {
    return this.media("screen", condition, rules);
  }
  mediaPrint(rules) {
    return this.media("print", "", rules);
  }
  mediaMinWidth(minWidth, rules) {
    return this.media("screen", `min-width: ${minWidth}`, rules);
  }
  mediaMaxWidth(maxWidth, rules) {
    return this.media("screen", `max-width: ${maxWidth}`, rules);
  }
  mediaDark(rules) {
    const mediaRule = { type: "", condition: "prefers-color-scheme: dark", rules: this.rulesToCSSRules(rules) };
    this.mediaRules.push(mediaRule);
    return mediaRule;
  }
  mediaLight(rules) {
    const mediaRule = { type: "", condition: "prefers-color-scheme: light", rules: this.rulesToCSSRules(rules) };
    this.mediaRules.push(mediaRule);
    return mediaRule;
  }
  mediaReducedMotion(rules) {
    const mediaRule = { type: "", condition: "prefers-reduced-motion: reduce", rules: this.rulesToCSSRules(rules) };
    this.mediaRules.push(mediaRule);
    return mediaRule;
  }
  // @container - Container Queries
  container(condition, rules, name) {
    const containerRule = { name, condition, rules: this.rulesToCSSRules(rules) };
    this.containerRules.push(containerRule);
    return containerRule;
  }
  addContainer(name, styles2) {
    const containerStyles = { ...styles2, containerName: name };
    return this.addClass(name, containerStyles);
  }
  // @supports - Feature Queries
  supports(condition, rules) {
    const supportsRule = { condition, rules: this.rulesToCSSRules(rules) };
    this.supportsRules.push(supportsRule);
    return supportsRule;
  }
  // @layer - Cascade Layers
  layerOrder(...layers) {
    this._layerOrder = layers;
  }
  layer(name, rules) {
    const layerRule = { name, rules: this.rulesToCSSRules(rules) };
    this.layerRules.push(layerRule);
    return layerRule;
  }
  // Custom Rules
  add(rules) {
    const cssRules = Object.entries(rules).map(([selector, styles2]) => {
      const rule = { selector, styles: styles2, type: "custom" };
      this.rules.push(rule);
      return rule;
    });
    return cssRules;
  }
  important(value) {
    return `${value} !important`;
  }
  getVariables() {
    return Object.fromEntries(this.variables.map((variable) => [variable.name, variable.value]));
  }
  resolveVariableReferences(value, variables) {
    let resolved = value;
    for (let index = 0; index < 8; index++) {
      let replaced = false;
      resolved = resolved.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^\)]+))?\)/g, (match, name, fallback) => {
        const variableValue = variables[name];
        if (variableValue !== void 0) {
          replaced = true;
          return variableValue;
        }
        if (fallback !== void 0) {
          replaced = true;
          return fallback.trim();
        }
        return match;
      });
      if (!replaced) {
        break;
      }
    }
    return resolved.replace(/\s*!important\s*$/i, "").trim();
  }
  normalizeTargetIdentity(target) {
    return {
      tagName: typeof target.tagName === "string" && target.tagName.trim() ? target.tagName.trim().toLowerCase() : void 0,
      classNames: Array.isArray(target.classNames) ? target.classNames.map((className) => className.trim()).filter(Boolean) : [],
      attributes: target.attributes ? Object.fromEntries(
        Object.entries(target.attributes).filter(([, value]) => value !== void 0 && value !== null && value !== false).map(([name, value]) => [name.toLowerCase(), String(value)])
      ) : {},
      pseudoStates: Array.isArray(target.pseudoStates) ? [...new Set(target.pseudoStates.map((pseudoState) => pseudoState.trim().toLowerCase()).filter(Boolean))] : [],
      childIndex: typeof target.childIndex === "number" && Number.isFinite(target.childIndex) ? target.childIndex : void 0,
      siblingCount: typeof target.siblingCount === "number" && Number.isFinite(target.siblingCount) ? target.siblingCount : void 0,
      sameTypeIndex: typeof target.sameTypeIndex === "number" && Number.isFinite(target.sameTypeIndex) ? target.sameTypeIndex : void 0,
      sameTypeCount: typeof target.sameTypeCount === "number" && Number.isFinite(target.sameTypeCount) ? target.sameTypeCount : void 0,
      containerNames: Array.isArray(target.containerNames) ? [...new Set(target.containerNames.map((containerName) => containerName.trim().toLowerCase()).filter(Boolean))] : [],
      containerWidth: typeof target.containerWidth === "number" && Number.isFinite(target.containerWidth) ? target.containerWidth : void 0,
      isContainer: target.isContainer === true,
      isScopeReference: target.isScopeReference === true
    };
  }
  normalizeTarget(target) {
    const cached = this.nativeTargetNormalizationCache?.get(target);
    if (cached) {
      return cached;
    }
    const normalized = {
      ...this.normalizeTargetIdentity(target),
      previousSiblings: [],
      nextSiblings: [],
      children: []
    };
    this.nativeTargetNormalizationCache?.set(target, normalized);
    normalized.previousSiblings = Array.isArray(target.previousSiblings) ? target.previousSiblings.map((sibling) => this.normalizeTarget(sibling)) : [];
    normalized.nextSiblings = Array.isArray(target.nextSiblings) ? target.nextSiblings.map((sibling) => this.normalizeTarget(sibling)) : [];
    normalized.children = Array.isArray(target.children) ? target.children.map((child) => this.normalizeTarget(child)) : [];
    return normalized;
  }
  withNativeTargetNormalizationCache(callback) {
    const previousCache = this.nativeTargetNormalizationCache;
    this.nativeTargetNormalizationCache = /* @__PURE__ */ new WeakMap();
    try {
      return callback();
    } finally {
      this.nativeTargetNormalizationCache = previousCache;
    }
  }
  splitConditionalClauses(value, operator) {
    const clauses = [];
    let token = "";
    let depth = 0;
    for (let index = 0; index < value.length; index++) {
      const char = value[index];
      if (char === "(") {
        depth += 1;
      } else if (char === ")" && depth > 0) {
        depth -= 1;
      }
      const operatorToken = ` ${operator} `;
      if (depth === 0 && value.slice(index, index + operatorToken.length).toLowerCase() === operatorToken) {
        const trimmed = token.trim();
        if (trimmed) {
          clauses.push(trimmed);
        }
        token = "";
        index += operatorToken.length - 1;
        continue;
      }
      token += char;
    }
    const trailing = token.trim();
    if (trailing) {
      clauses.push(trailing);
    }
    return clauses;
  }
  splitSelectorList(value) {
    const selectors = [];
    let token = "";
    let attributeDepth = 0;
    let parenthesisDepth = 0;
    let quoted;
    for (let index = 0; index < value.length; index++) {
      const char = value[index];
      if (quoted) {
        token += char;
        if (char === quoted && value[index - 1] !== "\\") {
          quoted = void 0;
        }
        continue;
      }
      if (char === '"' || char === "'") {
        quoted = char;
        token += char;
        continue;
      }
      if (char === "[") {
        attributeDepth += 1;
        token += char;
        continue;
      }
      if (char === "]" && attributeDepth > 0) {
        attributeDepth -= 1;
        token += char;
        continue;
      }
      if (attributeDepth === 0 && char === "(") {
        parenthesisDepth += 1;
        token += char;
        continue;
      }
      if (attributeDepth === 0 && char === ")" && parenthesisDepth > 0) {
        parenthesisDepth -= 1;
        token += char;
        continue;
      }
      if (attributeDepth === 0 && parenthesisDepth === 0 && char === ",") {
        const trimmed = token.trim();
        if (trimmed) {
          selectors.push(trimmed);
        }
        token = "";
        continue;
      }
      token += char;
    }
    const trailing = token.trim();
    if (trailing) {
      selectors.push(trailing);
    }
    return selectors;
  }
  parsePseudoSelectorToken(token, startIndex) {
    if (token[startIndex] !== ":" || token[startIndex + 1] === ":") {
      return void 0;
    }
    let cursor = startIndex + 1;
    const nameMatch = token.slice(cursor).match(/^([_a-zA-Z][-_a-zA-Z0-9]*)/);
    if (!nameMatch) {
      return void 0;
    }
    const pseudoName = nameMatch[1].toLowerCase();
    cursor += nameMatch[0].length;
    if (token[cursor] !== "(") {
      return { value: pseudoName, nextIndex: cursor };
    }
    const argumentStart = cursor + 1;
    let attributeDepth = 0;
    let parenthesisDepth = 1;
    let quoted;
    cursor += 1;
    while (cursor < token.length) {
      const char = token[cursor];
      if (quoted) {
        if (char === quoted && token[cursor - 1] !== "\\") {
          quoted = void 0;
        }
        cursor += 1;
        continue;
      }
      if (char === '"' || char === "'") {
        quoted = char;
        cursor += 1;
        continue;
      }
      if (char === "[") {
        attributeDepth += 1;
        cursor += 1;
        continue;
      }
      if (char === "]" && attributeDepth > 0) {
        attributeDepth -= 1;
        cursor += 1;
        continue;
      }
      if (attributeDepth === 0 && char === "(") {
        parenthesisDepth += 1;
        cursor += 1;
        continue;
      }
      if (attributeDepth === 0 && char === ")") {
        parenthesisDepth -= 1;
        if (parenthesisDepth === 0) {
          const pseudoArgument = token.slice(argumentStart, cursor).trim();
          return {
            value: pseudoArgument.length > 0 ? `${pseudoName}(${pseudoArgument})` : `${pseudoName}()`,
            nextIndex: cursor + 1
          };
        }
        cursor += 1;
        continue;
      }
      cursor += 1;
    }
    return void 0;
  }
  matchesSupportsDeclaration(property, value) {
    const normalizedProperty = property.trim().toLowerCase();
    const normalizedValue = value.trim().toLowerCase();
    const supportedProperties = /* @__PURE__ */ new Set([
      "align-items",
      "background",
      "background-color",
      "backdrop-filter",
      "border",
      "border-radius",
      "box-shadow",
      "color",
      "column-gap",
      "container-name",
      "container-type",
      "display",
      "flex",
      "flex-direction",
      "flex-grow",
      "flex-wrap",
      "font-family",
      "font-size",
      "font-weight",
      "gap",
      "grid-template-columns",
      "height",
      "justify-content",
      "letter-spacing",
      "line-height",
      "margin",
      "margin-bottom",
      "margin-left",
      "margin-right",
      "margin-top",
      "max-height",
      "max-width",
      "min-height",
      "min-width",
      "padding",
      "padding-bottom",
      "padding-end",
      "padding-horizontal",
      "padding-left",
      "padding-right",
      "padding-start",
      "padding-top",
      "padding-vertical",
      "row-gap",
      "text-align",
      "text-decoration",
      "text-transform",
      "width"
    ]);
    if (!supportedProperties.has(normalizedProperty)) {
      return false;
    }
    if (normalizedProperty === "display") {
      return (/* @__PURE__ */ new Set(["block", "flex", "grid", "inline", "inline-block", "inline-flex", "inline-grid"])).has(normalizedValue);
    }
    if (normalizedProperty === "backdrop-filter") {
      return /blur\(/.test(normalizedValue);
    }
    if (normalizedProperty === "container-type") {
      return (/* @__PURE__ */ new Set(["inline-size", "size"])).has(normalizedValue);
    }
    return true;
  }
  matchesSupportsCondition(condition) {
    const normalized = condition.trim().replace(/^\(+|\)+$/g, "").trim();
    if (!normalized) {
      return true;
    }
    if (normalized.toLowerCase().startsWith("not ")) {
      return !this.matchesSupportsCondition(normalized.slice(4));
    }
    const orClauses = this.splitConditionalClauses(normalized, "or");
    if (orClauses.length > 1) {
      return orClauses.some((clause) => this.matchesSupportsCondition(clause));
    }
    const andClauses = this.splitConditionalClauses(normalized, "and");
    if (andClauses.length > 1) {
      return andClauses.every((clause) => this.matchesSupportsCondition(clause));
    }
    const declarationMatch = normalized.match(/^([a-z-]+)\s*:\s*(.+)$/i);
    if (!declarationMatch) {
      return false;
    }
    return this.matchesSupportsDeclaration(declarationMatch[1], declarationMatch[2]);
  }
  findMatchingContainerTarget(ancestors, name) {
    const normalizedName = typeof name === "string" && name.trim() ? name.trim().toLowerCase() : void 0;
    for (let index = ancestors.length - 1; index >= 0; index--) {
      const ancestor = ancestors[index];
      if (!ancestor?.isContainer || ancestor.containerWidth === void 0) {
        continue;
      }
      if (!normalizedName) {
        return ancestor;
      }
      if ((ancestor.containerNames ?? []).includes(normalizedName)) {
        return ancestor;
      }
    }
    return void 0;
  }
  matchesContainerCondition(condition, containerWidth) {
    const normalized = condition.trim().replace(/^\(+|\)+$/g, "").trim().toLowerCase();
    if (!normalized) {
      return true;
    }
    if (normalized.startsWith("not ")) {
      return !this.matchesContainerCondition(normalized.slice(4), containerWidth);
    }
    const orClauses = this.splitConditionalClauses(normalized, "or");
    if (orClauses.length > 1) {
      return orClauses.some((clause) => this.matchesContainerCondition(clause, containerWidth));
    }
    const andClauses = this.splitConditionalClauses(normalized, "and");
    if (andClauses.length > 1) {
      return andClauses.every((clause) => this.matchesContainerCondition(clause, containerWidth));
    }
    if (normalized.startsWith("min-width:")) {
      const minWidth = this.parseMediaLength(normalized.slice("min-width:".length));
      return minWidth !== void 0 && containerWidth >= minWidth;
    }
    if (normalized.startsWith("max-width:")) {
      const maxWidth = this.parseMediaLength(normalized.slice("max-width:".length));
      return maxWidth !== void 0 && containerWidth <= maxWidth;
    }
    return false;
  }
  parseSimpleSelectorToken(token) {
    const trimmed = token.trim();
    if (!trimmed || /[*&]/.test(trimmed)) {
      return void 0;
    }
    let cursor = 0;
    let tagName;
    let idName;
    const classNames = [];
    const attributes = [];
    const pseudoClasses = [];
    const tagMatch = trimmed.slice(cursor).match(/^([_a-zA-Z][-_a-zA-Z0-9]*)/);
    if (tagMatch) {
      tagName = tagMatch[1].toLowerCase();
      cursor += tagMatch[0].length;
    }
    while (cursor < trimmed.length) {
      const char = trimmed[cursor];
      if (char === ".") {
        const classMatch = trimmed.slice(cursor).match(/^\.([_a-zA-Z][-_a-zA-Z0-9]*)/);
        if (!classMatch) {
          return void 0;
        }
        classNames.push(classMatch[1]);
        cursor += classMatch[0].length;
        continue;
      }
      if (char === "#") {
        const idMatch = trimmed.slice(cursor).match(/^#([_a-zA-Z][-_a-zA-Z0-9]*)/);
        if (!idMatch || idName) {
          return void 0;
        }
        idName = idMatch[1];
        cursor += idMatch[0].length;
        continue;
      }
      if (char === "[") {
        const endIndex = trimmed.indexOf("]", cursor + 1);
        if (endIndex === -1) {
          return void 0;
        }
        const rawAttribute = trimmed.slice(cursor + 1, endIndex).trim();
        const attrMatch = rawAttribute.match(/^([_a-zA-Z][-_a-zA-Z0-9]*)(?:\s*(=|~=|\^=|\$=|\*=)\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?$/);
        if (!attrMatch) {
          return void 0;
        }
        attributes.push({
          name: attrMatch[1].toLowerCase(),
          operator: attrMatch[2],
          value: attrMatch[3] ?? attrMatch[4] ?? attrMatch[5]
        });
        cursor = endIndex + 1;
        continue;
      }
      if (char === ":") {
        const pseudoToken = this.parsePseudoSelectorToken(trimmed, cursor);
        if (!pseudoToken) {
          return void 0;
        }
        pseudoClasses.push(pseudoToken.value);
        cursor = pseudoToken.nextIndex;
        continue;
      }
      return void 0;
    }
    if (!tagName && !idName && classNames.length === 0 && attributes.length === 0 && pseudoClasses.length === 0) {
      return void 0;
    }
    return { tagName, idName, classNames, attributes, pseudoClasses };
  }
  extractSupportedSelectorChains(selector) {
    const cached = this.parsedSelectorChainCache.get(selector);
    if (cached) {
      return cached;
    }
    const parsedChains = this.splitSelectorList(selector).map((segment) => segment.trim()).map((segment) => {
      const chain = [];
      let token = "";
      let combinator = "descendant";
      let invalid = false;
      let attributeDepth = 0;
      let parenthesisDepth = 0;
      let quoted;
      const flushToken = () => {
        const trimmedToken = token.trim();
        token = "";
        if (!trimmedToken || invalid) {
          return;
        }
        const parsed = this.parseSimpleSelectorToken(trimmedToken);
        if (!parsed) {
          invalid = true;
          return;
        }
        if (chain.length > 0) {
          parsed.combinator = combinator;
        }
        chain.push(parsed);
        combinator = "descendant";
      };
      for (let index = 0; index < segment.length; index++) {
        const char = segment[index];
        if (quoted) {
          token += char;
          if (char === quoted && segment[index - 1] !== "\\") {
            quoted = void 0;
          }
          continue;
        }
        if (char === '"' || char === "'") {
          quoted = char;
          token += char;
          continue;
        }
        if (char === "[") {
          attributeDepth += 1;
          token += char;
          continue;
        }
        if (char === "]") {
          if (attributeDepth > 0) {
            attributeDepth -= 1;
          }
          token += char;
          continue;
        }
        if (attributeDepth === 0 && char === "(") {
          parenthesisDepth += 1;
          token += char;
          continue;
        }
        if (attributeDepth === 0 && char === ")" && parenthesisDepth > 0) {
          parenthesisDepth -= 1;
          token += char;
          continue;
        }
        if (attributeDepth === 0 && parenthesisDepth === 0 && (char === ">" || char === "+" || char === "~")) {
          flushToken();
          if (invalid) break;
          combinator = char === ">" ? "child" : char === "+" ? "adjacent-sibling" : "general-sibling";
          continue;
        }
        if (attributeDepth === 0 && parenthesisDepth === 0 && /\s/.test(char)) {
          flushToken();
          if (invalid) break;
          continue;
        }
        token += char;
      }
      flushToken();
      if (invalid || chain.length === 0) {
        return void 0;
      }
      return chain.some((part) => Boolean(part.tagName) || Boolean(part.idName) || part.classNames.length > 0 || part.attributes.length > 0 || part.pseudoClasses.length > 0) ? chain : void 0;
    }).filter((segment) => Array.isArray(segment) && segment.length > 0);
    this.parsedSelectorChainCache.set(selector, parsedChains);
    return parsedChains;
  }
  matchesAttributeSelector(targetValue, selector) {
    if (selector.operator === void 0) {
      return targetValue !== void 0;
    }
    if (targetValue === void 0 || selector.value === void 0) {
      return false;
    }
    switch (selector.operator) {
      case "=":
        return targetValue === selector.value;
      case "~=":
        return targetValue.split(/\s+/).includes(selector.value);
      case "^=":
        return targetValue.startsWith(selector.value);
      case "$=":
        return targetValue.endsWith(selector.value);
      case "*=":
        return targetValue.includes(selector.value);
      default:
        return false;
    }
  }
  matchesSelectorPart(target, selector) {
    if (selector.tagName && target.tagName !== selector.tagName) {
      return false;
    }
    const attributes = target.attributes;
    if (selector.idName && attributes?.id !== selector.idName) {
      return false;
    }
    const classSet = new Set(target.classNames ?? []);
    if (!selector.classNames.every((className) => classSet.has(className))) {
      return false;
    }
    if (!selector.attributes.every((attribute) => this.matchesAttributeSelector(attributes?.[attribute.name], attribute))) {
      return false;
    }
    return selector.pseudoClasses.every((pseudoClass) => this.matchesPseudoClass(target, pseudoClass));
  }
  matchesPseudoClass(target, pseudoClass) {
    const rawPseudoClass = pseudoClass.trim();
    const normalized = rawPseudoClass.toLowerCase();
    const pseudoStates = new Set((target.pseudoStates ?? []).map((state) => state.trim().toLowerCase()));
    if (pseudoStates.has(normalized)) {
      return true;
    }
    const functionalMatch = rawPseudoClass.match(/^([_a-zA-Z][-_a-zA-Z0-9]*)(?:\((.*)\))?$/);
    const pseudoName = functionalMatch?.[1] ?? normalized;
    const pseudoArgument = functionalMatch?.[2]?.trim();
    const attributes = target.attributes;
    switch (pseudoName) {
      case "scope":
        return target.isScopeReference === true;
      case "checked":
        return attributes?.checked !== void 0 && attributes.checked !== "false";
      case "disabled":
        return attributes?.disabled !== void 0 && attributes.disabled !== "false";
      case "selected":
        return attributes?.selected !== void 0 && attributes.selected !== "false" || attributes?.["aria-current"] !== void 0;
      case "first-child":
        return target.childIndex === 1;
      case "last-child":
        return target.childIndex !== void 0 && target.siblingCount !== void 0 && target.childIndex === target.siblingCount;
      case "only-child":
        return target.childIndex !== void 0 && target.siblingCount !== void 0 && target.siblingCount === 1;
      case "first-of-type":
        return target.sameTypeIndex === 1;
      case "last-of-type":
        return target.sameTypeIndex !== void 0 && target.sameTypeCount !== void 0 && target.sameTypeIndex === target.sameTypeCount;
      case "only-of-type":
        return target.sameTypeIndex !== void 0 && target.sameTypeCount !== void 0 && target.sameTypeCount === 1;
      case "nth-child":
        return target.childIndex !== void 0 && typeof pseudoArgument === "string" && this.matchesNthChildExpression(pseudoArgument, target.childIndex);
      case "nth-last-child":
        return target.childIndex !== void 0 && target.siblingCount !== void 0 && typeof pseudoArgument === "string" && this.matchesNthChildExpression(pseudoArgument, target.siblingCount - target.childIndex + 1);
      case "nth-of-type":
        return target.sameTypeIndex !== void 0 && typeof pseudoArgument === "string" && this.matchesNthChildExpression(pseudoArgument, target.sameTypeIndex);
      case "nth-last-of-type":
        return target.sameTypeIndex !== void 0 && target.sameTypeCount !== void 0 && typeof pseudoArgument === "string" && this.matchesNthChildExpression(pseudoArgument, target.sameTypeCount - target.sameTypeIndex + 1);
      case "has":
        return typeof pseudoArgument === "string" && this.matchesHasPseudoClass(target, pseudoArgument);
      case "not": {
        if (!pseudoArgument) {
          return false;
        }
        const selectorArguments = this.splitSelectorList(pseudoArgument);
        if (selectorArguments.length === 0) {
          return false;
        }
        const parsedSelectors = [];
        for (const selectorArgument of selectorArguments) {
          const parsedSelector = this.parseSimpleSelectorToken(selectorArgument);
          if (!parsedSelector) {
            return false;
          }
          parsedSelectors.push(parsedSelector);
        }
        return parsedSelectors.every((selectorPart) => !this.matchesSelectorPart(target, selectorPart));
      }
      default:
        return false;
    }
  }
  matchesNthChildExpression(expression, childIndex) {
    const normalized = expression.trim().toLowerCase().replace(/\s+/g, "");
    if (!normalized) {
      return false;
    }
    if (normalized === "odd") {
      return childIndex % 2 === 1;
    }
    if (normalized === "even") {
      return childIndex % 2 === 0;
    }
    if (/^[+-]?\d+$/.test(normalized)) {
      return childIndex === Number(normalized);
    }
    const patternMatch = normalized.match(/^([+-]?\d*)n(?:([+-]?\d+))?$/);
    if (!patternMatch) {
      return false;
    }
    const coefficientToken = patternMatch[1];
    const offsetToken = patternMatch[2];
    const coefficient = coefficientToken === "" || coefficientToken === "+" ? 1 : coefficientToken === "-" ? -1 : Number(coefficientToken);
    const offset = offsetToken !== void 0 ? Number(offsetToken) : 0;
    if (!Number.isFinite(coefficient) || !Number.isFinite(offset)) {
      return false;
    }
    if (coefficient === 0) {
      return childIndex === offset;
    }
    const delta = childIndex - offset;
    const step = Math.abs(coefficient);
    if (delta % step !== 0) {
      return false;
    }
    const n = delta / coefficient;
    return Number.isInteger(n) && n >= 0;
  }
  matchesHasPseudoClass(target, pseudoArgument) {
    const selectorArguments = this.splitSelectorList(pseudoArgument);
    if (selectorArguments.length === 0) {
      return false;
    }
    return selectorArguments.some((selectorArgument) => this.matchesRelativeHasSelector(target, selectorArgument));
  }
  matchesRelativeHasSelector(target, selectorArgument) {
    const trimmedSelector = selectorArgument.trim();
    if (!trimmedSelector) {
      return false;
    }
    const scopeRelativeSelector = this.toHasScopeRelativeSelector(trimmedSelector);
    if (!scopeRelativeSelector) {
      return false;
    }
    const selectorChains = this.extractSupportedSelectorChains(scopeRelativeSelector);
    if (selectorChains.length === 0) {
      return false;
    }
    const scopeTarget = this.normalizeTarget({ ...target, isScopeReference: true });
    if (trimmedSelector.startsWith("+") || trimmedSelector.startsWith("~")) {
      const scopedSiblings = this.buildScopedFollowingSiblingTargets(scopeTarget, target.nextSiblings ?? []);
      return selectorChains.some(
        (selectorChain) => scopedSiblings.some((sibling) => this.matchesSelectorChainInSubtree(sibling, [], selectorChain))
      );
    }
    return selectorChains.some(
      (selectorChain) => (target.children ?? []).some((child) => this.matchesSelectorChainInSubtree(child, [scopeTarget], selectorChain))
    );
  }
  toHasScopeRelativeSelector(selectorArgument) {
    const trimmedSelector = selectorArgument.trim();
    if (!trimmedSelector) {
      return void 0;
    }
    return trimmedSelector.startsWith(">") || trimmedSelector.startsWith("+") || trimmedSelector.startsWith("~") ? `:scope${trimmedSelector}` : `:scope ${trimmedSelector}`;
  }
  buildScopedFollowingSiblingTargets(scopeTarget, nextSiblings) {
    const scopedSiblings = [];
    for (const sibling of nextSiblings) {
      const scopedSibling = this.normalizeTarget({
        ...sibling,
        previousSiblings: [scopeTarget, ...scopedSiblings]
      });
      scopedSiblings.push(scopedSibling);
    }
    return scopedSiblings;
  }
  matchesSelectorChainInSubtree(target, ancestors, chain) {
    if (this.matchesSelectorChain(target, ancestors, chain)) {
      return true;
    }
    const nextAncestors = [...ancestors, target];
    return (target.children ?? []).some((child) => this.matchesSelectorChainInSubtree(child, nextAncestors, chain));
  }
  matchesSelectorChain(target, ancestors, chain) {
    const initialCursor = {
      target,
      ancestorIndex: ancestors.length - 1,
      previousSiblings: Array.isArray(target.previousSiblings) ? target.previousSiblings : []
    };
    return this.matchesSelectorChainFromCursor(chain, chain.length - 1, ancestors, initialCursor);
  }
  getAncestorCursor(ancestors, ancestorIndex) {
    if (ancestorIndex < 0 || ancestorIndex >= ancestors.length) {
      return void 0;
    }
    const ancestor = ancestors[ancestorIndex];
    return {
      target: ancestor,
      ancestorIndex: ancestorIndex - 1,
      previousSiblings: Array.isArray(ancestor.previousSiblings) ? ancestor.previousSiblings : []
    };
  }
  matchesSelectorChainFromCursor(chain, chainIndex, ancestors, cursor) {
    if (!this.matchesSelectorPart(cursor.target, chain[chainIndex])) {
      return false;
    }
    if (chainIndex === 0) {
      return true;
    }
    const combinator = chain[chainIndex].combinator ?? "descendant";
    switch (combinator) {
      case "child": {
        const parentCursor = this.getAncestorCursor(ancestors, cursor.ancestorIndex);
        return parentCursor ? this.matchesSelectorChainFromCursor(chain, chainIndex - 1, ancestors, parentCursor) : false;
      }
      case "adjacent-sibling": {
        const siblingIndex = cursor.previousSiblings.length - 1;
        if (siblingIndex < 0) {
          return false;
        }
        return this.matchesSelectorChainFromCursor(chain, chainIndex - 1, ancestors, {
          target: cursor.previousSiblings[siblingIndex],
          ancestorIndex: cursor.ancestorIndex,
          previousSiblings: cursor.previousSiblings.slice(0, siblingIndex)
        });
      }
      case "general-sibling": {
        for (let siblingIndex = cursor.previousSiblings.length - 1; siblingIndex >= 0; siblingIndex--) {
          if (this.matchesSelectorChainFromCursor(chain, chainIndex - 1, ancestors, {
            target: cursor.previousSiblings[siblingIndex],
            ancestorIndex: cursor.ancestorIndex,
            previousSiblings: cursor.previousSiblings.slice(0, siblingIndex)
          })) {
            return true;
          }
        }
        return false;
      }
      case "descendant":
      default: {
        for (let ancestorIndex = cursor.ancestorIndex; ancestorIndex >= 0; ancestorIndex--) {
          const ancestorCursor = this.getAncestorCursor(ancestors, ancestorIndex);
          if (ancestorCursor && this.matchesSelectorChainFromCursor(chain, chainIndex - 1, ancestors, ancestorCursor)) {
            return true;
          }
        }
        return false;
      }
    }
  }
  parseMediaLength(value) {
    const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(px|rem|em)?$/i);
    if (!match) {
      return void 0;
    }
    const numericValue = Number(match[1]);
    const unit = (match[2] ?? "px").toLowerCase();
    if (unit === "rem" || unit === "em") {
      return numericValue * 16;
    }
    return numericValue;
  }
  matchesMediaCondition(condition, options) {
    const normalized = condition.trim().replace(/^\(+|\)+$/g, "").trim().toLowerCase();
    if (!normalized) {
      return true;
    }
    if (normalized.startsWith("min-width:")) {
      const minWidth = this.parseMediaLength(normalized.slice("min-width:".length));
      return minWidth !== void 0 && options.viewportWidth !== void 0 && options.viewportWidth >= minWidth;
    }
    if (normalized.startsWith("max-width:")) {
      const maxWidth = this.parseMediaLength(normalized.slice("max-width:".length));
      return maxWidth !== void 0 && options.viewportWidth !== void 0 && options.viewportWidth <= maxWidth;
    }
    if (normalized === "prefers-color-scheme: dark") {
      return options.colorScheme === "dark";
    }
    if (normalized === "prefers-color-scheme: light") {
      return (options.colorScheme ?? "light") === "light";
    }
    if (normalized === "prefers-reduced-motion: reduce") {
      return options.reducedMotion === true;
    }
    return false;
  }
  matchesMediaRule(rule, options) {
    const mediaType = options.mediaType ?? "screen";
    if (rule.type && rule.type !== mediaType && rule.type !== "all") {
      return false;
    }
    if (!rule.condition.trim()) {
      return true;
    }
    return rule.condition.split(/\band\b/i).map((part) => part.trim()).filter(Boolean).every((part) => this.matchesMediaCondition(part, options));
  }
  getOrderedLayerNames() {
    const orderedLayerNames = [];
    for (const layerName of this._layerOrder) {
      const normalizedName = layerName.trim();
      if (normalizedName && !orderedLayerNames.includes(normalizedName)) {
        orderedLayerNames.push(normalizedName);
      }
    }
    for (const layerRule of this.layerRules) {
      const normalizedName = layerRule.name.trim();
      if (normalizedName && !orderedLayerNames.includes(normalizedName)) {
        orderedLayerNames.push(normalizedName);
      }
    }
    return orderedLayerNames;
  }
  resolveNativeStyles(target, ancestors = [], options = {}) {
    return this.withNativeTargetNormalizationCache(() => {
      const normalizedTarget = this.normalizeTarget(target);
      if (!normalizedTarget.tagName && (!normalizedTarget.classNames || normalizedTarget.classNames.length === 0)) {
        return {};
      }
      const normalizedAncestors = ancestors.map((ancestor) => this.normalizeTarget(ancestor));
      const variables = this.getVariables();
      const resolved = {};
      const applyRules = (rules) => {
        for (const rule of rules) {
          const selectorChains = this.extractSupportedSelectorChains(rule.selector);
          if (selectorChains.length === 0) {
            continue;
          }
          const matches = selectorChains.some((selectorChain) => this.matchesSelectorChain(normalizedTarget, normalizedAncestors, selectorChain));
          if (!matches) {
            continue;
          }
          for (const [property, value] of Object.entries(rule.styles)) {
            resolved[property] = typeof value === "string" ? this.resolveVariableReferences(value, variables) : value;
          }
        }
      };
      for (const layerName of this.getOrderedLayerNames()) {
        for (const layerRule of this.layerRules) {
          if (layerRule.name.trim() === layerName) {
            applyRules(layerRule.rules);
          }
        }
      }
      applyRules(this.rules);
      for (const supportsRule of this.supportsRules) {
        if (this.matchesSupportsCondition(supportsRule.condition)) {
          applyRules(supportsRule.rules);
        }
      }
      for (const containerRule of this.containerRules) {
        const matchingContainer = this.findMatchingContainerTarget(normalizedAncestors, containerRule.name);
        if (matchingContainer && this.matchesContainerCondition(containerRule.condition, matchingContainer.containerWidth)) {
          applyRules(containerRule.rules);
        }
      }
      for (const mediaRule of this.mediaRules) {
        if (this.matchesMediaRule(mediaRule, options)) {
          applyRules(mediaRule.rules);
        }
      }
      return resolved;
    });
  }
  resolveClassStyles(classNames) {
    return this.resolveNativeStyles({ classNames });
  }
  // Utility Methods
  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
  // Helper: Create and add rule (eliminates duplication in combinator selectors)
  createAndAddRule(selector, styles2, type = "custom") {
    const rule = { selector, styles: styles2, type };
    this.rules.push(rule);
    return rule;
  }
  // Helper: Convert rules object to CSSRule array (eliminates duplication in media/container/supports/layer)
  rulesToCSSRules(rules) {
    return Object.entries(rules).map(([selector, styles2]) => ({
      selector,
      styles: styles2,
      type: "custom"
    }));
  }
  // Helper: Render rules with indentation (eliminates duplication in render methods)
  renderRulesWithIndent(rules, indent = "    ") {
    return rules.map((rule) => this.renderRule(rule, indent)).join("\n");
  }
  stylesToString(styles2, indent = "    ") {
    return Object.entries(styles2).map(([prop, value]) => {
      const cssValue = typeof value === "object" && value !== null && "name" in value ? `var(${value.name})` : value;
      return `${indent}${this.toKebabCase(prop)}: ${cssValue};`;
    }).join("\n");
  }
  renderRule(rule, indent = "") {
    let css = `${indent}${rule.selector} {
${this.stylesToString(rule.styles, indent + "    ")}
`;
    if (rule.nested && rule.nested.length > 0) {
      for (const nestedRule of rule.nested) {
        const nestedSelector = nestedRule.selector.startsWith("&") ? nestedRule.selector.replace(/&/g, rule.selector) : `${rule.selector} ${nestedRule.selector}`;
        css += `
${indent}${nestedSelector} {
${this.stylesToString(nestedRule.styles, indent + "    ")}
${indent}}
`;
      }
    }
    css += `${indent}}`;
    return css;
  }
  renderMediaRule(media) {
    const condition = media.type && media.condition ? `${media.type} and (${media.condition})` : media.type ? media.type : `(${media.condition})`;
    return `@media ${condition} {
${this.renderRulesWithIndent(media.rules)}
}`;
  }
  renderKeyframes(kf) {
    let css = `@keyframes ${kf.name} {
`;
    for (const step of kf.steps) {
      css += `    ${step.step} {
${this.stylesToString(step.styles, "        ")}
    }
`;
    }
    css += "}";
    return css;
  }
  renderFontFace(ff) {
    let css = "@font-face {\n";
    css += `    font-family: "${ff.fontFamily}";
`;
    css += `    src: ${ff.src};
`;
    if (ff.fontWeight) css += `    font-weight: ${ff.fontWeight};
`;
    if (ff.fontStyle) css += `    font-style: ${ff.fontStyle};
`;
    if (ff.fontDisplay) css += `    font-display: ${ff.fontDisplay};
`;
    if (ff.unicodeRange) css += `    unicode-range: ${ff.unicodeRange};
`;
    css += "}";
    return css;
  }
  renderContainerRule(container2) {
    const nameStr = container2.name ? `${container2.name} ` : "";
    return `@container ${nameStr}(${container2.condition}) {
${this.renderRulesWithIndent(container2.rules)}
}`;
  }
  renderSupportsRule(supports) {
    return `@supports (${supports.condition}) {
${this.renderRulesWithIndent(supports.rules)}
}`;
  }
  renderLayerRule(layer2) {
    return `@layer ${layer2.name} {
${this.renderRulesWithIndent(layer2.rules)}
}`;
  }
  // Render Output
  render(...additionalRules) {
    const parts = [];
    if (this.imports.length > 0) {
      parts.push(this.imports.join("\n"));
    }
    if (this._layerOrder.length > 0) {
      parts.push(`@layer ${this._layerOrder.join(", ")};`);
    }
    if (this.variables.length > 0) {
      const varDeclarations = this.variables.map((v) => `    ${v.name}: ${v.value};`).join("\n");
      parts.push(`:root {
${varDeclarations}
}`);
    }
    for (const ff of this.fontFaces) {
      parts.push(this.renderFontFace(ff));
    }
    for (const kf of this.keyframes) {
      parts.push(this.renderKeyframes(kf));
    }
    const allRules = [...this.rules];
    const allMediaRules = [...this.mediaRules];
    const allKeyframes = [];
    const allContainerRules = [...this.containerRules];
    const allSupportsRules = [...this.supportsRules];
    const allLayerRules = [...this.layerRules];
    for (const item of additionalRules) {
      if (!item) continue;
      if (Array.isArray(item)) {
        allRules.push(...item);
      } else if ("condition" in item && "rules" in item && !("name" in item && "steps" in item)) {
        if ("type" in item) {
          allMediaRules.push(item);
        } else if ("name" in item && typeof item.name === "string") {
          allContainerRules.push(item);
        } else {
          allSupportsRules.push(item);
        }
      } else if ("name" in item && "steps" in item) {
        allKeyframes.push(item);
      } else if ("name" in item && "rules" in item) {
        allLayerRules.push(item);
      } else {
        allRules.push(item);
      }
    }
    for (const kf of allKeyframes) {
      parts.push(this.renderKeyframes(kf));
    }
    for (const layer2 of allLayerRules) {
      parts.push(this.renderLayerRule(layer2));
    }
    for (const rule of allRules) {
      parts.push(this.renderRule(rule));
    }
    for (const supports of allSupportsRules) {
      parts.push(this.renderSupportsRule(supports));
    }
    for (const container2 of allContainerRules) {
      parts.push(this.renderContainerRule(container2));
    }
    for (const media of allMediaRules) {
      parts.push(this.renderMediaRule(media));
    }
    return parts.join("\n\n");
  }
  inject(styleId) {
    const css = this.render();
    const style = document.createElement("style");
    if (styleId) style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
    return style;
  }
  clear() {
    this.variables.length = 0;
    this.rules.length = 0;
    this.mediaRules.length = 0;
    this.keyframes.length = 0;
    this.fontFaces.length = 0;
    this.imports.length = 0;
    this.containerRules.length = 0;
    this.supportsRules.length = 0;
    this.layerRules.length = 0;
    this._layerOrder.length = 0;
  }
};
var styles = new CreateStyle(getSharedStyleStore());
var {
  addVar,
  var: getVar,
  addTag,
  addClass,
  addId,
  addPseudoClass,
  addPseudoElement,
  addAttribute,
  attrEquals,
  attrContainsWord,
  attrStartsWith,
  attrEndsWith,
  attrContains,
  descendant,
  child: childStyle,
  adjacentSibling,
  generalSibling,
  multiple: multipleStyle,
  addName,
  nesting,
  keyframe,
  keyframeFromTo,
  fontFace,
  import: importStyle,
  media: mediaStyle,
  mediaScreen,
  mediaPrint,
  mediaMinWidth,
  mediaMaxWidth,
  mediaDark,
  mediaLight,
  mediaReducedMotion,
  container,
  addContainer,
  supports: supportsStyle,
  layerOrder,
  layer,
  add: addStyle,
  important,
  getVariables: getStyleVariables,
  resolveClassStyles,
  render: renderStyle,
  inject: injectStyle,
  clear: clearStyle
} = styles;
var index_default = styles;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreateStyle,
  addAttribute,
  addClass,
  addContainer,
  addId,
  addName,
  addPseudoClass,
  addPseudoElement,
  addStyle,
  addTag,
  addVar,
  adjacentSibling,
  attrContains,
  attrContainsWord,
  attrEndsWith,
  attrEquals,
  attrStartsWith,
  childStyle,
  clearStyle,
  container,
  descendant,
  fontFace,
  generalSibling,
  getStyleVariables,
  getVar,
  importStyle,
  important,
  injectStyle,
  keyframe,
  keyframeFromTo,
  layer,
  layerOrder,
  mediaDark,
  mediaLight,
  mediaMaxWidth,
  mediaMinWidth,
  mediaPrint,
  mediaReducedMotion,
  mediaScreen,
  mediaStyle,
  multipleStyle,
  nesting,
  renderStyle,
  resolveClassStyles,
  styles,
  supportsStyle
});

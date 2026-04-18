// src/shares/render-context/constants.ts
var RUNTIME_TARGET_KEY = "__ELIT_RUNTIME_TARGET__";
var CAPTURED_RENDER_KEY = "__ELIT_CAPTURED_RENDER__";
var RUNTIME_TARGET_ENV = "ELIT_RUNTIME_TARGET";

// src/shares/render-context/globals.ts
function getGlobalRenderScope() {
  return globalThis;
}

// src/shares/render-context/runtime-target.ts
function isRenderRuntimeTarget(value) {
  return value === "web" || value === "desktop" || value === "mobile" || value === "unknown";
}
function detectRenderRuntimeTarget() {
  const globalScope = getGlobalRenderScope();
  const explicitTarget = globalScope[RUNTIME_TARGET_KEY] ?? globalScope.process?.env?.[RUNTIME_TARGET_ENV];
  if (isRenderRuntimeTarget(explicitTarget)) {
    return explicitTarget;
  }
  if (typeof globalScope.document !== "undefined" && typeof globalScope.window !== "undefined") {
    return "web";
  }
  if (typeof globalScope.createWindow === "function") {
    return "desktop";
  }
  const argvValues = globalScope.process?.argv;
  const argv = Array.isArray(argvValues) ? argvValues.join(" ") : "";
  if (/\bdesktop\b/i.test(argv)) {
    return "desktop";
  }
  if (/\b(mobile|native)\b/i.test(argv)) {
    return "mobile";
  }
  return "unknown";
}

// src/shares/render-context/captured-render.ts
function captureRenderedVNode(rootElement, vNode, target = detectRenderRuntimeTarget()) {
  const globalScope = getGlobalRenderScope();
  globalScope[RUNTIME_TARGET_KEY] = target;
  globalScope[CAPTURED_RENDER_KEY] = {
    rootElement,
    target,
    vNode
  };
}

// src/client/dom/helpers.ts
function resolveElement(rootElement) {
  return typeof rootElement === "string" ? document.getElementById(rootElement.replace("#", "")) : rootElement;
}
function ensureElement(el, rootElement) {
  if (!el) {
    throw new Error(`Element not found: ${rootElement}`);
  }
  return el;
}
function shouldSkipChild(child) {
  return child == null || child === false;
}
function isPrimitiveJson(json) {
  return json == null || typeof json === "boolean" || typeof json === "string" || typeof json === "number";
}
function normalizeFormControlValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(",");
  }
  return value == null ? "" : String(value);
}
function resolveTextareaValue(tagName, props) {
  return tagName === "textarea" && props.value != null ? normalizeFormControlValue(props.value) : void 0;
}
function hasDocumentApi() {
  return typeof document !== "undefined";
}
function isState(value) {
  return value && typeof value === "object" && "value" in value && "subscribe" in value && typeof value.subscribe === "function";
}

// src/client/dom/dom-render.ts
function isSvgElement(tagName, parent) {
  return tagName === "svg" || tagName[0] === "s" && tagName[1] === "v" && tagName[2] === "g" || parent.namespaceURI === "http://www.w3.org/2000/svg";
}
function applyProps(el, props, textareaValue) {
  for (const key in props) {
    const value = props[key];
    if (value == null || value === false) continue;
    const c = key.charCodeAt(0);
    if (c === 99 && (key.length < 6 || key[5] === "N")) {
      const classValue = Array.isArray(value) ? value.join(" ") : String(value);
      if (el instanceof SVGElement) {
        el.setAttribute("class", classValue);
      } else {
        el.className = classValue;
      }
    } else if (c === 115 && key.length === 5) {
      if (typeof value === "string") {
        el.style.cssText = value;
      } else {
        const style = el.style;
        for (const styleKey in value) {
          style[styleKey] = value[styleKey];
        }
      }
    } else if (c === 111 && key.charCodeAt(1) === 110) {
      el[key.toLowerCase()] = value;
    } else if (c === 100 && key.length > 20) {
      el.innerHTML = value.__html;
    } else if (c === 114 && key === "ref") {
      setTimeout(() => {
        if (typeof value === "function") {
          value(el);
        } else {
          value.current = el;
        }
      }, 0);
    } else if (textareaValue !== void 0 && key === "value") {
      continue;
    } else {
      el.setAttribute(key, value === true ? "" : String(value));
    }
  }
}
function renderChildren(children, target) {
  const len = children.length;
  for (let i = 0; i < len; i++) {
    const child = children[i];
    if (shouldSkipChild(child)) continue;
    if (Array.isArray(child)) {
      for (let j = 0, childLen = child.length; j < childLen; j++) {
        const nestedChild = child[j];
        if (!shouldSkipChild(nestedChild)) {
          renderToDOM(nestedChild, target);
        }
      }
    } else {
      renderToDOM(child, target);
    }
  }
}
function renderToDOM(vNode, parent) {
  if (vNode == null || vNode === false) return;
  if (typeof vNode !== "object") {
    parent.appendChild(document.createTextNode(String(vNode)));
    return;
  }
  if (isState(vNode)) {
    const textNode = document.createTextNode(String(vNode.value ?? ""));
    parent.appendChild(textNode);
    vNode.subscribe((newValue) => {
      textNode.textContent = String(newValue ?? "");
    });
    return;
  }
  if (Array.isArray(vNode)) {
    for (const child of vNode) {
      renderToDOM(child, parent);
    }
    return;
  }
  const { tagName, props, children } = vNode;
  const textareaValue = resolveTextareaValue(tagName, props);
  if (!tagName) {
    renderChildren(children, parent);
    return;
  }
  const el = isSvgElement(tagName, parent) ? document.createElementNS("http://www.w3.org/2000/svg", tagName.replace("svg", "").toLowerCase() || tagName) : document.createElement(tagName);
  applyProps(el, props, textareaValue);
  const renderableChildren = textareaValue === void 0 ? children : [];
  if (!renderableChildren.length) {
    if (textareaValue !== void 0) {
      el.value = textareaValue;
    }
    parent.appendChild(el);
    return;
  }
  if (renderableChildren.length > 30) {
    const fragment = document.createDocumentFragment();
    renderChildren(renderableChildren, fragment);
    el.appendChild(fragment);
  } else {
    renderChildren(renderableChildren, el);
  }
  parent.appendChild(el);
}
function render(rootElement, vNode) {
  if (!hasDocumentApi()) {
    const runtimeTarget = detectRenderRuntimeTarget();
    if (runtimeTarget === "desktop" || runtimeTarget === "mobile") {
      captureRenderedVNode(rootElement, vNode, runtimeTarget);
      return {};
    }
    throw new Error("render() requires a DOM or an Elit desktop/mobile runtime target.");
  }
  const el = ensureElement(resolveElement(rootElement), rootElement);
  el.innerHTML = "";
  if (vNode.children && vNode.children.length > 500) {
    const fragment = document.createDocumentFragment();
    renderToDOM(vNode, fragment);
    el.appendChild(fragment);
  } else {
    renderToDOM(vNode, el);
  }
  return el;
}
function batchRender(rootElement, vNodes) {
  const el = ensureElement(resolveElement(rootElement), rootElement);
  const len = vNodes.length;
  if (len > 3e3) {
    const fragment = document.createDocumentFragment();
    let processed = 0;
    const chunkSize = 1500;
    const processChunk = () => {
      const end = Math.min(processed + chunkSize, len);
      for (let i = processed; i < end; i++) {
        renderToDOM(vNodes[i], fragment);
      }
      processed = end;
      if (processed >= len) {
        el.appendChild(fragment);
      } else {
        requestAnimationFrame(processChunk);
      }
    };
    processChunk();
  } else {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < len; i++) {
      renderToDOM(vNodes[i], fragment);
    }
    el.appendChild(fragment);
  }
  return el;
}
function renderChunked(rootElement, vNodes, chunkSize = 5e3, onProgress) {
  const el = ensureElement(resolveElement(rootElement), rootElement);
  const len = vNodes.length;
  let index = 0;
  const renderChunkFrame = () => {
    const end = Math.min(index + chunkSize, len);
    const fragment = document.createDocumentFragment();
    for (let i = index; i < end; i++) {
      renderToDOM(vNodes[i], fragment);
    }
    el.appendChild(fragment);
    index = end;
    if (onProgress) {
      onProgress(index, len);
    }
    if (index < len) {
      requestAnimationFrame(renderChunkFrame);
    }
  };
  requestAnimationFrame(renderChunkFrame);
  return el;
}
function renderToHead(...vNodes) {
  const head = document.head;
  if (head) {
    for (const vNode of vNodes.flat()) {
      if (vNode) {
        renderToDOM(vNode, head);
      }
    }
  }
  return head;
}
function addStyle(cssText) {
  const el = document.createElement("style");
  el.textContent = cssText;
  return document.head.appendChild(el);
}
function addMeta(attrs) {
  const el = document.createElement("meta");
  for (const key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
  return document.head.appendChild(el);
}
function addLink(attrs) {
  const el = document.createElement("link");
  for (const key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
  return document.head.appendChild(el);
}
function setTitle(text2) {
  return document.title = text2;
}
function cleanupUnusedElements(root, elementCache) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const toRemove = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.id && node.id.startsWith("r") && !elementCache.has(node)) {
      toRemove.push(node);
    }
  }
  toRemove.forEach((el) => el.remove());
  return toRemove.length;
}

// src/client/dom/reactive.ts
function createReactiveChild(state, reactiveNodes, renderFn) {
  const currentValue = renderFn(state.value);
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const entry = { node: null, renderFn };
    reactiveNodes.set(state, entry);
    state.subscribe(() => {
      if (entry.node && entry.node.parentNode) {
        const newValue = renderFn(state.value);
        entry.node.textContent = String(newValue ?? "");
      }
    });
  }
  return currentValue;
}

// src/client/dom/string-render.ts
var SELF_CLOSING_TAGS = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
function resolveStateValue(value) {
  return isState(value) ? value.value : value;
}
function isReactiveWrapper(vNode) {
  if (!vNode || typeof vNode !== "object" || !vNode.tagName) {
    return false;
  }
  return vNode.tagName === "span" && vNode.props?.id && typeof vNode.props.id === "string" && /^r[a-z0-9]{9}$/.test(vNode.props.id);
}
function unwrapReactive(vNode) {
  if (!isReactiveWrapper(vNode)) {
    return vNode;
  }
  const children = vNode.children;
  if (!children || children.length === 0) {
    return "";
  }
  if (children.length === 1) {
    const child = children[0];
    if (child && typeof child === "object" && child.tagName === "span") {
      const props = child.props;
      const hasNoProps = !props || Object.keys(props).length === 0;
      const hasSingleStringChild = child.children && child.children.length === 1 && typeof child.children[0] === "string";
      if (hasNoProps && hasSingleStringChild) {
        return child.children[0];
      }
    }
    return unwrapReactive(child);
  }
  return children.map((child) => unwrapReactive(child));
}
function escapeHtml(text2) {
  const htmlEscapes = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;"
  };
  return text2.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}
function isSelfClosingTag(tagName) {
  return SELF_CLOSING_TAGS.has(tagName.toLowerCase());
}
function styleToString(style) {
  if (typeof style === "string") {
    return style;
  }
  if (typeof style === "object" && style !== null) {
    const styles = [];
    for (const key in style) {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      styles.push(`${cssKey}:${style[key]}`);
    }
    return styles.join(";");
  }
  return "";
}
function propsToAttributes(props, tagName) {
  const attrs = [];
  for (const key in props) {
    if (key === "children" || key === "dangerouslySetInnerHTML" || key === "ref" || tagName === "textarea" && key === "value") {
      continue;
    }
    let value = props[key];
    value = resolveStateValue(value);
    if (value == null || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") {
      continue;
    }
    if (key === "className" || key === "class") {
      const className = Array.isArray(value) ? value.join(" ") : value;
      if (className) {
        attrs.push(`class="${escapeHtml(String(className))}"`);
      }
      continue;
    }
    if (key === "style") {
      const styleStr = styleToString(value);
      if (styleStr) {
        attrs.push(`style="${escapeHtml(styleStr)}"`);
      }
      continue;
    }
    if (value === true) {
      attrs.push(key);
      continue;
    }
    attrs.push(`${key}="${escapeHtml(String(value))}"`);
  }
  return attrs.join(" ");
}
function renderToString(vNode, options = {}) {
  const { pretty = false, indent = 0 } = options;
  const indentStr = pretty ? "  ".repeat(indent) : "";
  const newLine = pretty ? "\n" : "";
  let resolvedVNode = resolveStateValue(vNode);
  resolvedVNode = unwrapReactive(resolvedVNode);
  if (Array.isArray(resolvedVNode)) {
    return resolvedVNode.map((child) => renderToString(child, options)).join("");
  }
  if (typeof resolvedVNode !== "object" || resolvedVNode === null) {
    if (resolvedVNode === null || resolvedVNode === void 0 || resolvedVNode === false) {
      return "";
    }
    return escapeHtml(String(resolvedVNode));
  }
  const { tagName, props, children } = resolvedVNode;
  const textareaValue = resolveTextareaValue(tagName, props);
  const selfClosing = isSelfClosingTag(tagName);
  let html = `${indentStr}<${tagName}`;
  const attrs = propsToAttributes(props, tagName);
  if (attrs) {
    html += ` ${attrs}`;
  }
  if (selfClosing) {
    html += ` />${newLine}`;
    return html;
  }
  html += ">";
  if (textareaValue !== void 0) {
    html += escapeHtml(textareaValue);
    html += `</${tagName}>${newLine}`;
    return html;
  }
  if (props.dangerouslySetInnerHTML) {
    html += props.dangerouslySetInnerHTML.__html;
    html += `</${tagName}>${newLine}`;
    return html;
  }
  const isRawText = tagName === "script" || tagName === "style";
  if (children && children.length > 0) {
    const resolvedChildren = children.map((child) => unwrapReactive(resolveStateValue(child)));
    const hasComplexChildren = resolvedChildren.some(
      (child) => typeof child === "object" && child !== null && !Array.isArray(child) && "tagName" in child
    );
    if (pretty && hasComplexChildren) {
      html += newLine;
      for (const child of resolvedChildren) {
        if (shouldSkipChild(child)) continue;
        if (Array.isArray(child)) {
          for (const nestedChild of child) {
            if (!shouldSkipChild(nestedChild)) {
              html += isRawText && typeof nestedChild === "string" ? nestedChild : renderToString(nestedChild, { pretty, indent: indent + 1 });
            }
          }
        } else {
          html += isRawText && typeof child === "string" ? child : renderToString(child, { pretty, indent: indent + 1 });
        }
      }
      html += indentStr;
    } else {
      for (const child of resolvedChildren) {
        if (shouldSkipChild(child)) continue;
        if (Array.isArray(child)) {
          for (const nestedChild of child) {
            if (!shouldSkipChild(nestedChild)) {
              html += isRawText && typeof nestedChild === "string" ? nestedChild : renderToString(nestedChild, { pretty: false, indent: 0 });
            }
          }
        } else {
          html += isRawText && typeof child === "string" ? child : renderToString(child, { pretty: false, indent: 0 });
        }
      }
    }
  }
  html += `</${tagName}>${newLine}`;
  return html;
}
function renderToHTMLDocument(vNode, options = {}) {
  const {
    title = "",
    meta = [],
    links = [],
    scripts = [],
    styles = [],
    lang = "en",
    head = "",
    bodyAttrs = {},
    pretty = false
  } = options;
  const nl = pretty ? "\n" : "";
  const indent = pretty ? "  " : "";
  const indent2 = pretty ? "    " : "";
  let html = `<!DOCTYPE html>${nl}<html lang="${lang}">${nl}${indent}<head>${nl}${indent2}<meta charset="UTF-8">${nl}${indent2}<meta name="viewport" content="width=device-width, initial-scale=1.0">${nl}`;
  if (title) {
    html += `${indent2}<title>${escapeHtml(title)}</title>${nl}`;
  }
  for (const metaAttrs of meta) {
    html += `${indent2}<meta`;
    for (const key in metaAttrs) {
      html += ` ${key}="${escapeHtml(metaAttrs[key])}"`;
    }
    html += `>${nl}`;
  }
  for (const linkAttrs of links) {
    html += `${indent2}<link`;
    for (const key in linkAttrs) {
      html += ` ${key}="${escapeHtml(linkAttrs[key])}"`;
    }
    html += `>${nl}`;
  }
  for (const style of styles) {
    if (style.href) {
      html += `${indent2}<link rel="stylesheet" href="${escapeHtml(style.href)}">${nl}`;
    } else if (style.content) {
      html += `${indent2}<style>${style.content}</style>${nl}`;
    }
  }
  if (head) {
    html += head + nl;
  }
  html += `${indent}</head>${nl}${indent}<body`;
  for (const key in bodyAttrs) {
    html += ` ${key}="${escapeHtml(bodyAttrs[key])}"`;
  }
  html += `>${nl}`;
  html += renderToString(vNode, { pretty, indent: 2 });
  for (const script of scripts) {
    html += `${indent2}<script`;
    if (script.type) {
      html += ` type="${escapeHtml(script.type)}"`;
    }
    if (script.async) {
      html += " async";
    }
    if (script.defer) {
      html += " defer";
    }
    if (script.src) {
      html += ` src="${escapeHtml(script.src)}"><\/script>${nl}`;
    } else if (script.content) {
      html += `>${script.content}<\/script>${nl}`;
    } else {
      html += `><\/script>${nl}`;
    }
  }
  html += `${indent}</body>${nl}</html>`;
  return html;
}

// src/client/dom/json.ts
function jsonToVNode(json, reactiveNodes) {
  if (isState(json)) {
    return createReactiveChild(json, reactiveNodes, (value) => value);
  }
  if (isPrimitiveJson(json)) {
    return json;
  }
  const { tag, attributes = {}, children } = json;
  const props = {};
  for (const key in attributes) {
    const value = attributes[key];
    if (key === "class") {
      props.className = isState(value) ? value.value : value;
    } else {
      props[key] = isState(value) ? value.value : value;
    }
  }
  const childrenArray = [];
  if (children != null) {
    if (Array.isArray(children)) {
      for (const child of children) {
        if (isState(child)) {
          childrenArray.push(createReactiveChild(child, reactiveNodes, (value) => value));
        } else {
          const converted = jsonToVNode(child, reactiveNodes);
          if (converted != null && converted !== false) {
            childrenArray.push(converted);
          }
        }
      }
    } else if (isState(children)) {
      childrenArray.push(createReactiveChild(children, reactiveNodes, (value) => value));
    } else if (typeof children === "object" && children !== null && "tag" in children) {
      const converted = jsonToVNode(children, reactiveNodes);
      if (converted != null && converted !== false) {
        childrenArray.push(converted);
      }
    } else {
      childrenArray.push(children);
    }
  }
  return { tagName: tag, props, children: childrenArray };
}
function vNodeJsonToVNode(json, reactiveNodes) {
  if (isState(json)) {
    return createReactiveChild(json, reactiveNodes, (value) => value);
  }
  if (isPrimitiveJson(json)) {
    return json;
  }
  const { tagName, props = {}, children = [] } = json;
  const resolvedProps = {};
  for (const key in props) {
    const value = props[key];
    resolvedProps[key] = isState(value) ? value.value : value;
  }
  const childrenArray = [];
  for (const child of children) {
    if (isState(child)) {
      childrenArray.push(createReactiveChild(child, reactiveNodes, (value) => value));
    } else {
      const converted = vNodeJsonToVNode(child, reactiveNodes);
      if (converted != null && converted !== false) {
        childrenArray.push(converted);
      }
    }
  }
  return { tagName, props: resolvedProps, children: childrenArray };
}
function renderJson(rootElement, json, reactiveNodes) {
  const vNode = jsonToVNode(json, reactiveNodes);
  if (!vNode || typeof vNode !== "object" || !("tagName" in vNode)) {
    throw new Error("Invalid JSON structure");
  }
  return render(rootElement, vNode);
}
function renderVNode(rootElement, json, reactiveNodes) {
  const vNode = vNodeJsonToVNode(json, reactiveNodes);
  if (!vNode || typeof vNode !== "object" || !("tagName" in vNode)) {
    throw new Error("Invalid VNode JSON structure");
  }
  return render(rootElement, vNode);
}
function renderJsonToString(json, reactiveNodes, options = {}) {
  const vNode = jsonToVNode(json, reactiveNodes);
  return renderToString(vNode, options);
}
function renderVNodeToString(json, reactiveNodes, options = {}) {
  const vNode = vNodeJsonToVNode(json, reactiveNodes);
  return renderToString(vNode, options);
}

// src/client/dom/state-utils.ts
function createState(initialValue, options = {}) {
  let value = initialValue;
  const listeners = /* @__PURE__ */ new Set();
  let updateTimer = null;
  const { throttle: throttle2 = 0, deep = false } = options;
  const notify = () => listeners.forEach((listener) => listener(value));
  const scheduleUpdate = () => {
    if (throttle2 > 0) {
      if (!updateTimer) {
        updateTimer = setTimeout(() => {
          updateTimer = null;
          notify();
        }, throttle2);
      }
    } else {
      notify();
    }
  };
  return {
    get value() {
      return value;
    },
    set value(newValue) {
      const changed = deep ? JSON.stringify(value) !== JSON.stringify(newValue) : value !== newValue;
      if (changed) {
        value = newValue;
        scheduleUpdate();
      }
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    destroy() {
      listeners.clear();
      if (updateTimer) {
        clearTimeout(updateTimer);
      }
    }
  };
}
function computed(states, computeFn) {
  const values = states.map((state) => state.value);
  const result = createState(computeFn(...values));
  states.forEach((state, index) => {
    state.subscribe((newValue) => {
      values[index] = newValue;
      result.value = computeFn(...values);
    });
  });
  return result;
}
function effect(stateFn) {
  stateFn();
}
function createVirtualList(container, items, renderItem, itemHeight = 50, bufferSize = 5) {
  const viewportHeight = container.clientHeight;
  const totalHeight = items.length * itemHeight;
  let scrollTop = 0;
  const getVisibleRange = () => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const end = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + bufferSize);
    return { start, end };
  };
  const render3 = () => {
    const { start, end } = getVisibleRange();
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `height:${totalHeight}px;position:relative`;
    for (let i = start; i < end; i++) {
      const itemEl = document.createElement("div");
      itemEl.style.cssText = `position:absolute;top:${i * itemHeight}px;height:${itemHeight}px;width:100%`;
      renderToDOM(renderItem(items[i], i), itemEl);
      wrapper.appendChild(itemEl);
    }
    container.innerHTML = "";
    container.appendChild(wrapper);
  };
  const scrollHandler = () => {
    scrollTop = container.scrollTop;
    requestAnimationFrame(render3);
  };
  container.addEventListener("scroll", scrollHandler);
  render3();
  return {
    render: render3,
    destroy: () => {
      container.removeEventListener("scroll", scrollHandler);
      container.innerHTML = "";
    }
  };
}
function lazy(loadFn) {
  let component = null;
  let loading = false;
  return async (...args) => {
    if (!component && !loading) {
      loading = true;
      component = await loadFn();
      loading = false;
    }
    return component ? component(...args) : { tagName: "div", props: { class: "loading" }, children: ["Loading..."] };
  };
}

// src/client/dom/index.ts
var DomNode = class {
  constructor() {
    this.elementCache = /* @__PURE__ */ new WeakMap();
    this.reactiveNodes = /* @__PURE__ */ new Map();
  }
  createElement(tagName, props = {}, children = []) {
    return { tagName, props, children };
  }
  renderToDOM(vNode, parent) {
    return renderToDOM(vNode, parent);
  }
  render(rootElement, vNode) {
    return render2(rootElement, vNode);
  }
  batchRender(rootElement, vNodes) {
    return batchRender(rootElement, vNodes);
  }
  renderChunked(rootElement, vNodes, chunkSize = 5e3, onProgress) {
    return renderChunked(rootElement, vNodes, chunkSize, onProgress);
  }
  renderToHead(...vNodes) {
    return renderToHead(...vNodes);
  }
  addStyle(cssText) {
    return addStyle(cssText);
  }
  addMeta(attrs) {
    return addMeta(attrs);
  }
  addLink(attrs) {
    return addLink(attrs);
  }
  setTitle(text2) {
    return setTitle(text2);
  }
  // Reactive State Management
  createState(initialValue, options = {}) {
    return createState(initialValue, options);
  }
  computed(states, computeFn) {
    return computed(states, computeFn);
  }
  effect(stateFn) {
    effect(stateFn);
  }
  // Virtual scrolling helper for large lists
  createVirtualList(container, items, renderItem, itemHeight = 50, bufferSize = 5) {
    return createVirtualList(container, items, renderItem, itemHeight, bufferSize);
  }
  // Lazy load components
  lazy(loadFn) {
    return lazy(loadFn);
  }
  // Memory management - cleanup unused elements
  cleanupUnusedElements(root) {
    return cleanupUnusedElements(root, this.elementCache);
  }
  // Server-Side Rendering - convert VNode to HTML string
  renderToString(vNode, options = {}) {
    return renderToString2(vNode, options);
  }
  jsonToVNode(json) {
    return jsonToVNode(json, this.reactiveNodes);
  }
  vNodeJsonToVNode(json) {
    return vNodeJsonToVNode(json, this.reactiveNodes);
  }
  renderJson(rootElement, json) {
    return renderJson(rootElement, json, this.reactiveNodes);
  }
  renderVNode(rootElement, json) {
    return renderVNode(rootElement, json, this.reactiveNodes);
  }
  renderJsonToString(json, options = {}) {
    return renderJsonToString(json, this.reactiveNodes, options);
  }
  renderVNodeToString(json, options = {}) {
    return renderVNodeToString(json, this.reactiveNodes, options);
  }
  // Generate complete HTML document as string (for SSR)
  renderToHTMLDocument(vNode, options = {}) {
    return renderToHTMLDocument(vNode, options);
  }
  // Expose elementCache for reactive updates
  getElementCache() {
    return this.elementCache;
  }
};
var dom = new DomNode();
var render2 = dom.render.bind(dom);
var renderToString2 = dom.renderToString.bind(dom);

// src/client/state/core.ts
var createState2 = (initial, options) => dom.createState(initial, options);
var computed2 = (states, fn) => dom.computed(states, fn);
var effect2 = (fn) => dom.effect(fn);
var batchRender2 = (container, vNodes) => dom.batchRender(container, vNodes);
var renderChunked2 = (container, vNodes, chunkSize, onProgress) => dom.renderChunked(container, vNodes, chunkSize, onProgress);
var createVirtualList2 = (container, items, renderItem, itemHeight, bufferSize) => dom.createVirtualList(container, items, renderItem, itemHeight, bufferSize);
var lazy2 = (loadFn) => dom.lazy(loadFn);
var cleanupUnused = (root) => dom.cleanupUnusedElements(root);

// src/client/state/timing.ts
var throttle = (fn, delay) => {
  let timer = null;
  return (...args) => {
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        fn(...args);
      }, delay);
    }
  };
};
var debounce = (fn, delay) => {
  let timer = null;
  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => fn(...args), delay);
  };
};

// src/client/state/bindings.ts
var ELIT_NATIVE_BINDING = /* @__PURE__ */ Symbol.for("elit.native.binding");
function bindValue(state) {
  const props = {
    value: state.value,
    onInput: (event) => {
      const target = event.target;
      if (!target) {
        return;
      }
      if (target instanceof HTMLSelectElement && target.multiple) {
        state.value = Array.from(target.selectedOptions).map((option) => option.value);
        return;
      }
      const nextValue = typeof state.value === "number" ? Number(target.value) : target.value;
      state.value = typeof state.value === "number" && Number.isNaN(nextValue) ? state.value : nextValue;
    }
  };
  props[ELIT_NATIVE_BINDING] = {
    kind: "value",
    state
  };
  return props;
}
function bindChecked(state) {
  const props = {
    checked: state.value,
    onInput: (event) => {
      const target = event.target;
      if (!target) {
        return;
      }
      state.value = Boolean(target.checked);
    }
  };
  props[ELIT_NATIVE_BINDING] = {
    kind: "checked",
    state
  };
  return props;
}

// src/client/state/shared-state.ts
var ELIT_INTERNAL_WS_PATH = "/__elit_ws";
function resolveSharedStateWebSocketUrl(wsUrl) {
  const protocol = typeof location !== "undefined" && location.protocol === "https:" ? "wss:" : "ws:";
  const origin = typeof location !== "undefined" ? `${protocol}//${location.host}` : `${protocol}//localhost`;
  if (!wsUrl) {
    return `${origin}${ELIT_INTERNAL_WS_PATH}`;
  }
  if (/^wss?:\/\//i.test(wsUrl)) {
    const parsedUrl = new URL(wsUrl);
    if (!parsedUrl.pathname || parsedUrl.pathname === "/") {
      parsedUrl.pathname = ELIT_INTERNAL_WS_PATH;
    }
    return parsedUrl.toString();
  }
  if (wsUrl.startsWith("/")) {
    return `${origin}${wsUrl}`;
  }
  return wsUrl;
}
var SharedState = class {
  constructor(key, defaultValue, wsUrl) {
    this.key = key;
    this.wsUrl = wsUrl;
    this.ws = null;
    this.pendingUpdates = [];
    this.localState = createState2(defaultValue);
    this.previousValue = defaultValue;
    this.connect();
  }
  get value() {
    return this.localState.value;
  }
  set value(newValue) {
    this.previousValue = this.localState.value;
    this.localState.value = newValue;
    this.sendToServer(newValue);
  }
  get state() {
    return this.localState;
  }
  onChange(callback) {
    return this.localState.subscribe((newValue) => {
      const oldValue = this.previousValue;
      this.previousValue = newValue;
      callback(newValue, oldValue);
    });
  }
  update(updater) {
    this.value = updater(this.value);
  }
  connect() {
    if (typeof window === "undefined") {
      return;
    }
    const url = resolveSharedStateWebSocketUrl(this.wsUrl);
    this.ws = new WebSocket(url);
    this.ws.addEventListener("open", () => {
      this.subscribe();
      while (this.pendingUpdates.length > 0) {
        const value = this.pendingUpdates.shift();
        this.sendToServer(value);
      }
    });
    this.ws.addEventListener("message", (event) => {
      this.handleMessage(event.data);
    });
    this.ws.addEventListener("close", () => {
      setTimeout(() => this.connect(), 1e3);
    });
    this.ws.addEventListener("error", (error) => {
      console.error("[SharedState] WebSocket error:", error);
    });
  }
  subscribe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    this.ws.send(JSON.stringify({
      type: "state:subscribe",
      key: this.key
    }));
  }
  handleMessage(data) {
    try {
      const msg = JSON.parse(data);
      if (msg.key !== this.key) {
        return;
      }
      if (msg.type === "state:init" || msg.type === "state:update") {
        this.localState.value = msg.value;
      }
    } catch (error) {
    }
  }
  sendToServer(value) {
    if (!this.ws) {
      return;
    }
    if (this.ws.readyState !== WebSocket.OPEN) {
      this.pendingUpdates.push(value);
      return;
    }
    this.ws.send(JSON.stringify({
      type: "state:change",
      key: this.key,
      value
    }));
  }
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  destroy() {
    this.disconnect();
    this.localState.destroy();
  }
};
function createSharedState(key, defaultValue, wsUrl) {
  return new SharedState(key, defaultValue, wsUrl);
}
var SharedStateManager = class {
  constructor() {
    this.states = /* @__PURE__ */ new Map();
  }
  create(key, defaultValue, wsUrl) {
    if (this.states.has(key)) {
      return this.states.get(key);
    }
    const state = new SharedState(key, defaultValue, wsUrl);
    this.states.set(key, state);
    return state;
  }
  get(key) {
    return this.states.get(key);
  }
  delete(key) {
    const state = this.states.get(key);
    if (state) {
      state.destroy();
      return this.states.delete(key);
    }
    return false;
  }
  clear() {
    this.states.forEach((state) => state.destroy());
    this.states.clear();
  }
};
var sharedStateManager = new SharedStateManager();

// src/client/state/reactive-utils.ts
var scheduleRAFUpdate = (rafId, updateFn) => {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  return requestAnimationFrame(() => {
    updateFn();
  });
};
var renderToFragment = (content, isVNode) => {
  const fragment = document.createDocumentFragment();
  if (Array.isArray(content)) {
    for (const child of content) {
      dom.renderToDOM(child, fragment);
    }
  } else if (isVNode && content && typeof content === "object" && "tagName" in content) {
    const { children } = content;
    for (const child of children) {
      dom.renderToDOM(child, fragment);
    }
  } else {
    dom.renderToDOM(content, fragment);
  }
  return fragment;
};
var updateElementProps = (element, props) => {
  for (const key in props) {
    const value = props[key];
    if (key === "ref") {
      continue;
    }
    if (key === "class" || key === "className") {
      element.className = Array.isArray(value) ? value.join(" ") : value || "";
    } else if (key === "style" && typeof value === "object") {
      const style = element.style;
      for (const styleKey in value) {
        style[styleKey] = value[styleKey];
      }
    } else if (key.startsWith("on")) {
      element[key.toLowerCase()] = value;
    } else if (value != null && value !== false) {
      element.setAttribute(key, String(value === true ? "" : value));
    } else {
      element.removeAttribute(key);
    }
  }
};

// src/client/state/reactive.ts
var reactive = (state, renderFn) => {
  let rafId = null;
  let elementRef = null;
  let placeholder = null;
  let isInDOM = true;
  const initialResult = renderFn(state.value);
  const isVNodeResult = initialResult && typeof initialResult === "object" && "tagName" in initialResult;
  const initialIsNull = initialResult == null || initialResult === false;
  const updateElement = () => {
    if (!elementRef && !placeholder) {
      return;
    }
    const newResult = renderFn(state.value);
    const resultIsNull = newResult == null || newResult === false;
    if (resultIsNull) {
      if (isInDOM && elementRef) {
        placeholder = document.createComment("reactive");
        elementRef.parentNode?.replaceChild(placeholder, elementRef);
        isInDOM = false;
      }
    } else {
      if (!isInDOM && placeholder && elementRef) {
        placeholder.parentNode?.replaceChild(elementRef, placeholder);
        placeholder = null;
        isInDOM = true;
      }
      if (elementRef) {
        const isCurrentVNode = !!(isVNodeResult && newResult && typeof newResult === "object" && "tagName" in newResult);
        if (isCurrentVNode) {
          const { props } = newResult;
          updateElementProps(elementRef, props);
        }
        const fragment = renderToFragment(newResult, isCurrentVNode);
        elementRef.textContent = "";
        elementRef.appendChild(fragment);
        dom.getElementCache().set(elementRef, true);
      }
    }
  };
  state.subscribe(() => {
    rafId = scheduleRAFUpdate(rafId, () => {
      updateElement();
      rafId = null;
    });
  });
  const refCallback = (el) => {
    elementRef = el;
    if (initialIsNull && el.parentNode) {
      placeholder = document.createComment("reactive");
      el.parentNode.replaceChild(placeholder, el);
      isInDOM = false;
    }
  };
  if (isVNodeResult) {
    const vnode = initialResult;
    return {
      tagName: vnode.tagName,
      props: { ...vnode.props, ref: refCallback },
      children: vnode.children
    };
  }
  const initialChildren = Array.isArray(initialResult) ? initialResult : [initialResult];
  return { tagName: "span", props: { ref: refCallback, style: { display: "contents" } }, children: initialChildren };
};
var reactiveAs = (tagName, state, renderFn, props = {}) => {
  let rafId = null;
  let elementRef = null;
  state.subscribe(() => {
    rafId = scheduleRAFUpdate(rafId, () => {
      if (elementRef) {
        const newResult = renderFn(state.value);
        if (newResult == null || newResult === false) {
          elementRef.style.display = "none";
          elementRef.textContent = "";
        } else {
          elementRef.style.display = "";
          const fragment = renderToFragment(newResult, false);
          elementRef.textContent = "";
          elementRef.appendChild(fragment);
        }
        dom.getElementCache().set(elementRef, true);
      }
      rafId = null;
    });
  });
  const refCallback = (el) => {
    elementRef = el;
  };
  const initialResult = renderFn(state.value);
  const initialChildren = Array.isArray(initialResult) ? initialResult : [initialResult];
  return { tagName, props: { ...props, ref: refCallback }, children: initialChildren };
};
var text = (state) => state && state.value !== void 0 ? reactive(state, (value) => ({ tagName: "span", props: {}, children: [String(value)] })) : String(state);
export {
  ELIT_NATIVE_BINDING,
  SharedState,
  batchRender2 as batchRender,
  bindChecked,
  bindValue,
  cleanupUnused,
  computed2 as computed,
  createSharedState,
  createState2 as createState,
  createVirtualList2 as createVirtualList,
  debounce,
  effect2 as effect,
  lazy2 as lazy,
  reactive,
  reactiveAs,
  renderChunked2 as renderChunked,
  sharedStateManager,
  text,
  throttle
};

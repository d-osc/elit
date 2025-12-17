/**
 * DOM utility functions - Shorthand helpers for common document operations
 */

export const doc = document;
export const el = doc.querySelector.bind(doc);
export const els = doc.querySelectorAll.bind(doc);
export const createEl = doc.createElement.bind(doc);
export const createSvgEl = doc.createElementNS.bind(doc, 'http://www.w3.org/2000/svg');
export const createMathEl = doc.createElementNS.bind(doc, 'http://www.w3.org/1998/Math/MathML');
export const fragment = doc.createDocumentFragment.bind(doc);
export const textNode = doc.createTextNode.bind(doc);
export const commentNode = doc.createComment.bind(doc);
export const elId = doc.getElementById.bind(doc);
export const elClass = doc.getElementsByClassName.bind(doc);
export const elTag = doc.getElementsByTagName.bind(doc);
export const elName = doc.getElementsByName.bind(doc);

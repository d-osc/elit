/**
 * Elit - CreateStyle CSS Generation System
 */

export interface CSSVariable {
    name: string;
    value: string;
    toString(): string;
}

export interface CSSRule {
    selector: string;
    styles: Record<string, string | number>;
    nested?: CSSRule[];
    type: 'tag' | 'class' | 'id' | 'pseudo-class' | 'pseudo-element' | 'name' | 'custom' | 'media' | 'attribute';
}

export interface MediaRule {
    type: string;
    condition: string;
    rules: CSSRule[];
}

export interface KeyframeStep {
    step: string | number;
    styles: Record<string, string | number>;
}

export interface Keyframes {
    name: string;
    steps: KeyframeStep[];
}

export interface FontFace {
    fontFamily: string;
    src: string;
    fontWeight?: string | number;
    fontStyle?: string;
    fontDisplay?: string;
    unicodeRange?: string;
}

export interface ContainerRule {
    name?: string;
    condition: string;
    rules: CSSRule[];
}

export interface SupportsRule {
    condition: string;
    rules: CSSRule[];
}

export interface LayerRule {
    name: string;
    rules: CSSRule[];
}

export interface StyleSelectorTarget {
    tagName?: string;
    classNames?: string[];
    attributes?: Record<string, string | number | boolean>;
    pseudoStates?: string[];
    previousSiblings?: StyleSelectorTarget[];
    nextSiblings?: StyleSelectorTarget[];
    children?: StyleSelectorTarget[];
    childIndex?: number;
    siblingCount?: number;
    sameTypeIndex?: number;
    sameTypeCount?: number;
    containerNames?: string[];
    containerWidth?: number;
    isContainer?: boolean;
    isScopeReference?: boolean;
}

export interface NativeStyleResolveOptions {
    viewportWidth?: number;
    viewportHeight?: number;
    colorScheme?: 'light' | 'dark';
    reducedMotion?: boolean;
    mediaType?: 'screen' | 'print' | 'all';
}

type ParsedSelectorCombinator = 'descendant' | 'child' | 'adjacent-sibling' | 'general-sibling';

interface ParsedAttributeSelector {
    name: string;
    operator?: '=' | '~=' | '^=' | '$=' | '*=';
    value?: string;
}

interface ParsedSimpleSelector {
    tagName?: string;
    idName?: string;
    classNames: string[];
    attributes: ParsedAttributeSelector[];
    pseudoClasses: string[];
    combinator?: ParsedSelectorCombinator;
}

interface ParsedSelectorCursor {
    target: StyleSelectorTarget;
    ancestorIndex: number;
    previousSiblings: StyleSelectorTarget[];
}

interface CreateStyleStore {
    variables: CSSVariable[];
    rules: CSSRule[];
    mediaRules: MediaRule[];
    keyframes: Keyframes[];
    fontFaces: FontFace[];
    imports: string[];
    containerRules: ContainerRule[];
    supportsRules: SupportsRule[];
    layerRules: LayerRule[];
    layerOrder: string[];
}

const ELIT_SHARED_STYLE_STORE_KEY = '__elitSharedStyleStore__';

function createStyleStore(): CreateStyleStore {
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
        layerOrder: [],
    };
}

function getSharedStyleStore(): CreateStyleStore {
    const globalScope = globalThis as typeof globalThis & { [ELIT_SHARED_STYLE_STORE_KEY]?: CreateStyleStore };
    if (!globalScope[ELIT_SHARED_STYLE_STORE_KEY]) {
        globalScope[ELIT_SHARED_STYLE_STORE_KEY] = createStyleStore();
    }

    return globalScope[ELIT_SHARED_STYLE_STORE_KEY]!;
}

export class CreateStyle {
    private variables: CSSVariable[] = [];
    private rules: CSSRule[] = [];
    private mediaRules: MediaRule[] = [];
    private keyframes: Keyframes[] = [];
    private fontFaces: FontFace[] = [];
    private imports: string[] = [];
    private containerRules: ContainerRule[] = [];
    private supportsRules: SupportsRule[] = [];
    private layerRules: LayerRule[] = [];
    private _layerOrder: string[] = [];
    private parsedSelectorChainCache = new Map<string, ParsedSimpleSelector[][]>();
    private nativeTargetNormalizationCache?: WeakMap<StyleSelectorTarget, StyleSelectorTarget>;

    constructor(store?: CreateStyleStore) {
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
    addVar(name: string, value: string): CSSVariable {
        const cssVar: CSSVariable = {
            name: name.startsWith('--') ? name : `--${name}`,
            value,
            toString() { return `var(${this.name})`; }
        };
        this.variables.push(cssVar);
        return cssVar;
    }

    var(variable: CSSVariable | string, fallback?: string): string {
        const varName = typeof variable === 'string'
            ? (variable.startsWith('--') ? variable : `--${variable}`)
            : variable.name;
        return fallback ? `var(${varName}, ${fallback})` : `var(${varName})`;
    }

    // Basic Selectors
    addTag(tag: string, styles: Record<string, string | number>): CSSRule {
        const rule: CSSRule = { selector: tag, styles, type: 'tag' };
        this.rules.push(rule);
        return rule;
    }

    addClass(name: string, styles: Record<string, string | number>): CSSRule {
        const selector = name.startsWith('.') ? name : `.${name}`;
        const rule: CSSRule = { selector, styles, type: 'class' };
        this.rules.push(rule);
        return rule;
    }

    addId(name: string, styles: Record<string, string | number>): CSSRule {
        const selector = name.startsWith('#') ? name : `#${name}`;
        const rule: CSSRule = { selector, styles, type: 'id' };
        this.rules.push(rule);
        return rule;
    }

    // Pseudo Selectors
    addPseudoClass(pseudo: string, styles: Record<string, string | number>, baseSelector?: string): CSSRule {
        const pseudoClass = pseudo.startsWith(':') ? pseudo : `:${pseudo}`;
        const selector = baseSelector ? `${baseSelector}${pseudoClass}` : pseudoClass;
        const rule: CSSRule = { selector, styles, type: 'pseudo-class' };
        this.rules.push(rule);
        return rule;
    }

    addPseudoElement(pseudo: string, styles: Record<string, string | number>, baseSelector?: string): CSSRule {
        const pseudoElement = pseudo.startsWith('::') ? pseudo : `::${pseudo}`;
        const selector = baseSelector ? `${baseSelector}${pseudoElement}` : pseudoElement;
        const rule: CSSRule = { selector, styles, type: 'pseudo-element' };
        this.rules.push(rule);
        return rule;
    }

    // Attribute Selectors
    addAttribute(attr: string, styles: Record<string, string | number>, baseSelector?: string): CSSRule {
        const attrSelector = attr.startsWith('[') ? attr : `[${attr}]`;
        const selector = baseSelector ? `${baseSelector}${attrSelector}` : attrSelector;
        const rule: CSSRule = { selector, styles, type: 'attribute' };
        this.rules.push(rule);
        return rule;
    }

    attrEquals(attr: string, value: string, styles: Record<string, string | number>, baseSelector?: string): CSSRule {
        return this.addAttribute(`${attr}="${value}"`, styles, baseSelector);
    }

    attrContainsWord(attr: string, value: string, styles: Record<string, string | number>, baseSelector?: string): CSSRule {
        return this.addAttribute(`${attr}~="${value}"`, styles, baseSelector);
    }

    attrStartsWith(attr: string, value: string, styles: Record<string, string | number>, baseSelector?: string): CSSRule {
        return this.addAttribute(`${attr}^="${value}"`, styles, baseSelector);
    }

    attrEndsWith(attr: string, value: string, styles: Record<string, string | number>, baseSelector?: string): CSSRule {
        return this.addAttribute(`${attr}$="${value}"`, styles, baseSelector);
    }

    attrContains(attr: string, value: string, styles: Record<string, string | number>, baseSelector?: string): CSSRule {
        return this.addAttribute(`${attr}*="${value}"`, styles, baseSelector);
    }

    // Combinator Selectors
    descendant(ancestor: string, descendant: string, styles: Record<string, string | number>): CSSRule {
        return this.createAndAddRule(`${ancestor} ${descendant}`, styles);
    }

    child(parent: string, childSel: string, styles: Record<string, string | number>): CSSRule {
        return this.createAndAddRule(`${parent} > ${childSel}`, styles);
    }

    adjacentSibling(element: string, sibling: string, styles: Record<string, string | number>): CSSRule {
        return this.createAndAddRule(`${element} + ${sibling}`, styles);
    }

    generalSibling(element: string, sibling: string, styles: Record<string, string | number>): CSSRule {
        return this.createAndAddRule(`${element} ~ ${sibling}`, styles);
    }

    multiple(selectors: string[], styles: Record<string, string | number>): CSSRule {
        return this.createAndAddRule(selectors.join(', '), styles);
    }

    // Nesting (BEM-style)
    addName(name: string, styles: Record<string, string | number>): CSSRule {
        const selector = name.startsWith('--') ? `&${name}` : `&--${name}`;
        const rule: CSSRule = { selector, styles, type: 'name' };
        return rule;
    }

    nesting(parentRule: CSSRule, ...childRules: CSSRule[]): CSSRule {
        parentRule.nested = childRules;
        return parentRule;
    }

    // @keyframes - Animations
    keyframe(name: string, steps: Record<string | number, Record<string, string | number>>): Keyframes {
        const keyframeSteps: KeyframeStep[] = Object.entries(steps).map(([step, styles]) => ({
            step: step === 'from' ? 'from' : step === 'to' ? 'to' : `${step}%`,
            styles
        }));
        const kf: Keyframes = { name, steps: keyframeSteps };
        this.keyframes.push(kf);
        return kf;
    }

    keyframeFromTo(name: string, from: Record<string, string | number>, to: Record<string, string | number>): Keyframes {
        return this.keyframe(name, { from, to });
    }

    // @font-face - Custom Fonts
    fontFace(options: FontFace): FontFace {
        this.fontFaces.push(options);
        return options;
    }

    // @import - Import Stylesheets
    import(url: string, mediaQuery?: string): string {
        const importRule = mediaQuery ? `@import url("${url}") ${mediaQuery};` : `@import url("${url}");`;
        this.imports.push(importRule);
        return importRule;
    }

    // @media - Media Queries
    media(type: string, condition: string, rules: Record<string, Record<string, string | number>>): MediaRule {
        const mediaRule: MediaRule = { type, condition, rules: this.rulesToCSSRules(rules) };
        this.mediaRules.push(mediaRule);
        return mediaRule;
    }

    mediaScreen(condition: string, rules: Record<string, Record<string, string | number>>): MediaRule {
        return this.media('screen', condition, rules);
    }

    mediaPrint(rules: Record<string, Record<string, string | number>>): MediaRule {
        return this.media('print', '', rules);
    }

    mediaMinWidth(minWidth: string, rules: Record<string, Record<string, string | number>>): MediaRule {
        return this.media('screen', `min-width: ${minWidth}`, rules);
    }

    mediaMaxWidth(maxWidth: string, rules: Record<string, Record<string, string | number>>): MediaRule {
        return this.media('screen', `max-width: ${maxWidth}`, rules);
    }

    mediaDark(rules: Record<string, Record<string, string | number>>): MediaRule {
        const mediaRule: MediaRule = { type: '', condition: 'prefers-color-scheme: dark', rules: this.rulesToCSSRules(rules) };
        this.mediaRules.push(mediaRule);
        return mediaRule;
    }

    mediaLight(rules: Record<string, Record<string, string | number>>): MediaRule {
        const mediaRule: MediaRule = { type: '', condition: 'prefers-color-scheme: light', rules: this.rulesToCSSRules(rules) };
        this.mediaRules.push(mediaRule);
        return mediaRule;
    }

    mediaReducedMotion(rules: Record<string, Record<string, string | number>>): MediaRule {
        const mediaRule: MediaRule = { type: '', condition: 'prefers-reduced-motion: reduce', rules: this.rulesToCSSRules(rules) };
        this.mediaRules.push(mediaRule);
        return mediaRule;
    }

    // @container - Container Queries
    container(condition: string, rules: Record<string, Record<string, string | number>>, name?: string): ContainerRule {
        const containerRule: ContainerRule = { name, condition, rules: this.rulesToCSSRules(rules) };
        this.containerRules.push(containerRule);
        return containerRule;
    }

    addContainer(name: string, styles: Record<string, string | number>): CSSRule {
        const containerStyles = { ...styles, containerName: name };
        return this.addClass(name, containerStyles);
    }

    // @supports - Feature Queries
    supports(condition: string, rules: Record<string, Record<string, string | number>>): SupportsRule {
        const supportsRule: SupportsRule = { condition, rules: this.rulesToCSSRules(rules) };
        this.supportsRules.push(supportsRule);
        return supportsRule;
    }

    // @layer - Cascade Layers
    layerOrder(...layers: string[]): void {
        this._layerOrder = layers;
    }

    layer(name: string, rules: Record<string, Record<string, string | number>>): LayerRule {
        const layerRule: LayerRule = { name, rules: this.rulesToCSSRules(rules) };
        this.layerRules.push(layerRule);
        return layerRule;
    }

    // Custom Rules
    add(rules: Record<string, Record<string, string | number>>): CSSRule[] {
        const cssRules: CSSRule[] = Object.entries(rules).map(([selector, styles]) => {
            const rule: CSSRule = { selector, styles, type: 'custom' };
            this.rules.push(rule);
            return rule;
        });
        return cssRules;
    }

    important(value: string | number): string {
        return `${value} !important`;
    }

    getVariables(): Record<string, string> {
        return Object.fromEntries(this.variables.map((variable) => [variable.name, variable.value]));
    }

    private resolveVariableReferences(value: string, variables: Record<string, string>): string {
        let resolved = value;

        for (let index = 0; index < 8; index++) {
            let replaced = false;
            resolved = resolved.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^\)]+))?\)/g, (match, name: string, fallback?: string) => {
                const variableValue = variables[name];
                if (variableValue !== undefined) {
                    replaced = true;
                    return variableValue;
                }

                if (fallback !== undefined) {
                    replaced = true;
                    return fallback.trim();
                }

                return match;
            });

            if (!replaced) {
                break;
            }
        }

        return resolved.replace(/\s*!important\s*$/i, '').trim();
    }

    private normalizeTargetIdentity(target: StyleSelectorTarget): StyleSelectorTarget {
        return {
            tagName: typeof target.tagName === 'string' && target.tagName.trim()
                ? target.tagName.trim().toLowerCase()
                : undefined,
            classNames: Array.isArray(target.classNames)
                ? target.classNames.map((className) => className.trim()).filter(Boolean)
                : [],
            attributes: target.attributes
                ? Object.fromEntries(
                    Object.entries(target.attributes)
                        .filter(([, value]) => value !== undefined && value !== null && value !== false)
                        .map(([name, value]) => [name.toLowerCase(), String(value)])
                )
                : {},
            pseudoStates: Array.isArray(target.pseudoStates)
                ? [...new Set(target.pseudoStates.map((pseudoState) => pseudoState.trim().toLowerCase()).filter(Boolean))]
                : [],
            childIndex: typeof target.childIndex === 'number' && Number.isFinite(target.childIndex)
                ? target.childIndex
                : undefined,
            siblingCount: typeof target.siblingCount === 'number' && Number.isFinite(target.siblingCount)
                ? target.siblingCount
                : undefined,
            sameTypeIndex: typeof target.sameTypeIndex === 'number' && Number.isFinite(target.sameTypeIndex)
                ? target.sameTypeIndex
                : undefined,
            sameTypeCount: typeof target.sameTypeCount === 'number' && Number.isFinite(target.sameTypeCount)
                ? target.sameTypeCount
                : undefined,
            containerNames: Array.isArray(target.containerNames)
                ? [...new Set(target.containerNames.map((containerName) => containerName.trim().toLowerCase()).filter(Boolean))]
                : [],
            containerWidth: typeof target.containerWidth === 'number' && Number.isFinite(target.containerWidth)
                ? target.containerWidth
                : undefined,
            isContainer: target.isContainer === true,
            isScopeReference: target.isScopeReference === true,
        };
    }

    private normalizeTarget(target: StyleSelectorTarget): StyleSelectorTarget {
        const cached = this.nativeTargetNormalizationCache?.get(target);
        if (cached) {
            return cached;
        }

        const normalized: StyleSelectorTarget = {
            ...this.normalizeTargetIdentity(target),
            previousSiblings: [],
            nextSiblings: [],
            children: [],
        };

        this.nativeTargetNormalizationCache?.set(target, normalized);

        normalized.previousSiblings = Array.isArray(target.previousSiblings)
            ? target.previousSiblings.map((sibling) => this.normalizeTarget(sibling))
            : [];
        normalized.nextSiblings = Array.isArray(target.nextSiblings)
            ? target.nextSiblings.map((sibling) => this.normalizeTarget(sibling))
            : [];
        normalized.children = Array.isArray(target.children)
            ? target.children.map((child) => this.normalizeTarget(child))
            : [];

        return normalized;
    }

    private withNativeTargetNormalizationCache<T>(callback: () => T): T {
        const previousCache = this.nativeTargetNormalizationCache;
        this.nativeTargetNormalizationCache = new WeakMap();

        try {
            return callback();
        } finally {
            this.nativeTargetNormalizationCache = previousCache;
        }
    }

    private splitConditionalClauses(value: string, operator: 'and' | 'or'): string[] {
        const clauses: string[] = [];
        let token = '';
        let depth = 0;

        for (let index = 0; index < value.length; index++) {
            const char = value[index];
            if (char === '(') {
                depth += 1;
            } else if (char === ')' && depth > 0) {
                depth -= 1;
            }

            const operatorToken = ` ${operator} `;
            if (depth === 0 && value.slice(index, index + operatorToken.length).toLowerCase() === operatorToken) {
                const trimmed = token.trim();
                if (trimmed) {
                    clauses.push(trimmed);
                }
                token = '';
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

    private splitSelectorList(value: string): string[] {
        const selectors: string[] = [];
        let token = '';
        let attributeDepth = 0;
        let parenthesisDepth = 0;
        let quoted: '"' | '\'' | undefined;

        for (let index = 0; index < value.length; index++) {
            const char = value[index];

            if (quoted) {
                token += char;
                if (char === quoted && value[index - 1] !== '\\') {
                    quoted = undefined;
                }
                continue;
            }

            if (char === '"' || char === '\'') {
                quoted = char;
                token += char;
                continue;
            }

            if (char === '[') {
                attributeDepth += 1;
                token += char;
                continue;
            }

            if (char === ']' && attributeDepth > 0) {
                attributeDepth -= 1;
                token += char;
                continue;
            }

            if (attributeDepth === 0 && char === '(') {
                parenthesisDepth += 1;
                token += char;
                continue;
            }

            if (attributeDepth === 0 && char === ')' && parenthesisDepth > 0) {
                parenthesisDepth -= 1;
                token += char;
                continue;
            }

            if (attributeDepth === 0 && parenthesisDepth === 0 && char === ',') {
                const trimmed = token.trim();
                if (trimmed) {
                    selectors.push(trimmed);
                }
                token = '';
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

    private parsePseudoSelectorToken(token: string, startIndex: number): { value: string; nextIndex: number } | undefined {
        if (token[startIndex] !== ':' || token[startIndex + 1] === ':') {
            return undefined;
        }

        let cursor = startIndex + 1;
        const nameMatch = token.slice(cursor).match(/^([_a-zA-Z][-_a-zA-Z0-9]*)/);
        if (!nameMatch) {
            return undefined;
        }

        const pseudoName = nameMatch[1].toLowerCase();
        cursor += nameMatch[0].length;

        if (token[cursor] !== '(') {
            return { value: pseudoName, nextIndex: cursor };
        }

        const argumentStart = cursor + 1;
        let attributeDepth = 0;
        let parenthesisDepth = 1;
        let quoted: '"' | '\'' | undefined;
        cursor += 1;

        while (cursor < token.length) {
            const char = token[cursor];

            if (quoted) {
                if (char === quoted && token[cursor - 1] !== '\\') {
                    quoted = undefined;
                }
                cursor += 1;
                continue;
            }

            if (char === '"' || char === '\'') {
                quoted = char;
                cursor += 1;
                continue;
            }

            if (char === '[') {
                attributeDepth += 1;
                cursor += 1;
                continue;
            }

            if (char === ']' && attributeDepth > 0) {
                attributeDepth -= 1;
                cursor += 1;
                continue;
            }

            if (attributeDepth === 0 && char === '(') {
                parenthesisDepth += 1;
                cursor += 1;
                continue;
            }

            if (attributeDepth === 0 && char === ')') {
                parenthesisDepth -= 1;
                if (parenthesisDepth === 0) {
                    const pseudoArgument = token.slice(argumentStart, cursor).trim();
                    return {
                        value: pseudoArgument.length > 0
                            ? `${pseudoName}(${pseudoArgument})`
                            : `${pseudoName}()`,
                        nextIndex: cursor + 1,
                    };
                }

                cursor += 1;
                continue;
            }

            cursor += 1;
        }

        return undefined;
    }

    private matchesSupportsDeclaration(property: string, value: string): boolean {
        const normalizedProperty = property.trim().toLowerCase();
        const normalizedValue = value.trim().toLowerCase();
        const supportedProperties = new Set([
            'align-items',
            'background',
            'background-color',
            'backdrop-filter',
            'border',
            'border-radius',
            'box-shadow',
            'color',
            'column-gap',
            'container-name',
            'container-type',
            'display',
            'flex',
            'flex-direction',
            'flex-grow',
            'flex-wrap',
            'font-family',
            'font-size',
            'font-weight',
            'gap',
            'grid-template-columns',
            'height',
            'justify-content',
            'letter-spacing',
            'line-height',
            'margin',
            'margin-bottom',
            'margin-left',
            'margin-right',
            'margin-top',
            'max-height',
            'max-width',
            'min-height',
            'min-width',
            'padding',
            'padding-bottom',
            'padding-end',
            'padding-horizontal',
            'padding-left',
            'padding-right',
            'padding-start',
            'padding-top',
            'padding-vertical',
            'row-gap',
            'text-align',
            'text-decoration',
            'text-transform',
            'width',
        ]);

        if (!supportedProperties.has(normalizedProperty)) {
            return false;
        }

        if (normalizedProperty === 'display') {
            return new Set(['block', 'flex', 'grid', 'inline', 'inline-block', 'inline-flex', 'inline-grid']).has(normalizedValue);
        }

        if (normalizedProperty === 'backdrop-filter') {
            return /blur\(/.test(normalizedValue);
        }

        if (normalizedProperty === 'container-type') {
            return new Set(['inline-size', 'size']).has(normalizedValue);
        }

        return true;
    }

    private matchesSupportsCondition(condition: string): boolean {
        const normalized = condition.trim().replace(/^\(+|\)+$/g, '').trim();
        if (!normalized) {
            return true;
        }

        if (normalized.toLowerCase().startsWith('not ')) {
            return !this.matchesSupportsCondition(normalized.slice(4));
        }

        const orClauses = this.splitConditionalClauses(normalized, 'or');
        if (orClauses.length > 1) {
            return orClauses.some((clause) => this.matchesSupportsCondition(clause));
        }

        const andClauses = this.splitConditionalClauses(normalized, 'and');
        if (andClauses.length > 1) {
            return andClauses.every((clause) => this.matchesSupportsCondition(clause));
        }

        const declarationMatch = normalized.match(/^([a-z-]+)\s*:\s*(.+)$/i);
        if (!declarationMatch) {
            return false;
        }

        return this.matchesSupportsDeclaration(declarationMatch[1], declarationMatch[2]);
    }

    private findMatchingContainerTarget(ancestors: StyleSelectorTarget[], name?: string): StyleSelectorTarget | undefined {
        const normalizedName = typeof name === 'string' && name.trim()
            ? name.trim().toLowerCase()
            : undefined;

        for (let index = ancestors.length - 1; index >= 0; index--) {
            const ancestor = ancestors[index];
            if (!ancestor?.isContainer || ancestor.containerWidth === undefined) {
                continue;
            }

            if (!normalizedName) {
                return ancestor;
            }

            if ((ancestor.containerNames ?? []).includes(normalizedName)) {
                return ancestor;
            }
        }

        return undefined;
    }

    private matchesContainerCondition(condition: string, containerWidth: number): boolean {
        const normalized = condition.trim().replace(/^\(+|\)+$/g, '').trim().toLowerCase();
        if (!normalized) {
            return true;
        }

        if (normalized.startsWith('not ')) {
            return !this.matchesContainerCondition(normalized.slice(4), containerWidth);
        }

        const orClauses = this.splitConditionalClauses(normalized, 'or');
        if (orClauses.length > 1) {
            return orClauses.some((clause) => this.matchesContainerCondition(clause, containerWidth));
        }

        const andClauses = this.splitConditionalClauses(normalized, 'and');
        if (andClauses.length > 1) {
            return andClauses.every((clause) => this.matchesContainerCondition(clause, containerWidth));
        }

        if (normalized.startsWith('min-width:')) {
            const minWidth = this.parseMediaLength(normalized.slice('min-width:'.length));
            return minWidth !== undefined && containerWidth >= minWidth;
        }

        if (normalized.startsWith('max-width:')) {
            const maxWidth = this.parseMediaLength(normalized.slice('max-width:'.length));
            return maxWidth !== undefined && containerWidth <= maxWidth;
        }

        return false;
    }

    private parseSimpleSelectorToken(token: string): ParsedSimpleSelector | undefined {
        const trimmed = token.trim();
        if (!trimmed || /[*&]/.test(trimmed)) {
            return undefined;
        }
        let cursor = 0;
        let tagName: string | undefined;
        let idName: string | undefined;
        const classNames: string[] = [];
        const attributes: ParsedAttributeSelector[] = [];
        const pseudoClasses: string[] = [];

        const tagMatch = trimmed.slice(cursor).match(/^([_a-zA-Z][-_a-zA-Z0-9]*)/);
        if (tagMatch) {
            tagName = tagMatch[1].toLowerCase();
            cursor += tagMatch[0].length;
        }

        while (cursor < trimmed.length) {
            const char = trimmed[cursor];
            if (char === '.') {
                const classMatch = trimmed.slice(cursor).match(/^\.([_a-zA-Z][-_a-zA-Z0-9]*)/);
                if (!classMatch) {
                    return undefined;
                }
                classNames.push(classMatch[1]);
                cursor += classMatch[0].length;
                continue;
            }

            if (char === '#') {
                const idMatch = trimmed.slice(cursor).match(/^#([_a-zA-Z][-_a-zA-Z0-9]*)/);
                if (!idMatch || idName) {
                    return undefined;
                }
                idName = idMatch[1];
                cursor += idMatch[0].length;
                continue;
            }

            if (char === '[') {
                const endIndex = trimmed.indexOf(']', cursor + 1);
                if (endIndex === -1) {
                    return undefined;
                }

                const rawAttribute = trimmed.slice(cursor + 1, endIndex).trim();
                const attrMatch = rawAttribute.match(/^([_a-zA-Z][-_a-zA-Z0-9]*)(?:\s*(=|~=|\^=|\$=|\*=)\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?$/);
                if (!attrMatch) {
                    return undefined;
                }

                attributes.push({
                    name: attrMatch[1].toLowerCase(),
                    operator: attrMatch[2] as ParsedAttributeSelector['operator'] | undefined,
                    value: attrMatch[3] ?? attrMatch[4] ?? attrMatch[5],
                });
                cursor = endIndex + 1;
                continue;
            }

            if (char === ':') {
                const pseudoToken = this.parsePseudoSelectorToken(trimmed, cursor);
                if (!pseudoToken) {
                    return undefined;
                }

                pseudoClasses.push(pseudoToken.value);
                cursor = pseudoToken.nextIndex;
                continue;
            }

            return undefined;
        }

        if (!tagName && !idName && classNames.length === 0 && attributes.length === 0 && pseudoClasses.length === 0) {
            return undefined;
        }

        return { tagName, idName, classNames, attributes, pseudoClasses };
    }

    private extractSupportedSelectorChains(selector: string): ParsedSimpleSelector[][] {
        const cached = this.parsedSelectorChainCache.get(selector);
        if (cached) {
            return cached;
        }

        const parsedChains = this.splitSelectorList(selector)
            .map((segment) => segment.trim())
            .map((segment) => {
                const chain: ParsedSimpleSelector[] = [];
                let token = '';
                let combinator: ParsedSelectorCombinator = 'descendant';
                let invalid = false;
                let attributeDepth = 0;
                let parenthesisDepth = 0;
                let quoted: '"' | '\'' | undefined;

                const flushToken = (): void => {
                    const trimmedToken = token.trim();
                    token = '';
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
                    combinator = 'descendant';
                };

                for (let index = 0; index < segment.length; index++) {
                    const char = segment[index];
                    if (quoted) {
                        token += char;
                        if (char === quoted && segment[index - 1] !== '\\') {
                            quoted = undefined;
                        }
                        continue;
                    }

                    if (char === '"' || char === '\'') {
                        quoted = char;
                        token += char;
                        continue;
                    }

                    if (char === '[') {
                        attributeDepth += 1;
                        token += char;
                        continue;
                    }

                    if (char === ']') {
                        if (attributeDepth > 0) {
                            attributeDepth -= 1;
                        }
                        token += char;
                        continue;
                    }

                    if (attributeDepth === 0 && char === '(') {
                        parenthesisDepth += 1;
                        token += char;
                        continue;
                    }

                    if (attributeDepth === 0 && char === ')' && parenthesisDepth > 0) {
                        parenthesisDepth -= 1;
                        token += char;
                        continue;
                    }

                    if (attributeDepth === 0 && parenthesisDepth === 0 && (char === '>' || char === '+' || char === '~')) {
                        flushToken();
                        if (invalid) break;
                        combinator = char === '>'
                            ? 'child'
                            : char === '+'
                                ? 'adjacent-sibling'
                                : 'general-sibling';
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
                    return undefined;
                }

                return chain.some((part) => Boolean(part.tagName) || Boolean(part.idName) || part.classNames.length > 0 || part.attributes.length > 0 || part.pseudoClasses.length > 0)
                    ? chain
                    : undefined;
            })
            .filter((segment): segment is ParsedSimpleSelector[] => Array.isArray(segment) && segment.length > 0);

            this.parsedSelectorChainCache.set(selector, parsedChains);
            return parsedChains;
    }

    private matchesAttributeSelector(targetValue: string | undefined, selector: ParsedAttributeSelector): boolean {
        if (selector.operator === undefined) {
            return targetValue !== undefined;
        }

        if (targetValue === undefined || selector.value === undefined) {
            return false;
        }

        switch (selector.operator) {
            case '=':
                return targetValue === selector.value;
            case '~=':
                return targetValue.split(/\s+/).includes(selector.value);
            case '^=':
                return targetValue.startsWith(selector.value);
            case '$=':
                return targetValue.endsWith(selector.value);
            case '*=':
                return targetValue.includes(selector.value);
            default:
                return false;
        }
    }

    private matchesSelectorPart(target: StyleSelectorTarget, selector: ParsedSimpleSelector): boolean {
        if (selector.tagName && target.tagName !== selector.tagName) {
            return false;
        }

        const attributes = target.attributes as Record<string, string> | undefined;
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

    private matchesPseudoClass(target: StyleSelectorTarget, pseudoClass: string): boolean {
        const rawPseudoClass = pseudoClass.trim();
        const normalized = rawPseudoClass.toLowerCase();
        const pseudoStates = new Set((target.pseudoStates ?? []).map((state) => state.trim().toLowerCase()));
        if (pseudoStates.has(normalized)) {
            return true;
        }

        const functionalMatch = rawPseudoClass.match(/^([_a-zA-Z][-_a-zA-Z0-9]*)(?:\((.*)\))?$/);
        const pseudoName = functionalMatch?.[1] ?? normalized;
        const pseudoArgument = functionalMatch?.[2]?.trim();
        const attributes = target.attributes as Record<string, string> | undefined;
        switch (pseudoName) {
            case 'scope':
                return target.isScopeReference === true;
            case 'checked':
                return attributes?.checked !== undefined && attributes.checked !== 'false';
            case 'disabled':
                return attributes?.disabled !== undefined && attributes.disabled !== 'false';
            case 'selected':
                return (attributes?.selected !== undefined && attributes.selected !== 'false') || attributes?.['aria-current'] !== undefined;
            case 'first-child':
                return target.childIndex === 1;
            case 'last-child':
                return target.childIndex !== undefined
                    && target.siblingCount !== undefined
                    && target.childIndex === target.siblingCount;
            case 'only-child':
                return target.childIndex !== undefined
                    && target.siblingCount !== undefined
                    && target.siblingCount === 1;
            case 'first-of-type':
                return target.sameTypeIndex === 1;
            case 'last-of-type':
                return target.sameTypeIndex !== undefined
                    && target.sameTypeCount !== undefined
                    && target.sameTypeIndex === target.sameTypeCount;
            case 'only-of-type':
                return target.sameTypeIndex !== undefined
                    && target.sameTypeCount !== undefined
                    && target.sameTypeCount === 1;
            case 'nth-child':
                return target.childIndex !== undefined
                    && typeof pseudoArgument === 'string'
                    && this.matchesNthChildExpression(pseudoArgument, target.childIndex);
            case 'nth-last-child':
                return target.childIndex !== undefined
                    && target.siblingCount !== undefined
                    && typeof pseudoArgument === 'string'
                    && this.matchesNthChildExpression(pseudoArgument, target.siblingCount - target.childIndex + 1);
            case 'nth-of-type':
                return target.sameTypeIndex !== undefined
                    && typeof pseudoArgument === 'string'
                    && this.matchesNthChildExpression(pseudoArgument, target.sameTypeIndex);
            case 'nth-last-of-type':
                return target.sameTypeIndex !== undefined
                    && target.sameTypeCount !== undefined
                    && typeof pseudoArgument === 'string'
                    && this.matchesNthChildExpression(pseudoArgument, target.sameTypeCount - target.sameTypeIndex + 1);
            case 'has':
                return typeof pseudoArgument === 'string'
                    && this.matchesHasPseudoClass(target, pseudoArgument);
            case 'not': {
                if (!pseudoArgument) {
                    return false;
                }

                const selectorArguments = this.splitSelectorList(pseudoArgument);
                if (selectorArguments.length === 0) {
                    return false;
                }

                const parsedSelectors: ParsedSimpleSelector[] = [];
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

    private matchesNthChildExpression(expression: string, childIndex: number): boolean {
        const normalized = expression.trim().toLowerCase().replace(/\s+/g, '');
        if (!normalized) {
            return false;
        }

        if (normalized === 'odd') {
            return childIndex % 2 === 1;
        }

        if (normalized === 'even') {
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
        const coefficient = coefficientToken === '' || coefficientToken === '+'
            ? 1
            : coefficientToken === '-'
                ? -1
                : Number(coefficientToken);
        const offset = offsetToken !== undefined ? Number(offsetToken) : 0;

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

    private matchesHasPseudoClass(target: StyleSelectorTarget, pseudoArgument: string): boolean {
        const selectorArguments = this.splitSelectorList(pseudoArgument);
        if (selectorArguments.length === 0) {
            return false;
        }

        return selectorArguments.some((selectorArgument) => this.matchesRelativeHasSelector(target, selectorArgument));
    }

    private matchesRelativeHasSelector(target: StyleSelectorTarget, selectorArgument: string): boolean {
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
        if (trimmedSelector.startsWith('+') || trimmedSelector.startsWith('~')) {
            const scopedSiblings = this.buildScopedFollowingSiblingTargets(scopeTarget, target.nextSiblings ?? []);
            return selectorChains.some((selectorChain) =>
                scopedSiblings.some((sibling) => this.matchesSelectorChainInSubtree(sibling, [], selectorChain))
            );
        }

        return selectorChains.some((selectorChain) =>
            (target.children ?? []).some((child) => this.matchesSelectorChainInSubtree(child, [scopeTarget], selectorChain))
        );
    }

    private toHasScopeRelativeSelector(selectorArgument: string): string | undefined {
        const trimmedSelector = selectorArgument.trim();
        if (!trimmedSelector) {
            return undefined;
        }

        return trimmedSelector.startsWith('>') || trimmedSelector.startsWith('+') || trimmedSelector.startsWith('~')
            ? `:scope${trimmedSelector}`
            : `:scope ${trimmedSelector}`;
    }

    private buildScopedFollowingSiblingTargets(
        scopeTarget: StyleSelectorTarget,
        nextSiblings: StyleSelectorTarget[],
    ): StyleSelectorTarget[] {
        const scopedSiblings: StyleSelectorTarget[] = [];

        for (const sibling of nextSiblings) {
            const scopedSibling = this.normalizeTarget({
                ...sibling,
                previousSiblings: [scopeTarget, ...scopedSiblings],
            });
            scopedSiblings.push(scopedSibling);
        }

        return scopedSiblings;
    }

    private matchesSelectorChainInSubtree(
        target: StyleSelectorTarget,
        ancestors: StyleSelectorTarget[],
        chain: ParsedSimpleSelector[],
    ): boolean {
        if (this.matchesSelectorChain(target, ancestors, chain)) {
            return true;
        }

        const nextAncestors = [...ancestors, target];
        return (target.children ?? []).some((child) => this.matchesSelectorChainInSubtree(child, nextAncestors, chain));
    }

    private matchesSelectorChain(
        target: StyleSelectorTarget,
        ancestors: StyleSelectorTarget[],
        chain: ParsedSimpleSelector[],
    ): boolean {
        const initialCursor: ParsedSelectorCursor = {
            target,
            ancestorIndex: ancestors.length - 1,
            previousSiblings: Array.isArray(target.previousSiblings) ? target.previousSiblings : [],
        };

        return this.matchesSelectorChainFromCursor(chain, chain.length - 1, ancestors, initialCursor);
    }

    private getAncestorCursor(ancestors: StyleSelectorTarget[], ancestorIndex: number): ParsedSelectorCursor | undefined {
        if (ancestorIndex < 0 || ancestorIndex >= ancestors.length) {
            return undefined;
        }

        const ancestor = ancestors[ancestorIndex];
        return {
            target: ancestor,
            ancestorIndex: ancestorIndex - 1,
            previousSiblings: Array.isArray(ancestor.previousSiblings) ? ancestor.previousSiblings : [],
        };
    }

    private matchesSelectorChainFromCursor(
        chain: ParsedSimpleSelector[],
        chainIndex: number,
        ancestors: StyleSelectorTarget[],
        cursor: ParsedSelectorCursor,
    ): boolean {
        if (!this.matchesSelectorPart(cursor.target, chain[chainIndex])) {
            return false;
        }

        if (chainIndex === 0) {
            return true;
        }

        const combinator = chain[chainIndex].combinator ?? 'descendant';
        switch (combinator) {
            case 'child': {
                const parentCursor = this.getAncestorCursor(ancestors, cursor.ancestorIndex);
                return parentCursor
                    ? this.matchesSelectorChainFromCursor(chain, chainIndex - 1, ancestors, parentCursor)
                    : false;
            }
            case 'adjacent-sibling': {
                const siblingIndex = cursor.previousSiblings.length - 1;
                if (siblingIndex < 0) {
                    return false;
                }

                return this.matchesSelectorChainFromCursor(chain, chainIndex - 1, ancestors, {
                    target: cursor.previousSiblings[siblingIndex],
                    ancestorIndex: cursor.ancestorIndex,
                    previousSiblings: cursor.previousSiblings.slice(0, siblingIndex),
                });
            }
            case 'general-sibling': {
                for (let siblingIndex = cursor.previousSiblings.length - 1; siblingIndex >= 0; siblingIndex--) {
                    if (this.matchesSelectorChainFromCursor(chain, chainIndex - 1, ancestors, {
                        target: cursor.previousSiblings[siblingIndex],
                        ancestorIndex: cursor.ancestorIndex,
                        previousSiblings: cursor.previousSiblings.slice(0, siblingIndex),
                    })) {
                        return true;
                    }
                }

                return false;
            }
            case 'descendant':
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

    private parseMediaLength(value: string): number | undefined {
        const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(px|rem|em)?$/i);
        if (!match) {
            return undefined;
        }

        const numericValue = Number(match[1]);
        const unit = (match[2] ?? 'px').toLowerCase();
        if (unit === 'rem' || unit === 'em') {
            return numericValue * 16;
        }

        return numericValue;
    }

    private matchesMediaCondition(condition: string, options: NativeStyleResolveOptions): boolean {
        const normalized = condition.trim().replace(/^\(+|\)+$/g, '').trim().toLowerCase();
        if (!normalized) {
            return true;
        }

        if (normalized.startsWith('min-width:')) {
            const minWidth = this.parseMediaLength(normalized.slice('min-width:'.length));
            return minWidth !== undefined && options.viewportWidth !== undefined && options.viewportWidth >= minWidth;
        }

        if (normalized.startsWith('max-width:')) {
            const maxWidth = this.parseMediaLength(normalized.slice('max-width:'.length));
            return maxWidth !== undefined && options.viewportWidth !== undefined && options.viewportWidth <= maxWidth;
        }

        if (normalized === 'prefers-color-scheme: dark') {
            return options.colorScheme === 'dark';
        }

        if (normalized === 'prefers-color-scheme: light') {
            return (options.colorScheme ?? 'light') === 'light';
        }

        if (normalized === 'prefers-reduced-motion: reduce') {
            return options.reducedMotion === true;
        }

        return false;
    }

    private matchesMediaRule(rule: MediaRule, options: NativeStyleResolveOptions): boolean {
        const mediaType = options.mediaType ?? 'screen';
        if (rule.type && rule.type !== mediaType && rule.type !== 'all') {
            return false;
        }

        if (!rule.condition.trim()) {
            return true;
        }

        return rule.condition
            .split(/\band\b/i)
            .map((part) => part.trim())
            .filter(Boolean)
            .every((part) => this.matchesMediaCondition(part, options));
    }

    private getOrderedLayerNames(): string[] {
        const orderedLayerNames: string[] = [];

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

    resolveNativeStyles(
        target: StyleSelectorTarget,
        ancestors: StyleSelectorTarget[] = [],
        options: NativeStyleResolveOptions = {},
    ): Record<string, string | number> {
        return this.withNativeTargetNormalizationCache(() => {
            const normalizedTarget = this.normalizeTarget(target);
            if (!normalizedTarget.tagName && (!normalizedTarget.classNames || normalizedTarget.classNames.length === 0)) {
                return {};
            }

            const normalizedAncestors = ancestors.map((ancestor) => this.normalizeTarget(ancestor));
            const variables = this.getVariables();
            const resolved: Record<string, string | number> = {};

            const applyRules = (rules: CSSRule[]): void => {
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
                        resolved[property] = typeof value === 'string'
                            ? this.resolveVariableReferences(value, variables)
                            : value;
                    }
                }
            }

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
                if (matchingContainer && this.matchesContainerCondition(containerRule.condition, matchingContainer.containerWidth!)) {
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

    resolveClassStyles(classNames: string[]): Record<string, string | number> {
        return this.resolveNativeStyles({ classNames });
    }

    // Utility Methods
    private toKebabCase(str: string): string {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    // Helper: Create and add rule (eliminates duplication in combinator selectors)
    private createAndAddRule(selector: string, styles: Record<string, string | number>, type: CSSRule['type'] = 'custom'): CSSRule {
        const rule: CSSRule = { selector, styles, type };
        this.rules.push(rule);
        return rule;
    }

    // Helper: Convert rules object to CSSRule array (eliminates duplication in media/container/supports/layer)
    private rulesToCSSRules(rules: Record<string, Record<string, string | number>>): CSSRule[] {
        return Object.entries(rules).map(([selector, styles]) => ({
            selector,
            styles,
            type: 'custom' as const
        }));
    }

    // Helper: Render rules with indentation (eliminates duplication in render methods)
    private renderRulesWithIndent(rules: CSSRule[], indent: string = '    '): string {
        return rules.map(rule => this.renderRule(rule, indent)).join('\n');
    }

    private stylesToString(styles: Record<string, string | number>, indent: string = '    '): string {
        return Object.entries(styles)
            .map(([prop, value]) => {
                const cssValue = typeof value === 'object' && value !== null && 'name' in value
                    ? `var(${(value as CSSVariable).name})`
                    : value;
                return `${indent}${this.toKebabCase(prop)}: ${cssValue};`;
            })
            .join('\n');
    }

    private renderRule(rule: CSSRule, indent: string = ''): string {
        let css = `${indent}${rule.selector} {\n${this.stylesToString(rule.styles, indent + '    ')}\n`;

        if (rule.nested && rule.nested.length > 0) {
            for (const nestedRule of rule.nested) {
                const nestedSelector = nestedRule.selector.startsWith('&')
                    ? nestedRule.selector.replace(/&/g, rule.selector)
                    : `${rule.selector} ${nestedRule.selector}`;
                css += `\n${indent}${nestedSelector} {\n${this.stylesToString(nestedRule.styles, indent + '    ')}\n${indent}}\n`;
            }
        }

        css += `${indent}}`;
        return css;
    }

    private renderMediaRule(media: MediaRule): string {
        const condition = media.type && media.condition
            ? `${media.type} and (${media.condition})`
            : media.type
                ? media.type
                : `(${media.condition})`;
        return `@media ${condition} {\n${this.renderRulesWithIndent(media.rules)}\n}`;
    }

    private renderKeyframes(kf: Keyframes): string {
        let css = `@keyframes ${kf.name} {\n`;
        for (const step of kf.steps) {
            css += `    ${step.step} {\n${this.stylesToString(step.styles, '        ')}\n    }\n`;
        }
        css += '}';
        return css;
    }

    private renderFontFace(ff: FontFace): string {
        let css = '@font-face {\n';
        css += `    font-family: "${ff.fontFamily}";\n`;
        css += `    src: ${ff.src};\n`;
        if (ff.fontWeight) css += `    font-weight: ${ff.fontWeight};\n`;
        if (ff.fontStyle) css += `    font-style: ${ff.fontStyle};\n`;
        if (ff.fontDisplay) css += `    font-display: ${ff.fontDisplay};\n`;
        if (ff.unicodeRange) css += `    unicode-range: ${ff.unicodeRange};\n`;
        css += '}';
        return css;
    }

    private renderContainerRule(container: ContainerRule): string {
        const nameStr = container.name ? `${container.name} ` : '';
        return `@container ${nameStr}(${container.condition}) {\n${this.renderRulesWithIndent(container.rules)}\n}`;
    }

    private renderSupportsRule(supports: SupportsRule): string {
        return `@supports (${supports.condition}) {\n${this.renderRulesWithIndent(supports.rules)}\n}`;
    }

    private renderLayerRule(layer: LayerRule): string {
        return `@layer ${layer.name} {\n${this.renderRulesWithIndent(layer.rules)}\n}`;
    }

    // Render Output
    render(...additionalRules: (CSSRule | CSSRule[] | MediaRule | Keyframes | ContainerRule | SupportsRule | LayerRule | undefined | null)[]): string {
        const parts: string[] = [];

        if (this.imports.length > 0) {
            parts.push(this.imports.join('\n'));
        }

        if (this._layerOrder.length > 0) {
            parts.push(`@layer ${this._layerOrder.join(', ')};`);
        }

        if (this.variables.length > 0) {
            const varDeclarations = this.variables
                .map(v => `    ${v.name}: ${v.value};`)
                .join('\n');
            parts.push(`:root {\n${varDeclarations}\n}`);
        }

        for (const ff of this.fontFaces) {
            parts.push(this.renderFontFace(ff));
        }

        for (const kf of this.keyframes) {
            parts.push(this.renderKeyframes(kf));
        }

        const allRules: CSSRule[] = [...this.rules];
        const allMediaRules: MediaRule[] = [...this.mediaRules];
        const allKeyframes: Keyframes[] = [];
        const allContainerRules: ContainerRule[] = [...this.containerRules];
        const allSupportsRules: SupportsRule[] = [...this.supportsRules];
        const allLayerRules: LayerRule[] = [...this.layerRules];

        for (const item of additionalRules) {
            if (!item) continue;
            if (Array.isArray(item)) {
                allRules.push(...item);
            } else if ('condition' in item && 'rules' in item && !('name' in item && 'steps' in item)) {
                if ('type' in item) {
                    allMediaRules.push(item as MediaRule);
                } else if ('name' in item && typeof (item as any).name === 'string') {
                    allContainerRules.push(item as ContainerRule);
                } else {
                    allSupportsRules.push(item as SupportsRule);
                }
            } else if ('name' in item && 'steps' in item) {
                allKeyframes.push(item as Keyframes);
            } else if ('name' in item && 'rules' in item) {
                allLayerRules.push(item as LayerRule);
            } else {
                allRules.push(item as CSSRule);
            }
        }

        for (const kf of allKeyframes) {
            parts.push(this.renderKeyframes(kf));
        }

        for (const layer of allLayerRules) {
            parts.push(this.renderLayerRule(layer));
        }

        for (const rule of allRules) {
            parts.push(this.renderRule(rule));
        }

        for (const supports of allSupportsRules) {
            parts.push(this.renderSupportsRule(supports));
        }

        for (const container of allContainerRules) {
            parts.push(this.renderContainerRule(container));
        }

        for (const media of allMediaRules) {
            parts.push(this.renderMediaRule(media));
        }

        return parts.join('\n\n');
    }

    inject(styleId?: string): HTMLStyleElement {
        const css = this.render();
        const style = document.createElement('style');
        if (styleId) style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
        return style;
    }

    clear(): void {
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
}

export const styles = new CreateStyle(getSharedStyleStore());


export const {
    addVar, var: getVar,
    addTag, addClass, addId,
    addPseudoClass, addPseudoElement, addAttribute, attrEquals, attrContainsWord, attrStartsWith, attrEndsWith, attrContains,
    descendant, child: childStyle, adjacentSibling, generalSibling, multiple: multipleStyle,
    addName, nesting,
    keyframe, keyframeFromTo,
    fontFace,
    import: importStyle,
    media: mediaStyle,
    mediaScreen, mediaPrint, mediaMinWidth, mediaMaxWidth, mediaDark, mediaLight, mediaReducedMotion,
    container, addContainer,
    supports: supportsStyle,
    layerOrder, layer,
    add: addStyle, important,
    getVariables: getStyleVariables,
    resolveClassStyles,
    render: renderStyle, inject: injectStyle, clear: clearStyle
} = styles;

export default styles;
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
    }
}

export const styles = new CreateStyle();


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
    render: renderStyle, inject: injectStyle, clear: clearStyle
} = styles;

export default styles;
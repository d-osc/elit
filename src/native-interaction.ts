import { type NativeStyleResolveOptions } from './style';
import { getNativeStyleResolveOptions, parsePlainNumericValue } from './native-units';
import { parseCssColor, toComposeColorLiteral } from './native-color';
import { isExternalDestination, resolveNativeLinkHint } from './native-link';
import { flattenTextContent, quoteKotlinString, quoteSwiftString } from './native-strings';
import { prependComposeModifierCall } from './native-canvas';
import { buildComposeTextStyleLiteralFromStyle } from './native-typography';
import type {
    NativeBindingReference,
    NativeControlEventExpressionOptions,
    NativeElementNode,
    NativeNode,
    NativePickerOption,
    NativePropValue,
} from './native-types';

const NATIVE_PATTERN_MAX_LENGTH = 500;
const REDOS_NESTED_QUANTIFIER = /\([^()]*[+*][^()]*\)[+*]/;
const IMAGE_FALLBACK_STOP_WORDS = new Set([
    'image',
    'icon',
    'public',
    'assets',
    'asset',
    'favicon',
    'svg',
    'png',
    'jpg',
    'jpeg',
    'webp',
]);

function resolveNativeInputTypeValue(sourceTag: string, props: Record<string, NativePropValue>): string | undefined {
    if (sourceTag === 'textarea') {
        return 'textarea';
    }

    if (sourceTag !== 'input') {
        return undefined;
    }

    return typeof props.type === 'string' && props.type.trim()
        ? props.type.trim().toLowerCase()
        : 'text';
}

export function isCheckboxInput(sourceTag: string, props: Record<string, NativePropValue>): boolean {
    return resolveNativeInputTypeValue(sourceTag, props) === 'checkbox';
}

export function isRangeInput(sourceTag: string, props: Record<string, NativePropValue>): boolean {
    return resolveNativeInputTypeValue(sourceTag, props) === 'range';
}

export function toNativeBoolean(value: NativePropValue | undefined): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes';
    }
    return false;
}

export function buildComposeButtonModifier(
    modifier: string,
    onClickExpression?: string,
    enabled = true,
    interactionSourceName?: string,
): string {
    if (!onClickExpression || !enabled) {
        return modifier;
    }

    return prependComposeModifierCall(
        modifier,
        interactionSourceName
            ? `clickable(interactionSource = ${interactionSourceName}, indication = LocalIndication.current) { ${onClickExpression} }`
            : `clickable { ${onClickExpression} }`,
    );
}

export function buildComposeTextInputArgsFromStyle(
    node: NativeElementNode,
    style: Record<string, NativePropValue> | undefined,
    submitActionExpression?: string,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    const args: string[] = [];
    if (style) {
        const textStyle = buildComposeTextStyleLiteralFromStyle(style, styleResolveOptions);
        if (textStyle) {
            args.push(`textStyle = ${textStyle}`);
        }

        const color = parseCssColor(style.color);
        if (color) {
            args.push(`cursorBrush = SolidColor(${toComposeColorLiteral(color)})`);
        }
    }

    if (isNativeDisabled(node)) {
        args.push('enabled = false');
    }

    if (isNativeReadOnly(node)) {
        args.push('readOnly = true');
    }

    const keyboardType = resolveComposeKeyboardType(node);
    if (keyboardType || submitActionExpression) {
        const keyboardArgs: string[] = [];
        if (keyboardType) {
            keyboardArgs.push(`keyboardType = ${keyboardType}`);
        }
        if (submitActionExpression) {
            keyboardArgs.push('imeAction = androidx.compose.ui.text.input.ImeAction.Done');
        }
        args.push(`keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(${keyboardArgs.join(', ')})`);
    }

    if (submitActionExpression) {
        args.push(`keyboardActions = androidx.compose.foundation.text.KeyboardActions(onDone = { ${submitActionExpression} })`);
    }

    if (resolveNativeTextInputType(node) === 'password') {
        args.push('visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation()');
    }

    args.push(`singleLine = ${node.sourceTag === 'textarea' ? 'false' : 'true'}`);
    if (node.sourceTag === 'textarea') {
        args.push('minLines = 4');
    }

    return args;
}

export function buildSwiftUIButtonModifiersFromStyle(
    node: NativeElementNode,
    modifiers: string[],
    style: Record<string, NativePropValue> | undefined,
): string[] {
    const interactiveModifiers = [
        ...(node.sourceTag === 'button' && isNativeDisabled(node) ? ['.disabled(true)'] : []),
        ...modifiers,
    ];
    return style ? ['.buttonStyle(.plain)', ...interactiveModifiers] : interactiveModifiers;
}

export function isNativeDisabled(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.disabled) || toNativeBoolean(node.props['aria-disabled']);
}

export function isNativeFormControl(node: NativeElementNode): boolean {
    return node.component === 'TextInput' || node.component === 'Toggle' || node.component === 'Picker' || node.component === 'Slider';
}

export function isNativeEnabled(node: NativeElementNode): boolean {
    return (node.component === 'Button' || isNativeFormControl(node)) && !isNativeDisabled(node);
}

export function isNativeChecked(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.checked) || toNativeBoolean(node.props['aria-checked']);
}

export function isNativeSelected(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.selected)
        || toNativeBoolean(node.props['aria-selected'])
        || typeof node.props['aria-current'] === 'string';
}

export function hasNativePressedAccessibilityState(node: NativeElementNode): boolean {
    return node.props['aria-pressed'] !== undefined;
}

export function isNativePressed(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props['aria-pressed'])
        || toNativeBoolean(node.props.pressed)
        || toNativeBoolean(node.props.active);
}

export function isNativeActive(node: NativeElementNode): boolean {
    return !isNativeDisabled(node) && isNativePressed(node);
}

export function isNativeRequired(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.required) || toNativeBoolean(node.props['aria-required']);
}

export function isNativeMultiple(node: NativeElementNode): boolean {
    return node.component === 'Picker' && toNativeBoolean(node.props.multiple);
}

function canNativeParticipateInValidation(node: NativeElementNode): boolean {
    return isNativeFormControl(node) && !isNativeDisabled(node);
}

export function resolveNativeTextInputValue(node: NativeElementNode): string {
    return typeof node.props.value === 'string' || typeof node.props.value === 'number'
        ? String(node.props.value)
        : '';
}

function parseNativeNonNegativeIntegerConstraint(value: NativePropValue | undefined): number | undefined {
    const parsed = parsePlainNumericValue(value);
    return parsed !== undefined && Number.isInteger(parsed) && parsed >= 0
        ? parsed
        : undefined;
}

function resolveNativeTextInputMinLength(node: NativeElementNode): number | undefined {
    return parseNativeNonNegativeIntegerConstraint(node.props.minLength ?? node.props.minlength);
}

function resolveNativeTextInputMaxLength(node: NativeElementNode): number | undefined {
    return parseNativeNonNegativeIntegerConstraint(node.props.maxLength ?? node.props.maxlength);
}

function resolveNativePatternExpression(node: NativeElementNode): RegExp | undefined {
    if (node.component !== 'TextInput' || typeof node.props.pattern !== 'string' || !node.props.pattern.trim()) {
        return undefined;
    }

    const pattern = node.props.pattern.trim();
    if (pattern.length > NATIVE_PATTERN_MAX_LENGTH || REDOS_NESTED_QUANTIFIER.test(pattern)) {
        return undefined;
    }

    try {
        return new RegExp(`^(?:${pattern})$`);
    } catch {
        return undefined;
    }
}

function resolveNativeNumericConstraint(value: NativePropValue | undefined): number | undefined {
    return parsePlainNumericValue(value);
}

export function resolveNativeStepConstraint(node: NativeElementNode): number | undefined {
    if (node.props.step === undefined) {
        return undefined;
    }

    if (typeof node.props.step === 'string' && node.props.step.trim().toLowerCase() === 'any') {
        return undefined;
    }

    const parsed = resolveNativeNumericConstraint(node.props.step);
    return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

export function resolveNativeTextInputType(node: NativeElementNode): 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'textarea' {
    const inputType = resolveNativeInputTypeValue(node.sourceTag, node.props);

    switch (inputType) {
        case 'password':
        case 'email':
        case 'number':
        case 'tel':
        case 'url':
        case 'search':
            return inputType;
        default:
            return 'text';
    }
}

function supportsNativePatternValidation(node: NativeElementNode): boolean {
    switch (resolveNativeTextInputType(node)) {
        case 'text':
        case 'password':
        case 'email':
        case 'tel':
        case 'url':
        case 'search':
            return true;
        default:
            return false;
    }
}

function isNativeEmailValue(value: string): boolean {
    return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value);
}

function isNativeUrlValue(value: string): boolean {
    try {
        const parsed = new URL(value);
        return Boolean(parsed.protocol && parsed.hostname);
    } catch {
        return false;
    }
}

export function hasNativeValidationConstraint(node: NativeElementNode): boolean {
    if (node.props['aria-invalid'] !== undefined) {
        return true;
    }

    if (node.component === 'TextInput') {
        return isNativeRequired(node)
            || resolveNativeTextInputMinLength(node) !== undefined
            || resolveNativeTextInputMaxLength(node) !== undefined
            || resolveNativePatternExpression(node) !== undefined
            || resolveNativeNumericConstraint(node.props.min) !== undefined
            || resolveNativeNumericConstraint(node.props.max) !== undefined
            || resolveNativeStepConstraint(node) !== undefined
            || resolveNativeTextInputType(node) === 'email'
            || resolveNativeTextInputType(node) === 'url'
            || resolveNativeTextInputType(node) === 'number';
    }

    return isNativeRequired(node);
}

function isNativeTextInputConstraintInvalid(node: NativeElementNode): boolean {
    const value = resolveNativeTextInputValue(node);
    const trimmedValue = value.trim();

    if (isNativeRequired(node) && trimmedValue.length === 0) {
        return true;
    }

    if (trimmedValue.length === 0) {
        return false;
    }

    const inputType = resolveNativeTextInputType(node);
    if (inputType === 'email' && !isNativeEmailValue(trimmedValue)) {
        return true;
    }

    if (inputType === 'url' && !isNativeUrlValue(trimmedValue)) {
        return true;
    }

    const minLength = resolveNativeTextInputMinLength(node);
    if (minLength !== undefined && value.length < minLength) {
        return true;
    }

    const maxLength = resolveNativeTextInputMaxLength(node);
    if (maxLength !== undefined && value.length > maxLength) {
        return true;
    }

    const patternExpression = supportsNativePatternValidation(node)
        ? resolveNativePatternExpression(node)
        : undefined;
    if (patternExpression && !patternExpression.test(value)) {
        return true;
    }

    if (inputType === 'number') {
        const numericValue = Number(trimmedValue);
        if (!Number.isFinite(numericValue)) {
            return true;
        }

        const min = resolveNativeNumericConstraint(node.props.min);
        if (min !== undefined && numericValue < min) {
            return true;
        }

        const max = resolveNativeNumericConstraint(node.props.max);
        if (max !== undefined && numericValue > max) {
            return true;
        }

        const step = resolveNativeStepConstraint(node);
        if (step !== undefined) {
            const stepBase = resolveNativeNumericConstraint(node.props.min) ?? 0;
            const steps = (numericValue - stepBase) / step;
            if (Math.abs(steps - Math.round(steps)) > 1e-7) {
                return true;
            }
        }
    }

    return false;
}

export function isNativePlaceholderShown(node: NativeElementNode): boolean {
    return node.component === 'TextInput'
        && typeof node.props.placeholder === 'string'
        && node.props.placeholder.length > 0
        && resolveNativeTextInputValue(node).length === 0;
}

export function isNativeReadOnlyState(node: NativeElementNode): boolean {
    return node.component === 'TextInput' && (isNativeReadOnly(node) || isNativeDisabled(node));
}

export function isNativeReadWrite(node: NativeElementNode): boolean {
    return node.component === 'TextInput' && !isNativeReadOnlyState(node);
}

export function isNativeElementEmpty(node: NativeElementNode): boolean {
    return node.children.every((child) => child.kind === 'text' && child.value.length === 0);
}

export function isNativeFocusWithin(node: NativeElementNode): boolean {
    if (isNativePseudoFocused(node)) {
        return true;
    }

    return node.children.some((child) => child.kind === 'element' && isNativeFocusWithin(child));
}

function isNativeAriaInvalid(node: NativeElementNode): boolean {
    const value = node.props['aria-invalid'];
    if (value === undefined || value === null || value === false) {
        return false;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized.length > 0 && normalized !== 'false';
    }

    return toNativeBoolean(value);
}

export function isNativeInvalid(node: NativeElementNode): boolean {
    if (isNativeAriaInvalid(node)) {
        return true;
    }

    if (!isNativeFormControl(node)) {
        return false;
    }

    if (!canNativeParticipateInValidation(node)) {
        return false;
    }

    if (node.component === 'TextInput') {
        return isNativeTextInputConstraintInvalid(node);
    }

    if (!isNativeRequired(node)) {
        return false;
    }

    if (node.component === 'Toggle') {
        return !isNativeChecked(node);
    }

    if (node.component === 'Picker') {
        const options = resolveNativePickerOptions(node);
        return isNativeMultiple(node)
            ? resolveNativePickerInitialSelections(node, options).length === 0
            : resolveNativePickerInitialSelection(node, options).trim().length === 0;
    }

    return false;
}

export function isNativeValid(node: NativeElementNode): boolean {
    return canNativeParticipateInValidation(node) && !isNativeInvalid(node);
}

export function isNativeOptional(node: NativeElementNode): boolean {
    return isNativeFormControl(node) && !isNativeRequired(node);
}

export function isNativeReadOnly(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.readOnly) || toNativeBoolean(node.props.readonly);
}

function parseNativeTabIndex(node: NativeElementNode): number | undefined {
    const rawValue = node.props.tabIndex ?? node.props.tabindex;
    if (typeof rawValue === 'number' && Number.isInteger(rawValue)) {
        return rawValue;
    }

    if (typeof rawValue === 'string' && /^-?\d+$/.test(rawValue.trim())) {
        return Number(rawValue.trim());
    }

    return undefined;
}

function hasNativeExplicitFocusSignal(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.autoFocus)
        || toNativeBoolean(node.props.autofocus)
        || toNativeBoolean(node.props.focused)
        || toNativeBoolean(node.props['aria-focused']);
}

function isNativeFocusableRole(node: NativeElementNode): boolean {
    const role = typeof node.props.role === 'string'
        ? node.props.role.trim().toLowerCase()
        : undefined;

    return role === 'button'
        || role === 'link'
        || role === 'checkbox'
        || role === 'switch'
        || role === 'tab'
        || role === 'textbox'
        || role === 'combobox';
}

function isNativeFocusableElement(node: NativeElementNode): boolean {
    if (isNativeDisabled(node)) {
        return false;
    }

    const tabIndex = parseNativeTabIndex(node);
    if (tabIndex !== undefined) {
        return tabIndex >= 0;
    }

    if (toNativeBoolean(node.props.contentEditable) || toNativeBoolean(node.props.contenteditable)) {
        return true;
    }

    if (node.component === 'TextInput' || node.component === 'Button' || node.component === 'Link' || node.component === 'Toggle' || node.component === 'Picker' || node.component === 'Slider') {
        return true;
    }

    return isNativeFocusableRole(node);
}

export function isNativePseudoFocused(node: NativeElementNode): boolean {
    return hasNativeExplicitFocusSignal(node) && isNativeFocusableElement(node);
}

export function shouldNativeAutoFocus(node: NativeElementNode): boolean {
    return node.component === 'TextInput' && hasNativeExplicitFocusSignal(node) && !isNativeDisabled(node);
}

export function isNativeMuted(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.muted);
}

export function shouldNativeShowVideoControls(node: NativeElementNode): boolean {
    return node.sourceTag === 'video' && toNativeBoolean(node.props.controls);
}

export function resolveNativeVideoPoster(node: NativeElementNode): string | undefined {
    return node.sourceTag === 'video' && typeof node.props.poster === 'string' && node.props.poster.trim()
        ? node.props.poster.trim()
        : undefined;
}

export function shouldNativePlayInline(node: NativeElementNode): boolean {
    return node.sourceTag === 'video' && (
        toNativeBoolean(node.props.playsInline)
        || toNativeBoolean(node.props.playsinline)
    );
}

export function resolveNativeExplicitAccessibilityLabel(node: NativeElementNode): string | undefined {
    const explicitLabel = typeof node.props['aria-label'] === 'string' && node.props['aria-label'].trim()
        ? node.props['aria-label'].trim()
        : typeof node.props.title === 'string' && node.props.title.trim()
            ? node.props.title.trim()
            : undefined;

    if (explicitLabel) {
        return explicitLabel;
    }

    if (typeof node.props.alt === 'string' && node.props.alt.trim()) {
        return node.props.alt.trim();
    }

    return undefined;
}

export function resolveNativeMediaLabel(node: NativeElementNode): string {
    const explicitLabel = typeof node.props['aria-label'] === 'string' && node.props['aria-label'].trim()
        ? node.props['aria-label'].trim()
        : typeof node.props.title === 'string' && node.props.title.trim()
            ? node.props.title.trim()
            : undefined;

    if (explicitLabel) {
        return explicitLabel;
    }

    const textContent = flattenTextContent(node.children).trim();
    if (textContent) {
        return textContent;
    }

    return node.sourceTag === 'audio' ? 'Audio' : 'Video';
}

function tokenizeImageFallbackWords(value: string): string[] {
    return value
        .split(/[^a-zA-Z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .filter((token) => !/^\d+$/.test(token))
        .filter((token) => !IMAGE_FALLBACK_STOP_WORDS.has(token.toLowerCase()));
}

export function resolveImageFallbackLabel(source: string, alt?: string): string {
    const altTokens = alt ? tokenizeImageFallbackWords(alt) : [];
    const sourceTokens = tokenizeImageFallbackWords(source.replace(/\.[a-z0-9]+$/i, ''));
    const tokens = altTokens.length > 0 ? altTokens : sourceTokens;

    if (tokens.length === 0) {
        return 'IMG';
    }

    if (tokens.length === 1) {
        return tokens[0]!.slice(0, 2).toUpperCase();
    }

    const initials = tokens
        .slice(0, 2)
        .map((token) => token[0]!.toUpperCase())
        .join('');

    return initials || 'IMG';
}

export function resolveNativeAccessibilityLabel(node: NativeElementNode): string | undefined {
    const explicitLabel = resolveNativeExplicitAccessibilityLabel(node);

    if (explicitLabel) {
        return explicitLabel;
    }

    if (node.component === 'Picker') {
        if (typeof node.props.placeholder === 'string' && node.props.placeholder.trim()) {
            return node.props.placeholder.trim();
        }

        return isNativeMultiple(node) ? 'Selection list' : 'Select';
    }

    const textContent = flattenTextContent(node.children).trim();
    if (textContent) {
        return textContent;
    }

    if (typeof node.props.placeholder === 'string' && node.props.placeholder.trim()) {
        return node.props.placeholder.trim();
    }

    if (node.component === 'Media') {
        return resolveNativeMediaLabel(node);
    }

    if (node.component === 'WebView') {
        return 'Web content';
    }

    return undefined;
}

export function resolveNativeAccessibilityHint(node: NativeElementNode): string | undefined {
    const parts: string[] = [];

    if (typeof node.props['aria-description'] === 'string' && node.props['aria-description'].trim()) {
        parts.push(node.props['aria-description'].trim());
    }

    const linkHint = resolveNativeLinkHint(node);
    if (linkHint) {
        parts.push(linkHint);
    }

    return parts.length > 0 ? parts.join(', ') : undefined;
}

export function resolveNativeAccessibilityRole(node: NativeElementNode): 'button' | 'link' | 'checkbox' | 'switch' | 'tab' | 'image' | 'heading' | undefined {
    const explicitRole = typeof node.props.role === 'string'
        ? node.props.role.trim().toLowerCase()
        : undefined;

    switch (explicitRole) {
        case 'button':
        case 'link':
        case 'checkbox':
        case 'switch':
        case 'tab':
        case 'image':
        case 'heading':
            return explicitRole;
        case 'img':
            return 'image';
        default:
            break;
    }

    return undefined;
}

export function hasExplicitNativeAccessibilitySignal(node: NativeElementNode): boolean {
    return Boolean(
        resolveNativeExplicitAccessibilityLabel(node)
        || resolveNativeAccessibilityHint(node)
        || resolveNativeLinkHint(node)
        || (typeof node.props.role === 'string' && node.props.role.trim())
        || node.props['aria-selected'] !== undefined
        || node.props['aria-checked'] !== undefined
        || node.props['aria-pressed'] !== undefined
        || node.props['aria-disabled'] !== undefined
        || node.props['aria-expanded'] !== undefined
        || node.props['aria-invalid'] !== undefined
        || node.props['aria-current'] !== undefined
        || node.props['aria-valuetext'] !== undefined
        || node.props['aria-required'] !== undefined
        || toNativeBoolean(node.props.required)
        || isNativeMultiple(node)
    );
}

export function shouldEmitNativeAccessibilityLabel(node: NativeElementNode): boolean {
    return hasExplicitNativeAccessibilitySignal(node);
}

export function resolveNativeAccessibilityStateParts(node: NativeElementNode): string[] {
    const parts: string[] = [];
    const role = resolveNativeAccessibilityRole(node);
    const hasSelectedState = node.props['aria-selected'] !== undefined || typeof node.props['aria-current'] === 'string' || role === 'tab';
    const hasCheckedState = node.component === 'Toggle' || node.props['aria-checked'] !== undefined || role === 'checkbox' || role === 'switch';
    const hasPressedState = hasNativePressedAccessibilityState(node);

    if (isNativeRequired(node)) {
        parts.push('Required');
    }

    if (isNativeInvalid(node)) {
        parts.push('Invalid');
    }

    if (!isNativeInvalid(node) && hasNativeValidationConstraint(node) && isNativeValid(node)) {
        parts.push('Valid');
    }

    if (isNativeDisabled(node)) {
        parts.push('Disabled');
    }

    if (hasSelectedState) {
        parts.push(isNativeSelected(node) ? 'Selected' : 'Not selected');
    }

    if (hasCheckedState) {
        parts.push(isNativeChecked(node) ? 'Checked' : 'Unchecked');
    }

    if (hasPressedState) {
        parts.push(isNativePressed(node) ? 'Pressed' : 'Not pressed');
    }

    if (node.props['aria-expanded'] !== undefined) {
        parts.push(toNativeBoolean(node.props['aria-expanded']) ? 'Expanded' : 'Collapsed');
    }

    if (typeof node.props['aria-valuetext'] === 'string' && node.props['aria-valuetext'].trim()) {
        parts.push(node.props['aria-valuetext'].trim());
    }

    return [...new Set(parts)];
}

function resolveComposeAccessibilityRoleExpression(node: NativeElementNode): string | undefined {
    switch (resolveNativeAccessibilityRole(node)) {
        case 'button':
        case 'link':
            return 'Role.Button';
        case 'checkbox':
            return 'Role.Checkbox';
        case 'switch':
            return 'Role.Switch';
        case 'tab':
            return 'Role.Tab';
        case 'image':
            return 'Role.Image';
        default:
            return undefined;
    }
}

export function buildComposeAccessibilityModifier(node: NativeElementNode): string | undefined {
    if (!hasExplicitNativeAccessibilitySignal(node)) {
        return undefined;
    }

    const statements: string[] = [];
    const label = shouldEmitNativeAccessibilityLabel(node) ? resolveNativeAccessibilityLabel(node) : undefined;
    const hint = resolveNativeAccessibilityHint(node);
    const stateParts = resolveNativeAccessibilityStateParts(node);
    const stateDescription = [hint, ...stateParts].filter((value): value is string => Boolean(value)).join(', ');
    const roleExpression = resolveComposeAccessibilityRoleExpression(node);
    const role = resolveNativeAccessibilityRole(node);

    if (label) {
        statements.push(`contentDescription = ${quoteKotlinString(label)}`);
    }

    if (roleExpression) {
        statements.push(`role = ${roleExpression}`);
    }

    if ((node.props['aria-selected'] !== undefined || typeof node.props['aria-current'] === 'string' || role === 'tab') && isNativeSelected(node)) {
        statements.push('selected = true');
    }

    if (stateDescription) {
        statements.push(`stateDescription = ${quoteKotlinString(stateDescription)}`);
    }

    if (role === 'heading') {
        statements.push('heading()');
    }

    if (node.props['aria-disabled'] !== undefined) {
        statements.push('disabled()');
    }

    return statements.length > 0
        ? `semantics(mergeDescendants = true) { ${statements.join('; ')} }`
        : undefined;
}

export function buildSwiftAccessibilityModifiers(node: NativeElementNode): string[] {
    if (!hasExplicitNativeAccessibilitySignal(node)) {
        return [];
    }

    const modifiers: string[] = [];
    const label = shouldEmitNativeAccessibilityLabel(node) ? resolveNativeAccessibilityLabel(node) : undefined;
    const hint = resolveNativeAccessibilityHint(node);
    const value = resolveNativeAccessibilityStateParts(node).join(', ');
    const role = resolveNativeAccessibilityRole(node);

    if (label) {
        modifiers.push(`.accessibilityLabel(${quoteSwiftString(label)})`);
    }

    if (hint) {
        modifiers.push(`.accessibilityHint(${quoteSwiftString(hint)})`);
    }

    if (value) {
        modifiers.push(`.accessibilityValue(${quoteSwiftString(value)})`);
    }

    if (role === 'button') {
        modifiers.push('.accessibilityAddTraits(.isButton)');
    } else if (role === 'link') {
        modifiers.push('.accessibilityAddTraits(.isLink)');
    } else if (role === 'image') {
        modifiers.push('.accessibilityAddTraits(.isImage)');
    } else if (role === 'heading') {
        modifiers.push('.accessibilityAddTraits(.isHeader)');
    }

    if ((node.props['aria-selected'] !== undefined || typeof node.props['aria-current'] === 'string' || role === 'tab') && isNativeSelected(node)) {
        modifiers.push('.accessibilityAddTraits(.isSelected)');
    }

    return modifiers;
}

export function resolveNativeRangeMin(node: NativeElementNode): number {
    return resolveNativeNumericConstraint(node.props.min) ?? 0;
}

export function resolveNativeRangeMax(node: NativeElementNode): number {
    const min = resolveNativeRangeMin(node);
    const max = resolveNativeNumericConstraint(node.props.max);
    return max !== undefined && max > min ? max : min + 100;
}

export function resolveNativeRangeInitialValue(node: NativeElementNode): number {
    const min = resolveNativeRangeMin(node);
    const max = resolveNativeRangeMax(node);
    const value = resolveNativeNumericConstraint(node.props.value);
    const candidate = value !== undefined ? value : min;
    return Math.min(max, Math.max(min, candidate));
}

export function resolveComposeSliderSteps(node: NativeElementNode): number | undefined {
    const step = resolveNativeStepConstraint(node);
    if (step === undefined) {
        return undefined;
    }

    const intervals = (resolveNativeRangeMax(node) - resolveNativeRangeMin(node)) / step;
    if (!Number.isFinite(intervals)) {
        return undefined;
    }

    const roundedIntervals = Math.round(intervals);
    if (roundedIntervals < 1 || Math.abs(intervals - roundedIntervals) > 1e-7) {
        return undefined;
    }

    return Math.max(0, roundedIntervals - 1);
}

export function resolveComposeKeyboardType(node: NativeElementNode): string | undefined {
    switch (resolveNativeTextInputType(node)) {
        case 'email':
            return 'androidx.compose.ui.text.input.KeyboardType.Email';
        case 'number':
            return 'androidx.compose.ui.text.input.KeyboardType.Decimal';
        case 'password':
            return 'androidx.compose.ui.text.input.KeyboardType.Password';
        case 'tel':
            return 'androidx.compose.ui.text.input.KeyboardType.Phone';
        case 'url':
            return 'androidx.compose.ui.text.input.KeyboardType.Uri';
        case 'search':
            return 'androidx.compose.ui.text.input.KeyboardType.Text';
        default:
            return undefined;
    }
}

export function resolveSwiftKeyboardTypeModifier(node: NativeElementNode): string | undefined {
    switch (resolveNativeTextInputType(node)) {
        case 'email':
            return '.keyboardType(.emailAddress)';
        case 'number':
            return '.keyboardType(.decimalPad)';
        case 'tel':
            return '.keyboardType(.phonePad)';
        case 'url':
            return '.keyboardType(.URL)';
        case 'search':
            return '.keyboardType(.webSearch)';
        default:
            return undefined;
    }
}

export function shouldDisableNativeTextCapitalization(node: NativeElementNode): boolean {
    const inputType = resolveNativeTextInputType(node);
    return inputType === 'email' || inputType === 'password' || inputType === 'url';
}

export function serializeNativePayload(value: NativePropValue | undefined): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
}

export function resolveNativeAction(node: NativeElementNode): string | undefined {
    return typeof node.props.nativeAction === 'string' && node.props.nativeAction.trim()
        ? node.props.nativeAction
        : undefined;
}

export function resolveNativeRoute(node: NativeElementNode): string | undefined {
    if (typeof node.props.nativeRoute === 'string' && node.props.nativeRoute.trim()) {
        return node.props.nativeRoute;
    }

    const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
    if (destination && !isExternalDestination(destination)) {
        return destination;
    }

    return undefined;
}

export function buildComposeBridgeInvocation(action?: string, route?: string, payloadJson?: string): string | undefined {
    const args: string[] = [];

    if (action) args.push(`action = ${quoteKotlinString(action)}`);
    if (route) args.push(`route = ${quoteKotlinString(route)}`);
    if (payloadJson) args.push(`payloadJson = ${quoteKotlinString(payloadJson)}`);

    return args.length > 0 ? `ElitNativeBridge.dispatch(${args.join(', ')})` : undefined;
}

export function buildSwiftBridgeInvocation(action?: string, route?: string, payloadJson?: string): string | undefined {
    const args: string[] = [];

    if (action) args.push(`action: ${quoteSwiftString(action)}`);
    if (route) args.push(`route: ${quoteSwiftString(route)}`);
    if (payloadJson) args.push(`payloadJson: ${quoteSwiftString(payloadJson)}`);

    return args.length > 0 ? `ElitNativeBridge.dispatch(${args.join(', ')})` : undefined;
}

function resolveNativeControlEventInputType(node: NativeElementNode): string | undefined {
    if (node.component === 'Picker') {
        return isNativeMultiple(node) ? 'select-multiple' : 'select-one';
    }

    if (node.component === 'Toggle') {
        return typeof node.props.type === 'string' && node.props.type.trim()
            ? node.props.type.trim().toLowerCase()
            : 'checkbox';
    }

    if (node.component === 'Slider') {
        return 'range';
    }

    return resolveNativeInputTypeValue(node.sourceTag, node.props);
}

function shouldDispatchNativeControlEvent(node: NativeElementNode, eventName: 'input' | 'change' | 'submit'): boolean {
    if (!node.events.includes(eventName)) {
        return false;
    }

    return !(eventName === 'input' && getNativeBindingReference(node) && node.events.every((candidate) => candidate === 'input'));
}

function resolveNativeControlEventAction(node: NativeElementNode, eventName: 'input' | 'change' | 'submit'): string {
    return resolveNativeAction(node) ?? `elit.event.${eventName}`;
}

function buildComposeControlEventPayloadInvocation(
    node: NativeElementNode,
    eventName: 'input' | 'change' | 'submit',
    options: NativeControlEventExpressionOptions = {},
): string {
    const args = [
        `event = ${quoteKotlinString(eventName)}`,
        `sourceTag = ${quoteKotlinString(node.sourceTag)}`,
    ];
    const inputType = resolveNativeControlEventInputType(node);
    const detailJson = serializeNativePayload(node.props.nativePayload);

    if (inputType) {
        args.push(`inputType = ${quoteKotlinString(inputType)}`);
    }
    if (options.valueExpression) {
        args.push(`value = ${options.valueExpression}`);
    }
    if (options.valuesExpression) {
        args.push(`values = ${options.valuesExpression}`);
    }
    if (options.checkedExpression) {
        args.push(`checked = ${options.checkedExpression}`);
    }
    if (detailJson) {
        args.push(`detailJson = ${quoteKotlinString(detailJson)}`);
    }

    return `ElitNativeBridge.controlEventPayload(${args.join(', ')})`;
}

export function buildComposeControlEventDispatchInvocation(
    node: NativeElementNode,
    eventName: 'input' | 'change' | 'submit',
    options: NativeControlEventExpressionOptions = {},
): string {
    return `ElitNativeBridge.dispatch(action = ${quoteKotlinString(resolveNativeControlEventAction(node, eventName))}, payloadJson = ${buildComposeControlEventPayloadInvocation(node, eventName, options)})`;
}

export function buildComposeControlEventDispatchStatements(
    node: NativeElementNode,
    options: NativeControlEventExpressionOptions = {},
): string[] {
    const statements: string[] = [];
    if (shouldDispatchNativeControlEvent(node, 'input')) {
        statements.push(buildComposeControlEventDispatchInvocation(node, 'input', options));
    }
    if (shouldDispatchNativeControlEvent(node, 'change')) {
        statements.push(buildComposeControlEventDispatchInvocation(node, 'change', options));
    }
    return statements;
}

function buildSwiftControlEventPayloadInvocation(
    node: NativeElementNode,
    eventName: 'input' | 'change' | 'submit',
    options: NativeControlEventExpressionOptions = {},
): string {
    const args = [
        `event: ${quoteSwiftString(eventName)}`,
        `sourceTag: ${quoteSwiftString(node.sourceTag)}`,
    ];
    const inputType = resolveNativeControlEventInputType(node);
    const detailJson = serializeNativePayload(node.props.nativePayload);

    if (inputType) {
        args.push(`inputType: ${quoteSwiftString(inputType)}`);
    }
    if (options.valueExpression) {
        args.push(`value: ${options.valueExpression}`);
    }
    if (options.valuesExpression) {
        args.push(`values: ${options.valuesExpression}`);
    }
    if (options.checkedExpression) {
        args.push(`checked: ${options.checkedExpression}`);
    }
    if (detailJson) {
        args.push(`detailJson: ${quoteSwiftString(detailJson)}`);
    }

    return `ElitNativeBridge.controlEventPayload(${args.join(', ')})`;
}

export function buildSwiftControlEventDispatchInvocation(
    node: NativeElementNode,
    eventName: 'input' | 'change' | 'submit',
    options: NativeControlEventExpressionOptions = {},
): string {
    return `ElitNativeBridge.dispatch(action: ${quoteSwiftString(resolveNativeControlEventAction(node, eventName))}, payloadJson: ${buildSwiftControlEventPayloadInvocation(node, eventName, options)})`;
}

export function buildSwiftControlEventDispatchStatements(
    node: NativeElementNode,
    options: NativeControlEventExpressionOptions = {},
): string[] {
    const statements: string[] = [];
    if (shouldDispatchNativeControlEvent(node, 'input')) {
        statements.push(buildSwiftControlEventDispatchInvocation(node, 'input', options));
    }
    if (shouldDispatchNativeControlEvent(node, 'change')) {
        statements.push(buildSwiftControlEventDispatchInvocation(node, 'change', options));
    }
    return statements;
}

export function getNativeBindingReference(node: NativeElementNode): NativeBindingReference | undefined {
    const binding = node.props.nativeBinding;
    if (!binding || typeof binding !== 'object' || Array.isArray(binding)) {
        return undefined;
    }

    const id = typeof binding.id === 'string' ? binding.id : undefined;
    const kind = binding.kind === 'value' || binding.kind === 'checked' ? binding.kind : undefined;
    const valueType = binding.valueType === 'boolean' || binding.valueType === 'number' || binding.valueType === 'string' || binding.valueType === 'string-array'
        ? binding.valueType
        : undefined;

    if (!id || !kind || !valueType) {
        return undefined;
    }

    return { id, kind, valueType };
}

function collectNativePickerOptionNodes(nodes: NativeNode[]): NativeElementNode[] {
    const options: NativeElementNode[] = [];

    for (const node of nodes) {
        if (node.kind !== 'element') {
            continue;
        }

        if (node.component === 'Option') {
            options.push(node);
            continue;
        }

        if (node.sourceTag === 'optgroup') {
            options.push(...collectNativePickerOptionNodes(node.children));
        }
    }

    return options;
}

export function resolveNativePickerOptionLabel(node: NativeElementNode): string {
    if (typeof node.props.label === 'string' && node.props.label.trim()) {
        return node.props.label;
    }

    const textContent = flattenTextContent(node.children).trim();
    if (textContent) {
        return textContent;
    }

    if (typeof node.props.value === 'string' || typeof node.props.value === 'number' || typeof node.props.value === 'boolean') {
        return String(node.props.value);
    }

    return 'Option';
}

function resolveNativePickerOptionValue(node: NativeElementNode): string {
    if (typeof node.props.value === 'string' || typeof node.props.value === 'number' || typeof node.props.value === 'boolean') {
        return String(node.props.value);
    }

    return resolveNativePickerOptionLabel(node);
}

export function resolveNativePickerOptions(node: NativeElementNode): NativePickerOption[] {
    return collectNativePickerOptionNodes(node.children).map((optionNode) => ({
        label: resolveNativePickerOptionLabel(optionNode),
        value: resolveNativePickerOptionValue(optionNode),
        selected: isNativeSelected(optionNode),
        disabled: isNativeDisabled(optionNode),
    }));
}

export function resolveNativePickerInitialSelection(node: NativeElementNode, options: NativePickerOption[]): string {
    if (isNativeMultiple(node)) {
        return resolveNativePickerInitialSelections(node, options)[0] ?? '';
    }

    const explicitValue = typeof node.props.value === 'string' || typeof node.props.value === 'number' || typeof node.props.value === 'boolean'
        ? String(node.props.value)
        : undefined;

    if (explicitValue && options.some((option) => option.value === explicitValue)) {
        return explicitValue;
    }

    const selectedOption = options.find((option) => option.selected);

    if (selectedOption) {
        return selectedOption.value;
    }

    if (isNativeRequired(node)) {
        return '';
    }

    return options[0]?.value ?? '';
}

export function resolveNativePickerInitialSelections(node: NativeElementNode, options: NativePickerOption[]): string[] {
    if (Array.isArray(node.props.value)) {
        const explicitValues = node.props.value
            .filter((value): value is string | number | boolean => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
            .map((value) => String(value));

        return explicitValues.filter((value, index) => explicitValues.indexOf(value) === index && options.some((option) => option.value === value));
    }

    const explicitValue = typeof node.props.value === 'string' || typeof node.props.value === 'number' || typeof node.props.value === 'boolean'
        ? String(node.props.value)
        : undefined;

    if (explicitValue && options.some((option) => option.value === explicitValue)) {
        return [explicitValue];
    }

    return options
        .filter((option) => option.selected)
        .map((option) => option.value);
}

export function resolveNativePickerDisplayLabel(value: string, options: NativePickerOption[]): string {
    return options.find((option) => option.value === value)?.label ?? value;
}

export function buildComposePickerLabelExpression(selectionExpression: string, options: NativePickerOption[], placeholder?: string): string {
    const fallbackLabel = placeholder ? quoteKotlinString(placeholder) : undefined;

    if (options.length === 0 || options.every((option) => option.value === option.label)) {
        return fallbackLabel
            ? `if (${selectionExpression}.isEmpty()) ${fallbackLabel} else ${selectionExpression}`
            : selectionExpression;
    }

    const branches = options.map((option) => `${quoteKotlinString(option.value)} -> ${quoteKotlinString(option.label)}`).join('; ');
    return fallbackLabel
        ? `when (${selectionExpression}) { "" -> ${fallbackLabel}; ${branches}; else -> ${selectionExpression} }`
        : `when (${selectionExpression}) { ${branches}; else -> ${selectionExpression} }`;
}

export function resolveNativeProgressFraction(props: Record<string, NativePropValue>): number | undefined {
    const value = parsePlainNumericValue(props.value);
    if (value === undefined) {
        return undefined;
    }

    const max = parsePlainNumericValue(props.max);
    const denominator = max !== undefined && max > 0 ? max : 1;
    return Math.max(0, Math.min(1, value / denominator));
}

export function resolveNativeSurfaceSource(node: NativeElementNode): string | undefined {
    const source = typeof node.props.source === 'string' && node.props.source.trim()
        ? node.props.source.trim()
        : typeof node.props.src === 'string' && node.props.src.trim()
            ? node.props.src.trim()
            : typeof node.props.data === 'string' && node.props.data.trim()
                ? node.props.data.trim()
                : typeof node.props.destination === 'string' && node.props.destination.trim()
                    ? node.props.destination.trim()
                    : undefined;

    return source && source.length > 0 ? source : undefined;
}
import type {
    NativeTree,
    NativeNode,
    NativeStateDescriptor,
    AndroidComposeContext,
    SwiftUIContext,
} from './native-types';
import { quoteKotlinString, quoteSwiftString } from './native-strings';
import { formatFloat } from './native-units';

function indent(level: number): string {
    return '    '.repeat(level);
}

type NativeTextTransform = 'uppercase' | 'lowercase' | 'capitalize';

export function createNativeStateDescriptorMap(tree: NativeTree): Map<string, NativeStateDescriptor> {
    return new Map((tree.stateDescriptors ?? []).map((descriptor) => [descriptor.id, descriptor]));
}

function toNativeStateVariableName(id: string): string {
    const suffix = id.replace(/[^a-zA-Z0-9_]/g, '_');
    return suffix ? `native${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}` : 'nativeState';
}

function formatKotlinStringList(values: readonly string[]): string {
    return values.length > 0
        ? `listOf(${values.map((value) => quoteKotlinString(String(value))).join(', ')})`
        : 'emptyList<String>()';
}

function formatSwiftStringList(values: readonly string[]): string {
    return `[${values.map((value) => quoteSwiftString(String(value))).join(', ')}]`;
}

export function formatNativeNumberLiteral(value: number): string {
    const formatted = formatFloat(value);
    return formatted.includes('.') ? formatted : `${formatted}.0`;
}

function formatComposeStateInitialValue(descriptor: NativeStateDescriptor): string {
    if (descriptor.type === 'string-array') {
        const values = Array.isArray(descriptor.initialValue) ? descriptor.initialValue : [];
        return formatKotlinStringList(values);
    }

    if (descriptor.type === 'string') {
        return quoteKotlinString(String(descriptor.initialValue));
    }

    if (descriptor.type === 'number') {
        return formatNativeNumberLiteral(Number(descriptor.initialValue));
    }

    return String(descriptor.initialValue);
}

function formatSwiftStateInitialValue(descriptor: NativeStateDescriptor): string {
    if (descriptor.type === 'string-array') {
        const values = Array.isArray(descriptor.initialValue) ? descriptor.initialValue : [];
        return formatSwiftStringList(values);
    }

    if (descriptor.type === 'string') {
        return quoteSwiftString(String(descriptor.initialValue));
    }

    if (descriptor.type === 'number') {
        return formatNativeNumberLiteral(Number(descriptor.initialValue));
    }

    return String(descriptor.initialValue);
}

export function ensureComposeStateVariable(context: AndroidComposeContext, stateId: string): { descriptor: NativeStateDescriptor; variableName: string } {
    const descriptor = context.stateDescriptors.get(stateId);
    if (!descriptor) {
        throw new Error(`Unknown native state descriptor: ${stateId}`);
    }

    const variableName = toNativeStateVariableName(stateId);
    if (!context.declaredStateIds.has(stateId)) {
        context.declaredStateIds.add(stateId);
        context.stateDeclarations.push(`${indent(1)}var ${variableName} by remember { mutableStateOf(${formatComposeStateInitialValue(descriptor)}) }`);
    }

    return { descriptor, variableName };
}

export function ensureSwiftStateVariable(context: SwiftUIContext, stateId: string): { descriptor: NativeStateDescriptor; variableName: string } {
    const descriptor = context.stateDescriptors.get(stateId);
    if (!descriptor) {
        throw new Error(`Unknown native state descriptor: ${stateId}`);
    }

    const variableName = toNativeStateVariableName(stateId);
    if (!context.declaredStateIds.has(stateId)) {
        context.declaredStateIds.add(stateId);
        const annotation = descriptor.type === 'string-array'
            ? ': [String]'
            : descriptor.type === 'number'
                ? ': Double'
                : '';
        context.stateDeclarations.push(`${indent(1)}@State private var ${variableName}${annotation} = ${formatSwiftStateInitialValue(descriptor)}`);
    }

    return { descriptor, variableName };
}

export function toComposeTextValueExpression(variableName: string, descriptor: NativeStateDescriptor): string {
    if (descriptor.type === 'string') {
        return variableName;
    }

    if (descriptor.type === 'string-array') {
        return `${variableName}.joinToString(", ")`;
    }

    return `${variableName}.toString()`;
}

export function toSwiftTextValueExpression(variableName: string, descriptor: NativeStateDescriptor): string {
    if (descriptor.type === 'string') {
        return variableName;
    }

    if (descriptor.type === 'string-array') {
        return `${variableName}.joined(separator: ", ")`;
    }

    return `String(${variableName})`;
}

export function buildComposeStateStringAssignment(variableName: string, descriptor: NativeStateDescriptor, value: string): string {
    const literal = quoteKotlinString(value);

    if (descriptor.type === 'string-array') {
        return `${variableName} = listOf(${literal})`;
    }

    if (descriptor.type === 'number') {
        return `${variableName} = ${literal}.toDoubleOrNull() ?: ${variableName}`;
    }

    if (descriptor.type === 'boolean') {
        return `${variableName} = ${literal}.equals("true", ignoreCase = true)`;
    }

    return `${variableName} = ${literal}`;
}

export function buildSwiftStateStringAssignment(variableName: string, descriptor: NativeStateDescriptor, valueExpression: string): string {
    if (descriptor.type === 'string-array') {
        return `${variableName} = ${valueExpression}.split(separator: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }`;
    }

    if (descriptor.type === 'number') {
        return `if let parsed = Double(${valueExpression}) { ${variableName} = parsed }`;
    }

    if (descriptor.type === 'boolean') {
        return `${variableName} = ${valueExpression}.compare("true", options: .caseInsensitive) == .orderedSame`;
    }

    return `${variableName} = ${valueExpression}`;
}

export function buildComposeStateStringArrayToggleAssignment(variableName: string, value: string, optionValues: readonly string[]): string {
    const orderedValues = formatKotlinStringList(optionValues);
    const literal = quoteKotlinString(value);
    return `${variableName} = ${orderedValues}.filter { candidate -> if (candidate == ${literal}) checked else ${variableName}.contains(candidate) }`;
}

export function buildSwiftStringBindingExpression(
    variableName: string,
    descriptor: NativeStateDescriptor,
    additionalSetterStatements: string[] = [],
): string {
    const setterSuffix = additionalSetterStatements.length > 0
        ? `; ${additionalSetterStatements.join('; ')}`
        : '';

    if (descriptor.type === 'string') {
        return additionalSetterStatements.length > 0
            ? `Binding(get: { ${variableName} }, set: { nextValue in ${variableName} = nextValue${setterSuffix} })`
            : `$${variableName}`;
    }

    if (descriptor.type === 'string-array') {
        return `Binding(get: { ${variableName}.joined(separator: ", ") }, set: { nextValue in ${variableName} = nextValue.split(separator: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }${setterSuffix} })`;
    }

    if (descriptor.type === 'number') {
        return `Binding(get: { String(${variableName}) }, set: { nextValue in if let parsed = Double(nextValue) { ${variableName} = parsed }${setterSuffix} })`;
    }

    return `Binding(get: { ${variableName} ? "true" : "false" }, set: { nextValue in ${variableName} = nextValue.compare("true", options: .caseInsensitive) == .orderedSame${setterSuffix} })`;
}

export function buildSwiftStateStringArrayToggleBinding(
    variableName: string,
    value: string,
    optionValues: readonly string[],
    additionalSetterStatements: string[] = [],
): string {
    const literal = quoteSwiftString(value);
    const orderedValues = formatSwiftStringList(optionValues);
    const setterSuffix = additionalSetterStatements.length > 0
        ? `; ${additionalSetterStatements.join('; ')}`
        : '';
    return `Binding(get: { ${variableName}.contains(${literal}) }, set: { isOn in ${variableName} = ${orderedValues}.filter { option in option == ${literal} ? isOn : ${variableName}.contains(option) }${setterSuffix} })`;
}

export function buildSwiftReadOnlyBindingExpression(valueExpression: string): string {
    return `Binding(get: { ${valueExpression} }, set: { _ in })`;
}

export function applyComposeTextTransformExpression(expression: string, transform: NativeTextTransform | undefined): string {
    if (!transform) {
        return expression;
    }

    if (transform === 'uppercase') {
        return `${expression}.uppercase()`;
    }

    if (transform === 'lowercase') {
        return `${expression}.lowercase()`;
    }

    return `${expression}.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }`;
}

function applySwiftTextTransformExpression(expression: string, transform: NativeTextTransform | undefined): string {
    if (!transform) {
        return expression;
    }

    if (transform === 'uppercase') {
        return `${expression}.uppercased()`;
    }

    if (transform === 'lowercase') {
        return `${expression}.lowercased()`;
    }

    return `${expression}.capitalized`;
}

export function buildComposeTextExpression(
    nodes: NativeNode[],
    context: AndroidComposeContext,
    transform?: NativeTextTransform,
): string | undefined {
    const parts: string[] = [];
    let hasDynamicPart = false;

    const visit = (items: NativeNode[]): void => {
        for (const item of items) {
            if (item.kind === 'text') {
                if (item.stateId) {
                    const { descriptor, variableName } = ensureComposeStateVariable(context, item.stateId);
                    parts.push(toComposeTextValueExpression(variableName, descriptor));
                    hasDynamicPart = true;
                } else {
                    parts.push(quoteKotlinString(item.value));
                }
                continue;
            }

            visit(item.children);
        }
    };

    visit(nodes);

    if (parts.length === 0 || !hasDynamicPart) {
        return undefined;
    }

    const expression = parts.join(' + ');
    return applyComposeTextTransformExpression(expression, transform);
}

export function buildSwiftTextExpression(
    nodes: NativeNode[],
    context: SwiftUIContext,
    transform?: NativeTextTransform,
): string | undefined {
    const parts: string[] = [];
    let hasDynamicPart = false;

    const visit = (items: NativeNode[]): void => {
        for (const item of items) {
            if (item.kind === 'text') {
                if (item.stateId) {
                    const { descriptor, variableName } = ensureSwiftStateVariable(context, item.stateId);
                    parts.push(toSwiftTextValueExpression(variableName, descriptor));
                    hasDynamicPart = true;
                } else {
                    parts.push(quoteSwiftString(item.value));
                }
                continue;
            }

            visit(item.children);
        }
    };

    visit(nodes);

    if (parts.length === 0 || !hasDynamicPart) {
        return undefined;
    }

    const expression = parts.join(' + ');
    return applySwiftTextTransformExpression(expression, transform);
}
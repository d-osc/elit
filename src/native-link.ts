import type { NativeElementNode, NativePropValue } from './native-types';

export function isExternalDestination(value: NativePropValue | undefined): value is string {
    return typeof value === 'string' && /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value);
}

export function resolveNativeLinkTarget(node: NativeElementNode): string | undefined {
    return node.component === 'Link' && typeof node.props.target === 'string' && node.props.target.trim()
        ? node.props.target.trim().toLowerCase()
        : undefined;
}

export function resolveNativeLinkRelTokens(node: NativeElementNode): string[] {
    if (node.component !== 'Link' || typeof node.props.rel !== 'string') {
        return [];
    }

    return node.props.rel
        .split(/\s+/)
        .map((token) => token.trim().toLowerCase())
        .filter(Boolean);
}

function canNativeDownloadDestination(destination: string): boolean {
    return /^https?:/i.test(destination);
}

export function shouldNativeDownloadLink(node: NativeElementNode): boolean {
    if (node.component !== 'Link' || node.props.download === undefined) {
        return false;
    }

    const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
    return Boolean(destination && canNativeDownloadDestination(destination));
}

export function resolveNativeDownloadSuggestedName(node: NativeElementNode): string | undefined {
    if (!shouldNativeDownloadLink(node)) {
        return undefined;
    }

    if (typeof node.props.download === 'string' && node.props.download.trim()) {
        return node.props.download.trim();
    }

    const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
    if (!destination) {
        return undefined;
    }

    const normalized = destination.split(/[?#]/, 1)[0];
    const segments = normalized.split('/').filter(Boolean);
    const tail = segments[segments.length - 1];
    return tail && !tail.includes(':') ? tail : undefined;
}

export function resolveNativeLinkHint(node: NativeElementNode): string | undefined {
    if (node.component !== 'Link') {
        return undefined;
    }

    const parts: string[] = [];
    const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
    const target = resolveNativeLinkTarget(node);
    const relTokens = resolveNativeLinkRelTokens(node);

    if (shouldNativeDownloadLink(node)) {
        parts.push('Downloads file');
    }

    if (destination && (isExternalDestination(destination) || target === '_blank' || target === '_system' || relTokens.includes('external'))) {
        parts.push('Opens externally');
    }

    return parts.length > 0 ? parts.join(', ') : undefined;
}
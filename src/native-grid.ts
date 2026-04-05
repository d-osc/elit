import { type NativeStyleResolveOptions } from './style';
import type {
    NativeElementNode,
    NativeGridColumnTrackSizeSpec,
    NativeGridTemplateAreaPlacement,
    NativeGridTrackDefinition,
    NativeGridTrackSizeSpec,
    NativePropValue,
} from './native-types';
import { toScaledUnitNumber } from './native-units';

export function createNativeGridPlaceholderNode(): NativeElementNode {
    return {
        kind: 'element',
        component: 'View',
        sourceTag: 'div',
        props: {},
        events: [],
        children: [],
    };
}

function splitCssTrackList(value: string): string[] {
    const tracks: string[] = [];
    let token = '';
    let functionDepth = 0;
    let bracketDepth = 0;

    for (const char of value.trim()) {
        if (char === '(') {
            functionDepth += 1;
        } else if (char === ')' && functionDepth > 0) {
            functionDepth -= 1;
        } else if (char === '[') {
            bracketDepth += 1;
        } else if (char === ']' && bracketDepth > 0) {
            bracketDepth -= 1;
        }

        if (/\s/.test(char) && functionDepth === 0 && bracketDepth === 0) {
            const trimmed = token.trim();
            if (trimmed) {
                tracks.push(trimmed);
                token = '';
            }
            continue;
        }

        token += char;
    }

    const trailing = token.trim();
    if (trailing) {
        tracks.push(trailing);
    }

    return tracks;
}

function extractNativeGridLineNames(token: string): string[] | undefined {
    const trimmed = token.trim();
    if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
        return undefined;
    }

    const names = trimmed.slice(1, -1).trim().split(/\s+/).filter(Boolean);
    return names.length > 0 ? names : undefined;
}

function expandRepeatTrackList(value: string): string[] | undefined {
    const trimmed = value.trim();
    if (!trimmed.endsWith(')') || !trimmed.toLowerCase().startsWith('repeat(')) {
        return undefined;
    }

    const commaIdx = trimmed.indexOf(',', 'repeat('.length);
    if (commaIdx < 0) {
        return undefined;
    }

    const countStr = trimmed.slice('repeat('.length, commaIdx).trim();
    if (!/^\d+$/.test(countStr)) {
        return undefined;
    }

    const count = Number(countStr);
    if (!Number.isFinite(count) || count <= 0) {
        return undefined;
    }

    const inner = trimmed.slice(commaIdx + 1, -1).trim();
    if (!inner) {
        return undefined;
    }

    const innerTracks = splitCssTrackList(inner);
    if (innerTracks.length === 0) {
        return undefined;
    }

    return Array.from({ length: count }, () => innerTracks).flat();
}

function parseFractionTrackWeight(track: string): number | undefined {
    const directMatch = track.trim().match(/^(-?\d+(?:\.\d+)?)fr$/i);
    if (directMatch) {
        return Number(directMatch[1]);
    }

    const minmaxMatch = track.trim().match(/^minmax\([^,()]*,\s*(-?\d+(?:\.\d+)?)fr\s*\)$/i);
    return minmaxMatch ? Number(minmaxMatch[1]) : undefined;
}

export function parseNativeGridTrackDefinition(value: string): NativeGridTrackDefinition | undefined {
    const tokens = expandRepeatTrackList(value.trim()) ?? splitCssTrackList(value.trim());
    if (tokens.length === 0) {
        return undefined;
    }

    const tracks: string[] = [];
    const lineNames = new Map<string, number[]>();
    let lineIndex = 1;

    for (const token of tokens) {
        const names = extractNativeGridLineNames(token);
        if (names) {
            for (const name of names) {
                const normalizedName = name.toLowerCase();
                const existing = lineNames.get(normalizedName) ?? [];
                existing.push(lineIndex);
                lineNames.set(normalizedName, existing);
            }
            continue;
        }

        tracks.push(token);
        lineIndex += 1;
    }

    return tracks.length > 0 ? { tracks, lineNames, lineCount: lineIndex } : undefined;
}

export function parseGridTrackSizeSpec(
    track: string,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeGridTrackSizeSpec | undefined {
    const trimmed = track.trim();
    if (!trimmed) {
        return undefined;
    }

    const direct = toScaledUnitNumber(trimmed, styleResolveOptions);
    if (direct !== undefined && direct >= 0) {
        return { minHeight: direct, height: direct };
    }

    const normalized = trimmed.toLowerCase();
    if (normalized === 'auto') {
        return { stretchEligible: true };
    }

    if (normalized === 'min-content' || normalized === 'max-content') {
        return { intrinsicHeight: true };
    }

    const fitContentMatch = trimmed.match(/^fit-content\(([^()]+)\)$/i);
    if (fitContentMatch) {
        const fitContent = toScaledUnitNumber(fitContentMatch[1].trim(), styleResolveOptions);
        return fitContent !== undefined && fitContent >= 0 ? { maxHeight: fitContent } : undefined;
    }

    const minmaxMatch = trimmed.match(/^minmax\(([^,()]+),([^,()]+)\)$/i);
    if (minmaxMatch) {
        const minToken = minmaxMatch[1].trim();
        const maxToken = minmaxMatch[2].trim();
        const normalizedMinToken = minToken.toLowerCase();
        const normalizedMaxToken = maxToken.toLowerCase();
        const minTrack = toScaledUnitNumber(minToken, styleResolveOptions);
        const maxTrack = toScaledUnitNumber(maxToken, styleResolveOptions);
        const trackWeight = parseFractionTrackWeight(trimmed);
        const hasFixedTrack = minTrack !== undefined && maxTrack !== undefined && Math.abs(minTrack - maxTrack) < 0.001;

        return {
            ...(minTrack !== undefined && minTrack >= 0 ? { minHeight: minTrack } : {}),
            ...((normalizedMinToken === 'min-content' || normalizedMinToken === 'max-content') ? { intrinsicMinHeight: true } : {}),
            ...(hasFixedTrack && maxTrack !== undefined ? { height: maxTrack } : {}),
            ...(!hasFixedTrack && maxTrack !== undefined && maxTrack >= 0 ? { maxHeight: maxTrack } : {}),
            ...((normalizedMaxToken === 'min-content' || normalizedMaxToken === 'max-content') ? { intrinsicMaxHeight: true } : {}),
            ...(minTrack === undefined && maxTrack === undefined && minToken.toLowerCase() === 'auto' && maxToken.toLowerCase() === 'auto' && trackWeight === undefined ? { stretchEligible: true } : {}),
            ...(trackWeight !== undefined && Number.isFinite(trackWeight) && trackWeight > 0 ? { trackWeight } : {}),
        };
    }

    const directWeight = parseFractionTrackWeight(trimmed);
    if (directWeight !== undefined && Number.isFinite(directWeight) && directWeight > 0) {
        return { trackWeight: directWeight };
    }

    return undefined;
}

export function parseGridColumnTrackSizeSpec(
    track: string,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeGridColumnTrackSizeSpec | undefined {
    const trimmed = track.trim();
    if (!trimmed) {
        return undefined;
    }

    const direct = toScaledUnitNumber(trimmed, styleResolveOptions);
    if (direct !== undefined && direct >= 0) {
        return { minWidth: direct, width: direct };
    }

    const normalized = trimmed.toLowerCase();
    if (normalized === 'auto') {
        return { trackWeight: 1 };
    }

    if (normalized === 'min-content' || normalized === 'max-content') {
        return { intrinsicWidth: true };
    }

    const fitContentMatch = trimmed.match(/^fit-content\(([^()]+)\)$/i);
    if (fitContentMatch) {
        const fitContent = toScaledUnitNumber(fitContentMatch[1].trim(), styleResolveOptions);
        return fitContent !== undefined && fitContent >= 0 ? { maxWidth: fitContent } : undefined;
    }

    const minmaxMatch = trimmed.match(/^minmax\(([^,()]+),([^,()]+)\)$/i);
    if (minmaxMatch) {
        const minToken = minmaxMatch[1].trim();
        const maxToken = minmaxMatch[2].trim();
        const normalizedMinToken = minToken.toLowerCase();
        const normalizedMaxToken = maxToken.toLowerCase();
        const minTrack = toScaledUnitNumber(minToken, styleResolveOptions);
        const maxTrack = toScaledUnitNumber(maxToken, styleResolveOptions);
        const trackWeight = parseFractionTrackWeight(trimmed);
        const hasFixedTrack = minTrack !== undefined && maxTrack !== undefined && Math.abs(minTrack - maxTrack) < 0.001;

        return {
            ...(minTrack !== undefined && minTrack >= 0 ? { minWidth: minTrack } : {}),
            ...((normalizedMinToken === 'min-content' || normalizedMinToken === 'max-content') ? { intrinsicMinWidth: true } : {}),
            ...(hasFixedTrack && maxTrack !== undefined ? { width: maxTrack } : {}),
            ...(!hasFixedTrack && maxTrack !== undefined && maxTrack >= 0 ? { maxWidth: maxTrack } : {}),
            ...((normalizedMaxToken === 'min-content' || normalizedMaxToken === 'max-content') ? { intrinsicMaxWidth: true } : {}),
            ...(minTrack === undefined && maxTrack === undefined && normalizedMinToken === 'auto' && normalizedMaxToken === 'auto' && trackWeight === undefined ? { trackWeight: 1 } : {}),
            ...(trackWeight !== undefined && Number.isFinite(trackWeight) && trackWeight > 0 ? { trackWeight } : {}),
        };
    }

    const directWeight = parseFractionTrackWeight(trimmed);
    if (directWeight !== undefined && Number.isFinite(directWeight) && directWeight > 0) {
        return { trackWeight: directWeight };
    }

    return { trackWeight: 1 };
}

export function resolveGridTrackSizeSpecs(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): Array<NativeGridTrackSizeSpec | undefined> | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const tracks = parseNativeGridTrackDefinition(value.trim())?.tracks ?? [];
    if (tracks.length === 0) {
        return undefined;
    }

    return tracks.map((track) => parseGridTrackSizeSpec(track, styleResolveOptions));
}

export function resolveGridColumnTrackSizeSpecs(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
    columnGap: number,
): Array<NativeGridColumnTrackSizeSpec | undefined> | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    const viewportWidth = styleResolveOptions.viewportWidth ?? 390;
    const autoRepeatMatch = trimmed.match(/^repeat\(\s*auto-(?:fit|fill)\s*,\s*(minmax\([^,()]+,[^,()]+\))\s*\)$/i);
    if (autoRepeatMatch) {
        const repeatedSpec = parseGridColumnTrackSizeSpec(autoRepeatMatch[1].trim(), styleResolveOptions);
        const minWidth = repeatedSpec?.width ?? repeatedSpec?.minWidth;
        if (minWidth === undefined || minWidth <= 0) {
            return undefined;
        }

        const columnCount = Math.max(1, Math.floor((viewportWidth + columnGap) / (minWidth + columnGap)));
        return Array.from({ length: columnCount }, () => repeatedSpec ? { ...repeatedSpec } : { trackWeight: 1 });
    }

    const tracks = parseNativeGridTrackDefinition(trimmed)?.tracks ?? [];
    if (tracks.length === 0) {
        return undefined;
    }

    return tracks.map((track) => parseGridColumnTrackSizeSpec(track, styleResolveOptions));
}

export function isWrapEnabled(style: Record<string, NativePropValue> | undefined): boolean {
    if (!style || typeof style.flexWrap !== 'string') {
        return false;
    }

    const flexWrap = style.flexWrap.trim().toLowerCase();
    return flexWrap === 'wrap' || flexWrap === 'wrap-reverse';
}

export function isRowFlexLayout(style: Record<string, NativePropValue> | undefined): boolean {
    if (!style) {
        return false;
    }

    if (typeof style.flexDirection === 'string') {
        return style.flexDirection.trim().toLowerCase() === 'row';
    }

    if (typeof style.display !== 'string') {
        return false;
    }

    const display = style.display.trim().toLowerCase();
    return display === 'flex' || display === 'inline-flex';
}

export function resolveGridTrackCount(value: NativePropValue | undefined): number | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const tracks = parseNativeGridTrackDefinition(value.trim())?.tracks ?? [];
    return tracks.length > 0 ? tracks.length : undefined;
}

function parseNativeGridTemplateAreas(value: NativePropValue | undefined): string[][] | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const rows = Array.from(value.matchAll(/"([^"]*)"/g))
        .map((match) => match[1].trim().split(/\s+/).filter(Boolean))
        .filter((row) => row.length > 0);
    if (rows.length === 0) {
        return undefined;
    }

    const columnCount = rows[0]?.length ?? 0;
    if (columnCount === 0 || rows.some((row) => row.length !== columnCount)) {
        return undefined;
    }

    return rows;
}

export function resolveNativeGridTemplateAreaPlacements(
    value: NativePropValue | undefined,
): Map<string, NativeGridTemplateAreaPlacement> | undefined {
    const rows = parseNativeGridTemplateAreas(value);
    if (!rows) {
        return undefined;
    }

    const bounds = new Map<string, { minRow: number; maxRow: number; minColumn: number; maxColumn: number }>();
    for (const [rowIndex, row] of rows.entries()) {
        for (const [columnIndex, areaName] of row.entries()) {
            if (areaName === '.') {
                continue;
            }

            const existing = bounds.get(areaName);
            if (existing) {
                existing.minRow = Math.min(existing.minRow, rowIndex);
                existing.maxRow = Math.max(existing.maxRow, rowIndex);
                existing.minColumn = Math.min(existing.minColumn, columnIndex);
                existing.maxColumn = Math.max(existing.maxColumn, columnIndex);
            } else {
                bounds.set(areaName, {
                    minRow: rowIndex,
                    maxRow: rowIndex,
                    minColumn: columnIndex,
                    maxColumn: columnIndex,
                });
            }
        }
    }

    const placements = new Map<string, NativeGridTemplateAreaPlacement>();
    for (const [areaName, bound] of bounds.entries()) {
        let isRectangular = true;
        for (let rowIndex = bound.minRow; rowIndex <= bound.maxRow && isRectangular; rowIndex += 1) {
            for (let columnIndex = bound.minColumn; columnIndex <= bound.maxColumn; columnIndex += 1) {
                if (rows[rowIndex]?.[columnIndex] !== areaName) {
                    isRectangular = false;
                    break;
                }
            }
        }

        if (!isRectangular) {
            continue;
        }

        placements.set(areaName, {
            rowPlacement: { start: bound.minRow + 1, span: (bound.maxRow - bound.minRow) + 1 },
            columnPlacement: { start: bound.minColumn + 1, span: (bound.maxColumn - bound.minColumn) + 1 },
        });
    }

    return placements.size > 0 ? placements : undefined;
}

export function resolveNativeGridAutoFlow(value: NativePropValue | undefined): { axis: 'row' | 'column'; dense: boolean } {
    if (typeof value !== 'string') {
        return { axis: 'row', dense: false };
    }

    const tokens = value
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

    return {
        axis: tokens.includes('column') ? 'column' : 'row',
        dense: tokens.includes('dense'),
    };
}

export function parseNativeGridLineIndexValue(
    value: NativePropValue | undefined,
    lineNames?: Map<string, number[]>,
    explicitLineCount?: number,
): number | undefined {
    const resolveNumericLine = (lineIndex: number): number | undefined => {
        if (!Number.isInteger(lineIndex) || lineIndex === 0) {
            return undefined;
        }

        if (lineIndex > 0) {
            return lineIndex;
        }

        if (explicitLineCount === undefined || explicitLineCount <= 0) {
            return undefined;
        }

        const resolvedIndex = explicitLineCount + lineIndex + 1;
        return resolvedIndex >= 1 && resolvedIndex <= explicitLineCount ? resolvedIndex : undefined;
    };

    if (typeof value === 'number') {
        return resolveNumericLine(value);
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim().toLowerCase();
    if (!trimmed || trimmed === 'auto') {
        return undefined;
    }

    const match = trimmed.match(/^(-?\d+)$/);
    if (match) {
        return resolveNumericLine(Number(match[1]));
    }

    const namedLineMatch = trimmed.match(/^([_a-z][-_a-z0-9]*)(?:\s+(-?\d+))?$|^(-?\d+)\s+([_a-z][-_a-z0-9]*)$/i);
    if (!namedLineMatch) {
        return undefined;
    }

    const lineName = (namedLineMatch[1] ?? namedLineMatch[4])?.toLowerCase();
    const occurrence = Number(namedLineMatch[2] ?? namedLineMatch[3] ?? '1');
    if (!lineName || !Number.isFinite(occurrence) || occurrence === 0) {
        return undefined;
    }

    const namedLines = lineNames?.get(lineName);
    if (!namedLines || namedLines.length === 0) {
        return undefined;
    }

    if (occurrence > 0) {
        return namedLines.length >= occurrence ? namedLines[occurrence - 1] : undefined;
    }

    const reverseIndex = namedLines.length + occurrence;
    return reverseIndex >= 0 ? namedLines[reverseIndex] : undefined;
}

export function parseNativeGridSpanValue(value: NativePropValue | undefined): number | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const match = value.trim().toLowerCase().match(/^span\s+(\d+)$/);
    return match ? Math.max(1, Number(match[1])) : undefined;
}

export function resolveNativeGridPlacementValue(
    value: NativePropValue | undefined,
    lineNames?: Map<string, number[]>,
    explicitLineCount?: number,
): { start?: number; span: number } | undefined {
    const directStart = parseNativeGridLineIndexValue(value, lineNames, explicitLineCount);
    if (directStart !== undefined) {
        return { start: directStart, span: 1 };
    }

    const directSpan = parseNativeGridSpanValue(value);
    if (directSpan !== undefined) {
        return { span: directSpan };
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const tokens = value.split('/').map((entry) => entry.trim()).filter(Boolean);
    if (tokens.length === 0) {
        return undefined;
    }

    const firstStart = parseNativeGridLineIndexValue(tokens[0], lineNames, explicitLineCount);
    const firstSpan = parseNativeGridSpanValue(tokens[0]);
    const secondStart = tokens[1] ? parseNativeGridLineIndexValue(tokens[1], lineNames, explicitLineCount) : undefined;
    const secondSpan = tokens[1] ? parseNativeGridSpanValue(tokens[1]) : undefined;
    const start = firstStart ?? secondStart;
    const span = secondSpan
        ?? firstSpan
        ?? (firstStart !== undefined && secondStart !== undefined ? Math.max(1, secondStart - firstStart) : 1);

    return start !== undefined || span !== 1
        ? { ...(start !== undefined ? { start } : {}), span }
        : undefined;
}

export function resolveNativeGridAreaPlacement(
    value: NativePropValue | undefined,
    rowLineNames?: Map<string, number[]>,
    columnLineNames?: Map<string, number[]>,
    rowExplicitLineCount?: number,
    columnExplicitLineCount?: number,
): { rowPlacement?: { start?: number; span: number }; columnPlacement?: { start?: number; span: number } } | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const tokens = value.split('/').map((entry) => entry.trim()).filter(Boolean);
    if (tokens.length < 2) {
        return undefined;
    }

    const rowStart = parseNativeGridLineIndexValue(tokens[0], rowLineNames, rowExplicitLineCount);
    const columnStart = parseNativeGridLineIndexValue(tokens[1], columnLineNames, columnExplicitLineCount);
    const rowEnd = tokens[2] ? parseNativeGridLineIndexValue(tokens[2], rowLineNames, rowExplicitLineCount) : undefined;
    const rowSpan = tokens[2] ? parseNativeGridSpanValue(tokens[2]) : undefined;
    const columnEnd = tokens[3] ? parseNativeGridLineIndexValue(tokens[3], columnLineNames, columnExplicitLineCount) : undefined;
    const columnSpan = tokens[3] ? parseNativeGridSpanValue(tokens[3]) : undefined;

    const rowPlacement = rowStart !== undefined || rowEnd !== undefined || rowSpan !== undefined
        ? {
            ...(rowStart !== undefined ? { start: rowStart } : {}),
            span: rowSpan ?? (rowStart !== undefined && rowEnd !== undefined ? Math.max(1, rowEnd - rowStart) : 1),
        }
        : undefined;
    const columnPlacement = columnStart !== undefined || columnEnd !== undefined || columnSpan !== undefined
        ? {
            ...(columnStart !== undefined ? { start: columnStart } : {}),
            span: columnSpan ?? (columnStart !== undefined && columnEnd !== undefined ? Math.max(1, columnEnd - columnStart) : 1),
        }
        : undefined;

    return rowPlacement || columnPlacement
        ? {
            ...(rowPlacement ? { rowPlacement } : {}),
            ...(columnPlacement ? { columnPlacement } : {}),
        }
        : undefined;
}
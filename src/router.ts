/**
 * Elit - Router - Client-side routing
 */

import type { VNode, Child, Props, State } from './types';
import { domNode } from './dom';

export interface Route {
    path: string;
    component: (params: RouteParams) => VNode | Child;
    beforeEnter?: (to: RouteLocation, from: RouteLocation | null) => boolean | string | void;
}

export interface RouteParams {
    [key: string]: string;
}

export interface RouteLocation {
    path: string;
    params: RouteParams;
    query: Record<string, string>;
    hash: string;
}

export interface RouterOptions {
    mode?: 'history' | 'hash';
    base?: string;
    routes: Route[];
    notFound?: (params: RouteParams) => VNode | Child;
}

export interface Router {
    currentRoute: State<RouteLocation>;
    push: (path: string) => void;
    replace: (path: string) => void;
    back: () => void;
    forward: () => void;
    go: (delta: number) => void;
    beforeEach: (guard: (to: RouteLocation, from: RouteLocation | null) => boolean | string | void) => void;
    destroy: () => void;
}

// Helper to match route
function matchRoute(pattern: string, path: string): RouteParams | null {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (pattern.endsWith('*')) {
        const basePattern = pattern.slice(0, -1);
        if (path.startsWith(basePattern) || basePattern === '/' || pattern === '*') {
            return { '*': path.slice(basePattern.length) };
        }
    }

    if (patternParts.length !== pathParts.length) return null;

    const params: RouteParams = {};
    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const pathPart = pathParts[i];

        if (patternPart.startsWith(':')) {
            params[patternPart.slice(1)] = decodeURIComponent(pathPart);
        } else if (patternPart !== pathPart) {
            return null;
        }
    }
    return params;
}

export function createRouter(options: RouterOptions): Router {
    const { mode = 'history', base = '', routes } = options;
    const globalGuards: Array<(to: RouteLocation, from: RouteLocation | null) => boolean | string | void> = [];

    const parseQuery = (search: string): Record<string, string> => {
        const query: Record<string, string> = {};
        const params = new URLSearchParams(search);
        params.forEach((value, key) => { query[key] = value; });
        return query;
    };

    const getCurrentPath = (): string => {
        if (mode === 'hash') {
            return window.location.hash.slice(1) || '/';
        }
        return window.location.pathname.replace(base, '') || '/';
    };

    const parseLocation = (path: string): RouteLocation => {
        const [pathPart, queryPart = ''] = path.split('?');
        const [cleanPath, hash = ''] = pathPart.split('#');
        return {
            path: cleanPath || '/',
            params: {},
            query: parseQuery(queryPart),
            hash: hash ? '#' + hash : ''
        };
    };

    const findRoute = (path: string): { route: Route; params: RouteParams } | null => {
        for (const route of routes) {
            const params = matchRoute(route.path, path);
            if (params !== null) {
                return { route, params };
            }
        }
        return null;
    };

    const currentRoute = domNode.createState<RouteLocation>(parseLocation(getCurrentPath()));

    const navigate = (path: string, replace = false): void => {
        const location = parseLocation(path);
        const match = findRoute(location.path);

        if (match) {
            location.params = match.params;
        }

        for (const guard of globalGuards) {
            const result = guard(location, currentRoute.value);
            if (result === false) return;
            if (typeof result === 'string') {
                navigate(result, replace);
                return;
            }
        }

        if (match?.route.beforeEnter) {
            const result = match.route.beforeEnter(location, currentRoute.value);
            if (result === false) return;
            if (typeof result === 'string') {
                navigate(result, replace);
                return;
            }
        }

        const url = mode === 'hash' ? '#' + path : base + path;
        if (replace) {
            window.history.replaceState({ path }, '', url);
        } else {
            window.history.pushState({ path }, '', url);
        }

        currentRoute.value = location;
    };

    const handlePopState = (): void => {
        const path = getCurrentPath();
        const location = parseLocation(path);
        const match = findRoute(location.path);
        if (match) {
            location.params = match.params;
        }
        currentRoute.value = location;
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('popstate', handlePopState);
    }

    return {
        currentRoute,
        push: (path: string) => navigate(path, false),
        replace: (path: string) => navigate(path, true),
        back: () => window.history.back(),
        forward: () => window.history.forward(),
        go: (delta: number) => window.history.go(delta),
        beforeEach: (guard) => { globalGuards.push(guard); },
        destroy: () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('popstate', handlePopState);
            }
            currentRoute.destroy();
        }
    };
}

// RouterView component - renders current route
export function createRouterView(router: Router, options: RouterOptions): () => VNode {
    const { routes, notFound } = options;

    return (): VNode => {
        const location = router.currentRoute.value;
        const match = routes.find(r => matchRoute(r.path, location.path) !== null);

        if (match) {
            const params = matchRoute(match.path, location.path) || {};
            const component = match.component({ ...params, ...location.query });
            if (typeof component === 'object' && component !== null && 'tagName' in component) {
                return component as VNode;
            }
            return { tagName: 'span', props: {}, children: [component] };
        }

        if (notFound) {
            const component = notFound(location.params);
            if (typeof component === 'object' && component !== null && 'tagName' in component) {
                return component as VNode;
            }
            return { tagName: 'span', props: {}, children: [component] };
        }

        return { tagName: 'div', props: {}, children: ['404 - Not Found'] };
    };
}

// Link component - prevents default and uses router
export const routerLink = (router: Router, props: Props & { to: string }, ...children: Child[]): VNode => {
    return {
        tagName: 'a',
        props: {
            ...props,
            href: props.to,
            onclick: (e: MouseEvent) => {
                e.preventDefault();
                router.push(props.to);
            }
        },
        children
    };
};

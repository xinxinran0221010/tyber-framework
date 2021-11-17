import * as Koa from 'koa';
import * as LRUCache from 'lru-cache';
import {isNil, isRegExp, forEach} from 'lodash';
import {URL} from 'url';
import {FieldValidator} from "./validation";
import {IMiddleware, RequestMethods} from "@constants";

type RouterHandlerFunction = (context: Koa.Context, next: Koa.Next, paramMethods: CallableFunction[]) => unknown;
type ServiceHandlerFunction = (todoName: string) => RouterHandlerFunction;

interface RouterCompilerInfo {
    regx: RegExp;
    params: string[];
    staticParts: string[];
    directPattern: boolean;
    treeSaveDepth: number;
}

interface RouterRegisterInfo extends RouterCompilerInfo {
    paramCount: number;
    name: string;
    handler: RouterHandlerFunction;
    routeExtInfo?: RouterExtendInfo;
}

interface RouterExtendInfo {
    validator?: FieldValidator,
    middlewareInfo?: { [middlewareName: string]: unknown[] },
    currentMiddleware?: IMiddleware[],
    paramMethods: CallableFunction[];
}
interface RouterTree {
    '#'? : RouterNodeInfo[],
    '#parent'? : RouterTree,
    [key : string] : RouterTree | RouterNodeInfo[],
}
interface RouterNodeInfo extends RouterCompilerInfo {
    routerSign: string;
    methodRouters: Map<RequestMethods, RouterRegisterInfo>;
}

interface RouteInfo {
    route: RouterRegisterInfo;
    params: Record<string, unknown>;
    errorCode?: 404 | 405;
}

class Router {
    private reqCache: LRUCache<string, RouteInfo> = new LRUCache({max: 2000});
    private routes: {[key : string]: RouterRegisterInfo} = {};
    private routesTree: RouterTree = {};
    private serviceHandler: ServiceHandlerFunction;
    private readonly routerName;

    constructor(name: string) {
        this.routerName = name;
    }

    setServiceHandler(serviceHandler: ServiceHandlerFunction): void {
        this.serviceHandler = serviceHandler;
    }

    registerUrl(method: string, urlPattern: string, handler: string | RouterHandlerFunction, routeExtInfo: RouterExtendInfo): void {
        if (!urlPattern || typeof urlPattern !== 'string') {
            throw new Error(`[router error][${this.routerName}]need string path`);
        }

        if (!this.serviceHandler || typeof this.serviceHandler !== 'function') {
            throw new Error(`[router error][${this.routerName}]need serviceHandler function, but got a :${typeof this.serviceHandler}`);
        }

        if (!handler || typeof handler !== 'function') {
            if (typeof handler !== 'string') {
                throw new Error(`[router error][${this.routerName}]need function handler`);
            } else {
                handler = this.serviceHandler(handler);
            }
        }

        const routerCompilerInfo: RouterCompilerInfo = Router.compileUrlPattern(urlPattern);
        const routerSignature = routerCompilerInfo.staticParts.join('-');
        const router: RouterRegisterInfo = {
            ...routerCompilerInfo,
            name: `${method}-${routerSignature}-${routerCompilerInfo.params.length}`,
            handler,
            routeExtInfo,
            paramCount: routerCompilerInfo.params.length
        };

        if (this.routes[router.name]) {
            throw new Error(`[router error][${this.routerName}]duplicate urlPattern : ${urlPattern}`);
        }

        let nowTreeBranch: RouterTree | RouterNodeInfo[] = this.routesTree;
        router.staticParts.forEach((staticPart, index) => {
            if (index < router.treeSaveDepth) {
                if (!nowTreeBranch[staticPart]) {
                    nowTreeBranch[staticPart] = {
                        '#parent': nowTreeBranch,
                        '#': [],
                    };
                    nowTreeBranch = nowTreeBranch[staticPart];
                } else {
                    nowTreeBranch = nowTreeBranch[staticPart];
                }
            }
        });
        const branchRoutes = nowTreeBranch['#'] = nowTreeBranch['#'] || [];
        const routerNode: RouterNodeInfo = branchRoutes.filter(r => r.routerSign === routerSignature)[0] || {
            ...routerCompilerInfo,
            routerSign: routerSignature,
            methodRouters: new Map<RequestMethods, RouterRegisterInfo>()
        };
        if (!routerNode.methodRouters.size) {
            branchRoutes.push(routerNode);
        }
        routerNode.methodRouters.set(RequestMethods[method.toUpperCase()], router);
        this.routes[router.name] = router;
    }

    private static compileUrlPattern(url: string | RegExp): RouterCompilerInfo {
        if (isRegExp(url)) {
            return {
                regx: url,
                directPattern: true,
                staticParts: [],
                params: [],
                treeSaveDepth: 0,
            };
        }

        const params = [], staticParts = [];
        const pureUrl = new URL(url, 'tyber://framework').pathname;
        let pattern = '^';
        let savedDepth = -1;
        let paramPathConfigured = false;

        pureUrl.split('/').forEach((part, index) => {
            if (part.length <= 0)
                return false;

            pattern += '\\/+';
            if (part.charAt(0) === ':') {
                const patternInfo = /^:(?:\(([^)]+)\))?(.+)$/.exec(part);
                if (isNil(patternInfo)) {
                    throw new Error('[router error]router pattern format error');
                }

                const label = patternInfo[2];
                const subExp = patternInfo[1] || '[^/]*';

                pattern += '(' + subExp + ')';
                params.push(label);
                if (!paramPathConfigured) {
                    paramPathConfigured = true;
                }
                staticParts.push(':');
            } else {
                staticParts.push(part);
                pattern += part;
            }
            if (!paramPathConfigured) {
                savedDepth = index;
            }
            return true;
        });

        if (pattern === '^') {
            pattern += '\\/';
        }
        pattern += '$';

        return {
            regx: new RegExp(pattern),
            params,
            staticParts,
            directPattern: false,
            treeSaveDepth: savedDepth
        };
    }

    getRoute(method: RequestMethods, requestPath: string): RouteInfo {
        const cacheKey = method + '|' + requestPath;
        let nowBranch: RouterTree | RouterNodeInfo[] = this.routesTree;
        if (!nowBranch || !method) {
            return null;
        }
        let nowRoute: RouteInfo = this.reqCache.get(cacheKey);
        let tmpPath = requestPath;

        if (nowRoute) {
            return nowRoute;
        }

        if (tmpPath.charAt(0) === '/') {
            tmpPath = requestPath.substring(1);
        }

        const pathParts = tmpPath.split('/');
        pathParts.forEach(part => {
            if (nowBranch[part]) {
                nowBranch = nowBranch[part];
            } else {
                return false;
            }
        });

        let routerNodes: RouterNodeInfo[] = nowBranch['#'];
        if (!routerNodes) {
            return null;
        }

        let triggerErrorMethod = false;
        while (!nowRoute && routerNodes) {
            forEach(routerNodes, rNode => {
                if (triggerErrorMethod) return false;
                const info = rNode.regx.exec(requestPath), routeParameters = {};
                if (info && !nowRoute) {
                    const r: RouterRegisterInfo = rNode.methodRouters.get(method);
                    if (!r) {
                        triggerErrorMethod = true;
                        nowRoute = {
                            route: null,
                            params: null,
                            errorCode: 405
                        };
                        return false;
                    }
                    r.params.forEach((paramName, index) => {
                        routeParameters[paramName] = info[index + 1];
                    });

                    nowRoute = {
                        route: r,
                        params: routeParameters
                    };
                    return false;
                }
            });
            if (!nowRoute) {
                nowBranch = nowBranch['#parent'];
                routerNodes = nowBranch && nowBranch['#'];
            }
        }

        if (!nowRoute) {
            return null;
        }
        this.reqCache.set(cacheKey, nowRoute);

        return nowRoute;
    }
}

// noinspection JSUnusedGlobalSymbols
class RouterRegister {
    private static innerInstanceMap: Map<string, RouterRegister> = new Map<string, RouterRegister>();

    private routerCache: Map<string, Router> = new Map<string, Router>();
    private readonly nowContext: string = 'default';
    private nowRouter: Router;
    private activeServiceHandler: ServiceHandlerFunction;

    private constructor(contextName?: string) {
        if (contextName) {
            this.nowContext = contextName;
        }
    }

    static getRegister(contextName = 'default'): RouterRegister {
        let contextInstance = RouterRegister.innerInstanceMap.get(contextName);
        if (!contextInstance) {
            contextInstance = new RouterRegister(contextName);
            RouterRegister.innerInstanceMap.set(contextName, contextInstance);
            contextInstance.initContext();
        }
        return contextInstance;
    }

    reset(): void {
        this.routerCache.clear();
        this.activeServiceHandler = null;
        this.initContext();
    }

    getRouter(): Router {
        return this.nowRouter;
    }

    initServiceHandler(handler: ServiceHandlerFunction, force?: boolean): void {
        if (this.activeServiceHandler && !force) {
            throw new Error('[RouteRegister init] service handler is already set.Please use force param to set a new one.');
        }
        this.activeServiceHandler = handler;
        this.routerCache.forEach(r => r.setServiceHandler(handler));
    }

    private initContext(): void {
        this.nowRouter = this.routerCache.get(this.nowContext);
        if (!this.nowRouter) {
            this.nowRouter = new Router(this.nowContext);
            if (this.activeServiceHandler) {
                this.nowRouter.setServiceHandler(this.activeServiceHandler);
            }
            this.routerCache.set(this.nowContext, this.nowRouter);
        }
    }

    private registerInChain(method: string, urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        const registerChain = new RegisterChainCaller(this.nowRouter, method, urlPattern, handler, routeExtInfo);

        if (urlPattern && handler) {
            this.nowRouter.registerUrl(method, urlPattern, handler, routeExtInfo);
        }

        return registerChain;
    }

    // noinspection JSUnusedGlobalSymbols
    chain(): RegisterChainCaller {
        return new RegisterChainCaller(this.nowRouter);
    }

    // noinspection JSUnusedGlobalSymbols
    get(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.registerInChain(RequestMethods.GET, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    post(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.registerInChain(RequestMethods.POST, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    put(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.registerInChain(RequestMethods.PUT, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    delete(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.registerInChain(RequestMethods.DELETE, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    patch(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.registerInChain(RequestMethods.PATCH, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    head(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.registerInChain(RequestMethods.HEAD, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    options(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.registerInChain(RequestMethods.OPTIONS, urlPattern, handler, routeExtInfo);
    }
}

class RegisterChainCaller {
    private router: Router;
    private methods: string[] = [];
    private usedMethods: string[] = [];
    private urlPattern: string;
    private handler: string | RouterHandlerFunction;
    private routeExtInfo: RouterExtendInfo;

    constructor(router: Router, startMethod?: string, urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo) {
        this.router = router;
        if (routeExtInfo) {
            this.routeExtInfo = routeExtInfo;
        }
        if (!urlPattern || !handler) {
            this.methods.push(startMethod);
        } else {
            this.usedMethods.push(startMethod);
        }
    }

    private callInChain(continueMethod: string, urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        if (~this.usedMethods.indexOf(continueMethod)) {
            return this;
        }
        if (!~this.methods.indexOf(continueMethod)) {
            this.methods.push(continueMethod);
        }

        this.urlPattern = this.urlPattern || urlPattern;
        this.handler = this.handler || handler;
        this.routeExtInfo = this.routeExtInfo || routeExtInfo;

        if (this.urlPattern && this.handler) {
            this.methods.forEach(m => {
                this.router.registerUrl(m, this.urlPattern, this.handler, this.routeExtInfo);
                this.usedMethods.push(m);
            });

            this.methods.length = 0;
        }
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    resetChain() {
        this.usedMethods = [];
        this.methods = [];
        this.handler = null;
        this.urlPattern = null;
    }

    // noinspection JSUnusedGlobalSymbols
    get(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.callInChain(RequestMethods.GET, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    post(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.callInChain(RequestMethods.POST, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    put(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.callInChain(RequestMethods.PUT, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    delete(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.callInChain(RequestMethods.DELETE, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    patch(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.callInChain(RequestMethods.PATCH, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    head(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.callInChain(RequestMethods.HEAD, urlPattern, handler, routeExtInfo);
    }

    // noinspection JSUnusedGlobalSymbols
    options(urlPattern?: string, handler?: string | RouterHandlerFunction, routeExtInfo?: RouterExtendInfo): RegisterChainCaller {
        return this.callInChain(RequestMethods.OPTIONS, urlPattern, handler, routeExtInfo);
    }
}
export {RouterRegister};

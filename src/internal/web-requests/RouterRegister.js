"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterRegister = void 0;
const LRUCache = require("lru-cache");
const lodash_1 = require("lodash");
const url_1 = require("url");
const _constants_1 = require("@constants");
class Router {
    constructor(name) {
        this.reqCache = new LRUCache({ max: 2000 });
        this.routes = {};
        this.routesTree = {};
        this.routerName = name;
    }
    setServiceHandler(serviceHandler) {
        this.serviceHandler = serviceHandler;
    }
    registerUrl(method, urlPattern, handler, routeExtInfo) {
        if (!urlPattern || typeof urlPattern !== 'string') {
            throw new Error(`[router error][${this.routerName}]need string path`);
        }
        if (!this.serviceHandler || typeof this.serviceHandler !== 'function') {
            throw new Error(`[router error][${this.routerName}]need serviceHandler function, but got a :${typeof this.serviceHandler}`);
        }
        if (!handler || typeof handler !== 'function') {
            if (typeof handler !== 'string') {
                throw new Error(`[router error][${this.routerName}]need function handler`);
            }
            else {
                handler = this.serviceHandler(handler);
            }
        }
        const routerCompilerInfo = Router.compileUrlPattern(urlPattern);
        const routerSignature = routerCompilerInfo.staticParts.join('-');
        const router = Object.assign(Object.assign({}, routerCompilerInfo), { name: `${method}-${routerSignature}-${routerCompilerInfo.params.length}`, handler,
            routeExtInfo, paramCount: routerCompilerInfo.params.length });
        if (this.routes[router.name]) {
            throw new Error(`[router error][${this.routerName}]duplicate urlPattern : ${urlPattern}`);
        }
        let nowTreeBranch = this.routesTree;
        router.staticParts.forEach((staticPart, index) => {
            if (index < router.treeSaveDepth) {
                if (!nowTreeBranch[staticPart]) {
                    nowTreeBranch[staticPart] = {
                        '#parent': nowTreeBranch,
                        '#': [],
                    };
                    nowTreeBranch = nowTreeBranch[staticPart];
                }
                else {
                    nowTreeBranch = nowTreeBranch[staticPart];
                }
            }
        });
        const branchRoutes = nowTreeBranch['#'] = nowTreeBranch['#'] || [];
        const routerNode = branchRoutes.filter(r => r.routerSign === routerSignature)[0] || Object.assign(Object.assign({}, routerCompilerInfo), { routerSign: routerSignature, methodRouters: new Map() });
        if (!routerNode.methodRouters.size) {
            branchRoutes.push(routerNode);
        }
        routerNode.methodRouters.set(_constants_1.RequestMethods[method.toUpperCase()], router);
        this.routes[router.name] = router;
    }
    static compileUrlPattern(url) {
        if (lodash_1.isRegExp(url)) {
            return {
                regx: url,
                directPattern: true,
                staticParts: [],
                params: [],
                treeSaveDepth: 0,
            };
        }
        const params = [], staticParts = [];
        const pureUrl = new url_1.URL(url, 'tyber://framework').pathname;
        let pattern = '^';
        let savedDepth = -1;
        let paramPathConfigured = false;
        pureUrl.split('/').forEach((part, index) => {
            if (part.length <= 0)
                return false;
            pattern += '\\/+';
            if (part.charAt(0) === ':') {
                const patternInfo = /^:(?:\(([^)]+)\))?(.+)$/.exec(part);
                if (lodash_1.isNil(patternInfo)) {
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
            }
            else {
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
    getRoute(method, requestPath) {
        const cacheKey = method + '|' + requestPath;
        let nowBranch = this.routesTree;
        if (!nowBranch || !method) {
            return null;
        }
        let nowRoute = this.reqCache.get(cacheKey);
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
            }
            else {
                return false;
            }
        });
        let routerNodes = nowBranch['#'];
        if (!routerNodes) {
            return null;
        }
        let triggerErrorMethod = false;
        while (!nowRoute && routerNodes) {
            lodash_1.forEach(routerNodes, rNode => {
                if (triggerErrorMethod)
                    return false;
                const info = rNode.regx.exec(requestPath), routeParameters = {};
                if (info && !nowRoute) {
                    const r = rNode.methodRouters.get(method);
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
class RouterRegister {
    constructor(contextName) {
        this.routerCache = new Map();
        this.nowContext = 'default';
        if (contextName) {
            this.nowContext = contextName;
        }
    }
    static getRegister(contextName = 'default') {
        let contextInstance = RouterRegister.innerInstanceMap.get(contextName);
        if (!contextInstance) {
            contextInstance = new RouterRegister(contextName);
            RouterRegister.innerInstanceMap.set(contextName, contextInstance);
            contextInstance.initContext();
        }
        return contextInstance;
    }
    reset() {
        this.routerCache.clear();
        this.activeServiceHandler = null;
        this.initContext();
    }
    getRouter() {
        return this.nowRouter;
    }
    initServiceHandler(handler, force) {
        if (this.activeServiceHandler && !force) {
            throw new Error('[RouteRegister init] service handler is already set.Please use force param to set a new one.');
        }
        this.activeServiceHandler = handler;
        this.routerCache.forEach(r => r.setServiceHandler(handler));
    }
    initContext() {
        this.nowRouter = this.routerCache.get(this.nowContext);
        if (!this.nowRouter) {
            this.nowRouter = new Router(this.nowContext);
            if (this.activeServiceHandler) {
                this.nowRouter.setServiceHandler(this.activeServiceHandler);
            }
            this.routerCache.set(this.nowContext, this.nowRouter);
        }
    }
    registerInChain(method, urlPattern, handler, routeExtInfo) {
        const registerChain = new RegisterChainCaller(this.nowRouter, method, urlPattern, handler, routeExtInfo);
        if (urlPattern && handler) {
            this.nowRouter.registerUrl(method, urlPattern, handler, routeExtInfo);
        }
        return registerChain;
    }
    chain() {
        return new RegisterChainCaller(this.nowRouter);
    }
    get(urlPattern, handler, routeExtInfo) {
        return this.registerInChain(_constants_1.RequestMethods.GET, urlPattern, handler, routeExtInfo);
    }
    post(urlPattern, handler, routeExtInfo) {
        return this.registerInChain(_constants_1.RequestMethods.POST, urlPattern, handler, routeExtInfo);
    }
    put(urlPattern, handler, routeExtInfo) {
        return this.registerInChain(_constants_1.RequestMethods.PUT, urlPattern, handler, routeExtInfo);
    }
    delete(urlPattern, handler, routeExtInfo) {
        return this.registerInChain(_constants_1.RequestMethods.DELETE, urlPattern, handler, routeExtInfo);
    }
    patch(urlPattern, handler, routeExtInfo) {
        return this.registerInChain(_constants_1.RequestMethods.PATCH, urlPattern, handler, routeExtInfo);
    }
    head(urlPattern, handler, routeExtInfo) {
        return this.registerInChain(_constants_1.RequestMethods.HEAD, urlPattern, handler, routeExtInfo);
    }
    options(urlPattern, handler, routeExtInfo) {
        return this.registerInChain(_constants_1.RequestMethods.OPTIONS, urlPattern, handler, routeExtInfo);
    }
}
exports.RouterRegister = RouterRegister;
RouterRegister.innerInstanceMap = new Map();
class RegisterChainCaller {
    constructor(router, startMethod, urlPattern, handler, routeExtInfo) {
        this.methods = [];
        this.usedMethods = [];
        this.router = router;
        if (routeExtInfo) {
            this.routeExtInfo = routeExtInfo;
        }
        if (!urlPattern || !handler) {
            this.methods.push(startMethod);
        }
        else {
            this.usedMethods.push(startMethod);
        }
    }
    callInChain(continueMethod, urlPattern, handler, routeExtInfo) {
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
    resetChain() {
        this.usedMethods = [];
        this.methods = [];
        this.handler = null;
        this.urlPattern = null;
    }
    get(urlPattern, handler, routeExtInfo) {
        return this.callInChain(_constants_1.RequestMethods.GET, urlPattern, handler, routeExtInfo);
    }
    post(urlPattern, handler, routeExtInfo) {
        return this.callInChain(_constants_1.RequestMethods.POST, urlPattern, handler, routeExtInfo);
    }
    put(urlPattern, handler, routeExtInfo) {
        return this.callInChain(_constants_1.RequestMethods.PUT, urlPattern, handler, routeExtInfo);
    }
    delete(urlPattern, handler, routeExtInfo) {
        return this.callInChain(_constants_1.RequestMethods.DELETE, urlPattern, handler, routeExtInfo);
    }
    patch(urlPattern, handler, routeExtInfo) {
        return this.callInChain(_constants_1.RequestMethods.PATCH, urlPattern, handler, routeExtInfo);
    }
    head(urlPattern, handler, routeExtInfo) {
        return this.callInChain(_constants_1.RequestMethods.HEAD, urlPattern, handler, routeExtInfo);
    }
    options(urlPattern, handler, routeExtInfo) {
        return this.callInChain(_constants_1.RequestMethods.OPTIONS, urlPattern, handler, routeExtInfo);
    }
}
//# sourceMappingURL=RouterRegister.js.map
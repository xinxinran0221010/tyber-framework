"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestDispatcher = void 0;
const url_1 = require("url");
const lodash_1 = require("lodash");
const RouterRegister_1 = require("./RouterRegister");
const _response_1 = require("@response");
const _exceptions_1 = require("@exceptions");
const _constants_1 = require("@constants");
const postprocessors_1 = require("../postprocessors");
const AbsoluteDispatcher_1 = require("./AbsoluteDispatcher");
class RequestDispatcher extends AbsoluteDispatcher_1.AbsoluteDispatcher {
    constructor() {
        super();
        this.routerRegister = RouterRegister_1.RouterRegister.getRegister();
        this.targetCache = new Map();
        this.routerRegister.initServiceHandler((processorName) => {
            let targetService = this.targetCache.get(processorName);
            if (!targetService) {
                const [serviceName, funcName] = processorName.split('.');
                targetService = this.doService.bind(null, serviceName, funcName);
                this.targetCache.set(processorName, targetService);
            }
            return targetService;
        });
    }
    makeDispatcher() {
        return async (ctx, next) => {
            const requestPath = new url_1.URL(ctx.originalUrl, 'tyber://framework').pathname || '/';
            const queryMethod = _constants_1.RequestMethods[lodash_1.toUpper(ctx.method)];
            if (!queryMethod) {
                return ctx.throw(405, `Invalid request method: ${ctx.method}`);
            }
            const targetRoute = this.routerRegister.getRouter().getRoute(queryMethod, requestPath);
            if (!targetRoute) {
                return ctx.throw(404, 'Resource not found for [' + ctx.originalUrl + ']');
            }
            if (targetRoute.errorCode === 405) {
                return ctx.throw(405, `Invalid request method: ${ctx.method}`);
            }
            const requestParameters = Object.assign({}, ctx.request.body, ctx.query);
            const routeParameters = targetRoute.params;
            ctx.requestParameters = requestParameters;
            ctx.routeParameters = routeParameters;
            try {
                const routeExtInfo = targetRoute.route.routeExtInfo;
                const middlewareInfo = routeExtInfo && routeExtInfo.middlewareInfo || {};
                if (!routeExtInfo.currentMiddleware) {
                    const middlewareKeys = Object.keys(middlewareInfo);
                    routeExtInfo.currentMiddleware = postprocessors_1.MiddlewareManager.instance().getActiveMiddleware(middlewareKeys);
                }
                const orderedMiddleware = routeExtInfo.currentMiddleware;
                let passMiddleware = true;
                if (orderedMiddleware.length) {
                    lodash_1.forEach(orderedMiddleware, middleware => {
                        if (!passMiddleware)
                            return;
                        const args = [ctx, ...(middlewareInfo[middleware.alias] || [])];
                        passMiddleware = passMiddleware && middleware.beforeProcessing.apply(middleware, args);
                    });
                }
                if (!passMiddleware) {
                    return await next();
                }
                if (routeExtInfo && routeExtInfo.validator) {
                    const targetValidator = routeExtInfo.validator.clone();
                    targetValidator.prepareData(Object.assign({}, ctx.requestParameters, ctx.routeParameters));
                    if (!targetValidator.valid) {
                        throw new _exceptions_1.ValidationError(targetValidator.getErrorMessageInfo());
                    }
                }
                const paramMethods = routeExtInfo && routeExtInfo.paramMethods || [];
                const handleResult = await targetRoute.route.handler(ctx, next, paramMethods);
                if (lodash_1.isUndefined(handleResult) || handleResult === ctx) {
                    if (ctx.toNext) {
                        await next();
                    }
                }
                else if (lodash_1.isString(handleResult)) {
                    if (handleResult.startsWith('redirect:')) {
                        ctx.redirect(handleResult.substring(9));
                    }
                    else if (handleResult.startsWith('redirect-permanent:')) {
                        ctx.status = 301;
                        ctx.redirect(handleResult.substring(19));
                        ctx.body = 'Now forwarding ...';
                    }
                    else {
                        ctx.body = { code: 'SUCCESS', msg: 'OK', body: handleResult };
                    }
                }
                else if (lodash_1.isObjectLike(handleResult)) {
                    if (handleResult instanceof _response_1.BaseResponse) {
                        ctx.status = handleResult.status;
                        ctx.body = handleResult.body;
                    }
                    else {
                        ctx.body = handleResult;
                    }
                }
                else {
                    ctx.body = new _response_1.BaseResponse(handleResult).body;
                }
                if (orderedMiddleware.length) {
                    lodash_1.forEachRight(orderedMiddleware, middleware => {
                        if (!passMiddleware)
                            return;
                        const args = [ctx, ...(middlewareInfo[middleware.alias] || [])];
                        passMiddleware = passMiddleware && middleware.afterProcessing.apply(middleware, args);
                    });
                }
            }
            catch (e) {
                if (e instanceof _exceptions_1.BaseHttpError) {
                    ctx.status = e.getStatusCode();
                    ctx.body = e.getErrorResponseBody();
                }
                else {
                    ctx.throw(500, e);
                }
            }
        };
    }
    onServerClose() {
        this.routerRegister.reset();
    }
}
exports.RequestDispatcher = RequestDispatcher;
//# sourceMappingURL=RequestDispatcher.js.map
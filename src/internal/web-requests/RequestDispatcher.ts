import * as Koa from 'koa';
import {URL} from 'url';
import {toUpper, isUndefined, isString, isObjectLike, forEach, forEachRight} from 'lodash';
import {RouterRegister} from './RouterRegister';
import {BaseResponse} from '@response';
import {BaseHttpError, ValidationError} from "@exceptions";
import {CONTEXT_BODY_SYMBOL, IMiddleware, RequestMethods} from "@constants";
import {MiddlewareManager} from "../postprocessors";
import {AbsoluteDispatcher} from "./AbsoluteDispatcher";
import {IShutdownListener} from "../IShutdownable";

export class RequestDispatcher extends AbsoluteDispatcher implements IShutdownListener {
    private routerRegister: RouterRegister = RouterRegister.getRegister();
    private targetCache: Map<string, () => unknown> = new Map<string, () => unknown>();

    constructor() {
        super();
        this.routerRegister.initServiceHandler((processorName: string) => {
            let targetService = this.targetCache.get(processorName);

            if (!targetService) {
                const [serviceName, funcName] = processorName.split('.');
                targetService = this.doService.bind(null, serviceName, funcName);
                this.targetCache.set(processorName, targetService);
            }

            return targetService;
        });
    }

    makeDispatcher(): Koa.Middleware {
        return async (ctx, next) => {
            const requestPath = new URL(ctx.originalUrl, 'tyber://framework').pathname || '/';
            const queryMethod: RequestMethods = RequestMethods[toUpper(ctx.method)];
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

            const requestBodyObject = Object.assign({}, ctx.requestParameters, ctx.routeParameters);
            ctx[CONTEXT_BODY_SYMBOL] = requestBodyObject;

            try {
                const routeExtInfo = targetRoute.route.routeExtInfo;
                const middlewareInfo = routeExtInfo && routeExtInfo.middlewareInfo || {};
                if (!routeExtInfo.currentMiddleware) {
                    const middlewareKeys: string[] = Object.keys(middlewareInfo);
                    routeExtInfo.currentMiddleware = MiddlewareManager.instance().getActiveMiddleware(middlewareKeys);
                }
                const orderedMiddleware: IMiddleware[] = routeExtInfo.currentMiddleware;
                let passMiddleware = true;
                if (orderedMiddleware.length) {
                    forEach(orderedMiddleware, middleware => {
                        if (!passMiddleware) return;
                        const args = [ctx, ...(middlewareInfo[middleware.alias] || [])];
                        // eslint-disable-next-line prefer-spread
                        passMiddleware = passMiddleware && middleware.beforeProcessing.apply(middleware, args);
                    });
                }

                if (!passMiddleware) {
                    return await next();
                }

                if (routeExtInfo && routeExtInfo.validator) {
                    const targetValidator = routeExtInfo.validator.clone();
                    targetValidator.prepareData(requestBodyObject);
                    if (!targetValidator.valid) {
                        // noinspection ExceptionCaughtLocallyJS
                        throw new ValidationError(targetValidator.getErrorMessageInfo());
                    }
                }
                const paramMethods = routeExtInfo && routeExtInfo.paramMethods || [];
                const handleResult = await targetRoute.route.handler(ctx, next, paramMethods);
                if (isUndefined(handleResult) || handleResult === ctx) {
                    if (ctx.toNext) {
                        await next();
                    }
                } else if (isString(handleResult)) {
                    if (handleResult.startsWith('redirect:')) {
                        ctx.redirect(handleResult.substring(9));
                    } else if (handleResult.startsWith('redirect-permanent:')) {
                        ctx.status = 301;
                        ctx.redirect(handleResult.substring(19));
                        ctx.body = 'Now forwarding ...';
                    } else {
                        ctx.body = {code: 'SUCCESS', msg: 'OK', body: handleResult};
                    }
                } else if (isObjectLike(handleResult)) {
                    if (handleResult instanceof BaseResponse) {
                        ctx.status = handleResult.status;
                        ctx.body = handleResult.body;
                    } else {
                        ctx.body = handleResult;
                    }
                } else {
                    ctx.body = new BaseResponse(handleResult).body;
                }

                if (orderedMiddleware.length) {
                    forEachRight(orderedMiddleware, middleware => {
                        if (!passMiddleware) return;
                        const args = [ctx, ...(middlewareInfo[middleware.alias] || [])];
                        // eslint-disable-next-line prefer-spread
                        passMiddleware = passMiddleware && middleware.afterProcessing.apply(middleware, args);
                    });
                }
            } catch (e) {
                if (e instanceof BaseHttpError) {
                    ctx.status = e.getStatusCode();
                    ctx.body = e.getErrorResponseBody();
                } else {
                    ctx.throw(500, e);
                }
            }
        }
    }

    onServerClose() {
        this.routerRegister.reset();
    }
}


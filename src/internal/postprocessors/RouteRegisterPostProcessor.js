"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteRegisterPostProcessor = void 0;
const lodash_1 = require("lodash");
const _utils_1 = require("@utils");
const _decorators_1 = require("@decorators");
const web_requests_1 = require("../web-requests");
const _constants_1 = require("@constants");
class RouteRegisterPostProcessor {
    constructor() {
        this.routeDecorators = [
            { decorator: _decorators_1.GetRouteDecorator, method: _constants_1.RequestMethods.GET },
            { decorator: _decorators_1.PostRouteDecorator, method: _constants_1.RequestMethods.POST },
            { decorator: _decorators_1.PutRouteDecorator, method: _constants_1.RequestMethods.PUT },
            { decorator: _decorators_1.DeleteRouteDecorator, method: _constants_1.RequestMethods.DELETE },
        ];
        this.logger = _utils_1.LoggerUtils.getLogger();
        this.routerRegister = web_requests_1.RouterRegister.getRegister();
    }
    processPostBean(beanName, bean) {
        if (!lodash_1.isNil(_utils_1.TypeUtils.getDecoratorInfo(bean, _decorators_1.ControllerDecorator))) {
            const baseRouteInfo = _utils_1.TypeUtils.getDecoratorInfo(bean, _decorators_1.RequestMappingDecorator);
            const basePath = baseRouteInfo && baseRouteInfo.routePath || '?';
            const methods = _utils_1.TypeUtils.getClassMethods(bean);
            methods.forEach(method => {
                const registerInfos = this.getRegisterInfo(method);
                if (registerInfos) {
                    const validationInfo = _utils_1.TypeUtils.getDecoratorInfo(method, _decorators_1.ValidateDecorator);
                    let validator = null;
                    if (validationInfo) {
                        validator = web_requests_1.Validation.compileValidator(validationInfo);
                    }
                    const handler = `${beanName}.${method.name}`;
                    const className = bean.constructor.name;
                    let paramInfo = _utils_1.TypeUtils.getDecoratorInfo(method, _decorators_1.RouteFunctionParameterDecorator);
                    if (!paramInfo) {
                        paramInfo = _utils_1.TypeUtils.getParameterInfo(method, bean, `${className}.${method.name}`);
                        _utils_1.TypeUtils.saveMetadata(_decorators_1.RouteFunctionParameterDecorator.getDecoratorSign(), paramInfo, method);
                    }
                    const requestBodyIndex = _utils_1.TypeUtils.getDecoratorInfo(method, _decorators_1.RequestBodyDecorator);
                    if (!lodash_1.isNil(requestBodyIndex) && paramInfo[requestBodyIndex]) {
                        paramInfo[requestBodyIndex].requestBody = true;
                    }
                    const contextAttributeIndexes = _utils_1.TypeUtils.getDecoratorInfo(method, _decorators_1.ContextAttributeDecorator);
                    if (contextAttributeIndexes) {
                        contextAttributeIndexes.forEach(caIndex => {
                            if (paramInfo[caIndex]) {
                                paramInfo[requestBodyIndex].contextAttribute = true;
                            }
                        });
                    }
                    const paramMethods = paramInfo.map(pInfo => {
                        if (pInfo.requestBody) {
                            if (pInfo.type.name !== 'Object') {
                                throw new Error(`[route error]requestBody argument can not be a non object type, function: ${className}.${method.name}`);
                            }
                            return ParameterInjections.requestBodyParameter;
                        }
                        if (pInfo.contextAttribute) {
                            return ParameterInjections.contextAttributeParameter.bind(null, pInfo.name);
                        }
                        if (~['ctx', 'context', 'koacontext'].indexOf(pInfo.name.toLowerCase())) {
                            if (pInfo.type.name !== 'Object') {
                                throw new Error(`[route error]context argument can not be a non object type, function: ${className}.${method.name}`);
                            }
                            return ParameterInjections.contextParameter;
                        }
                        if (~['next', 'koanext'].indexOf(pInfo.name.toLowerCase())) {
                            if (pInfo.type.name !== 'Object') {
                                throw new Error(`[route error]next argument can not be a non object type, function: ${className}.${method.name}`);
                            }
                            return ParameterInjections.nextParameter;
                        }
                        return ParameterInjections.routePathParameter.bind(null, pInfo.name, pInfo.type);
                    });
                    registerInfos.forEach(rInfo => {
                        const url = RouteRegisterPostProcessor.getRegisterUrl(basePath, rInfo.pathInfo.routePath, beanName, method.name);
                        const middlewareInfo = RouteRegisterPostProcessor.unifyMiddlewareInfo(baseRouteInfo.middleware, rInfo.pathInfo.middleware);
                        this.routerRegister[rInfo.method](url, handler, { validator, middlewareInfo, paramMethods });
                        this.logger.info(`[Route Mapping] route registration finished : ${rInfo.method.toUpperCase()}  ${url} -> ${handler}`);
                    });
                }
            });
        }
    }
    getRegisterInfo(method) {
        const result = [];
        this.routeDecorators.forEach(rd => {
            const pathInfo = _utils_1.TypeUtils.getDecoratorInfo(method, rd.decorator);
            if (!lodash_1.isNil(pathInfo)) {
                result.push({ method: rd.method, pathInfo });
            }
        });
        return result.length ? result : null;
    }
    static getRegisterUrl(basePath, routePath, beanName, methodName) {
        if (basePath === '?') {
            basePath = '';
            if (!routePath) {
                return `/${beanName}/${methodName}`;
            }
        }
        else {
            basePath = `/${lodash_1.trim(basePath, '/')}`;
        }
        routePath = `/${lodash_1.trim(routePath, '/') || methodName}`;
        return `${basePath}${routePath}`;
    }
    static unifyMiddlewareInfo(baseInfo, routeInfo) {
        if (!baseInfo && !routeInfo) {
            return null;
        }
        const baseUnifyInfo = !baseInfo ? {} : (lodash_1.isArray(baseInfo) ? baseInfo.reduce((info, mName) => {
            info[mName] = [];
            return info;
        }, {}) : baseInfo);
        const routeUnifyInfo = !routeInfo ? {} : (lodash_1.isArray(routeInfo) ? routeInfo.reduce((info, mName) => {
            info[mName] = [];
            return info;
        }, {}) : routeInfo);
        return Object.assign({}, baseUnifyInfo, routeUnifyInfo);
    }
}
exports.RouteRegisterPostProcessor = RouteRegisterPostProcessor;
class ParameterInjections {
    static requestBodyParameter(context) {
        return Object.assign({}, context.requestParameters, context.routeParameters);
    }
    static contextParameter(context) {
        return context;
    }
    static contextAttributeParameter(paramName, context) {
        return context[paramName];
    }
    static nextParameter(context, next) {
        return next;
    }
    static routePathParameter(paramName, paramType, context) {
        if (context.routeParameters && !lodash_1.isNil(context.routeParameters[paramName])) {
            const pathValue = context.routeParameters[paramName];
            if (paramType.name === 'Number') {
                return lodash_1.toNumber(pathValue);
            }
            return pathValue;
        }
        return lodash_1.noop();
    }
}
//# sourceMappingURL=RouteRegisterPostProcessor.js.map
import {isNil, trim, isArray, noop, toNumber} from 'lodash';
import {TypeUtils, LoggerUtils, ParameterInjectInfo} from '@utils';
import {
    RequestMappingDecorator,
    GetRouteDecorator,
    PostRouteDecorator,
    PutRouteDecorator,
    DeleteRouteDecorator,
    ControllerDecorator,
    ValidateDecorator,
    RequestBodyDecorator,
    ContextAttributeDecorator,
    RouteFunctionParameterDecorator,
} from '@decorators';
import {IPostBeanProcessor} from "@internal";
// noinspection ES6PreferShortImport
import {FieldValidator, RouterRegister, Validation, ValidationDescription} from "../web-requests";
import {CONTEXT_BODY_SYMBOL, KoaContext, KoaNext, RequestMethods} from "@constants";

export class RouteRegisterPostProcessor implements IPostBeanProcessor {
    private routeDecorators = [
        {decorator: GetRouteDecorator, method: RequestMethods.GET},
        {decorator: PostRouteDecorator, method: RequestMethods.POST},
        {decorator: PutRouteDecorator, method: RequestMethods.PUT},
        {decorator: DeleteRouteDecorator, method: RequestMethods.DELETE},
    ];

    private logger = LoggerUtils.getLogger();


    private readonly routerRegister: RouterRegister;

    constructor() {
        this.routerRegister = RouterRegister.getRegister();
    }

    processPostBean(beanName: string, bean: Record<string | symbol, unknown>): void {
        if (!isNil(TypeUtils.getDecoratorInfo(bean, ControllerDecorator))) {
            const baseRouteInfo = TypeUtils.getDecoratorInfo(bean, RequestMappingDecorator);
            const basePath = baseRouteInfo && baseRouteInfo.routePath || '?';
            const methods = TypeUtils.getClassMethods(bean);
            methods.forEach(method => {
                const registerInfos: RegisterInfo[] = this.getRegisterInfo(method);
                if (registerInfos) {
                    const validationInfo: ValidationDescription = TypeUtils.getDecoratorInfo(method, ValidateDecorator);
                    let validator: FieldValidator = null;
                    if (validationInfo) {
                        validator = Validation.compileValidator(validationInfo);
                    }
                    const handler = `${beanName}.${method.name}`;

                    const className = bean.constructor.name;
                    let paramInfo: ParameterInjectInfo[] = TypeUtils.getDecoratorInfo(method, RouteFunctionParameterDecorator);
                    if (!paramInfo) {
                        paramInfo = TypeUtils.getParameterInfo(method, bean, `${className}.${method.name}`);
                        TypeUtils.saveMetadata(RouteFunctionParameterDecorator.getDecoratorSign(), paramInfo, method);
                    }

                    const requestBodyIndex = TypeUtils.getDecoratorInfo(method, RequestBodyDecorator);
                    if (!isNil(requestBodyIndex) && paramInfo[requestBodyIndex]) {
                        paramInfo[requestBodyIndex].requestBody = true;
                    }
                    const contextAttributeIndexes: number[] = TypeUtils.getDecoratorInfo(method, ContextAttributeDecorator);
                    if (contextAttributeIndexes) {
                        contextAttributeIndexes.forEach(caIndex => {
                            if (paramInfo[caIndex]) {
                                paramInfo[requestBodyIndex].contextAttribute = true;
                            }
                        });
                    }
                    const paramMethods: CallableFunction[] = paramInfo.map(pInfo => {
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
                        this.routerRegister[rInfo.method](url, handler, {validator, middlewareInfo, paramMethods});
                        this.logger.info(`[Route Mapping] route registration finished : ${rInfo.method.toUpperCase()}  ${url} -> ${handler}`);
                    });
                }
            });
        }
    }

    private getRegisterInfo(method: CallableFunction): RegisterInfo[] | null {
        const result: RegisterInfo[] = [];
        this.routeDecorators.forEach(rd => {
            const pathInfo = TypeUtils.getDecoratorInfo(method, rd.decorator);
            if (!isNil(pathInfo)) {
                result.push({method: rd.method, pathInfo});
            }
        });

        return result.length ? result : null;
    }

    private static getRegisterUrl(basePath: string, routePath: string, beanName: string, methodName: string) {
        if (basePath === '?') {
            basePath = '';
            if (!routePath) {
                return `/${beanName}/${methodName}`;
            }
        } else {
            basePath = `/${trim(basePath, '/')}`;
        }
        routePath = `/${trim(routePath, '/') || methodName}`;

        return `${basePath}${routePath}`;
    }

    private static unifyMiddlewareInfo(baseInfo: string[] | { [middlewareName: string]: unknown[] }, routeInfo: string[] | { [middlewareName: string]: unknown[] }): ({ [middlewareName: string]: unknown[] }) {
        if (!baseInfo && !routeInfo) {
            return null;
        }
        const baseUnifyInfo = !baseInfo ? {} : (isArray(baseInfo) ? baseInfo.reduce((info, mName) => {
            info[mName] = [];
            return info;
        }, {}) : baseInfo);

        const routeUnifyInfo = !routeInfo ? {} : (isArray(routeInfo) ? routeInfo.reduce((info, mName) => {
            info[mName] = [];
            return info;
        }, {}) : routeInfo);

        return Object.assign({}, baseUnifyInfo, routeUnifyInfo);
    }
}

class ParameterInjections {
    static requestBodyParameter(context: KoaContext): unknown {
        if (!isNil(context[CONTEXT_BODY_SYMBOL])) {
            return context[CONTEXT_BODY_SYMBOL];
        }
        return Object.assign({}, context.requestParameters, context.routeParameters);
    }

    static contextParameter(context: KoaContext): KoaContext {
        return context;
    }

    static contextAttributeParameter(paramName: string, context: KoaContext) {
        return context[paramName];
    }

    static nextParameter(context: KoaContext, next: KoaNext) {
        return next;
    }

    static routePathParameter(paramName: string, paramType: NewableFunction, context: KoaContext): unknown {
        if (context.routeParameters && !isNil(context.routeParameters[paramName])) {
            const pathValue = context.routeParameters[paramName];
            if (paramType.name === 'Number') {
                return toNumber(pathValue);
            }
            return pathValue;
        }
        return noop();
    }
}

interface RegisterInfo {
    method: RequestMethods;
    pathInfo: { routePath: string, middleware: string[] | { [middlewareName: string]: unknown[] } };
}

import 'reflect-metadata';
import {isFunction, isNil} from 'lodash';
// noinspection TypeScriptPreferShortImport
import {IDecorator} from "@decorators";

export class TypeUtils {
    private static decoratorBeanIdsMap: Map<string, string[]> = new Map();
    private static decoratorNameSignMap: Map<string, string> = new Map();

    private static unifyTarget(target: unknown): unknown {
        if (typeof target === 'object') {
            return target.constructor && target.constructor.prototype || Object.getPrototypeOf(target);
        }

        if (typeof target === 'function') {
            return target.prototype || target;  // member method's prototype is undefined
        }

        return null;
    }

    static saveDecoratorNameSign(decorator: IDecorator): void {
        TypeUtils.decoratorNameSignMap.set(decorator.getDecoratorName(), decorator.getDecoratorSign());
    }

    static saveMetadata(key: string, value: unknown, target: unknown, beanId?: string, propertyKey?: string | symbol): void {
        if (propertyKey) {
            Reflect.defineMetadata(key, value, TypeUtils.unifyTarget(target), propertyKey);
        } else {
            Reflect.defineMetadata(key, value, TypeUtils.unifyTarget(target));
        }
        if (beanId) {
            let beanIds: string[] = TypeUtils.decoratorBeanIdsMap.get(key);
            if (!beanIds) {
                beanIds = [];
                TypeUtils.decoratorBeanIdsMap.set(key, beanIds);
            }
            beanIds.push(beanId);
        }
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    static getDecoratorInfo(target: unknown, decorator: IDecorator, defaultValue?: unknown): any {
        const decoratorInfo = Reflect.getMetadata(decorator.getDecoratorSign(), TypeUtils.unifyTarget(target));
        if (isNil(decoratorInfo) && defaultValue) {
            return defaultValue;
        }
        return decoratorInfo;
    }

    static getBeanIdsByDecorator(decoratorOrName: IDecorator | string): string[] {
        let targetKey;
        if (typeof decoratorOrName === 'string') {
            targetKey = TypeUtils.decoratorNameSignMap.get(decoratorOrName);
        } else {
            targetKey = decoratorOrName.getDecoratorSign();
        }

        return TypeUtils.decoratorBeanIdsMap.get(targetKey) || [];
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    static getSavedMetadata(key: string, target: unknown): any {
        return Reflect.getMetadata(key, TypeUtils.unifyTarget(target));
    }

    static getDefinedType(target: unknown, propertyKey?: string | symbol): NewableFunction {
        return Reflect.getMetadata("design:type", target, propertyKey);
    }

    static getClassMethods(beanOrClass: unknown): CallableFunction[] {
        const targetPrototype = TypeUtils.unifyTarget(beanOrClass);
        const methods: CallableFunction[] = [];
        if (targetPrototype) {
            Object.getOwnPropertyNames(targetPrototype).forEach((pName: string) => {
                if (pName !== 'constructor') {
                    const member = targetPrototype[pName];
                    if (isFunction(member)) {
                        methods.push(member);
                    }
                }
            });

        }
        return methods;
    }

    static isAsyncFunction(func: CallableFunction): boolean {
        const constructor = func.constructor;
        if (!constructor) {
            return false;
        }

        return constructor.name === 'AsyncFunction';
    }

    static getParameterNames(fn: CallableFunction): string[] {
        if (!isFunction(fn)) {
            return [];
        }
        const commentsRegx = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        const code = fn.toString().replace(commentsRegx, '');
        const result = code.slice(code.indexOf('(') + 1, code.indexOf(')'))
            .match(/([^\s,]+)/g);

        return result || [];
    }

    static getParameterTypes(targetObject: Record<string | symbol, unknown>, funcName: string): unknown[] {
        // noinspection SpellCheckingInspection
        return Reflect.getMetadata("design:paramtypes", targetObject, funcName);
    }

    static getParameterInfo(targetFunc: CallableFunction, targetObject: Record<string | symbol, unknown>, errorFunctionName?: string): ParameterInjectInfo[] {
        const parameterTypes = TypeUtils.getParameterTypes(targetObject, targetFunc.name);
        const parameterNames = TypeUtils.getParameterNames(targetFunc);
        if (parameterNames.length !== parameterTypes.length) {
            throw new Error(`[type error] argument type and name length are not match, function: ${errorFunctionName || targetFunc.name}`);
        }
        return parameterNames.map((name, index) => ({
            name, type: parameterTypes[index] as NewableFunction
        }));
    }
}

export interface ParameterInjectInfo {
    name: string;
    type: NewableFunction;
    requestBody?: boolean;
    contextAttribute?: boolean;
}

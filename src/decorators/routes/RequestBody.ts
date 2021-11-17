// noinspection TypeScriptPreferShortImport
import {TypeUtils} from '@utils';
import {isFunction, isNil} from 'lodash';
import {BaseDecorator} from "../BaseDecorator";

class RequestBodyDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__RequestBody_';
    }

    getDecoratorName(): string {
        return 'RequestBody';
    }
}

export const RequestBodyDecorator = new RequestBodyDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export const RequestBody: ParameterDecorator = (target, funcName, parameterIndex) => {
    const targetFunc: CallableFunction = target[funcName];
    const className = isFunction(target) ? target.name : target.constructor.name;
    const requestBodyIndex = TypeUtils.getDecoratorInfo(targetFunc, RequestBodyDecorator);
    if (!isNil(requestBodyIndex) && requestBodyIndex !== parameterIndex) {
        throw Error(`[route error]RequestBody decorator can used only once in a entrance function, function: ${className}.${targetFunc.name}`);
    }

    TypeUtils.saveMetadata(RequestBodyDecorator.getDecoratorSign(), parameterIndex, targetFunc);
};


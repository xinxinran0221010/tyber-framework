// noinspection TypeScriptPreferShortImport
import {TypeUtils} from '@utils';
import {BaseDecorator} from "../BaseDecorator";

class ContextAttributeDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__ContextAttribute_';
    }

    getDecoratorName(): string {
        return 'ContextAttribute';
    }
}

export const ContextAttributeDecorator = new ContextAttributeDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export const ContextAttribute: ParameterDecorator = (target, funcName, parameterIndex) => {
    const targetFunc: CallableFunction = target[funcName];
    const contextAttrIndexes = TypeUtils.getDecoratorInfo(targetFunc, ContextAttributeDecorator) || [];

    contextAttrIndexes.push(parameterIndex);
    TypeUtils.saveMetadata(ContextAttributeDecorator.getDecoratorSign(), contextAttrIndexes, targetFunc);
};


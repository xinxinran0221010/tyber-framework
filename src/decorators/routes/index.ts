import {IDecorator} from "../IDecorator";

export * from './RequestMapping';
export * from './GetRoute';
export * from './PostRoute';
export * from './PutRoute';
export * from './DeleteRoute';
export * from './Validate';
export * from './RequestBody';
export * from './ContextAttribute';

class RouteFunctionParameterDecoratorInfo implements IDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__RouteFunctionParameter_';
    }

    getDecoratorName(): string {
        return '';
    }
}

export const RouteFunctionParameterDecorator = new RouteFunctionParameterDecoratorInfo();

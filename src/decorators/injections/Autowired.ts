import {TypeUtils} from "@utils";
import {BaseDecorator} from "../BaseDecorator";

class AutowiredDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__Autowired_';
    }

    getDecoratorName(): string {
        return 'Autowired';
    }
}

export const AutowiredDecorator = new AutowiredDecoratorInfo();

export interface AutowiredInfo {
    propertyName: string | symbol;
    targetType: NewableFunction;
}

// noinspection JSUnusedGlobalSymbols
export const Autowired: PropertyDecorator = (target, propertyKey) => {
    const propertyType = TypeUtils.getDefinedType(target, propertyKey);
    const injectProperties: AutowiredInfo[] = TypeUtils.getDecoratorInfo(target, AutowiredDecorator, []);
    injectProperties.push({propertyName: propertyKey, targetType: propertyType});
    TypeUtils.saveMetadata(AutowiredDecorator.getDecoratorSign(), injectProperties, target);
};

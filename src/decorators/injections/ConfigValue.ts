import {TypeUtils} from "@utils";
import {BaseDecorator} from "../BaseDecorator";

class ConfigValueDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__ConfigValue_';
    }

    getDecoratorName(): string {
        return 'ConfigValue';
    }
}

export const ConfigValueDecorator = new ConfigValueDecoratorInfo();

export interface ConfigValueInfo {
    propertyName: string | symbol;
    keyPath: string;
}

// noinspection JSUnusedGlobalSymbols
export function ConfigValue(propertyPath: string): PropertyDecorator {
    if (!propertyPath) {
        throw new Error('[ConfigValue] need property names');
    }
    return (target, propertyKey) => {
        const injectProperties: ConfigValueInfo[] = TypeUtils.getDecoratorInfo(target, ConfigValueDecorator, []);
        injectProperties.push({propertyName: propertyKey, keyPath: propertyPath});
        TypeUtils.saveMetadata(ConfigValueDecorator.getDecoratorSign(), injectProperties, target);
    }
}

import {TypeUtils} from '@utils';
import {ValidationDescription} from "@internal";
import {BaseDecorator} from "../BaseDecorator";

class ValidateDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__Validate_';
    }

    getDecoratorName(): string {
        return 'Validate';
    }
}

export const ValidateDecorator = new ValidateDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function Validate(validateObj: ValidationDescription): MethodDecorator {
    return (target, propertyKey, descriptor) => {
        const targetFunc = descriptor.value;
        if (validateObj) {
            TypeUtils.saveMetadata(ValidateDecorator.getDecoratorSign(), validateObj, targetFunc);
        }
    }
}

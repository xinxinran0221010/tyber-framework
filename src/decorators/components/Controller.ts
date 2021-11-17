import {BeanUtils, TypeUtils} from '@utils';
import {BaseDecorator} from "../BaseDecorator";

class ControllerDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__Controller_';
    }

    getDecoratorName(): string {
        return 'Controller';
    }
}

export const ControllerDecorator = new ControllerDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function Controller(beanName?: string): ClassDecorator {
    return (target) => {
        const beanId = beanName || target.name;
        BeanUtils.makeBeanDefinition(target, beanId, true);
        TypeUtils.saveMetadata(ControllerDecorator.getDecoratorSign(), beanId, target, beanId);
    }
}

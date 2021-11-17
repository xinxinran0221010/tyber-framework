import {BeanUtils, TypeUtils} from '@utils';
import {BaseDecorator} from "../BaseDecorator";

class ComponentDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__Component_';
    }

    getDecoratorName(): string {
        return 'Component';
    }
}

export const ComponentDecorator = new ComponentDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function Component(beanName?: string): ClassDecorator {
    return (target) => {
        const beanId = beanName || target.name;
        BeanUtils.makeBeanDefinition(target, beanId, false);
        TypeUtils.saveMetadata(ComponentDecorator.getDecoratorSign(), beanName || target.name, target, beanId);
    }
}

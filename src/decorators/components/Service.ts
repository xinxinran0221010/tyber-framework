import {BeanUtils, TypeUtils} from '@utils';
import {BaseDecorator} from "../BaseDecorator";

class ServiceDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__Service_';
    }

    getDecoratorName(): string {
        return 'Service';
    }
}

export const ServiceDecorator = new ServiceDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function Service(beanName?: string): ClassDecorator {
    return (target: NewableFunction) => {
        const beanId: string = beanName || target.name;
        BeanUtils.makeBeanDefinition(target, beanId, false);
        TypeUtils.saveMetadata(ServiceDecorator.getDecoratorSign(), beanName || target.name, target, beanId);
    }
}

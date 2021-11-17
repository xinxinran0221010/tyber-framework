import {BeanUtils, TypeUtils} from '@utils';
import {MIDDLEWARE_LOWEST_PRECEDENCE, MiddlewareSettings} from "@constants";
import {BaseDecorator} from "../BaseDecorator";

class MiddlewareDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__Middleware_';
    }

    getDecoratorName(): string {
        return 'Middleware';
    }
}

export const MiddlewareDecorator = new MiddlewareDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function Middleware(settings?: MiddlewareSettings): ClassDecorator {
    return (target) => {
        settings = settings || {order: MIDDLEWARE_LOWEST_PRECEDENCE, scope: 'route'};
        const beanId = settings.alias || target.name;
        BeanUtils.makeBeanDefinition(target, beanId, true);
        TypeUtils.saveMetadata(MiddlewareDecorator.getDecoratorSign(), settings, target, beanId);
    }
}

import {TypeUtils} from '@utils';
import {BaseDecorator} from "../BaseDecorator";

class RequestMappingDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__RequestMapping_';
    }

    getDecoratorName(): string {
        return 'RequestMapping';
    }
}

export const RequestMappingDecorator = new RequestMappingDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function RequestMapping(routePath?: string, middleware?: string[] | { [middlewareName: string]: unknown[] }): ClassDecorator {
    return (target: NewableFunction) => {
        TypeUtils.saveMetadata(RequestMappingDecorator.getDecoratorSign(), {
            routePath: routePath || '',
            middleware: middleware || []
        }, target);
    }
}

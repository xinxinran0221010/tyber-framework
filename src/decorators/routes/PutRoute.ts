import {TypeUtils} from '@utils';
import {BaseDecorator} from "../BaseDecorator";

class PutRouteDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__PutRoute_';
    }

    getDecoratorName(): string {
        return 'PutRoute';
    }
}

export const PutRouteDecorator = new PutRouteDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function PutRoute(routePath: string, middleware?: string[] | { [middlewareName: string]: unknown[] }): MethodDecorator {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return <T extends CallableFunction>(target, propertyKey, descriptor) => {
        const targetFunc: CallableFunction = descriptor.value;
        TypeUtils.saveMetadata(PutRouteDecorator.getDecoratorSign(), {
            routePath: routePath || '',
            middleware: middleware || []
        }, targetFunc);
    }
}

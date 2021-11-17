import {TypeUtils} from '@utils';
import {BaseDecorator} from "../BaseDecorator";

class GetRouteDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__GetRoute_';
    }

    getDecoratorName(): string {
        return 'GetRoute';
    }
}

export const GetRouteDecorator = new GetRouteDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function GetRoute(routePath: string, middleware?: string[] | { [middlewareName: string]: unknown[] }): MethodDecorator {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return <T extends CallableFunction>(target, propertyKey, descriptor) => {
        const targetFunc: CallableFunction = descriptor.value;
        TypeUtils.saveMetadata(GetRouteDecorator.getDecoratorSign(), {
            routePath: routePath || '',
            middleware: middleware || []
        }, targetFunc);
    }
}

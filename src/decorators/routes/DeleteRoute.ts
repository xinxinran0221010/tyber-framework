import {TypeUtils} from '@utils';
import {BaseDecorator} from "../BaseDecorator";

class DeleteRouteDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__DeleteRoute_';
    }

    getDecoratorName(): string {
        return 'DeleteRoute';
    }
}

export const DeleteRouteDecorator = new DeleteRouteDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function DeleteRoute(routePath: string, middleware?: string[] | { [middlewareName: string]: unknown[] }): MethodDecorator {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return <T extends CallableFunction>(target, propertyKey, descriptor) => {
        const targetFunc: CallableFunction = descriptor.value;
        TypeUtils.saveMetadata(DeleteRouteDecorator.getDecoratorSign(), {
            routePath: routePath || '',
            middleware: middleware || []
        }, targetFunc);
    }
}

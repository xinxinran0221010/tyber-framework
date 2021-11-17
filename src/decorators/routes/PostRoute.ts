import {TypeUtils} from '@utils';
import {BaseDecorator} from "../BaseDecorator";

class PostRouteDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__PostRoute_';
    }

    getDecoratorName(): string {
        return 'PostRoute';
    }
}

export const PostRouteDecorator = new PostRouteDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function PostRoute(routePath: string, middleware?: string[] | { [middlewareName: string]: unknown[] }): MethodDecorator {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return <T extends CallableFunction>(target, propertyKey, descriptor) => {
        const targetFunc: CallableFunction = descriptor.value;
        TypeUtils.saveMetadata(PostRouteDecorator.getDecoratorSign(), {
            routePath: routePath || '',
            middleware: middleware || []
        }, targetFunc);
    }
}

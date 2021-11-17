import * as Koa from "koa";
import {BeanUtils, TypeUtils} from "@utils";

export abstract class AbsoluteDispatcher {

    protected async doService(serviceName: string, funcName: string, serviceContext: Koa.Context, next: Koa.Next, paramMethods: CallableFunction[]): Promise<unknown> {
        const targetService = BeanUtils.getBean(BeanUtils.getBeanName(serviceName));
        const targetFunc = targetService && targetService[funcName];

        if (targetFunc) {
            const args = paramMethods.map(paramMethod => paramMethod(serviceContext, next));
            if (TypeUtils.isAsyncFunction(targetFunc)) {
                return await targetFunc.apply(targetService, args);
            } else {
                return targetFunc.apply(targetService, args);
            }
        } else {
            throw new Error('Request handler not found:' + serviceName + '->' + String(funcName));
        }
    }

    abstract makeDispatcher(): Koa.Middleware;
}

import {IPostBeanProcessor} from "@internal";
import {LoggerDecorator} from '@decorators';
import {TypeUtils, LoggerUtils} from '@utils';

export class LoggerPostProcessor implements IPostBeanProcessor {

    processPostBean(beanName: string, bean: Record<string | symbol, unknown>): void {
        const loggerCategory: string = TypeUtils.getDecoratorInfo(bean, LoggerDecorator);
        Reflect.set(bean, 'logger', LoggerUtils.getLogger(loggerCategory));
    }

}

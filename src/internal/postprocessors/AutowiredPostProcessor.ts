import {IPostBeanProcessor} from "@internal";
import {AutowiredDecorator, AutowiredInfo} from '@decorators';
import {TypeUtils, BeanUtils, LoggerUtils} from '@utils';
import {LoggerType} from "@extensions";

export class AutowiredPostProcessor implements IPostBeanProcessor {
    private logger: LoggerType = LoggerUtils.getLogger();

    processPostBean(beanName: string, bean: Record<string | symbol, unknown>): void {
        const autowiredInfos: AutowiredInfo[] = TypeUtils.getDecoratorInfo(bean, AutowiredDecorator, []);
        autowiredInfos && autowiredInfos.forEach(autowiredInfo => {
            const targetBeanName = BeanUtils.getBeanNameFromBean(autowiredInfo.targetType);
            const targetBean = targetBeanName && BeanUtils.getBean(targetBeanName);
            if (targetBean) {
                Reflect.set(bean, autowiredInfo.propertyName, targetBean);
            } else {
                this.logger.warn(`[Autowired] bean(${beanName}) property inject failed. Property name: ${String(autowiredInfo.propertyName)}, target beanName: ${targetBeanName} `);
            }
        });
    }

}

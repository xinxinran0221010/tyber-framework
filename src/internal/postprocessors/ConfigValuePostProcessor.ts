import {isUndefined} from 'lodash';
import {ConfigurationPropertiesLoader, IPostBeanProcessor} from "@internal";
import {ConfigValueDecorator, ConfigValueInfo} from '@decorators';
import {TypeUtils, LoggerUtils} from '@utils';
import {LoggerType} from "@extensions";

export class ConfigValuePostProcessor implements IPostBeanProcessor {
    private logger: LoggerType = LoggerUtils.getLogger();
    private configHelper: ConfigurationPropertiesLoader = new ConfigurationPropertiesLoader();

    processPostBean(beanName: string, bean: Record<string | symbol, unknown>): void {
        const configValueInfos: ConfigValueInfo[] = TypeUtils.getDecoratorInfo(bean, ConfigValueDecorator, []);
        configValueInfos && configValueInfos.forEach(configValueInfo => {
            const targetBean = this.configHelper.getConfig(configValueInfo.keyPath);
            if (!isUndefined(targetBean)) {
                Reflect.set(bean, configValueInfo.propertyName, targetBean);
            } else {
                this.logger.warn(`[ConfigValue] bean(${beanName}) property inject failed because config value is undefined. Property name: ${String(configValueInfo.propertyName)},`);
            }
        });
    }

}

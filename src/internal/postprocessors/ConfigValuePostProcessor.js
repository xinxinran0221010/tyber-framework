"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValuePostProcessor = void 0;
const lodash_1 = require("lodash");
const _internal_1 = require("@internal");
const _decorators_1 = require("@decorators");
const _utils_1 = require("@utils");
class ConfigValuePostProcessor {
    constructor() {
        this.logger = _utils_1.LoggerUtils.getLogger();
        this.configHelper = new _internal_1.ConfigurationPropertiesLoader();
    }
    processPostBean(beanName, bean) {
        const configValueInfos = _utils_1.TypeUtils.getDecoratorInfo(bean, _decorators_1.ConfigValueDecorator, []);
        configValueInfos && configValueInfos.forEach(configValueInfo => {
            const targetBean = this.configHelper.getConfig(configValueInfo.keyPath);
            if (!lodash_1.isUndefined(targetBean)) {
                Reflect.set(bean, configValueInfo.propertyName, targetBean);
            }
            else {
                this.logger.warn(`[ConfigValue] bean(${beanName}) property inject failed because config value is undefined. Property name: ${String(configValueInfo.propertyName)},`);
            }
        });
    }
}
exports.ConfigValuePostProcessor = ConfigValuePostProcessor;
//# sourceMappingURL=ConfigValuePostProcessor.js.map
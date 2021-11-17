"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutowiredPostProcessor = void 0;
const _decorators_1 = require("@decorators");
const _utils_1 = require("@utils");
class AutowiredPostProcessor {
    constructor() {
        this.logger = _utils_1.LoggerUtils.getLogger();
    }
    processPostBean(beanName, bean) {
        const autowiredInfos = _utils_1.TypeUtils.getDecoratorInfo(bean, _decorators_1.AutowiredDecorator, []);
        autowiredInfos && autowiredInfos.forEach(autowiredInfo => {
            const targetBeanName = _utils_1.BeanUtils.getBeanNameFromBean(autowiredInfo.targetType);
            const targetBean = targetBeanName && _utils_1.BeanUtils.getBean(targetBeanName);
            if (targetBean) {
                Reflect.set(bean, autowiredInfo.propertyName, targetBean);
            }
            else {
                this.logger.warn(`[Autowired] bean(${beanName}) property inject failed. Property name: ${String(autowiredInfo.propertyName)}, target beanName: ${targetBeanName} `);
            }
        });
    }
}
exports.AutowiredPostProcessor = AutowiredPostProcessor;
//# sourceMappingURL=AutowiredPostProcessor.js.map
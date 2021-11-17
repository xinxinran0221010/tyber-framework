"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerPostProcessor = void 0;
const _decorators_1 = require("@decorators");
const _utils_1 = require("@utils");
class LoggerPostProcessor {
    processPostBean(beanName, bean) {
        const loggerCategory = _utils_1.TypeUtils.getDecoratorInfo(bean, _decorators_1.LoggerDecorator);
        Reflect.set(bean, 'logger', _utils_1.LoggerUtils.getLogger(loggerCategory));
    }
}
exports.LoggerPostProcessor = LoggerPostProcessor;
//# sourceMappingURL=LoggerPostProcessor.js.map
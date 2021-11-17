"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbsoluteDispatcher = void 0;
const _utils_1 = require("@utils");
class AbsoluteDispatcher {
    async doService(serviceName, funcName, serviceContext, next, paramMethods) {
        const targetService = _utils_1.BeanUtils.getBean(_utils_1.BeanUtils.getBeanName(serviceName));
        const targetFunc = targetService && targetService[funcName];
        if (targetFunc) {
            const args = paramMethods.map(paramMethod => paramMethod(serviceContext, next));
            if (_utils_1.TypeUtils.isAsyncFunction(targetFunc)) {
                return await targetFunc.apply(targetService, args);
            }
            else {
                return targetFunc.apply(targetService, args);
            }
        }
        else {
            throw new Error('Request handler not found:' + serviceName + '->' + String(funcName));
        }
    }
}
exports.AbsoluteDispatcher = AbsoluteDispatcher;
//# sourceMappingURL=AbsoluteDispatcher.js.map
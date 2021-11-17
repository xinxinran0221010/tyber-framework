"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostBeanProcessorManager = void 0;
const tslib_1 = require("tslib");
const Bearcat = require("bearcat-es6-decorator-aop");
const lodash_1 = require("lodash");
const _utils_1 = require("@utils");
class PostBeanProcessorManager {
    constructor() {
        this.processors = [];
        this.triggered = false;
    }
    checkProcessorSync(newProcessor) {
        return !_utils_1.TypeUtils.isAsyncFunction(newProcessor.processPostBean);
    }
    addPostBeanProcessors(newProcessors) {
        if (newProcessors) {
            const invalidProcessors = newProcessors.filter(p => !this.checkProcessorSync(p));
            if (invalidProcessors.length) {
                const invalidProcessorNames = invalidProcessors.map(p => p['name']).join();
                throw new Error(`[post bean process error] process function can not be async. error processors: ${invalidProcessorNames}`);
            }
            this.processors = [...this.processors, ...newProcessors];
        }
    }
    triggerProcess() {
        if (Bearcat.state < 4) {
            throw new Error('[post bean process error] Bearcat has not started yet.');
        }
        if (this.triggered) {
            throw new Error('[post bean process error] Processors have already been triggered.');
        }
        const beanFactory = Bearcat.getBeanFactory();
        Object.keys(beanFactory.getBeanDefinitions()).forEach((beanName) => {
            const beanObj = Bearcat.getBean(beanName);
            this.processors.forEach((processor) => processor.processPostBean(beanName, beanObj));
            if (lodash_1.isFunction(beanObj['afterPropertiesSet'])) {
                beanObj['afterPropertiesSet'].call(beanObj);
            }
        });
        this.triggered = true;
    }
    onServerClose() {
        this.triggered = false;
    }
}
exports.PostBeanProcessorManager = PostBeanProcessorManager;
tslib_1.__exportStar(require("./IPostBeanProcessor"), exports);
tslib_1.__exportStar(require("./FrameBeanDetectPostProcessor"), exports);
tslib_1.__exportStar(require("./LoggerPostProcessor"), exports);
tslib_1.__exportStar(require("./ConfigValuePostProcessor"), exports);
tslib_1.__exportStar(require("./AutowiredPostProcessor"), exports);
tslib_1.__exportStar(require("./RouteRegisterPostProcessor"), exports);
//# sourceMappingURL=index.js.map
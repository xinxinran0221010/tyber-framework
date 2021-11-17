"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareManager = exports.FrameBeanDetectPostProcessor = void 0;
const lodash_1 = require("lodash");
const _internal_1 = require("@internal");
const _decorators_1 = require("@decorators");
const _constants_1 = require("@constants");
const _utils_1 = require("@utils");
class FrameBeanDetectPostProcessor {
    constructor() {
        this.detectDecorators = [
            _decorators_1.MiddlewareDecorator,
        ];
    }
    processPostBean(beanName, bean) {
        this.detectDecorators.forEach(decorator => {
            const decoratorContent = _utils_1.TypeUtils.getDecoratorInfo(bean, decorator);
            if (decoratorContent) {
                return this.processDetectedBean(beanName, bean, decorator, decoratorContent);
            }
        });
    }
    processDetectedBean(beanName, bean, decorator, decoratorContent) {
        if (decorator === _decorators_1.MiddlewareDecorator) {
            MiddlewareManager.instance().registerMiddleware(beanName, bean, decoratorContent);
        }
    }
    onServerClose() {
        MiddlewareManager.instance().onServerClose();
    }
}
exports.FrameBeanDetectPostProcessor = FrameBeanDetectPostProcessor;
class MiddlewareManager {
    constructor() {
        this.globalMiddlewareBeans = [];
        this.routeMiddlewareBeans = {};
        return MiddlewareManager.innerInstance;
    }
    static instance() {
        return this.innerInstance;
    }
    registerMiddleware(beanName, bean, setting) {
        const middlewareName = setting.alias || beanName;
        bean.alias = middlewareName;
        bean.order = setting.order || _constants_1.MIDDLEWARE_LOWEST_PRECEDENCE;
        bean.scope = setting.scope || 'route';
        if (setting.matchEnv) {
            bean.matchEnv = lodash_1.isArray(setting.matchEnv) ? setting.matchEnv : [setting.matchEnv];
        }
        if (setting.scope === 'global') {
            this.globalMiddlewareBeans.push(bean);
        }
        else {
            if (this.routeMiddlewareBeans[middlewareName]) {
                throw new Error(`[middleware error] middleware name "${middlewareName}" duplicated`);
            }
            this.routeMiddlewareBeans[middlewareName] = bean;
        }
    }
    getActiveMiddleware(routeMiddlewareNames) {
        const routeMiddlewareBeans = routeMiddlewareNames ? routeMiddlewareNames.map(name => this.routeMiddlewareBeans[name]) : [];
        const currentEnv = new _internal_1.ConfigurationPropertiesLoader().getEnv();
        let resultMiddleware = [...this.globalMiddlewareBeans, ...routeMiddlewareBeans];
        resultMiddleware = resultMiddleware.filter(middleware => {
            if (middleware.matchEnv) {
                return middleware.matchEnv.includes(currentEnv);
            }
            return true;
        });
        resultMiddleware = lodash_1.sortBy(resultMiddleware, ['order', 'alias']);
        return resultMiddleware;
    }
    onServerClose() {
        this.globalMiddlewareBeans = [];
        this.routeMiddlewareBeans = {};
    }
}
exports.MiddlewareManager = MiddlewareManager;
MiddlewareManager.innerInstance = new MiddlewareManager();
//# sourceMappingURL=FrameBeanDetectPostProcessor.js.map
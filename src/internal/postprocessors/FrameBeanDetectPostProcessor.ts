import {sortBy, isArray} from 'lodash';
import {ConfigurationPropertiesLoader, IPostBeanProcessor} from '@internal';
import {MiddlewareDecorator, IDecorator} from "@decorators";
import {IMiddleware, MIDDLEWARE_LOWEST_PRECEDENCE, MiddlewareSettings} from "@constants";
import {TypeUtils} from "@utils";
import {IShutdownListener} from "../IShutdownable";

export class FrameBeanDetectPostProcessor implements IPostBeanProcessor, IShutdownListener {

    private detectDecorators: IDecorator[] = [
        MiddlewareDecorator,
    ];

    processPostBean(beanName: string, bean: Record<string | symbol, unknown>): void {
        this.detectDecorators.forEach(decorator => {
            const decoratorContent = TypeUtils.getDecoratorInfo(bean, decorator);
            if (decoratorContent) {
                return this.processDetectedBean(beanName, bean, decorator, decoratorContent);
            }
        });
    }

    // noinspection JSMethodCanBeStatic
    private processDetectedBean(beanName: string, bean: unknown, decorator: IDecorator, decoratorContent: unknown): void {
        if (decorator === MiddlewareDecorator) {
            MiddlewareManager.instance().registerMiddleware(beanName, bean as IMiddleware, decoratorContent);
        }
    }

    onServerClose(): void {
        MiddlewareManager.instance().onServerClose();
    }
}

export class MiddlewareManager implements IShutdownListener {
    private static innerInstance: MiddlewareManager = new MiddlewareManager();

    private globalMiddlewareBeans: IMiddleware[] = [];
    private routeMiddlewareBeans: { [alias: string]: IMiddleware } = {};

    constructor() {
        return MiddlewareManager.innerInstance;
    }

    static instance(): MiddlewareManager {
        return this.innerInstance;
    }

    registerMiddleware(beanName: string, bean: IMiddleware, setting: MiddlewareSettings): void {
        const middlewareName = setting.alias || beanName;
        bean.alias = middlewareName;
        bean.order = setting.order || MIDDLEWARE_LOWEST_PRECEDENCE;
        bean.scope = setting.scope || 'route';

        if(setting.matchEnv) {
            bean.matchEnv = isArray(setting.matchEnv) ? setting.matchEnv : [setting.matchEnv];
        }

        if (setting.scope === 'global') {
            this.globalMiddlewareBeans.push(bean);
        } else {
            if (this.routeMiddlewareBeans[middlewareName]) {
                throw new Error(`[middleware error] middleware name "${middlewareName}" duplicated`);
            }
            this.routeMiddlewareBeans[middlewareName] = bean;
        }
    }

    getActiveMiddleware(routeMiddlewareNames: string[]): IMiddleware[] {
        const routeMiddlewareBeans = routeMiddlewareNames ? routeMiddlewareNames.map(name => this.routeMiddlewareBeans[name]) : [];
        const currentEnv = new ConfigurationPropertiesLoader().getEnv();
        let resultMiddleware: IMiddleware[] = [...this.globalMiddlewareBeans, ...routeMiddlewareBeans];
        resultMiddleware = resultMiddleware.filter(middleware => {
            if (middleware.matchEnv) {
                return middleware.matchEnv.includes(currentEnv);
            }
            return true;
        });
        resultMiddleware = sortBy(resultMiddleware, ['order', 'alias']);
        return resultMiddleware;
    }

    onServerClose(): void {
        this.globalMiddlewareBeans = [];
        this.routeMiddlewareBeans = {};
    }
}

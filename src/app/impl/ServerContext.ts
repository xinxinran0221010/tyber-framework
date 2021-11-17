import {
    ConfigurationPropertiesLoader,
    DefaultMiddlewareLoader,
    ILoader,
    IPostBeanProcessor,
    IConfigurationLoader,
    SentryLoader,
    LogConfigurationLoader,
    AbsoluteDispatcher,
    RequestDispatcher,
    PostBeanProcessorManager,
    FrameBeanDetectPostProcessor,
    LoggerPostProcessor,
    ConfigValuePostProcessor, AutowiredPostProcessor, RouteRegisterPostProcessor
} from "@internal";
import {isArray, isFunction} from "lodash";

export class ServerContext {
    public static SERVER_STATUS_NOT_RUNNING = 0;
    public static SERVER_STATUS_BOOTING = 1;
    public static SERVER_STATUS_RUNNING = 2;

    private serverStatus: 0 | 1 | 2 = 0;
    private readonly loaders: ILoader[] = [];
    private readonly postProcessors: IPostBeanProcessor[] = [];
    private dispatcher: AbsoluteDispatcher;
    private processorManager: PostBeanProcessorManager;

    public addLoader(loader: ILoader): void {
        if (this.serverStatus !== ServerContext.SERVER_STATUS_NOT_RUNNING) {
            throw new Error('[Context Error] Cannot add loader after server starting.');
        }

        this.loaders.push(loader);
    }

    public setDispatcher(dispatcher: AbsoluteDispatcher): void {
        if (this.serverStatus !== ServerContext.SERVER_STATUS_NOT_RUNNING) {
            throw new Error('[Context Error] Cannot set dispatcher after server starting.');
        }
        this.dispatcher = dispatcher;
    }

    public setProcessorManager(processorManager: PostBeanProcessorManager) {
        this.processorManager = processorManager;
    }

    public addProcessors(processors: IPostBeanProcessor | IPostBeanProcessor[]) {
        if(!this.processorManager) {
            throw new Error('[Context Error] Post Bean Processor Manager not found.');
        }
        if (!isArray(processors)) {
            processors = [processors];
        }
        this.processorManager.addPostBeanProcessors(processors);
        processors.forEach(p => this.postProcessors.push(p));
    }

    public getConfigurationLoader(): IConfigurationLoader {
        const resultList = this.loaders.filter(loader => loader.getOrder() === Number.NEGATIVE_INFINITY && isFunction(loader['getConfig']));
        return resultList[0] as IConfigurationLoader;
    }

    public getHighPriorityLoader() {
        const resultList = this.loaders.filter(loader => loader.getOrder() < 0);
        resultList.sort((loader1, loader2) => loader1.getOrder() - loader2.getOrder());
        return resultList;
    }

    public getLowPriorityLoader() {
        const resultList = this.loaders.filter(loader => loader.getOrder() >= 0);
        resultList.sort((loader1, loader2) => loader1.getOrder() - loader2.getOrder());
        return resultList;
    }

    public getDispatcher() {
        if(!this.dispatcher) {
            throw new Error('[Context Error] Server request dispatcher not found.');
        }
        return this.dispatcher;
    }

    public getProcessorManager() {
        if(!this.processorManager) {
            throw new Error('[Context Error] Post Bean Processor Manager not found.');
        }
        return this.processorManager;
    }

    public serverStarted() {
        this.serverStatus = 2;
    }

    public serverClosed() {
        this.serverStatus = 0;
        this.loaders.forEach(loader => isFunction(loader['onServerClose']) && loader['onServerClose']());
        this.postProcessors.forEach(processor => isFunction(processor['onServerClose']) && processor['onServerClose']());
        isFunction(this.dispatcher['onServerClose']) && this.dispatcher['onServerClose']();
        isFunction(this.processorManager['onServerClose']) && this.processorManager['onServerClose']();
    }
}

export class ServerContextConfiguration {
    private static readonly ServerContextConfigMap: Map<String, ServerContext> = new Map<String, ServerContext>();

    public static getServerContext(name: string): ServerContext {
        if (this.ServerContextConfigMap.has(name)) {
            return this.ServerContextConfigMap.get(name);
        }

        const newContext = new ServerContext();
        this.ServerContextConfigMap.set(name, newContext);
        return newContext;
    }

    public static removeServerContext(name: string): void {
        if (this.ServerContextConfigMap.has(name)) {
            this.ServerContextConfigMap.delete(name);
        }
    }

    public static initDefaultServerContext(context: ServerContext, type: 'loader' | 'dispatcher' | 'processor' = null): void {
        if (context) {
            if (!type || type === 'loader') {
                context.addLoader(new ConfigurationPropertiesLoader());
                context.addLoader(new LogConfigurationLoader());
                context.addLoader(new SentryLoader());
                context.addLoader(new DefaultMiddlewareLoader());
            }

            if (!type || type === 'dispatcher') {
                context.setDispatcher(new RequestDispatcher());
            }

            if (!type || type === 'processor') {
                context.setProcessorManager(new PostBeanProcessorManager());
                context.addProcessors([
                    new FrameBeanDetectPostProcessor(),
                    new LoggerPostProcessor(),
                    new ConfigValuePostProcessor(),
                    new AutowiredPostProcessor(),
                    new RouteRegisterPostProcessor(),
                ]);
            }
        }
    }
}

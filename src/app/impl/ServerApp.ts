import * as Koa from 'koa';
import {join as joinPath} from 'path';
import {createServer, Server} from 'http';
import {flatten} from 'lodash';
import {IServerApp} from '../IServerApp';
import {ApplicationContext} from "bearcat-es6";
import * as Bearcat from 'bearcat-es6-decorator-aop';
import {TypeUtils, BeanUtils, LoggerUtils} from "@utils";
import {IKoaRestyServerSettings, IServerAppContext, IServerContextState} from '@constants';
import {DirectoryScanDecorator, KoaRestyServerDecorator} from '@decorators';
import {
    IConfigurationLoader,
    IPostBeanProcessor,
} from "@internal";
import {ServerContext, ServerContextConfiguration} from "./ServerContext";

// noinspection JSUnusedGlobalSymbols
export abstract class ServerApp implements IServerApp {

    private app: Koa = new Koa<IServerContextState, IServerAppContext>();
    private httpServer: Server;
    private options: IKoaRestyServerSettings = null;

    private env: string;
    private configurationPath: string;
    private configurationLoader: IConfigurationLoader = null;

    abstract basePath(): string;

    extPostProcessor(): IPostBeanProcessor[] {
        return [];
    }

    getKoa(): Koa {
        return this.app;
    }

    getServerOptions(): IKoaRestyServerSettings {
        if (!this.options) {
            this.options = TypeUtils.getDecoratorInfo(this, KoaRestyServerDecorator, {
                port: 8888
            }) as IKoaRestyServerSettings;
        }

        return this.options;
    }

    getApplicationContext(): ApplicationContext {
        return Bearcat.getApplicationContext();
    }

    getEnv(): string {
        return this.env;
    }

    getConfigurationPath(): string {
        return this.configurationPath;
    }

    getConfigurationLoader(): IConfigurationLoader {
        return this.configurationLoader;
    }

    getServerContextName(): string {
        return 'default';
    }

    getServerContext(): ServerContext {
        return ServerContextConfiguration.getServerContext(this.getServerContextName());
    }

    initServerContext(): void {
        ServerContextConfiguration.initDefaultServerContext(this.getServerContext());
    }

    startServer(): Promise<Server> {
        this.initServerContext();
        const contextConfigPath = [];
        const scanPath: string | string[] = TypeUtils.getDecoratorInfo(this, DirectoryScanDecorator) as (string | string[]);
        const absoluteScanPath: string[] = scanPath ? flatten([scanPath]).map(path => joinPath(this.basePath(), path)) : null;
        if (absoluteScanPath) {
            contextConfigPath.push(BeanUtils.generateConfigFile(absoluteScanPath));
        }

        const serverSettings: IKoaRestyServerSettings = this.getServerOptions();
        const configurationPath = joinPath(this.basePath(), serverSettings.configPath || './config');
        Bearcat.createApp(contextConfigPath, {BEARCAT_CPATH: configurationPath});

        this.getServerContext().addProcessors(this.extPostProcessor());
        return new Promise((resolve) => {
            Bearcat.start(() => {
                BeanUtils.initializeProjectBeans();
                const appContext = Bearcat.getApplicationContext();
                const serverContext = this.getServerContext();
                this.env = appContext.getEnv();
                this.configurationPath = configurationPath;

                this.configurationLoader = serverContext.getConfigurationLoader();
                this.configurationLoader.load(this);

                serverContext.getHighPriorityLoader().forEach(loader => loader.load(this));
                serverContext.getProcessorManager().triggerProcess();
                serverContext.getLowPriorityLoader().forEach(loader => loader.load(this));

                const mainDispatcher = serverContext.getDispatcher();
                this.app.use(mainDispatcher.makeDispatcher());

                this.httpServer = createServer(this.app.callback()).listen(serverSettings.port);
                LoggerUtils.getLogger().info('Tyber Rest Server run in [%s] mode, listening [%s]', appContext.getEnv(), serverSettings.port);

                serverContext.serverStarted();
                resolve(this.httpServer);
            });
        });
    }

    stopServer(cb?: (err?: Error) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            this.httpServer.close(err => {
                if (err) {
                    cb && cb(err);
                    reject(err);
                }
                Bearcat.stop();
                BeanUtils.resetBeanDefinitions();
                cb && cb();

                this.getServerContext().serverClosed();
                ServerContextConfiguration.removeServerContext(this.getServerContextName());
                resolve();
            })
        });
    }
}



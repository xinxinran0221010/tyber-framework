import * as Koa from 'koa';
import {IKoaRestyServerSettings} from "@constants";
import {ApplicationContext} from "bearcat-es6";
import {IConfigurationLoader} from "../internal/loaders/IConfigurationLoader";
import {ServerContext} from "./impl/ServerContext";

export interface IServerApp {
    startServer(): Promise<unknown>;

    stopServer(cb: (err?: Error) => void): void;

    getKoa(): Koa;

    getEnv(): string;

    getConfigurationPath(): string;

    getConfigurationLoader(): IConfigurationLoader;

    getServerContextName(): string;

    getServerContext(): ServerContext;

    initServerContext(): void;

    getServerOptions(): IKoaRestyServerSettings;

    getApplicationContext(): ApplicationContext;
}

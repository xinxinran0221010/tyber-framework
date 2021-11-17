import {ILoader} from "@internal";
import {IServerApp} from "@app";
import {LoggerUtils} from "@utils";
import * as Logger from "log4js";
import {DefaultLoggerConfig} from "@constants";

export class LogConfigurationLoader implements ILoader {
    getOrder(): number {
        return -100;
    }

    load(serverApp: IServerApp): void {
        LoggerUtils.initLogger(serverApp.getConfigurationLoader()?.getConfig('log', DefaultLoggerConfig) as Logger.Configuration);
    }

}

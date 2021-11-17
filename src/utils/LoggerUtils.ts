import * as Logger from 'log4js';

export class LoggerUtils {
    static initLogger(config: Logger.Configuration): void {
        Logger.configure(config);
    }

    static getLogger(category?: string): Logger.Logger {
        return Logger.getLogger(category);
    }
}

import {Logger} from 'log4js';

export type LoggerType = Logger;

export interface ILogger {
    logger: LoggerType;
}

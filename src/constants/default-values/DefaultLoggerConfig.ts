import {Configuration} from 'log4js';

export const DefaultLoggerConfig: Configuration = {
    appenders: {
        console: {type: "console"}
    },
    categories: {
        default: {appenders: ['console'], level: 'info'}
    }
};

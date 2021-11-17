import * as koaCompress from 'koa-compress';
import * as cors from 'kcors';
import * as koaQs from "koa-qs";

export interface IKoaRestyServerSettings {
    port: number;
    configPath?: string,
    requestLogger?: string | boolean,
    compress?: koaCompress.CompressOptions;
    disableCors?: boolean;
    cors?: cors.Options;
    qsMode?: koaQs.ParseMode;
    sentryDsn?: SentryEnvOption[];
}

interface SentryEnvOption {
    env: string;
    dsn: string;
}

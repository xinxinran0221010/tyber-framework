import {IServerApp} from "@app";
import * as Koa from "koa";
import * as Sentry from '@sentry/node';
import {IKoaRestyServerSettings} from "@constants";
import {ILoader} from "./ILoader";

export class SentryLoader implements ILoader {
    private env: string = process.env.NODE_ENV;

    load(serverApp: IServerApp): void {
        this.loadSentry(serverApp);
    }

    getOrder(): number {
        return 10;
    }

    loadSentry(server: IServerApp): void {
        const koaApp: Koa = server.getKoa();
        const options: IKoaRestyServerSettings = server.getServerOptions();
        const sentryDsn = this.getNowSentryDsn(options);

        if (sentryDsn) {
            Sentry.init({dsn: sentryDsn});

            koaApp.on('error', (err: Error) => {
                Sentry.captureException(err);
            });
        }
    }

    private getNowSentryDsn(options: IKoaRestyServerSettings): string {
        if (options.sentryDsn && options.sentryDsn.length) {
            const matchedSentryOptions = options.sentryDsn.filter(sd => this.matchEnv(sd.env));
            if (matchedSentryOptions.length == 1) {
                return matchedSentryOptions[0].dsn;
            } else if (matchedSentryOptions.length > 1) {
                return matchedSentryOptions.filter(sd => sd.env !== '*')[0].dsn;
            }
        }
        return '';
    }

    private matchEnv(targetEnv: string): boolean {
        return targetEnv === this.env || targetEnv === '*';
    }
}

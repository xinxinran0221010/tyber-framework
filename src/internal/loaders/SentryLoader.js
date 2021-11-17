"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentryLoader = void 0;
const Sentry = require("@sentry/node");
class SentryLoader {
    constructor() {
        this.env = process.env.NODE_ENV;
    }
    load(serverApp) {
        this.loadSentry(serverApp);
    }
    getOrder() {
        return 10;
    }
    loadSentry(server) {
        const koaApp = server.getKoa();
        const options = server.getServerOptions();
        const sentryDsn = this.getNowSentryDsn(options);
        if (sentryDsn) {
            Sentry.init({ dsn: sentryDsn });
            koaApp.on('error', (err) => {
                Sentry.captureException(err);
            });
        }
    }
    getNowSentryDsn(options) {
        if (options.sentryDsn && options.sentryDsn.length) {
            const matchedSentryOptions = options.sentryDsn.filter(sd => this.matchEnv(sd.env));
            if (matchedSentryOptions.length == 1) {
                return matchedSentryOptions[0].dsn;
            }
            else if (matchedSentryOptions.length > 1) {
                return matchedSentryOptions.filter(sd => sd.env !== '*')[0].dsn;
            }
        }
        return '';
    }
    matchEnv(targetEnv) {
        return targetEnv === this.env || targetEnv === '*';
    }
}
exports.SentryLoader = SentryLoader;
//# sourceMappingURL=SentryLoader.js.map
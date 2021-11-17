"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultMiddlewareLoader = void 0;
const koaMorgan = require("koa-morgan");
const koaCompress = require("koa-compress");
const kCors = require("kcors");
const koaQs = require("koa-qs");
const koaBody = require("koa-body");
const koaJsonError = require("koa-json-error");
const lodash_1 = require("lodash");
class DefaultMiddlewareLoader {
    load(server) {
        this.loadDefault(server);
    }
    getOrder() {
        return 20;
    }
    loadDefault(server) {
        const koaApp = server.getKoa();
        const options = server.getServerOptions();
        if (options.compress) {
            koaApp.use(koaCompress(options.compress));
        }
        if (!options.disableCors) {
            koaApp.use(kCors(options.cors));
        }
        koaQs(koaApp, options.qsMode);
        koaApp.use(koaBody());
        const defaultLogFormat = '":req[x-forwarded-for]" - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :response-time :req[content-length] :status :res[content-length] ":referrer" ":user-agent" ":req[x-authenticated-userid]" ":req[x-authenticated-scope]" ":req-body"';
        if (options.requestLogger !== false) {
            if (!options.requestLogger || options.requestLogger === true) {
                options.requestLogger = defaultLogFormat;
            }
            koaMorgan.token('req-body', (req) => {
                return req['body'] && Object.keys(req['body']).length ? JSON.stringify(req['body']) : undefined;
            });
            koaApp.use(koaMorgan(options.requestLogger));
        }
        koaApp.use(koaJsonError({
            postFormat(err, obj) {
                return process.env.NODE_ENV === 'production' ? lodash_1.omit(obj, 'stack') : obj;
            }
        }));
    }
}
exports.DefaultMiddlewareLoader = DefaultMiddlewareLoader;
//# sourceMappingURL=DefaultMiddlewareLoader.js.map
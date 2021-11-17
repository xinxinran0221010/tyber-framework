import * as Koa from 'koa';
import * as koaMorgan from 'koa-morgan';
import * as koaCompress from 'koa-compress';
import * as kCors from 'kcors';
import * as koaQs from 'koa-qs';
import * as koaBody from 'koa-body';
import * as koaJsonError from 'koa-json-error';
import {omit} from 'lodash';
import {IServerApp} from '@app';
import {CONTEXT_BODY_SYMBOL, IKoaRestyServerSettings, IServerAppContext, IServerContextState} from "@constants";
import {ILoader} from "./ILoader";
import {Validation, ValidationDescription} from "../web-requests";

declare module 'koa' {

}

export class DefaultMiddlewareLoader implements ILoader {

    load(server: IServerApp): void {
        this.loadDefault(server);
    }

    getOrder(): number {
        return 20;
    }

    loadDefault(server: IServerApp): void {
        const koaApp: Koa = server.getKoa();
        const options: IKoaRestyServerSettings = server.getServerOptions();

        // 文本模式可压缩
        if (options.compress) {
            koaApp.use(koaCompress(options.compress));
        }

        // cors跨域支持
        if (!options.disableCors) {
            koaApp.use(kCors(options.cors));
        }

        //  对queryString的支持
        koaQs(koaApp, options.qsMode);

        // 对请求体的json/form/multipart的支持
        koaApp.use(koaBody());

        // 对集中获取Validator的支持
        koaApp.use<IServerContextState, IServerAppContext>(async (ctx, next) => {
            ctx.validate = (v: ValidationDescription) => {
                Validation.validateRequests(
                    ctx[CONTEXT_BODY_SYMBOL] || Object.assign({}, ctx.requestParameters, ctx.routeParameters),
                    v);
            };

            await next();
        });

        // 请求日志
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

        // 针对异常json返回的处理
        koaApp.use(koaJsonError({
            postFormat(err: Error, obj: Record<string, unknown>): unknown {
                return process.env.NODE_ENV === 'production' ? omit(obj, 'stack') : obj;
            }
        }));
    }
}

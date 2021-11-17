import * as Koa from "koa";
import {ParameterizedContext} from "koa";
import {IServerAppContext, IServerContextState} from "./ContextStateProperties";

export interface MiddlewareSettings {
    alias?: string;
    order?: number;
    scope?: 'route' | 'global';
    matchEnv?: string | string[];
}

export const MIDDLEWARE_LOWEST_PRECEDENCE = 65535;
// noinspection JSUnusedGlobalSymbols
export const MIDDLEWARE_HIGHEST_PRECEDENCE = 1;

export const CONTEXT_BODY_SYMBOL = '_Tyber__Context_Request_body';

export declare type KoaContext = Koa.ParameterizedContext<IServerContextState, IServerAppContext>;
export declare type KoaNext = Koa.Next;

export interface IMiddleware {
    alias?: string;
    order?: number;
    scope?: 'route' | 'global';
    matchEnv?: string[];

    beforeProcessing(ctx: KoaContext, ...extArgs: unknown[]): boolean;

    afterProcessing(ctx: KoaContext, ...extArgs: unknown[]): boolean;
}

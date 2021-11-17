import {IMiddleware, KoaContext, Middleware} from "../../../lib/src";

@Middleware({alias: 'testOEM', matchEnv: 'production'})
export class TestOtherEnvMiddleware implements IMiddleware {

    afterProcessing(ctx: KoaContext, ...extArgs: any[]): boolean {
        return true;
    }

    beforeProcessing(ctx: KoaContext, forceStop: boolean): boolean {
        TestOtherEnvMiddleware.doTestProcess();
        return forceStop !== true;
    }

    static doTestProcess() {}
}

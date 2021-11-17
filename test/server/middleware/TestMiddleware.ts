import {IMiddleware, KoaContext, Middleware} from "../../../lib/src";

@Middleware({alias: 'testM'})
export class TestMiddleware implements IMiddleware {

    afterProcessing(ctx: KoaContext, ...extArgs: any[]): boolean {
        return true;
    }

    beforeProcessing(ctx: KoaContext, forceStop: boolean): boolean {
        TestMiddleware.doTestProcess();
        return forceStop !== true;
    }

    static doTestProcess() {}
}

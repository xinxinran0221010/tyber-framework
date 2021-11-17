import {
    ILogger,
    LoggerType,
    Controller,
    Logger,
    RequestMapping,
    GetRoute,
    Autowired,
    PostRoute, Validate, KoaContext, PutRoute, RequestBody
} from "../../../lib/src";
import {TestService} from "../services/TestService";
import {TestAopService} from "../services/TestAopService";

@Controller()
@Logger()
@RequestMapping("/a")
export class TestController implements ILogger{
    logger: LoggerType;

    @Autowired
    private testService: TestService;

    @Autowired
    private testAopService: TestAopService;

    @GetRoute("/b/c")
    async someGet() {
        return await this.testService.someBusiness();
    }

    @GetRoute('/config')
    async getConfigValue() {
        return await this.testService.getConfigValue();
    }

    @Validate({rules: {
        name: 'required'
    }})
    @PostRoute('/check/validate')
    async checkValidation() {
        return {result: 'Can not return this result'};
    }

    @GetRoute('/check/middleware', ['testM'])
    async testMiddleware() {
        return {result: 'middlewareTest'};
    }

    @GetRoute('/check/otherEnvMiddleware', ['testOEM'])
    async testOtherEnvMiddleware() {
        return {result: 'middlewareOtherEnvTest'};
    }

    @GetRoute('/check/middleware/stop', {testM : [true]})
    async testMiddlewareStop() {
        return {result: 'middlewareTest'};
    }

    @PutRoute('/check/param/:id/sec/:name')
    async testRoutePathParameter(id: number, name: string, @RequestBody body: object, ctx: KoaContext) {
        ctx.status = 202;
        return {id, result: body};
    }

    @GetRoute('/test/aop/decorator')
    async testAopDecorator() {
        const result = this.testAopService.testD();
        this.logger.info('aop result is :' + result);
        return result;
    }

    @GetRoute('/test/aop/wildcard')
    async testAopWildcard() {
        const result = this.testAopService.testW();
        this.logger.info('aop result is :' + result);
        return result;
    }

    @GetRoute('/test/aop/negative')
    async testAopNegative() {
        const result = this.testAopService.testNegativeW();
        this.logger.info('normal result is :' + result);
        return result;
    }
}

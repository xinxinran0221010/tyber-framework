import { suite, test } from '@testdeck/mocha';
import * as chai from "chai";
import * as Sinon from 'sinon';
import {ILogger} from "../lib/src";
import {TestMiddleware} from "./server/middleware/TestMiddleware";
import {TestOtherEnvMiddleware} from "./server/middleware/TestOtherEnvMiddleware";
import {TestAspect} from "./server/aop/TestAspect";
import {BaseServerTest} from "./base-test.spec";

const expect = chai.expect;

// noinspection JSUnusedGlobalSymbols
@suite
class DemoServerTest extends BaseServerTest {
  private static testMiddlewareFunction = Sinon.spy(TestMiddleware, 'doTestProcess');
  private static testOtherEnvMiddlewareFunction = Sinon.spy(TestOtherEnvMiddleware, 'doTestProcess');
  private static testAopFunction = Sinon.spy(TestAspect, 'fakeProcessAop');

  before() {
    DemoServerTest.testMiddlewareFunction.resetHistory();
    DemoServerTest.testOtherEnvMiddlewareFunction.resetHistory();
    DemoServerTest.testAopFunction.resetHistory();
  }

  @test
  isServerRunning() {
    expect(DemoServerTest.httpServer.listening).to.be.true;
  }

  @test
  async testNoRouteShouldReturnNotFound() {
    const response = await DemoServerTest.doRequest.get('/a/no/route').expect(404);
    expect(response.body).to.have.property('message', 'Resource not found for [/a/no/route]');
  }

  @test
  async testRouteShouldHappyPass() {
    const testService = DemoServerTest.testServer.getApplicationContext().getBean('TestService');
    const infoLogger = Sinon.spy((testService as ILogger).logger, 'info');

    const response = await DemoServerTest.doRequest.get('/a/b/c').expect(200);
    expect(response.body).to.have.property('result');
    expect(infoLogger).to.have.been.calledOnceWith('do get');
  }

  @test
  async testPostRouteShouldReturn405() {
    await DemoServerTest.doRequest.post('/a/b/c').expect(405);
  }

  @test
  async testGetConfigValueShouldHappyPass() {
    const response = await DemoServerTest.doRequest.get('/a/config');
    expect(response.body).to.deep.equal({result: 'config result'});
  }

  @test
  async testRequestValidationShouldReturn422() {
    const response = await DemoServerTest.doRequest.post('/a/check/validate').expect(422);
    expect(response.body).to.have.property('code', 'request.validation.error');
  }

  @test
  async testRequestValidationShouldHappyPass() {
    await DemoServerTest.doRequest.post('/a/check/validate').send({name: 'test'}).expect(200);
  }

  @test
  async testMiddlewareShouldHappyPass() {
    const response = await DemoServerTest.doRequest.get('/a/check/middleware').expect(200);
    expect(response.body).to.have.property('result', 'middlewareTest');
    expect(DemoServerTest.testMiddlewareFunction).to.have.been.calledOnce;
  }

  @test
  async testEnvMiddlewareShouldNotCalled() {
    const response = await DemoServerTest.doRequest.get('/a/check/otherEnvMiddleware').expect(200);
    expect(response.body).to.have.property('result', 'middlewareOtherEnvTest');
    expect(DemoServerTest.testOtherEnvMiddlewareFunction).to.have.not.called;
  }

  @test
  async testMiddlewareShouldStopRequestWith404() {
    await DemoServerTest.doRequest.get('/a/check/middleware/stop').expect(404);
  }

  @test
  async testRoutePathParamAndArgumentParamShouldHappyPass() {
    const response = await DemoServerTest.doRequest.put('/a/check/param/123/sec/abc').send({p1 : 1}).expect(202);
    expect(response.body).to.have.property('id', 123);
    expect(response.body).to.have.property('result');
    expect(response.body.result).to.be.eql({id: '123', name: 'abc', p1: 1});
  }

  @test
  async testDecoratorAopShouldHappyPass() {
    await DemoServerTest.doRequest.get('/a/test/aop/decorator').expect(200);
    expect(DemoServerTest.testAopFunction).to.been.calledOnceWith('D');
  }

  @test
  async testWildcardDecoratorAopShouldHappyPass() {
    const response = await DemoServerTest.doRequest.get('/a/test/aop/wildcard').expect(200);
    expect(DemoServerTest.testAopFunction).to.been.callCount(1);
    expect(DemoServerTest.testAopFunction).to.been.calledOnceWith('W');
    expect(response.body).to.have.property('body', 2);
  }

  @test
  async testNegativeAopShouldNotCalled() {
    const response = await DemoServerTest.doRequest.get('/a/test/aop/negative').expect(200);
    expect(DemoServerTest.testAopFunction).to.been.callCount(0);
    expect(response.body).to.have.property('body', 3);
  }
}

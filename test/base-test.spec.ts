import * as chai from "chai";
import * as chaiAsPromise from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import * as superTest from "supertest";
import {Server} from "http";
import {TestServer} from "./server/TestServer";

chai.use(chaiAsPromise);
chai.use(sinonChai);

export abstract class BaseServerTest {
    protected static httpServer: Server;
    protected static doRequest: superTest.SuperTest<superTest.Test>;
    protected static testServer: TestServer = new TestServer();

    static async before() {
        if (this.httpServer && this.httpServer.listening) return;
        this.httpServer = await this.testServer.startServer();
        this.doRequest = superTest(this.httpServer);
    }

    static async after() {
        await this.testServer.stopServer();
    }
}

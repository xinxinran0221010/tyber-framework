import {ServerApp, DirectoryScan} from "../../lib/src";

@DirectoryScan(["./services", './controllers'])
export class TestServer extends ServerApp {

    basePath(): string {
        return __dirname;
    }
}

import {TestD1} from "../aop/TestDecorator";

@TestD1()
export class TestAopService {

    testW(): number {
        return 2;
    }

    testNegativeW(): number {
        return 3;
    }

    testD(): string {
        return '1';
    }

    testR(): string {
        return 'R';
    }
}

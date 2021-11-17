import {After, Aspect, Before, Pointcut} from "../../../lib/src";

@Aspect()
export class TestAspect {

    @Pointcut('@target(TestD1).*D')
    testDecoratorPointcut(): void {}

    @Pointcut('*AopService.*W && !*.*NegativeW')
    testWildcardPointcut(): void {}

    @Before('testDecoratorPointcut')
    doAopD(next: Function): string {
        TestAspect.fakeProcessAop('D');
        return next();
    }

    @After('testWildcardPointcut')
    doAopW(next: Function): void {
        TestAspect.fakeProcessAop('W');
    }

    static fakeProcessAop(name: string): void {

    }
}

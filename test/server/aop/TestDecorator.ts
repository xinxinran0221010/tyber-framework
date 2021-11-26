import {BaseDecorator} from "../../../lib/src/decorators";

class TestDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return 'Test_TestD1';
    }

    getDecoratorName(): string {
        return 'TestD1';
    }

    isBeanDecorator(): boolean {
        return true;
    }

    isStaticBean(): boolean {
        return false;
    }

    protected beanFunctionGetter(): (target) => (target?: unknown) => unknown {
        return target => target;
    }
}

export const TestDecorator = new TestDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function TestD1(beanName?: string): ClassDecorator {
    return (target) => {
        const beanId = beanName || target.name;
        TestDecorator.registerDecorator(target, beanId, beanId);
    }
}

import {IDecorator} from "./IDecorator";
import {BeanUtils, TypeUtils, Assert} from "@utils";

export abstract class BaseDecorator implements IDecorator {

    constructor() {
        TypeUtils.saveDecoratorNameSign(this);
    }

    abstract getDecoratorName(): string;

    abstract getDecoratorSign(): string;

    protected isBeanDecorator(): boolean {
        return false;
    }

    protected isStaticBean(): boolean {
        return true;
    }

    protected beanFunctionGetter(): (target) => (target?: unknown) => unknown {
        return () => null;
    }

    // noinspection JSUnusedGlobalSymbols
    registerDecorator(target: Record<string, unknown> | NewableFunction, decoratorValue: unknown, beanId?: string): void {
        if (this.isBeanDecorator()) {
            const beanFunc = this.beanFunctionGetter()(target);
            Assert.notEmpty(beanFunc, '[Decorator] bean function can not be null.');
            BeanUtils.makeBeanDefinition(beanFunc, beanId || target.name as string, this.isStaticBean());
        }

        TypeUtils.saveMetadata(this.getDecoratorSign(), decoratorValue, target, beanId);
    }
}

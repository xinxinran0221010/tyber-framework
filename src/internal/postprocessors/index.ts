import * as Bearcat from 'bearcat-es6-decorator-aop';
import {isFunction} from 'lodash';
import {IPostBeanProcessor} from './IPostBeanProcessor';
import {FrameBeanDetectPostProcessor} from './FrameBeanDetectPostProcessor';
import {LoggerPostProcessor} from './LoggerPostProcessor';
import {RouteRegisterPostProcessor} from './RouteRegisterPostProcessor';
import {AutowiredPostProcessor} from "./AutowiredPostProcessor";
import {ConfigValuePostProcessor} from "./ConfigValuePostProcessor";
import {TypeUtils} from '@utils'
import {IShutdownListener} from "../IShutdownable";

export class PostBeanProcessorManager implements IShutdownListener {
    private processors: IPostBeanProcessor[] = [];

    private triggered = false;

    checkProcessorSync(newProcessor: IPostBeanProcessor): boolean {
        return !TypeUtils.isAsyncFunction(newProcessor.processPostBean);
    }

    addPostBeanProcessors(newProcessors: IPostBeanProcessor[]): void {
        if (newProcessors) {
            const invalidProcessors: IPostBeanProcessor[] = newProcessors.filter(p => !this.checkProcessorSync(p));
            if (invalidProcessors.length) {
                const invalidProcessorNames: string = invalidProcessors.map(p => p['name']).join();
                throw new Error(`[post bean process error] process function can not be async. error processors: ${invalidProcessorNames}`);
            }
            this.processors = [...this.processors, ...newProcessors];
        }
    }

    triggerProcess(): void {
        if (Bearcat.state < 4) {
            throw new Error('[post bean process error] Bearcat has not started yet.');
        }

        if (this.triggered) {
            throw new Error('[post bean process error] Processors have already been triggered.');
        }

        const beanFactory: Bearcat.BeanFactory = Bearcat.getBeanFactory();
        Object.keys(beanFactory.getBeanDefinitions()).forEach((beanName: string) => {
            const beanObj = Bearcat.getBean(beanName);
            this.processors.forEach((processor: IPostBeanProcessor) => processor.processPostBean(beanName, beanObj));
            if (isFunction(beanObj['afterPropertiesSet'])) {
                beanObj['afterPropertiesSet'].call(beanObj);
            }
        });
        this.triggered = true;
    }

    onServerClose() {
        this.triggered = false;
    }
}

export * from './IPostBeanProcessor';
export * from './FrameBeanDetectPostProcessor';
export * from './LoggerPostProcessor';
export * from './ConfigValuePostProcessor';
export * from './AutowiredPostProcessor';
export * from './RouteRegisterPostProcessor';

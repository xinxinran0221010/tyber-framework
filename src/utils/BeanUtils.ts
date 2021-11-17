import * as File from 'fs';
import {extname, resolve as resolvePath} from 'path';
import * as Bearcat from 'bearcat-es6-decorator-aop';
import {upperFirst, isFunction, toLower} from 'lodash';
import {BeanFactory} from "bearcat-es6-decorator-aop";
import {TypeUtils} from "./TypeUtils";
import {AspectInfo} from "@decorators";

interface BeanMetadata {
    id: string,
    func: NewableFunction,
    proxy?: boolean,
    aop? : AopDescription[],
    aspectInfo?: AspectInfo,
}

export type AopDescription = {
    pointcut: {
        type: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expressions: any[]
    },
    advice: string,
    runtime: boolean,
    order?: number,
};

export class BeanUtils {
    private static readonly beanDefinitions: BeanMetadata[] = [];
    private static readonly beanRegisteredDefinitions: BeanMetadata[] = [];
    private static readonly idKey = 'bearcat:beanName';
    private static readonly beanNameDuplicateChecker: Set<string> = new Set<string>();

    static generateConfigFile(scan: string | string[]): string {
        const configPath = resolvePath('./.gate.config.json');
        File.writeFileSync(configPath, JSON.stringify({scan}));
        return configPath;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static getBean(beanName: string): any {
        return Bearcat.getBean(beanName);
    }

    static getBeanName(serviceName: string): string {
        return `${upperFirst(serviceName)}`;
    }

    static makeBeanDefinition(classFunction: NewableFunction, beanName: string, isStaticBean: boolean): void {
        if (this.beanNameDuplicateChecker.has(beanName)) {
            throw new Error(`[bean init]Duplicate bean name: ${beanName}`);
        }
        this.beanNameDuplicateChecker.add(beanName);

        BeanUtils.beanDefinitions.push({
            id: beanName,
            func: classFunction,
            proxy: !isStaticBean,
        });

        if (!isStaticBean) {
            BeanUtils.makeBeanMethodsEnumerable(classFunction);
        }

        TypeUtils.saveMetadata(BeanUtils.idKey, beanName, classFunction);
    }

    static makeAopDefinition(classFunction: NewableFunction, beanName: string, aspectInfo: AspectInfo): void {
        if (this.beanNameDuplicateChecker.has(beanName)) {
            throw new Error(`[bean init]Duplicate bean name: ${beanName}`);
        }
        this.beanNameDuplicateChecker.add(beanName);

        BeanUtils.beanDefinitions.unshift({
            id: beanName,
            func: classFunction,
            aspectInfo: aspectInfo,
        });

        TypeUtils.saveMetadata(BeanUtils.idKey, beanName, classFunction);
    }

    static initializeProjectBeans(): void {
        const beanFactory: BeanFactory = Bearcat.getBeanFactory();
        BeanUtils.beanDefinitions.forEach(beanMetadata => {
            if (beanMetadata.aspectInfo) {
                beanMetadata.aop = beanMetadata.aspectInfo.makeAopConfiguration();
                Reflect.deleteProperty(beanMetadata, 'aspectInfo');
            }
            beanFactory.registerBean(beanMetadata.id, beanMetadata);
            BeanUtils.beanRegisteredDefinitions.push(beanMetadata);
        });
        BeanUtils.beanDefinitions.length = 0;
    }

    static getBeanNameFromBean(classOrBean: Record<string | symbol, unknown> | NewableFunction): string {
        if (!classOrBean) {
            return null;
        }
        const beanFunction = isFunction(classOrBean) ? classOrBean : classOrBean.constructor;
        const propertyDescriptor = TypeUtils.getSavedMetadata(BeanUtils.idKey, beanFunction);
        return propertyDescriptor || null;
    }

    static innerRequire(jsonPath: string): Record<string | symbol, unknown> {
        let contextResult = null;

        try {
            contextResult = require(jsonPath);
            return contextResult;
        } catch (ignored) {
        }

        return contextResult;
    }

    static scanDirectories(scanPath: string, extName: string, recurse: boolean, cb: (filePath: string) => void): void {
        if (scanPath) {
            if (!File.existsSync(scanPath)) {
                return;
            }

            if (!File.statSync(scanPath).isDirectory()) {
                return;
            }

            const files = File.readdirSync(scanPath);

            files.forEach(f => {
                const thisFile = resolvePath(scanPath, f);

                if (recurse && File.statSync(thisFile).isDirectory()) {
                    BeanUtils.scanDirectories(thisFile, extName, recurse, cb);
                }

                if (!File.statSync(thisFile).isFile() || toLower(extname(thisFile)) !== toLower(extName)) {
                    return;
                }

                cb(thisFile);
            });
        }
    }

    private static makeBeanMethodsEnumerable(classFunction: NewableFunction): void {
        const proto = classFunction.prototype;
        Reflect.ownKeys(proto).forEach(key => {
            const descriptor = Object.getOwnPropertyDescriptor(proto, key);
            if (isFunction(descriptor.value) && key !== 'constructor') {
                descriptor.enumerable = true;
                Object.defineProperty(proto, key, descriptor);
            }
        });
    }

     static resetBeanDefinitions() {
        BeanUtils.beanRegisteredDefinitions.forEach(beanDefinition => {
            BeanUtils.beanDefinitions.push(beanDefinition);
        });
        BeanUtils.beanRegisteredDefinitions.length = 0;
    }
}

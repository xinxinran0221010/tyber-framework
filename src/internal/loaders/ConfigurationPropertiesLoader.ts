import {join as joinPath} from 'path';
import {isNil, isObject, get as objectGet} from 'lodash';
import {BeanUtils} from '@utils';
import {IServerApp} from "@app";
import {IConfigurationLoader} from "./IConfigurationLoader";

export class ConfigurationPropertiesLoader implements IConfigurationLoader {
    private static innerInstance: ConfigurationPropertiesLoader = new ConfigurationPropertiesLoader();

    private configPath: string;

    private propertiesObject: Record<string, unknown> = {};

    private env: string;

    getOrder(): number {
        return Number.NEGATIVE_INFINITY;
    }

    constructor() {
        return ConfigurationPropertiesLoader.innerInstance;
    }

    load(serverApp: IServerApp): void {
        this.loadDefault(serverApp.getConfigurationPath(), serverApp.getEnv());
    }

    loadDefault(configPath: string, env: string): void {
        if (this.configPath) {
            return;
        }
        this.env = env;
        this.configPath = configPath;

        const propertyLoader = this.loadPropertyFile.bind(this);
        BeanUtils.scanDirectories(this.configPath, '.json', false, propertyLoader);
        BeanUtils.scanDirectories(joinPath(this.configPath, env), '.json', true, propertyLoader);
    }

    private loadPropertyFile(jsonPath: string): void {
        const configProperties = BeanUtils.innerRequire(jsonPath);

        if (isNil(configProperties) || !isObject(configProperties)) {
            return;
        }

        Object.keys(configProperties).forEach(k => {
            if (this.propertiesObject.hasOwnProperty(k)) {
                throw new Error('Duplicate properties in config files.');
            }

            this.propertiesObject[k] = configProperties[k];
        });
    }

    getConfigByKey(key?: string): string | number | null | Record<string, unknown> | unknown {
        if (this.propertiesObject.hasOwnProperty(key)) {
            return this.propertiesObject[key];
        }
        return null;
    }

    getConfig(keyPath: string, defaultValue?: unknown): string | number | null | Record<string, unknown> | unknown {
        return objectGet(this.propertiesObject, keyPath, defaultValue);
    }

    getEnv(): string {
        return this.env;
    }
}

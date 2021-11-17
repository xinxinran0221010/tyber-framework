"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationPropertiesLoader = void 0;
const path_1 = require("path");
const lodash_1 = require("lodash");
const _utils_1 = require("@utils");
class ConfigurationPropertiesLoader {
    constructor() {
        this.propertiesObject = {};
        return ConfigurationPropertiesLoader.innerInstance;
    }
    getOrder() {
        return Number.NEGATIVE_INFINITY;
    }
    load(serverApp) {
        this.loadDefault(serverApp.getConfigurationPath(), serverApp.getEnv());
    }
    loadDefault(configPath, env) {
        if (this.configPath) {
            return;
        }
        this.env = env;
        this.configPath = configPath;
        const propertyLoader = this.loadPropertyFile.bind(this);
        _utils_1.BeanUtils.scanDirectories(this.configPath, '.json', false, propertyLoader);
        _utils_1.BeanUtils.scanDirectories(path_1.join(this.configPath, env), '.json', true, propertyLoader);
    }
    loadPropertyFile(jsonPath) {
        const configProperties = _utils_1.BeanUtils.innerRequire(jsonPath);
        if (lodash_1.isNil(configProperties) || !lodash_1.isObject(configProperties)) {
            return;
        }
        Object.keys(configProperties).forEach(k => {
            if (this.propertiesObject.hasOwnProperty(k)) {
                throw new Error('Duplicate properties in config files.');
            }
            this.propertiesObject[k] = configProperties[k];
        });
    }
    getConfigByKey(key) {
        if (this.propertiesObject.hasOwnProperty(key)) {
            return this.propertiesObject[key];
        }
        return null;
    }
    getConfig(keyPath, defaultValue) {
        return lodash_1.get(this.propertiesObject, keyPath, defaultValue);
    }
    getEnv() {
        return this.env;
    }
}
exports.ConfigurationPropertiesLoader = ConfigurationPropertiesLoader;
ConfigurationPropertiesLoader.innerInstance = new ConfigurationPropertiesLoader();
//# sourceMappingURL=ConfigurationPropertiesLoader.js.map
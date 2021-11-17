"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogConfigurationLoader = void 0;
const _utils_1 = require("@utils");
const _constants_1 = require("@constants");
class LogConfigurationLoader {
    getOrder() {
        return -100;
    }
    load(serverApp) {
        var _a;
        _utils_1.LoggerUtils.initLogger((_a = serverApp.getConfigurationLoader()) === null || _a === void 0 ? void 0 : _a.getConfig('log', _constants_1.DefaultLoggerConfig));
    }
}
exports.LogConfigurationLoader = LogConfigurationLoader;
//# sourceMappingURL=LogConfigurationLoader.js.map
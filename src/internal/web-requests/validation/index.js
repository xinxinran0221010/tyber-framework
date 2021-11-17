"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validation = void 0;
const tslib_1 = require("tslib");
const FieldValidator_1 = require("./FieldValidator");
const _exceptions_1 = require("@exceptions");
class Validation {
    static compileValidator(v) {
        return new FieldValidator_1.FieldValidator(v.rules, v.messages || {}, v.filters);
    }
    static validateRequests(requestData, v) {
        const validator = new FieldValidator_1.FieldValidator(v.rules, v.messages || {}, v.filters);
        validator.prepareData(requestData);
        if (!validator.valid) {
            throw new _exceptions_1.ValidationError(validator.getErrorMessageInfo());
        }
    }
}
exports.Validation = Validation;
tslib_1.__exportStar(require("./FieldValidator"), exports);
//# sourceMappingURL=index.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiredRules = void 0;
const lodash_1 = require("lodash");
class RequiredRules {
    constructor(validator) {
        this.validator = validator;
    }
    static emptyValue(val) {
        return lodash_1.isNil(val) || !lodash_1.toString(val).trim();
    }
    required(field, value, message) {
        if (RequiredRules.emptyValue(value)) {
            this.validator.addError(field, 'requiredRule', 'required', message || `Field '${field}' is mandatory.`);
            return false;
        }
        return true;
    }
    requiredIf(field, value, args, message) {
        if (args.length >= 2) {
            if (args.length % 2 === 0) {
                const argGroups = lodash_1.chunk(args, 2);
                const allData = this.validator.fields || {};
                let needRequired = true, sameField = false;
                argGroups.forEach(argGroup => {
                    if (RequiredRules.emptyValue(allData[argGroup[0]]) || !lodash_1.isEqual(allData[argGroup[0]], argGroup[1])) {
                        needRequired = false;
                    }
                    if (argGroup[0] == field) {
                        sameField = true;
                    }
                });
                if (sameField) {
                    this.validator.addError(field, 'requiredRule', 'requiredIf', message || `Field '${field}' needs to contain another field name in the args.`);
                    return false;
                }
                this.validator.validations[field].required = needRequired;
                if (needRequired && RequiredRules.emptyValue(value)) {
                    this.validator.addError(field, 'requiredRule', 'requiredIf', message || `Field '${field}' is mandatory.`);
                    return false;
                }
                return true;
            }
            else {
                this.validator.addError(field, 'requiredRule', 'requiredIf', message || `Field '${field}' has an incorrect number of arguments. The arguments length needs to be a multiple of 2`);
                return false;
            }
        }
        else {
            this.validator.addError(field, 'requiredRule', 'requiredIf', message || `Field '${field}' required a minimum of two arguments`);
            return false;
        }
    }
    requiredNotIf(field, value, args, message) {
        if (args.length >= 2) {
            if (args.length % 2 === 0) {
                const argGroups = lodash_1.chunk(args, 2);
                const allData = this.validator.fields || {};
                let needRequired = true, sameField = false;
                argGroups.forEach(argGroup => {
                    if (RequiredRules.emptyValue(allData[argGroup[0]]) || lodash_1.isEqual(allData[argGroup[0]], argGroup[1])) {
                        needRequired = false;
                    }
                    if (argGroup[0] == field) {
                        sameField = true;
                    }
                });
                if (sameField) {
                    this.validator.addError(field, 'requiredRule', 'requiredNotIf', message || `Field '${field}' needs to contain another field name in the args.`);
                    return false;
                }
                this.validator.validations[field].required = needRequired;
                if (needRequired && RequiredRules.emptyValue(value)) {
                    this.validator.addError(field, 'requiredRule', 'requiredNotIf', message || `Field '${field}' is mandatory.`);
                    return false;
                }
                return true;
            }
            else {
                this.validator.addError(field, 'requiredRule', 'requiredIf', message || `Field '${field}' has an incorrect number of arguments. The arguments length needs to be a multiple of 2`);
                return false;
            }
        }
        else {
            this.validator.addError(field, 'requiredRule', 'requiredIf', message || `Field '${field}' required a minimum of two arguments`);
            return false;
        }
    }
    requiredWith(field, value, args, message) {
        if (!lodash_1.isArray(args)) {
            args = [args];
        }
        if (args.length) {
            let needRequired = false;
            const allData = this.validator.fields || {};
            args.forEach(arg => {
                if (!RequiredRules.emptyValue(allData[arg])) {
                    needRequired = true;
                }
            });
            if (needRequired && RequiredRules.emptyValue(value)) {
                this.validator.addError(field, 'requiredRule', 'requiredWith', message || `Field '${field}' is mandatory.`);
                return false;
            }
            return true;
        }
        else {
            this.validator.addError(field, 'requiredRule', 'requiredWith', message || `Field '${field}' requires at least one other field in the argument`);
            return false;
        }
    }
    requiredWithout(field, value, args, message) {
        if (!lodash_1.isArray(args)) {
            args = [args];
        }
        if (args.length) {
            let needRequired = false;
            const allData = this.validator.fields || {};
            args.forEach(arg => {
                if (RequiredRules.emptyValue(allData[arg])) {
                    needRequired = true;
                }
            });
            this.validator.validations[field].required = needRequired;
            if (needRequired && RequiredRules.emptyValue(value)) {
                this.validator.addError(field, 'requiredRule', 'requiredWithout', message || `Field '${field}' is mandatory.`);
                return false;
            }
            return true;
        }
        else {
            this.validator.addError(field, 'requiredRule', 'requiredWithout', message || `Field '${field}' requires at least one other field in the argument`);
            return false;
        }
    }
    requiredWithAll(field, value, args, message) {
        if (!lodash_1.isArray(args)) {
            args = [args];
        }
        if (args.length) {
            let needRequired = true;
            const allData = this.validator.fields || {};
            args.forEach(arg => {
                if (RequiredRules.emptyValue(allData[arg])) {
                    needRequired = false;
                }
            });
            this.validator.validations[field].required = needRequired;
            if (needRequired && RequiredRules.emptyValue(value)) {
                this.validator.addError(field, 'requiredRule', 'requiredWithAll', message || `Field '${field}' is mandatory.`);
                return false;
            }
            return true;
        }
        else {
            this.validator.addError(field, 'requiredRule', 'requiredWithAll', message || `Field '${field}' requires at least one other field in the argument`);
            return false;
        }
    }
    requiredWithoutAll(field, value, args, message) {
        if (!lodash_1.isArray(args)) {
            args = [args];
        }
        if (args.length) {
            let needRequired = true;
            const allData = this.validator.fields || {};
            args.forEach(arg => {
                if (!RequiredRules.emptyValue(allData[arg])) {
                    needRequired = false;
                }
            });
            this.validator.validations[field].required = needRequired;
            if (needRequired && RequiredRules.emptyValue(value)) {
                this.validator.addError(field, 'requiredRule', 'requiredWithoutAll', message || `Field '${field}' is mandatory.`);
                return false;
            }
            return true;
        }
        else {
            this.validator.addError(field, 'requiredRule', 'requiredWithoutAll', message || `Field '${field}' requires at least one other field in the argument`);
            return false;
        }
    }
}
exports.RequiredRules = RequiredRules;
//# sourceMappingURL=RequiredRules.js.map
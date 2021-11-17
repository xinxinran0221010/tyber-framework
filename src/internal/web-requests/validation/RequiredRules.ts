// noinspection TypeScriptPreferShortImport
import {FieldValidator} from "@internal";
import {isNil, toString, chunk, isEqual, isArray} from 'lodash';

export class RequiredRules {
    private validator: FieldValidator;

    constructor(validator: FieldValidator) {
        this.validator = validator;
    }

    private static emptyValue(val: unknown): boolean {
        return isNil(val) || !toString(val).trim()
    }

    // noinspection JSUnusedGlobalSymbols
    required(field: string, value: unknown, message: string): boolean {

        if (RequiredRules.emptyValue(value)) {
            this.validator.addError(field, 'requiredRule', 'required', message || `Field '${field}' is mandatory.`);
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    requiredIf(field: string, value: unknown, args: string[], message: string): boolean {
        if (args.length >= 2) {
            if (args.length % 2 === 0) {
                const argGroups = chunk(args, 2);
                const allData = this.validator.fields || {};
                let needRequired = true, sameField = false;
                argGroups.forEach(argGroup => {
                    if (RequiredRules.emptyValue(allData[argGroup[0]]) || !isEqual(allData[argGroup[0]], argGroup[1])) {
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
            } else {
                this.validator.addError(
                    field,
                    'requiredRule',
                    'requiredIf',
                    message || `Field '${field}' has an incorrect number of arguments. The arguments length needs to be a multiple of 2`
                );

                return false;
            }
        } else {
            this.validator.addError(field, 'requiredRule', 'requiredIf', message || `Field '${field}' required a minimum of two arguments`);
            return false;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    requiredNotIf(field: string, value: unknown, args: string[], message: string): boolean {
        if (args.length >= 2) {
            if (args.length % 2 === 0) {
                const argGroups = chunk(args, 2);
                const allData = this.validator.fields || {};
                let needRequired = true, sameField = false;
                argGroups.forEach(argGroup => {
                    if (RequiredRules.emptyValue(allData[argGroup[0]]) || isEqual(allData[argGroup[0]], argGroup[1])) {
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
            } else {
                this.validator.addError(
                    field,
                    'requiredRule',
                    'requiredIf',
                    message || `Field '${field}' has an incorrect number of arguments. The arguments length needs to be a multiple of 2`
                );

                return false;
            }
        } else {
            this.validator.addError(field, 'requiredRule', 'requiredIf', message || `Field '${field}' required a minimum of two arguments`);
            return false;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    requiredWith(field: string, value: unknown, args: string | string[], message: string): boolean {
        if (!isArray(args)) {
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
        } else {
            this.validator.addError(field, 'requiredRule', 'requiredWith', message || `Field '${field}' requires at least one other field in the argument`);
            return false;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    requiredWithout(field: string, value: unknown, args: string | string[], message: string): boolean {
        if (!isArray(args)) {
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
        } else {
            this.validator.addError(field, 'requiredRule', 'requiredWithout', message || `Field '${field}' requires at least one other field in the argument`);
            return false;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    requiredWithAll(field: string, value: unknown, args: string | string[], message: string): boolean {
        if (!isArray(args)) {
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
        } else {
            this.validator.addError(field, 'requiredRule', 'requiredWithAll', message || `Field '${field}' requires at least one other field in the argument`);
            return false;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    requiredWithoutAll(field: string, value: unknown, args: string | string[], message: string): boolean {
        if (!isArray(args)) {
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
        } else {
            this.validator.addError(field, 'requiredRule', 'requiredWithoutAll', message || `Field '${field}' requires at least one other field in the argument`);
            return false;
        }
    }
}

import {FieldValidator, FiltersParameter, MessagesParameter, RulesParameter} from "./FieldValidator";
import {ValidationError} from "@exceptions";

export interface ValidationDescription {
    rules: RulesParameter,
    messages?: MessagesParameter,
    filters?: FiltersParameter,
}

export class Validation {

    static compileValidator(v: ValidationDescription): FieldValidator {
        return new FieldValidator(v.rules, v.messages || {}, v.filters)
    }

    // noinspection JSUnusedGlobalSymbols
    static validateRequests(requestData: unknown, v: ValidationDescription): void {
        const validator = new FieldValidator(v.rules, v.messages || {}, v.filters);
        validator.prepareData(requestData);
        if (!validator.valid) {
            throw new ValidationError(validator.getErrorMessageInfo());
        }
    }
}

export * from "./FieldValidator";

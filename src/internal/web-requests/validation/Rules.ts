import {default as v} from 'validator';
import * as moment from 'moment-timezone';
import {isUndefined, isArray, isString, isEqual, isNumber, toString, isNil} from 'lodash';
// noinspection TypeScriptPreferShortImport
import {FieldValidator} from "@internal";
import {MomentBuiltinFormat} from "moment";

const date_formats: (string | MomentBuiltinFormat)[] = [
    moment.ISO_8601,
    'DD-MM-YYYY',
    'DD.MM.YYYY',
    'DD/MM/YYYY',
    'D-M-YYYY',
    'D.M.YYYY',
    'D/M/YYYY',
    'YYYY-MM-DD',
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DD HH:mm:Z',
    'YYYY-MM-DD HH:mm:ZZ',
    'YYYY-MM-DD HH:mm Z'
];

export class Rules {
    private validator: FieldValidator;

    constructor(validator: FieldValidator) {
        this.validator = validator;
    }

    // noinspection JSUnusedGlobalSymbols
    accepted(field: string, value: unknown, message: string): boolean {
        if (value === true || value === 'yes' || value === 'on' || value === 1 || value === "1") {
            return true;
        } else {
            this.validator.addError(field, 'rule', 'accepted', message || 'The value of the field needs to be between 1, yes, or true');
            return false;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    after(field: string, value: unknown, afterDate: string, message: string): boolean {
        let mAfterDate, mDate;
        if (isUndefined(this.validator.validations[field].dateFormat)) {
            mAfterDate = moment(afterDate, date_formats);
            mDate = moment(value, date_formats);
        } else {
            mAfterDate = moment(afterDate, date_formats.concat([this.validator.validations[field].dateFormat]));
            mDate = moment(value, this.validator.validations[field].dateFormat, true);
        }

        if (message) {
            message = message.replace(':afterDate', afterDate);
        }

        if (!mAfterDate.isValid()) {
            this.validator.addError(field, 'rule', 'after', 'The after date argument is an invalid date');
            return false;
        } else if (!mDate.isValid()) {
            this.validator.addError(field, 'rule', 'after', 'The value of the field is an invalid date');
            return false;
        } else if (mAfterDate.valueOf() > mDate.valueOf()) {
            this.validator.addError(field, 'rule', 'after', message || 'The provided date does not fall after the date mentioned in the argument');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    alpha(field: string, value: unknown, message: string): boolean {
        if (!v.isAlpha(toString(value))) {
            this.validator.addError(field, 'rule', 'alpha', message || 'The value of the field needs to be alphabetical');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    alphaDash(field: string, value: unknown, message: string): boolean {
        if (!(/^[A-Z0-9_-]+$/i.test(toString(value)))) {
            this.validator.addError(field, 'rule', 'alphaDash', message || 'The field value can only contain alphabetic characters, _ and -');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    alphaNumeric(field: string, value: unknown, message: string): boolean {
        if (!v.isAlphanumeric(toString(value))) {
            this.validator.addError(field, 'rule', 'alphaNumeric', message || 'The value of the field can only contain letters and numbers');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    before(field: string, value: unknown, beforeDate: string, message: string): boolean {
        let mBeforeDate: moment.Moment, mDate: moment.Moment;
        if (!isNil(this.validator.validations[field].dateFormat)) {
            mBeforeDate = moment(beforeDate, date_formats.concat([this.validator.validations[field].dateFormat]));
            mDate = moment(toString(value), this.validator.validations[field].dateFormat, true);
        } else {
            mBeforeDate = moment(beforeDate, date_formats);
            mDate = moment(toString(value), date_formats);
        }

        if (message) {
            message = message.replace(':beforeDate', beforeDate);
        }

        if (!mBeforeDate.isValid()) {
            this.validator.addError(field, 'rule', 'before', message || 'The before date argument is an invalid date');
            return false;
        } else if (!mDate.isValid()) {
            this.validator.addError(field, 'rule', 'before', message || 'The value of the field is an invalid date');
            return false;
        } else if (mBeforeDate.valueOf() < mDate.valueOf()) {
            this.validator.addError(field, 'rule', 'before', message || 'The provided date does not come before the date mentioned in the argument');
            return false;
        }

        return true;
    }


    //Length of characters
    // noinspection JSUnusedGlobalSymbols
    between(field: string, value: unknown, args: string[], message: string): boolean {
        return this.digitsBetween(field, value, args, message);
    }

    // noinspection JSUnusedGlobalSymbols
    boolean(field: string, value: unknown, message: string): boolean {
        if (value === true || value === false || value === 0 || value === "0" || value === 1 || value === "1") {
            return true;
        } else {
            this.validator.addError(field, 'rule', 'boolean', message || 'The value of the field needs to be between true, false, 0 and 1');
            return false;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    contains(field: string, value: unknown, inString: unknown, message: string): boolean {
        if (!isString(inString)) {
            this.validator.addError(field, 'rule', 'contains', 'The number of arguments provided is invalid. Please provide one single string');
            return false;
        } else {
            if (!v.contains(toString(value), inString)) {
                if (message) {
                    message.replace(':substring', inString);
                }
                this.validator.addError(field, 'rule', 'contains', message || 'The value of the field does not contains the specified text.');
                return false;
            }
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    date(field: string, value: unknown, message: string): boolean {
        if (!moment(value, date_formats, true).isValid()) {
            this.validator.addError(field, 'rule', 'date', message || 'The value provided for the field is an invalid date');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    dateFormat(field: string, value: unknown, format: string, message: string): boolean {
        if (!moment(value, format, true).isValid()) {
            if (message) {
                message.replace(':format', format);
            }
            this.validator.addError(field, 'rule', 'dateFormat', message || 'The value provided for the field is either invalid or not in the format mentioned');
            return false;
        }

        this.validator.validations[field].dateFormat = format;
        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    different(field: string, value: unknown, otherField: unknown, message: string): boolean {
        let otherValue = undefined;
        if (!isString(otherField)) {
            this.validator.addError(field, 'rule', 'different', 'The number of arguments provided is invalid. Please provide one single string');
            return false;
        } else {
            const otherFields = otherField.split('.').filter(function (e) {
                return e !== '';
            });

            otherFields.map(item => {
                if (isUndefined(otherValue)) {
                    otherValue = this.validator.fields && this.validator.fields[item];
                } else {
                    otherValue = otherValue[item];
                }
            });

            if (isUndefined(otherValue)) {
                this.validator.addError(field, 'rule', 'different', message || 'The field you are comparing the value against does not exist');
                return false;
            } else if (otherValue === value) {
                this.validator.addError(field, 'rule', 'different', message || 'The field you are comparing the value against is the same');
                return false;
            }
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    digits(field: string, value: unknown, dNumber: string, message: string): boolean {

        if (message) {
            message = message.replace(':digits', dNumber.toString());
        }

        if (!v.isInt(toString(dNumber))) {
            this.validator.addError(field, 'rule', 'digits', 'The argument entered is an invalid. Please enter digits');
            return false;
        } else if (+value != parseInt(toString(dNumber))) {
            this.validator.addError(field, 'rule', 'digits', message || 'The value does not match with the mentioned number');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    digitsBetween(field: string, value: unknown, args: string[], message: string): boolean {
        if (!isArray(args) || args.length !== 2) {
            this.validator.addError(field, 'rule', 'digitsBetween', 'The number of arguments in the field are invalid');
            return false;
        } else {
            if (!v.isInt(args[0]) || !v.isInt(args[1])) {
                this.validator.addError(field, 'rule', 'digitsBetween', 'The rule arguments for the field need to be integers');
                return false;
            } else if (parseInt(args[0]) >= parseInt(args[1])) {
                this.validator.addError(field, 'rule', 'digitsBetween', 'The rule argument for the min value cannot be greater than or equal to the max value');
                return false;
            } else if (parseInt(toString(value)) < parseInt(args[0]) || parseInt(toString(value)) > parseInt(args[1])) {
                if (message) {
                    message = message.replace(':min', args[0]).replace(':max', args[1]);
                }

                this.validator.addError(field, 'rule', 'digitsBetween', message || 'The digits are not within the specified range');
                return false;
            }
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    email(field: string, value: string, message: string): boolean {
        if (!v.isEmail(value)) {
            this.validator.addError(field, 'rule', 'email', message || 'The value entered is not a valid email');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    equals(field: string, value: unknown, arg: unknown, message: string): boolean {
        if ((isString(value) && isNumber(arg)) || (isNumber(value) && isString(arg))) {
            value = toString(value);
            arg = toString(arg);
        }
        if (!isEqual(value, arg)) {
            this.validator.addError(field, 'rule', 'equals', message || 'The value entered does not match with the argument');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    in(field: string, value: unknown, args: unknown, message: string): boolean {
        const argsArr = Array.isArray(args) ? args : [args];

        let match = false;

        for (let i = 0; i < argsArr.length; i++) {
            if (value == argsArr[i]) {
                match = true;
            }
        }

        if (!match) {
            this.validator.addError(field, 'rule', 'in', message || 'The value entered does not exist in the arguments supplied');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    integer(field: string, value: unknown, message: string): boolean {
        if (!v.isInt(toString(value))) {
            this.validator.addError(field, 'rule', 'integer', message || 'The value entered is not an integer');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    ip(field: string, value: unknown, message: string): boolean {
        if (!v.isIP(toString(value))) {
            this.validator.addError(field, 'rule', 'ip', message || 'The value entered is not an IP Address');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    json(field: string, value: unknown, message: string): boolean {
        if (!v.isJSON(toString(value))) {
            this.validator.addError(field, 'rule', 'json', message || 'The value entered is not a JSON string');
            return false;
        }

        return true;
    }

    //Length of characters
    // noinspection JSUnusedGlobalSymbols
    lengthBetween(field: string, value: unknown, args: unknown, message: string): boolean {

        if (!isArray(args) || args.length !== 2) {
            this.validator.addError(field, 'rule', 'between', 'The number of arguments in the field are invalid');
            return false;
        } else {
            if (!v.isInt(args[0]) || !v.isInt(args[1])) {
                this.validator.addError(field, 'rule', 'between', 'The rule arguments for the field need to be integers');
                return false;
            } else if (parseInt(args[0]) >= parseInt(args[1])) {
                this.validator.addError(field, 'rule', 'between', 'The rule argument for the min value cannot be greater than or equal to the max value');
                return false;
            } else if (value.toString().length < parseInt(args[0]) || value.toString().length > parseInt(args[1])) {
                if (message) {
                    message = message.replace(':minLength', args[0]).replace(':maxLength', args[1]);
                }

                this.validator.addError(field, 'rule', 'between', message || 'The size of the field is not within the specified range');
                return false;
            }
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    max(field: string, value: unknown, maxNum: string, message: string): boolean {
        if (!v.isInt(maxNum)) {
            this.validator.addError(field, 'rule', 'max', message || 'The rule arguments for max fields needs to be an integer');
            return false;
        } else if (parseInt(toString(value)) > parseInt(maxNum)) {
            if (message) {
                message.replace(':max', maxNum)
            }
            this.validator.addError(field, 'rule', 'max', message || 'The value of the field is greater than the max argument');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    maxLength(field: string, value: string, maxNum: string, message: string): boolean {
        if (!v.isInt(maxNum)) {
            this.validator.addError(field, 'rule', 'max', message || 'The rule arguments for max fields needs to be an integer');
            return false;
        } else if (value.toString().length > parseInt(maxNum)) {
            if (message) {
                message.replace(':maxLength', maxNum)
            }
            this.validator.addError(field, 'rule', 'maxLength', message || 'The size of the field is greater than the max argument');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    min(field: string, value: string, minNum: string, message: string): boolean {
        if (!v.isInt(minNum)) {
            this.validator.addError(field, 'rule', 'min', message || 'The rule arguments for min fields needs to be an integer');
            return false;
        } else if (parseInt(value) < parseInt(minNum)) {
            if (message) {
                message.replace(':min', minNum)
            }

            this.validator.addError(field, 'rule', 'min', message || 'The value of the field is lesser than the min argument');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    minLength(field: string, value: string, minNum: string, message: string): boolean {
        if (!v.isInt(minNum)) {
            this.validator.addError(field, 'rule', 'min', 'The rule arguments for min fields needs to be an integer');
            return false;
        } else if (value.toString().length < parseInt(minNum)) {
            if (message) {
                message.replace(':minLength', minNum)
            }

            this.validator.addError(field, 'rule', 'minLength', message || 'The size of the field is lesser than the min argument');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    notContains(field: string, value: string, inString: string, message: string): boolean {
        if (typeof inString !== "string") {
            this.validator.addError(field, 'rule', 'notContains', 'The number of arguments provided is invalid. Please provide one single string');
            return false;
        } else {
            if (v.contains(value, inString)) {
                if (message) {
                    message.replace(':substring', inString);
                }

                this.validator.addError(field, 'rule', 'notContains', message || 'The value of the field can only contain letters and numbers');
                return false;
            }
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    notIn(field: string, value: unknown, args: unknown, message: string): boolean {
        const argsArr = isArray(args) ? args : [args];

        const noMatch = !argsArr.some(arg => isEqual(value, arg));

        if (!noMatch) {
            this.validator.addError(field, 'rule', 'notIn', message || 'The value entered exists in the arguments supplied');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    numeric(field: string, value: unknown, message: string): boolean {
        if (!v.isNumeric(toString(value))) {
            this.validator.addError(field, 'rule', 'numeric', message || 'The value entered is not numeric');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    regex(field: string, value: string, regexp: unknown, message: string): boolean {
        if (!(regexp instanceof RegExp)) {
            this.validator.addError(field, 'rule', 'regex', message || 'The regex argument is not a valid regular expression');
            return false;
        } else if (!regexp.test(value)) {
            if (message) {
                message = message.replace(':regexp', toString(regexp));
            }

            this.validator.addError(field, 'rule', 'regex', message || 'The value provided did not match with the regex format');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    same(field: string, value: unknown, otherField: string, message: string): boolean {
        if (typeof otherField !== 'string') {
            this.validator.addError(field, 'rule', 'same', message || 'The number of arguments provided is invalid. Please provide one single string');
            return false;
        } else {
            const targetValue = this.validator.parseKey(otherField, this.validator.fields);

            if (isUndefined(targetValue)) {
                this.validator.addError(field, 'rule', 'same', message || 'The field you are comparing the value against does not exist');
                return false;
            } else if (!isEqual(value, targetValue)) {
                this.validator.addError(field, 'rule', 'same', message || 'The field you are comparing the value against are different');
                return false;
            }
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    string(field: string, value: unknown, message: string): boolean {
        if (!isString(value)) {
            this.validator.addError(field, 'rule', 'string', message || 'The value provided is not a string');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    timezone(field: string, value: string, message: string): boolean {
        if (!moment.tz.zone(value)) {
            this.validator.addError(field, 'rule', 'timezone', message || 'The value provided is not a valid timezone');
            return false;
        }

        return true;
    }

    // noinspection JSUnusedGlobalSymbols
    url(field: string, value: string, message: string): boolean {
        if (!v.isURL(value)) {
            this.validator.addError(field, 'rule', 'url', message || 'The value provided is not a URL');
            return false;
        }

        return true;
    }
}

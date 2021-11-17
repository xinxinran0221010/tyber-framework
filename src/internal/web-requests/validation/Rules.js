"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rules = void 0;
const validator_1 = require("validator");
const moment = require("moment-timezone");
const lodash_1 = require("lodash");
const date_formats = [
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
class Rules {
    constructor(validator) {
        this.validator = validator;
    }
    accepted(field, value, message) {
        if (value === true || value === 'yes' || value === 'on' || value === 1 || value === "1") {
            return true;
        }
        else {
            this.validator.addError(field, 'rule', 'accepted', message || 'The value of the field needs to be between 1, yes, or true');
            return false;
        }
    }
    after(field, value, afterDate, message) {
        let mAfterDate, mDate;
        if (lodash_1.isUndefined(this.validator.validations[field].dateFormat)) {
            mAfterDate = moment(afterDate, date_formats);
            mDate = moment(value, date_formats);
        }
        else {
            mAfterDate = moment(afterDate, date_formats.concat([this.validator.validations[field].dateFormat]));
            mDate = moment(value, this.validator.validations[field].dateFormat, true);
        }
        if (message) {
            message = message.replace(':afterDate', afterDate);
        }
        if (!mAfterDate.isValid()) {
            this.validator.addError(field, 'rule', 'after', 'The after date argument is an invalid date');
            return false;
        }
        else if (!mDate.isValid()) {
            this.validator.addError(field, 'rule', 'after', 'The value of the field is an invalid date');
            return false;
        }
        else if (mAfterDate.valueOf() > mDate.valueOf()) {
            this.validator.addError(field, 'rule', 'after', message || 'The provided date does not fall after the date mentioned in the argument');
            return false;
        }
        return true;
    }
    alpha(field, value, message) {
        if (!validator_1.default.isAlpha(lodash_1.toString(value))) {
            this.validator.addError(field, 'rule', 'alpha', message || 'The value of the field needs to be alphabetical');
            return false;
        }
        return true;
    }
    alphaDash(field, value, message) {
        if (!(/^[A-Z0-9_-]+$/i.test(lodash_1.toString(value)))) {
            this.validator.addError(field, 'rule', 'alphaDash', message || 'The field value can only contain alphabetic characters, _ and -');
            return false;
        }
        return true;
    }
    alphaNumeric(field, value, message) {
        if (!validator_1.default.isAlphanumeric(lodash_1.toString(value))) {
            this.validator.addError(field, 'rule', 'alphaNumeric', message || 'The value of the field can only contain letters and numbers');
            return false;
        }
        return true;
    }
    before(field, value, beforeDate, message) {
        let mBeforeDate, mDate;
        if (!lodash_1.isNil(this.validator.validations[field].dateFormat)) {
            mBeforeDate = moment(beforeDate, date_formats.concat([this.validator.validations[field].dateFormat]));
            mDate = moment(lodash_1.toString(value), this.validator.validations[field].dateFormat, true);
        }
        else {
            mBeforeDate = moment(beforeDate, date_formats);
            mDate = moment(lodash_1.toString(value), date_formats);
        }
        if (message) {
            message = message.replace(':beforeDate', beforeDate);
        }
        if (!mBeforeDate.isValid()) {
            this.validator.addError(field, 'rule', 'before', message || 'The before date argument is an invalid date');
            return false;
        }
        else if (!mDate.isValid()) {
            this.validator.addError(field, 'rule', 'before', message || 'The value of the field is an invalid date');
            return false;
        }
        else if (mBeforeDate.valueOf() < mDate.valueOf()) {
            this.validator.addError(field, 'rule', 'before', message || 'The provided date does not come before the date mentioned in the argument');
            return false;
        }
        return true;
    }
    between(field, value, args, message) {
        return this.digitsBetween(field, value, args, message);
    }
    boolean(field, value, message) {
        if (value === true || value === false || value === 0 || value === "0" || value === 1 || value === "1") {
            return true;
        }
        else {
            this.validator.addError(field, 'rule', 'boolean', message || 'The value of the field needs to be between true, false, 0 and 1');
            return false;
        }
    }
    contains(field, value, inString, message) {
        if (!lodash_1.isString(inString)) {
            this.validator.addError(field, 'rule', 'contains', 'The number of arguments provided is invalid. Please provide one single string');
            return false;
        }
        else {
            if (!validator_1.default.contains(lodash_1.toString(value), inString)) {
                if (message) {
                    message.replace(':substring', inString);
                }
                this.validator.addError(field, 'rule', 'contains', message || 'The value of the field does not contains the specified text.');
                return false;
            }
        }
        return true;
    }
    date(field, value, message) {
        if (!moment(value, date_formats, true).isValid()) {
            this.validator.addError(field, 'rule', 'date', message || 'The value provided for the field is an invalid date');
            return false;
        }
        return true;
    }
    dateFormat(field, value, format, message) {
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
    different(field, value, otherField, message) {
        let otherValue = undefined;
        if (!lodash_1.isString(otherField)) {
            this.validator.addError(field, 'rule', 'different', 'The number of arguments provided is invalid. Please provide one single string');
            return false;
        }
        else {
            const otherFields = otherField.split('.').filter(function (e) {
                return e !== '';
            });
            otherFields.map(item => {
                if (lodash_1.isUndefined(otherValue)) {
                    otherValue = this.validator.fields && this.validator.fields[item];
                }
                else {
                    otherValue = otherValue[item];
                }
            });
            if (lodash_1.isUndefined(otherValue)) {
                this.validator.addError(field, 'rule', 'different', message || 'The field you are comparing the value against does not exist');
                return false;
            }
            else if (otherValue === value) {
                this.validator.addError(field, 'rule', 'different', message || 'The field you are comparing the value against is the same');
                return false;
            }
        }
        return true;
    }
    digits(field, value, dNumber, message) {
        if (message) {
            message = message.replace(':digits', dNumber.toString());
        }
        if (!validator_1.default.isInt(dNumber)) {
            this.validator.addError(field, 'rule', 'digits', 'The argument entered is an invalid. Please enter digits');
            return false;
        }
        else if (value != dNumber) {
            this.validator.addError(field, 'rule', 'digits', message || 'The value does not match with the mentioned number');
            return false;
        }
        return true;
    }
    digitsBetween(field, value, args, message) {
        if (!lodash_1.isArray(args) || args.length !== 2) {
            this.validator.addError(field, 'rule', 'digitsBetween', 'The number of arguments in the field are invalid');
            return false;
        }
        else {
            if (!validator_1.default.isInt(args[0]) || !validator_1.default.isInt(args[1])) {
                this.validator.addError(field, 'rule', 'digitsBetween', 'The rule arguments for the field need to be integers');
                return false;
            }
            else if (parseInt(args[0]) >= parseInt(args[1])) {
                this.validator.addError(field, 'rule', 'digitsBetween', 'The rule argument for the min value cannot be greater than or equal to the max value');
                return false;
            }
            else if (parseInt(lodash_1.toString(value)) < parseInt(args[0]) || parseInt(lodash_1.toString(value)) > parseInt(args[1])) {
                if (message) {
                    message = message.replace(':min', args[0]).replace(':max', args[1]);
                }
                this.validator.addError(field, 'rule', 'digitsBetween', message || 'The digits are not within the specified range');
                return false;
            }
        }
        return true;
    }
    email(field, value, message) {
        if (!validator_1.default.isEmail(value)) {
            this.validator.addError(field, 'rule', 'email', message || 'The value entered is not a valid email');
            return false;
        }
        return true;
    }
    equals(field, value, arg, message) {
        if ((lodash_1.isString(value) && lodash_1.isNumber(arg)) || (lodash_1.isNumber(value) && lodash_1.isString(arg))) {
            value = lodash_1.toString(value);
            arg = lodash_1.toString(arg);
        }
        if (!lodash_1.isEqual(value, arg)) {
            this.validator.addError(field, 'rule', 'equals', message || 'The value entered does not match with the argument');
            return false;
        }
        return true;
    }
    in(field, value, args, message) {
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
    integer(field, value, message) {
        if (!validator_1.default.isInt(lodash_1.toString(value))) {
            this.validator.addError(field, 'rule', 'integer', message || 'The value entered is not an integer');
            return false;
        }
        return true;
    }
    ip(field, value, message) {
        if (!validator_1.default.isIP(lodash_1.toString(value))) {
            this.validator.addError(field, 'rule', 'ip', message || 'The value entered is not an IP Address');
            return false;
        }
        return true;
    }
    json(field, value, message) {
        if (!validator_1.default.isJSON(lodash_1.toString(value))) {
            this.validator.addError(field, 'rule', 'json', message || 'The value entered is not a JSON string');
            return false;
        }
        return true;
    }
    lengthBetween(field, value, args, message) {
        if (!lodash_1.isArray(args) || args.length !== 2) {
            this.validator.addError(field, 'rule', 'between', 'The number of arguments in the field are invalid');
            return false;
        }
        else {
            if (!validator_1.default.isInt(args[0]) || !validator_1.default.isInt(args[1])) {
                this.validator.addError(field, 'rule', 'between', 'The rule arguments for the field need to be integers');
                return false;
            }
            else if (parseInt(args[0]) >= parseInt(args[1])) {
                this.validator.addError(field, 'rule', 'between', 'The rule argument for the min value cannot be greater than or equal to the max value');
                return false;
            }
            else if (value.toString().length < parseInt(args[0]) || value.toString().length > parseInt(args[1])) {
                if (message) {
                    message = message.replace(':minLength', args[0]).replace(':maxLength', args[1]);
                }
                this.validator.addError(field, 'rule', 'between', message || 'The size of the field is not within the specified range');
                return false;
            }
        }
        return true;
    }
    max(field, value, maxNum, message) {
        if (!validator_1.default.isInt(maxNum)) {
            this.validator.addError(field, 'rule', 'max', message || 'The rule arguments for max fields needs to be an integer');
            return false;
        }
        else if (parseInt(lodash_1.toString(value)) > parseInt(maxNum)) {
            if (message) {
                message.replace(':max', maxNum);
            }
            this.validator.addError(field, 'rule', 'max', message || 'The value of the field is greater than the max argument');
            return false;
        }
        return true;
    }
    maxLength(field, value, maxNum, message) {
        if (!validator_1.default.isInt(maxNum)) {
            this.validator.addError(field, 'rule', 'max', message || 'The rule arguments for max fields needs to be an integer');
            return false;
        }
        else if (value.toString().length > parseInt(maxNum)) {
            if (message) {
                message.replace(':maxLength', maxNum);
            }
            this.validator.addError(field, 'rule', 'maxLength', message || 'The size of the field is greater than the max argument');
            return false;
        }
        return true;
    }
    min(field, value, minNum, message) {
        if (!validator_1.default.isInt(minNum)) {
            this.validator.addError(field, 'rule', 'min', message || 'The rule arguments for min fields needs to be an integer');
            return false;
        }
        else if (parseInt(value) < parseInt(minNum)) {
            if (message) {
                message.replace(':min', minNum);
            }
            this.validator.addError(field, 'rule', 'min', message || 'The value of the field is lesser than the min argument');
            return false;
        }
        return true;
    }
    minLength(field, value, minNum, message) {
        if (!validator_1.default.isInt(minNum)) {
            this.validator.addError(field, 'rule', 'min', 'The rule arguments for min fields needs to be an integer');
            return false;
        }
        else if (value.toString().length < parseInt(minNum)) {
            if (message) {
                message.replace(':minLength', minNum);
            }
            this.validator.addError(field, 'rule', 'minLength', message || 'The size of the field is lesser than the min argument');
            return false;
        }
        return true;
    }
    notContains(field, value, inString, message) {
        if (typeof inString !== "string") {
            this.validator.addError(field, 'rule', 'notContains', 'The number of arguments provided is invalid. Please provide one single string');
            return false;
        }
        else {
            if (validator_1.default.contains(value, inString)) {
                if (message) {
                    message.replace(':substring', inString);
                }
                this.validator.addError(field, 'rule', 'notContains', message || 'The value of the field can only contain letters and numbers');
                return false;
            }
        }
        return true;
    }
    notIn(field, value, args, message) {
        const argsArr = lodash_1.isArray(args) ? args : [args];
        const noMatch = !argsArr.some(arg => lodash_1.isEqual(value, arg));
        if (!noMatch) {
            this.validator.addError(field, 'rule', 'notIn', message || 'The value entered exists in the arguments supplied');
            return false;
        }
        return true;
    }
    numeric(field, value, message) {
        if (!validator_1.default.isNumeric(lodash_1.toString(value))) {
            this.validator.addError(field, 'rule', 'numeric', message || 'The value entered is not numeric');
            return false;
        }
        return true;
    }
    regex(field, value, regexp, message) {
        if (!(regexp instanceof RegExp)) {
            this.validator.addError(field, 'rule', 'regex', message || 'The regex argument is not a valid regular expression');
            return false;
        }
        else if (!regexp.test(value)) {
            if (message) {
                message = message.replace(':regexp', lodash_1.toString(regexp));
            }
            this.validator.addError(field, 'rule', 'regex', message || 'The value provided did not match with the regex format');
            return false;
        }
        return true;
    }
    same(field, value, otherField, message) {
        if (typeof otherField !== 'string') {
            this.validator.addError(field, 'rule', 'same', message || 'The number of arguments provided is invalid. Please provide one single string');
            return false;
        }
        else {
            const targetValue = this.validator.parseKey(otherField, this.validator.fields);
            if (lodash_1.isUndefined(targetValue)) {
                this.validator.addError(field, 'rule', 'same', message || 'The field you are comparing the value against does not exist');
                return false;
            }
            else if (!lodash_1.isEqual(value, targetValue)) {
                this.validator.addError(field, 'rule', 'same', message || 'The field you are comparing the value against are different');
                return false;
            }
        }
        return true;
    }
    string(field, value, message) {
        if (!lodash_1.isString(value)) {
            this.validator.addError(field, 'rule', 'string', message || 'The value provided is not a string');
            return false;
        }
        return true;
    }
    timezone(field, value, message) {
        if (!moment.tz.zone(value)) {
            this.validator.addError(field, 'rule', 'timezone', message || 'The value provided is not a valid timezone');
            return false;
        }
        return true;
    }
    url(field, value, message) {
        if (!validator_1.default.isURL(value)) {
            this.validator.addError(field, 'rule', 'url', message || 'The value provided is not a URL');
            return false;
        }
        return true;
    }
}
exports.Rules = Rules;
//# sourceMappingURL=Rules.js.map
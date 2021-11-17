"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Filters = void 0;
const validator_1 = require("validator");
const lodash_1 = require("lodash");
const crypto = require("crypto");
class Filters {
    constructor(validator) {
        this.validator = validator;
    }
    integer(field, value) {
        const eVal = validator_1.default.toInt(value);
        if (!isNaN(eVal)) {
            return eVal;
        }
        else {
            this.validator.addError(field, 'filter', 'integer', 'The value for ' + field + ' cannot be converted to an integer.');
            return;
        }
    }
    float(field, value) {
        const eVal = validator_1.default.toFloat(value);
        if (!isNaN(eVal)) {
            return eVal;
        }
        else {
            this.validator.addError(field, 'filter', 'float', 'The value for ' + field + ' cannot be converted to a Float.');
            return;
        }
    }
    lowercase(field, value) {
        try {
            return value.toLowerCase();
        }
        catch (e) {
            this.validator.addError(field, 'filter', 'lowercase', 'The value for ' + field + ' cannot be converted to lowercase.');
            return;
        }
    }
    uppercase(field, value) {
        try {
            return value.toUpperCase();
        }
        catch (e) {
            this.validator.addError(field, 'filter', 'uppercase', 'The value for ' + field + ' cannot be converted to uppercase.');
            return;
        }
    }
    boolean(field, value) {
        return validator_1.default.toBoolean(value);
    }
    json(field, value) {
        try {
            return JSON.stringify(lodash_1.toString(value));
        }
        catch (e) {
            this.validator.addError(field, 'filter', 'json', 'Invalid string cannot be converted to JSON');
            return;
        }
    }
    trim(field, value, separator) {
        const eVal = (separator) ? validator_1.default.trim(lodash_1.toString(value), lodash_1.toString(separator)) : validator_1.default.trim(lodash_1.toString(value));
        if (lodash_1.toString(eVal)) {
            return eVal;
        }
        else {
            this.validator.addError(field, 'filter', 'trim', 'The value for ' + field + ' cannot be trimmed as the data type is invalid');
            return;
        }
    }
    ltrim(field, value, separator) {
        const eVal = (separator) ? validator_1.default.ltrim(lodash_1.toString(value), lodash_1.toString(separator)) : validator_1.default.ltrim(lodash_1.toString(value));
        if (lodash_1.toString(eVal)) {
            return eVal;
        }
        else {
            this.validator.addError(field, 'filter', 'ltrim', 'The value for ' + field + ' cannot be trimmed as the data type is invalid');
            return;
        }
    }
    rtrim(field, value, separator) {
        const eVal = (separator) ? validator_1.default.rtrim(lodash_1.toString(value), lodash_1.toString(separator)) : validator_1.default.rtrim(lodash_1.toString(value));
        if (lodash_1.toString(eVal)) {
            return eVal;
        }
        else {
            this.validator.addError(field, 'filter', 'rtrim', 'The value for ' + field + ' cannot be trimmed as the data type is invalid');
            return;
        }
    }
    escape(field, value) {
        const eVal = validator_1.default.escape(lodash_1.toString(value));
        if (lodash_1.isString(eVal)) {
            return eVal;
        }
        else {
            this.validator.addError(field, 'filter', 'escape', 'The value for ' + field + ' cannot be trimmed as the data type is invalid');
            return;
        }
    }
    replace(field, value, original, replacement) {
        if (!original || !replacement) {
            this.validator.addError(field, 'filter', 'replace', 'The arguments for replacing the provided string are missing');
            return;
        }
        try {
            if (typeof replacement === 'string') {
                return value.replace(original, replacement);
            }
            else {
                return value.replace(original, replacement);
            }
        }
        catch (e) {
            this.validator.addError(field, 'filter', 'replace', 'The value for ' + field + ' is not a valid string and hence cannot be replaced.');
            return;
        }
    }
    hex(field, value, alg, enc) {
        enc = enc || 'hex';
        try {
            return crypto.createHash(alg).update(value).digest(enc);
        }
        catch (e) {
            this.validator.addError(field, 'filter', 'hex', 'The value or arguments required to hex the field are invalid');
            return;
        }
    }
    sha1(field, value) {
        try {
            return crypto.createHash('sha1').update(value).digest('hex');
        }
        catch (e) {
            this.validator.addError(field, 'filter', 'sha1', 'The value you tried to sha1 is invalid');
            return;
        }
    }
    md5(field, value) {
        try {
            return crypto.createHash('md5').update(value).digest('hex');
        }
        catch (e) {
            this.validator.addError(field, 'filter', 'md5', 'The value you tried to md5 is invalid');
            return;
        }
    }
}
exports.Filters = Filters;
//# sourceMappingURL=Filters.js.map
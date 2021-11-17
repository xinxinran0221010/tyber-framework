// noinspection TypeScriptPreferShortImport,ES6PreferShortImport
import {FieldValidator} from "./FieldValidator";
import {default as v} from 'validator';
import {toString, isString} from 'lodash';
import * as crypto from 'crypto';

export class Filters {
    private validator: FieldValidator;

    constructor(validator: FieldValidator) {
        this.validator = validator;
    }

    // noinspection JSUnusedGlobalSymbols
    integer(field: string, value: string): number {
        const eVal = v.toInt(value);
        if (!isNaN(eVal)) {
            return eVal;
        } else {
            this.validator.addError(field, 'filter', 'integer', 'The value for ' + field + ' cannot be converted to an integer.');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    float(field: string, value: string): number {
        const eVal = v.toFloat(value);
        if (!isNaN(eVal)) {
            return eVal;
        } else {
            this.validator.addError(field, 'filter', 'float', 'The value for ' + field + ' cannot be converted to a Float.');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    lowercase(field: string, value: string): string {
        try {
            return value.toLowerCase();
        } catch (e) {
            this.validator.addError(field, 'filter', 'lowercase', 'The value for ' + field + ' cannot be converted to lowercase.');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    uppercase(field: string, value: string): string {
        try {
            return value.toUpperCase();
        } catch (e) {
            this.validator.addError(field, 'filter', 'uppercase', 'The value for ' + field + ' cannot be converted to uppercase.');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    boolean(field: string, value: string): boolean {
        return v.toBoolean(value);
    }

    // noinspection JSUnusedGlobalSymbols
    json(field: string, value: unknown): string {
        try {
            return JSON.stringify(toString(value));
        } catch (e) {
            this.validator.addError(field, 'filter', 'json', 'Invalid string cannot be converted to JSON');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    trim(field: string, value: unknown, separator: string): string {
        const eVal = (separator) ? v.trim(toString(value), toString(separator)) : v.trim(toString(value));
        if (toString(eVal)) {
            return eVal;
        } else {
            this.validator.addError(field, 'filter', 'trim', 'The value for ' + field + ' cannot be trimmed as the data type is invalid');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    ltrim(field: string, value: unknown, separator: string): string {
        const eVal = (separator) ? v.ltrim(toString(value), toString(separator)) : v.ltrim(toString(value));
        if (toString(eVal)) {
            return eVal;
        } else {
            this.validator.addError(field, 'filter', 'ltrim', 'The value for ' + field + ' cannot be trimmed as the data type is invalid');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    rtrim(field: string, value: unknown, separator: string): string {
        const eVal = (separator) ? v.rtrim(toString(value), toString(separator)) : v.rtrim(toString(value));
        if (toString(eVal)) {
            return eVal;
        } else {
            this.validator.addError(field, 'filter', 'rtrim', 'The value for ' + field + ' cannot be trimmed as the data type is invalid');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    escape(field: string, value: unknown): string {
        const eVal = v.escape(toString(value));

        if (isString(eVal)) {
            return eVal;
        } else {
            this.validator.addError(field, 'filter', 'escape', 'The value for ' + field + ' cannot be trimmed as the data type is invalid');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    replace(field: string, value: string, original: RegExp | string, replacement: string | ((match: string, ...args: unknown[]) => string)): string {
        if (!original || !replacement) {
            this.validator.addError(field, 'filter', 'replace', 'The arguments for replacing the provided string are missing');
            return;
        }

        try {
            if (typeof replacement === 'string') {
                return value.replace(original, replacement);
            } else {
                return value.replace(original, replacement);
            }
        } catch (e) {
            this.validator.addError(field, 'filter', 'replace', 'The value for ' + field + ' is not a valid string and hence cannot be replaced.');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    hex(field: string, value: string, alg: string, enc: crypto.BinaryToTextEncoding): string {
        enc = enc || 'hex';
        try {
            return crypto.createHash(alg).update(value).digest(enc);
        } catch (e) {
            this.validator.addError(field, 'filter', 'hex', 'The value or arguments required to hex the field are invalid');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    sha1(field: string, value: string): string {
        try {
            return crypto.createHash('sha1').update(value).digest('hex');
        } catch (e) {
            this.validator.addError(field, 'filter', 'sha1', 'The value you tried to sha1 is invalid');
            return;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    md5(field: string, value: string): string {
        try {
            return crypto.createHash('md5').update(value).digest('hex');
        } catch (e) {
            this.validator.addError(field, 'filter', 'md5', 'The value you tried to md5 is invalid');
            return;
        }
    }
}

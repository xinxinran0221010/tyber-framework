"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldValidator = void 0;
const lodash_1 = require("lodash");
const Rules_1 = require("./Rules");
const Filters_1 = require("./Filters");
const RequiredRules_1 = require("./RequiredRules");
class FieldValidator {
    constructor(rules, messages, filters, cloneInstance) {
        this.validations = {};
        this.validationErrors = [];
        this.rules = new Rules_1.Rules(this);
        this.filters = new Filters_1.Filters(this);
        this.requiredRules = new RequiredRules_1.RequiredRules(this);
        if (cloneInstance) {
            this.validations = lodash_1.cloneDeep(cloneInstance.validations);
        }
        else {
            this.parseRulesAndFilters(rules, messages, filters);
        }
    }
    clone() {
        return new FieldValidator(null, null, null, this);
    }
    prepareData(requestData) {
        this.fields = requestData;
        Object.keys(this.validations).forEach(fieldName => {
            this.validations[fieldName].value = this.parseKey(fieldName, this.fields);
        });
    }
    get valid() {
        this.fields = this.fields || {};
        return this.applyRulesAndFilters();
    }
    parseKey(key, data) {
        if (!~key.indexOf('[*].')) {
            return lodash_1.get(data, key);
        }
        const arrayValues = [];
        const subKeys = key.split('[*].');
        const [targetKey, ...remainSubKeys] = subKeys;
        const targetData = data[targetKey];
        const remainKey = remainSubKeys.join('[*].');
        if (lodash_1.isArray(targetData)) {
            targetData.forEach(subData => {
                arrayValues.push(this.parseKey(remainKey, subData));
            });
        }
        return arrayValues.length ? arrayValues : lodash_1.noop();
    }
    addError(key, type, rule, message) {
        if (!this.validationErrors) {
            this.validationErrors = [];
        }
        const vError = {
            key,
            type,
            message,
        };
        if (type === 'filter') {
            vError.filter = rule;
        }
        else {
            vError.rule = rule;
        }
        this.validationErrors.push(vError);
    }
    getErrorMessageInfo() {
        return this.validationErrors ? this.validationErrors.reduce((infoData, vError) => {
            const { key, message } = vError;
            infoData[key] = infoData[key] || '';
            infoData[key] += `${infoData[key] ? '\n' : ''}${message}`;
            return infoData;
        }, {}) : null;
    }
    parseRulesAndFilters(rules, messages, filters) {
        rules && Object.keys(rules).forEach(fieldName => {
            this.initFieldValidatorInfo(fieldName);
            const rulesInfo = this.makeRuleInfo(rules[fieldName], 'rules');
            rulesInfo.forEach(rule => this.populateRule(fieldName, rule, messages));
            this.validations[fieldName].required = rulesInfo.some(r => r.type === 'requiredRules');
        });
        if (filters && filters.before) {
            Object.keys(filters.before).forEach(fieldName => this.populateFilters('before', fieldName, filters.before[fieldName]));
        }
        if (filters && filters.after) {
            Object.keys(filters.after).forEach(fieldName => this.populateFilters('after', fieldName, filters.after[fieldName]));
        }
    }
    initFieldValidatorInfo(field) {
        if (!this.validations[field]) {
            this.validations[field] = {
                field: field,
                value: null,
                required: false,
                dateFormat: null,
                rules: [],
                filters: {
                    before: [],
                    after: []
                }
            };
        }
    }
    makeRuleInfo(ruleDesc, type) {
        const result = [];
        const targetChecker = this[type];
        if (!ruleDesc) {
            return result;
        }
        if (lodash_1.isObjectLike(ruleDesc)) {
            Object.keys(ruleDesc).forEach(ruleName => {
                if (ruleDesc[ruleName]) {
                    const trueType = lodash_1.isFunction(targetChecker[ruleName]) ?
                        type
                        : ((type === 'rules' && lodash_1.isFunction(this.requiredRules[ruleName])) ?
                            'requiredRules'
                            : null);
                    const valid = !!trueType;
                    result.push({
                        name: ruleName,
                        type: trueType || type,
                        valid: valid,
                        args: lodash_1.isArray(ruleDesc[ruleName]) ? ruleDesc[ruleName] : []
                    });
                }
            });
        }
        else {
            lodash_1.toString(ruleDesc).split('|').forEach(rule => {
                const rInfo = rule.split(':');
                const ruleName = rInfo[0];
                const trueType = lodash_1.isFunction(targetChecker[ruleName]) ?
                    type
                    : ((type === 'rules' && lodash_1.isFunction(this.requiredRules[ruleName])) ?
                        'requiredRules'
                        : null);
                const valid = !!trueType;
                result.push({
                    name: ruleName,
                    type: trueType || type,
                    valid: valid,
                    args: lodash_1.isUndefined(rInfo[1]) ? [] : rInfo[1].split(',')
                });
            });
        }
        return result;
    }
    changeFieldValue(key, value) {
        lodash_1.set(this.fields, key, value);
    }
    populateRule(field, ruleInfo, messages) {
        const ruleName = ruleInfo.name;
        if (!lodash_1.isUndefined(messages[`${field}.${ruleName}`])) {
            ruleInfo.message = messages[`${field}.${ruleName}`];
        }
        else if (!lodash_1.isUndefined(messages[ruleName])) {
            ruleInfo.message = messages[ruleName];
        }
        if (ruleInfo.message) {
            if (~ruleInfo.message.indexOf(':attribute')) {
                ruleInfo.message = ruleInfo.message.replace(':attribute', field);
            }
            if (!ruleInfo.message.indexOf(':value')) {
                if (typeof this.validations[field].value === 'object') {
                    ruleInfo.message = ruleInfo.message.replace(':value', JSON.stringify(this.validations[field].value));
                }
                else if (typeof this.validations[field].value === 'undefined') {
                    ruleInfo.message = ruleInfo.message.replace(':value', 'undefined');
                }
                else {
                    ruleInfo.message = ruleInfo.message.replace(':value', this.validations[field].value.toString());
                }
            }
        }
        if (lodash_1.isFunction(this.requiredRules[ruleName])) {
            this.validations[field].rules.unshift(ruleInfo);
        }
        else {
            this.validations[field].rules.push(ruleInfo);
        }
    }
    populateFilters(type, field, filters) {
        this.initFieldValidatorInfo(field);
        const typeFilters = this.validations[field].filters[type];
        const filterInfos = this.makeRuleInfo(filters, 'filters');
        filterInfos.forEach(filterInfo => typeFilters.push(filterInfo));
    }
    applyRulesAndFilters() {
        Object.keys(this.validations).forEach(fieldKey => {
            this.evaluateField(this.validations[fieldKey]);
        });
        return !(this.validationErrors && this.validationErrors.length);
    }
    evaluateField(fieldValidator) {
        let proceed = fieldValidator.required || !lodash_1.isUndefined(fieldValidator.value);
        if (fieldValidator.filters.before.length && !lodash_1.isUndefined(fieldValidator.value)) {
            fieldValidator.filters.before.forEach(beforeFilter => {
                if (!proceed)
                    return;
                if (beforeFilter.valid) {
                    fieldValidator.value = (this.filters[beforeFilter.name])
                        .apply(this.filters, [fieldValidator.field, fieldValidator.value, ...(beforeFilter.args || [])]);
                    if (!lodash_1.isUndefined(fieldValidator.value)) {
                        this.changeFieldValue(fieldValidator.field, fieldValidator.value);
                    }
                    else {
                        proceed = false;
                    }
                }
                else {
                    this.addError(fieldValidator.field, 'filter', beforeFilter.name, `Invalid filter: ${beforeFilter.name} does not exist`);
                    proceed = false;
                }
            });
        }
        if (!proceed) {
            return;
        }
        if (fieldValidator.rules.length) {
            fieldValidator.rules.forEach(rule => {
                if (!proceed)
                    return;
                if (rule.valid) {
                    const targetFunc = this[rule.type][rule.name];
                    const applyArgs = targetFunc.length < 4 ? [fieldValidator.field, fieldValidator.value, rule.message]
                        : [fieldValidator.field, fieldValidator.value, FieldValidator.unwrapArgs(rule.args) || [], rule.message];
                    proceed = targetFunc.apply(this[rule.type], applyArgs);
                    if (rule.type === 'requiredRules' && proceed) {
                        proceed = fieldValidator.required;
                    }
                }
                else {
                    this.addError(fieldValidator.field, 'rule', rule.name, `Invalid Validation Rule: ${rule.name} does not exist`);
                    proceed = false;
                }
            });
        }
        if (!proceed) {
            return;
        }
        if (fieldValidator.filters.after.length) {
            fieldValidator.filters.after.forEach(afterFilter => {
                if (!proceed)
                    return;
                if (afterFilter.valid) {
                    fieldValidator.value = (this.filters[afterFilter.name])
                        .apply(this.filters, [fieldValidator.field, fieldValidator.value, ...(afterFilter.args || [])]);
                    if (!lodash_1.isUndefined(fieldValidator.value)) {
                        this.changeFieldValue(fieldValidator.field, fieldValidator.value);
                    }
                    else {
                        proceed = false;
                    }
                }
                else {
                    this.addError(fieldValidator.field, 'filter', afterFilter.name, `Invalid filter: ${afterFilter.name} does not exist`);
                    proceed = false;
                }
            });
        }
    }
    static unwrapArgs(args) {
        if (args && args.length === 1) {
            return args[0];
        }
        return args;
    }
}
exports.FieldValidator = FieldValidator;
//# sourceMappingURL=FieldValidator.js.map
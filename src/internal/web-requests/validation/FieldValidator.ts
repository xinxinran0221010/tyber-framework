import {isFunction, isUndefined, isObjectLike, isArray, get as getValueByPath, set as setValueByPath, noop, toString, cloneDeep} from 'lodash';
import {Rules} from "./Rules";
import {Filters} from "./Filters";
import {RequiredRules} from "./RequiredRules";

interface ValidateError {
    key: string;
    type: string;
    message: string;
    rule?: string;
    filter?: string;
}

interface RuleInfo {
    name: string,
    type: 'rules' | 'filters' | 'requiredRules';
    valid: boolean,
    args: unknown[],
    message?: string,
}

interface FieldValidatorInfo {
    field: string;
    value: unknown;
    required: boolean;
    rules: RuleInfo[],
    dateFormat: string,
    filters: {
        before: RuleInfo[],
        after: RuleInfo[],
    }
}

export interface RulesParameter {
    [fieldName: string]: string | Record<string | symbol, unknown>;
}

export interface MessagesParameter {
    [fieldName: string]: string;
}

export interface FiltersParameter {
    before?: { [fieldName: string]: string | Record<string | symbol, unknown> };
    after?: { [fieldName: string]: string | Record<string | symbol, unknown> };
}

// TODO [*] attributes in array support
// TODO Filter need to change request body's value
// noinspection DuplicatedCode
export class FieldValidator {
    readonly validations: { [fieldName: string]: FieldValidatorInfo } = {};
    validationErrors: ValidateError[] = [];
    fields: unknown;

    // noinspection JSUnusedLocalSymbols
    private rules: Rules = new Rules(this);
    private filters: Filters = new Filters(this);
    private requiredRules: RequiredRules = new RequiredRules(this);

    constructor(rules: RulesParameter, messages: MessagesParameter, filters: FiltersParameter, cloneInstance?: FieldValidator) {
        if (cloneInstance) {
            this.validations = cloneDeep(cloneInstance.validations);
        } else {
            this.parseRulesAndFilters(rules, messages, filters);
        }
    }

    clone(): FieldValidator {
        return new FieldValidator(null, null, null, this);
    }

    prepareData(requestData: unknown): void {
        this.fields = requestData;

        Object.keys(this.validations).forEach(fieldName => {
            this.validations[fieldName].value = this.parseKey(fieldName, this.fields);
        });
    }

    get valid(): boolean {
        this.fields = this.fields || {};
        return this.applyRulesAndFilters();
    }

    parseKey(key: string, data: unknown): unknown {
        if (!~key.indexOf('[*].')) {
            return getValueByPath(data, key);
        }
        const arrayValues = [];
        const subKeys = key.split('[*].');
        const [targetKey, ...remainSubKeys] = subKeys;

        const targetData = data[targetKey];
        const remainKey = remainSubKeys.join('[*].');
        if (isArray(targetData)) {
            targetData.forEach(subData => {
                arrayValues.push(this.parseKey(remainKey, subData));
            });
        }

        return arrayValues.length ? arrayValues : noop();
    }

    addError(key: string, type: string, rule: string, message: string): void {
        if (!this.validationErrors) {
            this.validationErrors = [];
        }

        const vError: ValidateError = {
            key,
            type,
            message,
        };

        if (type === 'filter') {
            vError.filter = rule;
        } else {
            vError.rule = rule;
        }

        this.validationErrors.push(vError);
    }

    getErrorMessageInfo(): { [field: string]: string } {
        return this.validationErrors ? this.validationErrors.reduce((infoData, vError) => {
            const {key, message} = vError;
            infoData[key] = infoData[key] || '';
            infoData[key] += `${infoData[key] ? '\n' : ''}${message}`;
            return infoData;
        }, {}) : null;
    }

    parseRulesAndFilters(rules: RulesParameter, messages: MessagesParameter, filters: FiltersParameter): void {
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

    private initFieldValidatorInfo(field: string): void {
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

    private makeRuleInfo(ruleDesc: string | Record<string | symbol, unknown>, type: 'rules' | 'filters'): RuleInfo[] {
        const result: RuleInfo[] = [];
        const targetChecker = this[type];
        if (!ruleDesc) {
            return result;
        }

        if (isObjectLike(ruleDesc)) {
            Object.keys(ruleDesc).forEach(ruleName => {
                if (ruleDesc[ruleName]) {
                    const trueType = isFunction(targetChecker[ruleName]) ?
                        type
                        : ((type === 'rules' && isFunction(this.requiredRules[ruleName])) ?
                            'requiredRules'
                            : null);
                    const valid = !!trueType;
                    result.push({
                        name: ruleName,
                        type: trueType || type,
                        valid: valid,
                        args: isArray(ruleDesc[ruleName]) ? ruleDesc[ruleName] : []
                    });
                }
            });
        } else {
            toString(ruleDesc).split('|').forEach(rule => {
                const rInfo = rule.split(':');
                const ruleName = rInfo[0];
                const trueType = isFunction(targetChecker[ruleName]) ?
                    type
                    : ((type === 'rules' && isFunction(this.requiredRules[ruleName])) ?
                        'requiredRules'
                        : null);
                const valid = !!trueType;
                result.push({
                    name: ruleName,
                    type: trueType || type,
                    valid: valid,
                    args: isUndefined(rInfo[1]) ? [] : rInfo[1].split(',')
                });
            });
        }
        return result;
    }

    private changeFieldValue(key: string, value: unknown): void {
        //
        setValueByPath(this.fields as Record<string, unknown>, key, value);
    }

    private populateRule(field: string, ruleInfo: RuleInfo, messages: MessagesParameter): void {
        const ruleName: string = ruleInfo.name;
        if (!isUndefined(messages[`${field}.${ruleName}`])) {
            ruleInfo.message = messages[`${field}.${ruleName}`] as string;
        } else if (!isUndefined(messages[ruleName])) {
            ruleInfo.message = messages[ruleName] as string;
        }

        if (ruleInfo.message) {
            if (~ruleInfo.message.indexOf(':attribute')) {
                ruleInfo.message = ruleInfo.message.replace(':attribute', field);
            }

            if (!ruleInfo.message.indexOf(':value')) {
                if (typeof this.validations[field].value === 'object') {
                    ruleInfo.message = ruleInfo.message.replace(':value', JSON.stringify(this.validations[field].value));
                } else if (typeof this.validations[field].value === 'undefined') {
                    ruleInfo.message = ruleInfo.message.replace(':value', 'undefined');
                } else {
                    ruleInfo.message = ruleInfo.message.replace(':value', this.validations[field].value.toString());
                }
            }
        }

        if (isFunction(this.requiredRules[ruleName])) {
            this.validations[field].rules.unshift(ruleInfo);
        } else {
            this.validations[field].rules.push(ruleInfo);
        }
    }

    private populateFilters(type: 'before' | 'after', field: string, filters: string | Record<string | symbol, unknown>) {
        this.initFieldValidatorInfo(field);
        const typeFilters = this.validations[field].filters[type];

        const filterInfos = this.makeRuleInfo(filters, 'filters');
        filterInfos.forEach(filterInfo => typeFilters.push(filterInfo));
    }

    private applyRulesAndFilters(): boolean {
        Object.keys(this.validations).forEach(fieldKey => {
            this.evaluateField(this.validations[fieldKey]);
        });
        return !(this.validationErrors && this.validationErrors.length);
    }

    private evaluateField(fieldValidator: FieldValidatorInfo): void {
        let proceed = fieldValidator.required || !isUndefined(fieldValidator.value);

        // noinspection DuplicatedCode
        if (fieldValidator.filters.before.length && !isUndefined(fieldValidator.value)) {
            fieldValidator.filters.before.forEach(beforeFilter => {
                if (!proceed) return;
                if (beforeFilter.valid) {
                    fieldValidator.value = (this.filters[beforeFilter.name])
                        .apply(this.filters, [fieldValidator.field, fieldValidator.value, ...(beforeFilter.args || [])]);
                    if (!isUndefined(fieldValidator.value)) {
                        this.changeFieldValue(fieldValidator.field, fieldValidator.value);
                    } else {
                        proceed = false;
                    }
                } else {
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
                if (!proceed) return;
                if (rule.valid) {
                    const targetFunc = this[rule.type][rule.name];
                    const applyArgs = targetFunc.length < 4 ? [fieldValidator.field, fieldValidator.value, rule.message]
                        : [fieldValidator.field, fieldValidator.value, FieldValidator.unwrapArgs(rule.args) || [], rule.message];
                    proceed = targetFunc.apply(this[rule.type], applyArgs);
                    if (rule.type === 'requiredRules' && proceed) {
                        proceed = fieldValidator.required;
                    }
                } else {
                    this.addError(fieldValidator.field, 'rule', rule.name, `Invalid Validation Rule: ${rule.name} does not exist`);
                    proceed = false;
                }
            });
        }

        if (!proceed) {
            return;
        }

        // noinspection DuplicatedCode
        if (fieldValidator.filters.after.length) {
            fieldValidator.filters.after.forEach(afterFilter => {
                if (!proceed) return;
                if (afterFilter.valid) {
                    fieldValidator.value = (this.filters[afterFilter.name])
                        .apply(this.filters, [fieldValidator.field, fieldValidator.value, ...(afterFilter.args || [])]);
                    if (!isUndefined(fieldValidator.value)) {
                        this.changeFieldValue(fieldValidator.field, fieldValidator.value);
                    } else {
                        proceed = false;
                    }
                } else {
                    this.addError(fieldValidator.field, 'filter', afterFilter.name, `Invalid filter: ${afterFilter.name} does not exist`);
                    proceed = false;
                }
            });
        }
    }

    private static unwrapArgs(args: unknown[]): unknown | unknown[] {
        if (args && args.length === 1) {
            return args[0];
        }
        return args;
    }
}

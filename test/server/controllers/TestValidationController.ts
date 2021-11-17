import {
    ILogger,
    LoggerType,
    Controller,
    Logger,
    RequestMapping,
    PostRoute, Validate, RequestBody, KoaContext
} from "../../../lib/src";

@Controller()
@Logger()
@RequestMapping("/v")
export class TestValidationController implements ILogger {
    logger: LoggerType;

    @Validate({rules: {
            name: 'required|string',
            accept: 'required|accepted',
            afterDate: 'required|dateFormat:YYYY-MM-DD|after:2021-02-05',
            beforeDate: 'required|date|before:2021-02-05',
            alpha: 'alpha',
            alphaDash: 'alphaDash',
            alphaNumeric: 'alphaNumeric',
            between: 'integer|between:1,4',
            different: 'different:name',
            email: 'email',
            equals: 'ip|equals:1.1.1.1',
            url: 'url',
        }})
    @PostRoute('/check/validate/rules')
    async checkValidationRules(@RequestBody body: object) {
        return { body };
    }

    @Validate({rules: {
            mobile: {regex: [/^1\d{10}$/]},
            boolean: 'boolean',
            notIn: 'string|notIn:abc,def',
            in: 'integer|in:1,2,3',
            contains: 'string|contains:something',
            requiredIf: 'requiredIf:mobile,13811099939',
            requiredNotIf: 'requiredNotIf:in,3',
            requiredWith: 'requiredWith:boolean',
            requiredWithout: 'requiredWithout:contains',
            requiredWithAll: 'requiredWithAll:mobile,boolean',
            requiredWithoutAll: 'requiredWithoutAll:mobile,boolean',
        }})
    @PostRoute('/check/validate/rules/advanced')
    async checkAdvancedValidationRules(@RequestBody body: object) {
        return { body };
    }

    @Validate({
        rules: {
            trim: 'string|in:a,b,c',
            replace: 'contains:AcB',
            md5: {regex: [/^[a-f0-9]+$/]},
        },
        filters: {
            before: {
                trim: 'trim',
                replace : {replace: [/[ab]/g, r => r.toUpperCase()]},
                md5: 'md5',
            }, after: {}
        }
    })
    @PostRoute('/check/validate/filters/before')
    async checkBeforeFilter(@RequestBody body: object) {
        return { body };
    }

    @Validate({
        rules: {},
        filters: {
            after: {
                ltrim: 'ltrim',
                rtrim: 'rtrim',
                sha1: 'sha1',
                integer: 'integer',
                float: 'float',
                lowercase: 'lowercase',
                uppercase: 'uppercase',
                boolean: 'boolean',
                json: 'json'
            }, before: {}
        }
    })
    @PostRoute('/check/validate/filters/after')
    async checkAfterFilter(@RequestBody body: object) {
        return { body };
    }

    @PostRoute('/check/validate/manual')
    async checkManualValidate(ctx: KoaContext, @RequestBody body: object) {
        ctx.validate({
            rules: {
                name: 'notContains:abc',
                age: 'digits:15|max:60|min:5',
                desc: 'string|minLength:5|maxLength:255|lengthBetween:1,100',
                score: 'numeric'
            }
        });
        return { body };
    }
}

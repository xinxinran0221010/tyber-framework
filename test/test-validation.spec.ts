import {params, suite, test} from '@testdeck/mocha';
import * as chai from "chai";
import {BaseServerTest} from "./base-test.spec";

const expect = chai.expect;

// noinspection JSUnusedGlobalSymbols
@suite
class DemoServerValidationTest extends BaseServerTest {

    @params({postData: {}}, 'test required')
    @params({postData: {name: 'a', accept: 'b'}}, 'test accepted')
    @params({postData: {name: 'a', accept: 'yes', afterDate: 'abc'}}, 'test date format')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-01-01'}}, 'test date after')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-03-01', beforeDate: '2021-03-01'}}, 'test date before')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-03-01', beforeDate: '2021-02-01', alpha: '*(*('}}, 'test alpha')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-03-01', beforeDate: '2021-02-01', alphaDash: 'abc*'}}, 'test alphaDash')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-03-01', beforeDate: '2021-02-01', alphaNumeric: 'abc*'}}, 'test alphaNumeric')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-03-01', beforeDate: '2021-02-01', between: 'a'}}, 'test integer')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-03-01', beforeDate: '2021-02-01', between: '6'}}, 'test between')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-03-01', beforeDate: '2021-02-01', different: 'a'}}, 'test different')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-03-01', beforeDate: '2021-02-01', email: 'a@b'}}, 'test email')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-03-01', beforeDate: '2021-02-01', equals: 'abc'}}, 'test ip')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-03-01', beforeDate: '2021-02-01', equals: '1.1.1.2'}}, 'test equals')
    @params({postData: {name: 'a', accept: 'yes', afterDate: '2021-03-01', beforeDate: '2021-02-01', url: 'abc'}}, 'test url')
    async testRegularRulesShouldReturn422({postData}) {
        await DemoServerValidationTest.doRequest
            .post('/v/check/validate/rules').send(postData).expect(422);
    }

    @test
    async testRegularRulesShouldHappyPass() {
        const result = await DemoServerValidationTest.doRequest
            .post('/v/check/validate/rules').send({
                name: 'a',
                accept: '1',
                afterDate: '2021-03-01',
                beforeDate: '2021-02-01',
                alpha: 'abcD',
                alphaDash: 'ab_cd',
                alphaNumeric: 'abc123',
                between: 2,
                different: 'b',
                email: 'abc@hotmail.com',
                equals: '1.1.1.1',
                url: 'https://baidu.com',
            }).expect(200);
    }

    @params({postData: {mobile: '12345678'}}, 'test regex')
    @params({postData: {notIn: 'abc'}}, 'test not in')
    @params({postData: {in: 4}}, 'test in')
    @params({postData: {contains: 'abc'}}, 'test contains')
    @params({postData: {mobile: '13811099939'}}, 'test requiredIf')
    @params({postData: {in: 2}}, 'test requiredNotIf')
    @params({postData: {boolean: false}}, 'test requiredWith')
    @params({postData: {boolean: false}}, 'test requiredWith')
    @params({postData: {}}, 'test requiredWithout')
    @params({postData: {mobile:'13811099939', boolean: true}}, 'test requiredWithAll')
    @params({postData: {}}, 'test requiredWithoutAll')
    async testAdvancedRulesShouldReturn422({postData}) {
        await DemoServerValidationTest.doRequest
            .post('/v/check/validate/rules/advanced').send(postData).expect(422);
    }

    @test
    async testAdvancedRulesShouldHappyPass() {
        const result = await DemoServerValidationTest.doRequest
            .post('/v/check/validate/rules/advanced').send({
                mobile: '13812344321',
                boolean: true,
                notIn: '123',
                in: 1,
                contains: 'contains something',
                requiredNotIf: 'in is not 3',
                requiredWith: 'boolean is true',
                requiredWithAll: 'this is requiredWithAll',
            }).expect(200);
    }

    @test
    async testBeforeFiltersShouldHappyPass() {
        const result = await DemoServerValidationTest.doRequest
            .post('/v/check/validate/filters/before').send({
                trim: '  a  ',
                replace: 'this is acb',
                md5: '!@!@!'
            }).expect(200);
        console.log(result.body);
    }

    @test
    async testAfterFiltersShouldHappyPass() {
        const result = await DemoServerValidationTest.doRequest
            .post('/v/check/validate/filters/after').send({
                ltrim: '  a  ',
                rtrim: '  a  ',
                sha1: '!@!@!',
                integer: '1',
                float: '1.1',
                lowercase: 'Abc',
                uppercase: 'Abc',
                boolean: 'true',
                json: {}
            }).expect(200);

    }

    @test
    async testManualValidationShouldHappyPass() {
        const result = await DemoServerValidationTest.doRequest
            .post('/v/check/validate/manual').send({
                name: 'ddd',
                age: 15,
                desc: 'This is a desc.',
                score: '99.5',
            }).expect(200);

    }
}

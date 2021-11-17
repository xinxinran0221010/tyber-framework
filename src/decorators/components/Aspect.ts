// noinspection JSUnusedGlobalSymbols

import {BaseDecorator} from "@decorators";
import {AopDescription, BeanUtils, TypeUtils} from "@utils";
import {isNil} from 'lodash';
import * as assert from "assert";

class AspectDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__Aspect_';
    }

    getDecoratorName(): string {
        return 'Aspect';
    }
}

export const AspectDecorator = new AspectDecoratorInfo();

export function Aspect(beanName?: string): ClassDecorator {
    return (target) => {
        const beanId = beanName || target.name;

        const aspectInfo: AspectInfo = TypeUtils.getDecoratorInfo(target, AspectDecorator);
        assert.ok(!!aspectInfo && !!aspectInfo.aopDeclarationCount(), `[Aspect]no aop declaration found!`);

        BeanUtils.makeAopDefinition(target, beanId, aspectInfo);
    }
}

export function Pointcut(pointcutExpr: string): MethodDecorator {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return <T extends CallableFunction>(target, propertyKey, descriptor) => {
        const targetFunc: CallableFunction = descriptor.value;
        const pointcutExpression = new PointcutExpression(pointcutExpr, targetFunc.name);
        let aspectInfo = TypeUtils.getDecoratorInfo(target, AspectDecorator);
        if (isNil(aspectInfo)) {
            aspectInfo = new AspectInfo();
            TypeUtils.saveMetadata(AspectDecorator.getDecoratorSign(), aspectInfo, target);
        }
        aspectInfo.registerPointcutExpression(pointcutExpression);
    }
}

export function Before(pointcut: string): MethodDecorator {
    return AopWrapper('before', pointcut);
}

// noinspection JSUnusedGlobalSymbols
export function After(pointcut: string): MethodDecorator {
    return AopWrapper('after', pointcut);
}

export function Around(pointcut: string): MethodDecorator {
    return AopWrapper('around', pointcut);
}

function AopWrapper(prefix: string, pointcut: string): MethodDecorator {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return <T extends CallableFunction>(target, propertyKey, descriptor) => {
        const targetFunc: CallableFunction = descriptor.value;
        let aspectInfo: AspectInfo = TypeUtils.getDecoratorInfo(target, AspectDecorator);
        if (isNil(aspectInfo)) {
            aspectInfo = new AspectInfo();
            TypeUtils.saveMetadata(AspectDecorator.getDecoratorSign(), aspectInfo, target);
        }
        aspectInfo.registerAopWrapper(prefix, targetFunc.name, pointcut);
    }
}

export class AspectInfo {
    private pointcutExpressions: Map<string, PointcutExpression> = new Map<string, PointcutExpression>();
    private aopDeclarations: {
        prefix: string,
        pointcutExpression: PointcutExpression,
        wrapperFuncName: string,
    }[] = [];

    makeAopConfiguration(): AopDescription[] {
        return this.aopDeclarations.map(aopDeclaration => ({
            pointcut: {
                type: aopDeclaration.prefix,
                expressions: aopDeclaration.pointcutExpression.calculatePointcut()
            },
            advice: aopDeclaration.wrapperFuncName,
            runtime: true,
        }));
    }

    registerPointcutExpression(pointcutExpression: PointcutExpression): void {
        this.pointcutExpressions.set(pointcutExpression.getName(), pointcutExpression);
    }

    registerAopWrapper(prefix: string, funcName: string, pointcut: string): void {
        const pointcutName = pointcut.replace(/\(.*\)/, '').trim();
        const targetPointcutExpression = this.pointcutExpressions.get(pointcutName);
        assert.ok(!!targetPointcutExpression, `[Aspect Declaration]can not find pointcut with [${pointcut}]`);

        this.aopDeclarations.push({
            prefix,
            pointcutExpression: targetPointcutExpression,
            wrapperFuncName: funcName,
        });
    }

    aopDeclarationCount(): number {
        return this.aopDeclarations.length;
    }
}

interface PointcutExpressionPart {
    executors: ParserExecutor[],
    negative: boolean,
    operator: string,
}

interface PointcutPart {
    negative: boolean,
    operator: string,
    expr: string,
}

class PointcutExpression {
    private readonly expr: string;
    private readonly name: string;
    private readonly isMulti: boolean;
    private readonly expressionParts: PointcutExpressionPart[];

    constructor(expr: string, pcFuncName: string) {
        this.expr = expr;
        this.name = pcFuncName;
        this.expressionParts = [];
        this.isMulti = this.parseExpr();
    }

    getName(): string {
        return this.name;
    }

    calculatePointcut(): PointcutPart[] {
        return this.expressionParts.map(ep => ({
            negative: ep.negative,
            operator: ep.operator,
            expr: (ep.executors || []).map(executor => executor()).join('\\.')
        }));
    }

    private parseExpr(): boolean {
        let partCount = 0;

        this.expr.replace(/(?:^|\s*(\|\||&&)\s*)(!)?((?:.(?!\|\||&&))+)/g, (_, operator, negative, body) => {
            partCount++;
            const expressionPart: PointcutExpressionPart = {
                executors: [],
                negative: !!negative,
                operator: operator || '&&'
            };
            this.parseSingle(body.trim(), expressionPart.executors);
            this.expressionParts.push(expressionPart);
            return _;
        });


        return partCount > 1;
    }

    // noinspection JSMethodCanBeStatic
    private parseSingle(singleExpr: string, executors: ParserExecutor[]): void {
        assert.ok(!!singleExpr, '[Pointcut Expression] expr can not be empty.');
        const parts = singleExpr.split('.');
        assert.ok(parts.length === 2, '[Pointcut Expression] expr must have two parts.');
        const [targetExpr, methodExpr] = parts;

        Parser.parse(targetExpr, methodExpr, executors);
    }
}

enum PARSE_TYPE {
    DECORATOR_TARGET = 'target.decorator',
    NORMAL_TARGET = 'target.normal',
    NORMAL_METHOD = 'method.normal',
}

type ParserExecutor = () => string;

class Parser {
    static readonly DECORATOR_TARGET_MATCHER = /@target\s*\(\s*([^)]+)\s*\)/;

    static parse(targetExpr: string, methodExpr: string, executors: ParserExecutor[]): void {
        executors.push(Parser[Parser.checkTargetType(targetExpr)](targetExpr));
        executors.push(Parser[Parser.checkMethodType(methodExpr)](methodExpr));
    }

    private static checkTargetType(targetExpr: string): PARSE_TYPE {
        if (Parser.DECORATOR_TARGET_MATCHER.test(targetExpr)) {
            return PARSE_TYPE.DECORATOR_TARGET;
        }
        return PARSE_TYPE.NORMAL_TARGET;
    }

    private static checkMethodType(methodExpr: string): PARSE_TYPE {
        if (methodExpr) {}
        return PARSE_TYPE.NORMAL_METHOD;
    }

    private static [PARSE_TYPE.DECORATOR_TARGET](expr: string): ParserExecutor {
        const decoratorTargetInfo = Parser.DECORATOR_TARGET_MATCHER.exec(expr);
        assert.ok(!!decoratorTargetInfo, '[Pointcut Expression] invalid target decorator expression.');
        const decoratorName = decoratorTargetInfo[1];

        return () => {
            const beanIds = TypeUtils.getBeanIdsByDecorator(decoratorName);
            if (!beanIds.length) {
                return ';';
            }
            return `(${TypeUtils.getBeanIdsByDecorator(decoratorName).join('|')})`;
        }
    }

    private static [PARSE_TYPE.NORMAL_TARGET](expr: string): ParserExecutor {
        return () => expr.replace(/\*/g, '.*');
    }

    private static [PARSE_TYPE.NORMAL_METHOD](expr: string): ParserExecutor {
        return () => expr.replace(/\*/g, '.*');
    }
}

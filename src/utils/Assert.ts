import * as BaseAssert from 'assert';

export class Assert {

    static notEmpty(target: unknown, errorMessage?: string): void {
        BaseAssert.ok(typeof target !== 'undefined' && target !== null && target !== '', errorMessage);
    }
}

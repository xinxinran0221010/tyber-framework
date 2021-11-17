export class BaseHttpError extends Error {
    protected readonly statusCode: number;
    protected readonly code: string | number;

    constructor(statusCode: number, code: string | number, message: string) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }

    getStatusCode(): number {
        return this.statusCode;
    }

    getErrorResponseBody(): HttpErrorResponse {
        return {code: this.code, message: this.message};
    }
}

export interface HttpErrorResponse {
    code: string | number,
    message: string,

    [key: string]: unknown,
}

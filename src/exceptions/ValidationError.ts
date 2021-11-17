import {BaseHttpError, HttpErrorResponse} from "./BaseHttpError";

export class ValidationError extends BaseHttpError {
    private readonly fieldErrors: { [fields: string]: unknown };

    constructor(fieldErrors: { [fields: string]: unknown }) {
        super(422, 'request.validation.error', 'Some fields validate failed in this request.');
        this.fieldErrors = fieldErrors;
    }

    getErrorResponseBody(): HttpErrorResponse {
        return Object.assign(super.getErrorResponseBody(), this.fieldErrors);
    }
}

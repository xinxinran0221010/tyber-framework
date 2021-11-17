import {isObjectLike} from 'lodash';

export class BaseResponse {
    status = 200;
    body: unknown;

    constructor(body: unknown) {
        if (isObjectLike(body)) {
            this.body = body;
        } else {
            this.body = {body};
        }
    }
}

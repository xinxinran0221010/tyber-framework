import {ValidationDescription} from "@internal";

export interface IServerContextState {

}

export interface IServerAppContext {
    validate:  (v: ValidationDescription) => void;
    requestParameters: Record<string, unknown>;
    routeParameters: Record<string, unknown>;
}

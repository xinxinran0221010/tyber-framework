import {ILoader} from "@internal";

export interface IConfigurationLoader extends ILoader {
    getConfig(keyPath: string, defaultValue?: unknown): string | number | null | Record<string, unknown> | unknown;
}

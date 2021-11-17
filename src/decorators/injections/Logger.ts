import {TypeUtils} from "@utils";
import {BaseDecorator} from "../BaseDecorator";

class LoggerDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__Logger_';
    }

    getDecoratorName(): string {
        return 'Logger';
    }
}

export const LoggerDecorator = new LoggerDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function Logger(category?: string): ClassDecorator {
    return (target) => {
        TypeUtils.saveMetadata(LoggerDecorator.getDecoratorSign(), category || '', target);
    }
}

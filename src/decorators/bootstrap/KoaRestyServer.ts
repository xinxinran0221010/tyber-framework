import {TypeUtils} from '@utils';
import {IKoaRestyServerSettings} from "@constants";
import {BaseDecorator} from "../BaseDecorator";

class KoaRestyServerDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__KoaRestyServer_';
    }

    getDecoratorName(): string {
        return 'KoaRestyServer';
    }
}

export const KoaRestyServerDecorator = new KoaRestyServerDecoratorInfo();

// noinspection JSUnusedGlobalSymbols
export function KoaRestyServer(serverSettings: IKoaRestyServerSettings): ClassDecorator {
    return (target: NewableFunction) => {
        TypeUtils.saveMetadata(KoaRestyServerDecorator.getDecoratorSign(), serverSettings, target);
    }
}

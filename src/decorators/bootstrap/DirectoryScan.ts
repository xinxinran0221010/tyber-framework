import {TypeUtils} from '@utils';
import {BaseDecorator} from "../BaseDecorator";

class DirectoryScanDecoratorInfo extends BaseDecorator {
    getDecoratorSign(): string {
        return '_Tyber_DS__DirScan_';
    }

    getDecoratorName(): string {
        return 'DirectoryScan';
    }
}

export const DirectoryScanDecorator = new DirectoryScanDecoratorInfo();

export function DirectoryScan(scanDir: string | string[]): ClassDecorator {
    return (target) => {
        TypeUtils.saveMetadata(DirectoryScanDecorator.getDecoratorSign(), scanDir, target);
    }
}

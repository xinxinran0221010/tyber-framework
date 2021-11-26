import {InitializingBean, Logger, ILogger, LoggerType, Service, ConfigValue} from "../../../lib/src";

@Service()
@Logger()
export class TestService implements ILogger, InitializingBean{

    logger: LoggerType;


    @ConfigValue('someConfig.myService')
    myConfig: object;

    afterPropertiesSet(): void {
        this.logger.info('after properties set');
    }

    async someBusiness() {
        this.logger.info('do get');
        return {result: 'a'};
    }

    async getConfigValue() {
        return this.myConfig;
    }
}

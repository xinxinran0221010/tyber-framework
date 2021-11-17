export interface IPostBeanProcessor {
    processPostBean(beanName: string, bean: Record<string | symbol, unknown>): void;
}

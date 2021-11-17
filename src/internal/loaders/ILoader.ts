import {IServerApp} from "@app";

export interface ILoader {
  load(serverApp: IServerApp): void;

  getOrder(): number;
}

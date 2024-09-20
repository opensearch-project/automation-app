import { TaskArgData } from '../../config/types';

export class Task {
  private name: string; // uid
  private callName: string;
  private callFunc: string = 'default';
  private callArgs: TaskArgData;

  constructor(call: string, callArgs: TaskArgData, name?: string) {
    const callArray = call.trim().split('@');
    this.callName = callArray[0];
    this.callFunc = callArray[1];
    this.callArgs = callArgs;
    const randomString = require('randomstring');
    const namePostfix = randomString.generate({ length: 8, charset: 'alphanumeric' });
    this.name = name ? `${name}#${namePostfix}` : `${this.callName}#${namePostfix}`;
  }

  public getName(): string {
    return this.name;
  }

  public getCallName(): string {
    return this.callName;
  }

  public getCallFunc(): string {
    return this.callFunc;
  }

  public getCallArgs(): TaskArgData {
    return this.callArgs;
  }
}

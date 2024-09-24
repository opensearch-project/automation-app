import randomstring from 'randomstring';
import { TaskArgData } from '../../config/types';

export class Task {
  private name: string; // uid

  private callName: string;

  private callFunc: string = 'default';

  private callArgs: TaskArgData;

  constructor(call: string, callArgs: TaskArgData, name?: string) {
    const callArray = call.trim().split('@');
    [this.callName, this.callFunc] = callArray;
    this.callArgs = callArgs;
    const namePostfix = randomstring.generate(8);
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

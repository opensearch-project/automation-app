/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { TaskArgData } from '../../config/types';

export class Task {
  private _name: string; // uid

  private readonly _callName: string;

  private readonly _callFunc: string = 'default';

  private readonly _callArgs: TaskArgData;

  constructor(call: string, callArgs: TaskArgData = {}, name?: string) {
    const callArray = call.trim().split('@');
    [this._callName, this._callFunc] = callArray;
    this._callArgs = callArgs;
    this._name = name || this.callName;
  }

  public set name(taskName: string) {
    if (!taskName || taskName.trim() === '') {
      throw new Error('Task Name input cannot be empty');
    }
    this._name = taskName;
  }

  public get name(): string {
    return this._name;
  }

  public get callName(): string {
    return this._callName;
  }

  public get callFunc(): string {
    return this._callFunc;
  }

  public get callArgs(): TaskArgData {
    return this._callArgs;
  }
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Operation } from '../service/operation/operation';
import { Task } from '../service/operation/task';
import { OperationData, TaskData } from './types';
import { Config } from './config';

export class OperationConfig extends Config {
  private static readonly _configSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      events: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            call: {
              type: 'string',
            },
            args: {
              type: 'object',
              additionalProperties: {
                oneOf: [
                  {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  {
                    type: 'string',
                  },
                ],
              },
            },
          },
          required: ['call'],
        },
      },
    },
    required: ['name', 'events', 'tasks'],
  };

  constructor(configPath: string) {
    super('OperationConfig');
    this._configData = OperationConfig.readConfig(configPath);
    OperationConfig.validateConfig(this.configData, OperationConfig._configSchema);
  }

  private static async _initTasks(taskDataArray: TaskData[]): Promise<Task[]> {
    const taskObjArray = taskDataArray.map((taskData) => {
      const taskObj = new Task(taskData.call, taskData.args, taskData.name);
      console.log(`Setup Task: ${taskObj.name}`);
      return taskObj;
    });
    return taskObjArray;
  }

  public async initOperation(): Promise<Operation> {
    const opObj = new Operation(
      (this.configData as OperationData).name,
      (this.configData as OperationData).events,
      await OperationConfig._initTasks((this.configData as OperationData).tasks),
    );
    console.log(`Setup Operation: ${opObj.name}`);
    return opObj;
  }
}

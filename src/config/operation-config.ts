import { Operation } from '../service/operation/operation';
import { Task } from '../service/operation/task';
import { OperationData, TaskData } from './types';
import { Config } from './config';

export class OperationConfig extends Config {
  private static configSchema = {
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
                type: 'string',
              },
            },
          },
          required: ['call', 'args'],
        },
      },
    },
    required: ['name', 'events', 'tasks'],
  };

  constructor(configPath: string) {
    super('OperationConfig');
    this.configData = OperationConfig.readConfig(configPath);
    this.configSchema = OperationConfig.configSchema;
    OperationConfig.validateConfig(this.configData, this.configSchema);
  }

  private static async _initTasks(taskDataArray: TaskData[]): Promise<Task[]> {
    const taskObjArray = taskDataArray.map((taskData) => {
      const taskObj = new Task(taskData.call, taskData.args, taskData.name);
      console.log(`Setup Task: ${taskObj.getName()}`);
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
    console.log(`Setup Operation: ${opObj.getName()}`);
    return opObj;
  }
}

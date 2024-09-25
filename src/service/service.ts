import { Probot } from 'probot';
import type { WebhookEventMap } from '@octokit/webhooks-types';
import { access, realpath } from 'fs/promises';
import { Resource } from './resource/resource';
import { Operation } from './operation/operation';
import { Task } from './operation/task';
import { ResourceConfig } from '../config/resource-config';
import { OperationConfig } from '../config/operation-config';
import { octokitAuth } from '../utility/octokit';

export class Service {
  private name: string;

  private resource: Resource;

  private operation: Operation;

  private app: Probot;

  constructor(name: string) {
    this.name = name;
  }

  public getName(): string {
    return this.name;
  }

  public getResource(): Resource {
    return this.resource;
  }

  public getOpOperationn(): Operation {
    return this.operation;
  }

  public async initService(app: Probot, resourceConfigPath: string, operationConfigPath: string): Promise<void> {
    app.log.info(`Initializing Service: ${this.name} `);
    this.app = app;
    // Get octokit client so Resource object will get context
    const octokit = await octokitAuth(this.app, Number(process.env.INSTALLATION_ID));
    const resConfigObj = new ResourceConfig(octokit, resourceConfigPath);
    this.resource = await resConfigObj.initResource();
    const opConfigObj = new OperationConfig(operationConfigPath);
    this.operation = await opConfigObj.initOperation();
    this._registerEvents();
  }

  private async _registerTasks(context: any, event: string, tasks: Task[]): Promise<void> {
    await tasks.reduce(async (promise, task) => {
      await promise; // Make sure tasks are completed in sequential orders

      const callPath = await realpath(`./bin/call/${task.getCallName()}.js`);
      const callFunc = task.getCallFunc();
      const callArgs = task.getCallArgs();

      console.log(`[${event}]: Verify call lib: ${callPath}`);
      try {
        await access(callPath);
      } catch (e) {
        console.error(`ERROR: ${e}`);
      }

      const callStack = await import(callPath);
      if (callFunc === 'default') {
        console.log(`[${event}]: Call default function: [${callStack.default.name}]`);
        await callStack.default(this.app, context, { ...callArgs });
      } else {
        console.log(callStack);
        const callFuncCustom = callStack[callFunc];
        console.log(`[${event}]: Call custom function: [${callFuncCustom.name}]`);
        if (!(typeof callFuncCustom === 'function')) {
          throw new Error(`[${event}]: ${callFuncCustom} is not a function, please verify in ${callPath}`);
        }
        await callFuncCustom(this.app, context, { ...callArgs });
      }
    }, Promise.resolve());
  }

  private async _registerEvents(): Promise<void> {
    const events = this.operation.getEvents();
    const tasks = this.operation.getTasks();
    console.log(`Evaluate events: [${events}]`);
    if (!events) {
      throw new Error('No events defined in the operation!');
    }
    if (events.includes('all') && events.length > 1) {
      throw new Error("Either listen to 'all' events or specific events! Not both!");
    }

    events.forEach((event) => {
      console.log(`Register event: "${event}"`);
      if (event === 'all') {
        console.warn('WARNING! All events will be listened based on the config!');
        this.app.onAny(async (context) => {
          this._registerTasks(context, event, tasks);
        });
      } else {
        this.app.on(event as keyof WebhookEventMap, async (context) => {
          this._registerTasks(context, event, tasks);
        });
      }
    });
  }
}

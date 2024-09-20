import { Resource } from './resource/resource';
import { Operation } from './operation/operation';
import { ResourceConfig } from '../config/resource-config';
import { OperationConfig } from '../config/operation-config';
import { octokitAuth } from '../utility/octokit';
import { Probot } from 'probot';
import { WebhookEventMap } from '@octokit/webhooks-types';
import { access, realpath } from 'fs/promises';

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

  public async initService(
    resourceConfigPath: string,
    operationConfigPath: string,
    app: Probot,
  ): Promise<void> {
    app.log.info(`Initializing Service: ${this.name} `);
    // Get octokit client so Resource object will get context
    const octokit = await octokitAuth(app, Number(process.env.INSTALLATION_ID));
    const resConfigObj = new ResourceConfig(resourceConfigPath, octokit);
    this.resource = await resConfigObj.initResource();
    const opConfigObj = new OperationConfig(operationConfigPath, app);
    this.operation = await opConfigObj.initOperation();
    this.app = app;
  }

  public async registerEvents(): Promise<void> {
    const events = this.operation.getEvents();
    const tasks = this.operation.getTasks();
    console.log(`Evaluate events: [${events}]`);
    if (!events) {
      throw new Error('No events defined in the operation!');
    } else {
      for (const event of events) {
        console.log(`Register event: "${event}"`);
        this.app.on(event as keyof WebhookEventMap, async (context) => {
          for (const task of tasks) {
            const callPath = await realpath(`./bin/call/${task.getCallName()}.js`);
            const callFunc = task.getCallFunc();
            const callArgs = task.getCallArgs();

            console.log(`Verify call lib: ${callPath}`);
            try {
              await access(callPath);
            } catch (e) {
              console.error(`ERROR: ${e}`);
            }

            console.log(`Import call function: ${callFunc}`);
            const callStack = await import(callPath);
            if (callFunc === 'default') {
              console.log(`Call default function: [${callStack.default.name}]`);
              await callStack.default(this.app, context, { ...callArgs });
            } else {
              console.log(callStack);
              const callFuncCustom = callStack[callFunc];
              console.log(`Call custom function: [${callFuncCustom.name}]`);
              if (typeof callFuncCustom === 'function') {
                await callFuncCustom(this.app, context, { ...callArgs });
              } else {
                throw new Error(
                  `${callFuncCustom} is not a function, please verify in ${callPath}`,
                );
              }
            }
          }
        });
      }
    }
  }
}

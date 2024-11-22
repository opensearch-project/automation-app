/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Probot } from 'probot';
import type { WebhookEventMap } from '@octokit/webhooks-types';
import { access, realpath } from 'fs/promises';
import { Resource } from './resource/resource';
import { Operation } from './operation/operation';
import { Task } from './operation/task';
import { ResourceConfig } from '../config/resource-config';
import { OperationConfig } from '../config/operation-config';
import { octokitAuth } from '../utility/probot/octokit';

export class Service {
  private readonly _name: string;

  private _resource: Resource;

  private _operation: Operation;

  private _app: Probot;

  // Map<eventName, Map<taskName, returnValue>>
  private _outputs: Map<string, Map<string, any>>;

  private readonly subPattern = /\$\{\{\s*(.*?)\s*\}\}/;

  constructor(name: string) {
    this._name = name;
  }

  public get name(): string {
    return this._name;
  }

  public get resource(): Resource {
    return this._resource;
  }

  public get operation(): Operation {
    return this._operation;
  }

  private get app(): Probot {
    return this._app;
  }

  public async initService(app: Probot, resourceConfigPath: string, operationConfigPath: string, additionalResourceContext: boolean): Promise<void> {
    app.log.info(`Initializing Service: ${this.name} `);
    this._app = app;
    // Get octokit client so Resource object will get context
    const octokit = await octokitAuth(this.app, Number(process.env.INSTALLATION_ID));
    const resConfigObj = new ResourceConfig(octokit, resourceConfigPath, additionalResourceContext);
    this._resource = await resConfigObj.initResource();
    const opConfigObj = new OperationConfig(operationConfigPath);
    this._operation = await opConfigObj.initOperation();
    this._outputs = new Map<string, any>();
    this._registerEvents();
  }

  private async _registerTasks(context: any, event: string, tasks: Task[]): Promise<void> {
    await tasks.reduce(async (promise, task) => {
      await promise; // Make sure tasks are completed in sequential orders

      const callPath = await realpath(`./bin/call/${task.callName}.js`);
      const { name, callFunc, callArgs } = task;

      console.log(`[${event}]: Verify call lib: ${callPath}`);
      try {
        await access(callPath);
      } catch (e) {
        console.error(`ERROR: ${e}`);
      }

      const callStack = await import(callPath);
      if (callFunc === 'default') {
        console.log(`[${event}]: Call default function: [${callStack.default.name}]`);
        if (callArgs) {
          console.log(`[${event}]: Call with args:`);
          for (const name2 in callArgs) {
            console.log(`[${event}]: args: ${name2}: ${callArgs[name2]}`);
            if (Array.isArray(callArgs[name2])) {
              for (let i = 0; i < callArgs[name2].length; i++) {
                if (this.subPattern.test(callArgs[name2][i])) {
                  console.log(`Array: ${callArgs[name2][i]}`);
                }
              }
            } else {
              const match = (callArgs[name2] as string).match(this.subPattern);
              if (match) {
                console.log(`StrSub: ${callArgs[name2]}, Match: ${match[1]}, ${match[1].replace('outputs.', '')}`);
                console.log(this._outputs.get(event)?.get(match[1].replace('outputs.', '')))
                callArgs[name2] = JSON.stringify(Object.fromEntries(this._outputs.get(event)?.get(match[1].replace('outputs.', ''))))
              }
            }
          }
        }

        const resultDefault = await callStack.default(this.app, context, this.resource, { ...callArgs });
        this._outputs.get(event)?.set(name, resultDefault);
        console.log(this._outputs.get(event));
      } else {
        console.log(callStack);
        const callFuncCustom = callStack[callFunc];
        console.log(`[${event}]: Call custom function: [${callFuncCustom.name}]`);
        if (!(typeof callFuncCustom === 'function')) {
          throw new Error(`[${event}]: ${callFuncCustom} is not a function, please verify in ${callPath}`);
        }
        this._outputs.get(event)?.set(name, await callFuncCustom(this.app, context, this.resource, { ...callArgs }));
      }
    }, Promise.resolve());
  }

  private async _registerEvents(): Promise<void> {
    const { events, tasks } = this.operation;
    console.log(`Evaluate events: [${events}]`);
    if (!events) {
      throw new Error('No events defined in the operation!');
    }
    if (events.includes('all') && events.length > 1) {
      throw new Error("Either listen to 'all' events or specific events! Not both!");
    }

    events.forEach((event) => {
      console.log(`Register event: "${event}"`);
      this._outputs.set(event, new Map<string, any>());
      if (event === 'all') {
        console.warn('WARNING! All events will be listened based on the config!');
        this._app.onAny(async (context) => {
          this._registerTasks(context, event, tasks);
        });
      } else {
        this._app.on(event as keyof WebhookEventMap, async (context) => {
          this._registerTasks(context, event, tasks);
        });
      }
    });
  }
}

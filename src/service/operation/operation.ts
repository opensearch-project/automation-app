/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Task } from './task';

export class Operation {
  private name: string; // uid

  private events: string[];

  private tasks: Task[];

  constructor(name: string, events: string[], tasks: Task[]) {
    this.name = name;
    this.events = events;
    this.tasks = tasks;
  }

  public getName(): string {
    return this.name;
  }

  public getEvents(): string[] {
    return this.events;
  }

  public getTasks(): Task[] {
    return this.tasks;
  }
}

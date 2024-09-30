/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Task } from './task';

export class Operation {
  private readonly _name: string; // uid

  private readonly _events: string[];

  private readonly _tasks: Task[];

  constructor(name: string, events: string[], tasks: Task[]) {
    this._name = name;
    this._events = events;
    this._tasks = tasks;
  }

  public get name(): string {
    return this._name;
  }

  public get events(): string[] {
    return this._events;
  }

  public get tasks(): Task[] {
    return this._tasks;
  }
}

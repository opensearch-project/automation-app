/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { ProbotOctokit } from 'probot';

export abstract class Entity {
  protected readonly _orgName: string;

  protected _nodeId: string;

  protected _context: any;

  constructor(orgName: string) {
    this._orgName = orgName;
  }

  public get orgName(): string {
    return this._orgName;
  }

  public get nodeId(): string {
    return this._nodeId;
  }

  public get context(): any {
    return this._context;
  }

  public abstract setContext(octokit: ProbotOctokit, ...params: string[]): void;
}

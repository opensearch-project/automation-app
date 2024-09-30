/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { ProbotOctokit } from 'probot';
import { Entity } from './entity';
import { ProjectField } from './project-field';
import { Issue } from './issue';

export class Project extends Entity {
  private readonly _projectNumber: number; // uid

  private _fields: Map<string, ProjectField>;

  private _issues: Map<number, Issue>;

  constructor(orgName: string, projNumber: number) {
    super(orgName);
    this._projectNumber = projNumber;
  }

  public async setContext(octokit: ProbotOctokit): Promise<void> {
    try {
      const projQuery = `
        query getProject() {
           organization(login: "${this.orgName}") {
             projectV2(number: ${this.projectNumber}) {
               id
               title
               number
               url
             }
           }
         }
      `;

      this._context = await octokit.graphql(projQuery);
      console.log(`Set project context: ${this.orgName}/project/${this.projectNumber}`);
      this._nodeId = this.context.organization.projectV2.id;
    } catch (e) {
      console.error(`ERROR: ${e}`);
    }
  }

  public addField(field: ProjectField): void {
    this._fields = this._fields || new Map<string, ProjectField>();
    this._fields.set(field.fieldName, field);
  }

  public addIssue(issue: Issue): void {
    this._issues = this._issues || new Map<number, Issue>();
    this._issues.set(issue.issueNumber, issue);
  }

  public get projectNumber(): number {
    return this._projectNumber;
  }

  public get fields(): Map<string, ProjectField> {
    return this._fields;
  }

  public get issues(): Map<number, Issue> {
    return this._issues;
  }
}

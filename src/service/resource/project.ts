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
  private projectNumber: number; // uid

  private fields: Map<string, ProjectField>;

  private issues: Map<number, Issue>;

  constructor(orgName: string, projNumber: number) {
    super(orgName);
    this.projectNumber = projNumber;
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

      this.context = await octokit.graphql(projQuery);
      console.log(`Set project context: ${this.orgName}/project/${this.projectNumber}`);
      this.nodeId = this.context.organization.projectV2.id;
    } catch (e) {
      console.error(`ERROR: ${e}`);
    }
  }

  public addField(field: ProjectField): void {
    this.fields = this.fields || new Map<string, ProjectField>();
    this.fields.set(field.getFieldName(), field);
  }

  public addIssue(issue: Issue): void {
    this.issues = this.issues || new Map<number, Issue>();
    this.issues.set(issue.getIssueNumber(), issue);
  }

  public getProjectNumber(): number {
    return this.projectNumber;
  }

  public getFields(): Map<string, ProjectField> {
    return this.fields;
  }

  public getIssues(): Map<number, Issue> {
    return this.issues;
  }
}

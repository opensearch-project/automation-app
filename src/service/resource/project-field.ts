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

export class ProjectField extends Entity {
  private _fieldName: string; // uid

  private _fieldType: string;

  private readonly _projectNumber: number;

  constructor(orgName: string, projNumber: number, fieldName: string) {
    super(orgName);
    this._projectNumber = projNumber;
    this._fieldName = fieldName;
  }

  public async setContext(octokit: ProbotOctokit, projNodeId: string): Promise<void> {
    // TODO: Add caching for calls within the same project
    try {
      const projFieldQuery = `
        query getProjectFields() {
          node(id: "${projNodeId}") {
            ... on ProjectV2 {
              fields(first: 20) {
                nodes {
                  ... on ProjectV2Field {
                    id
                    name
                    dataType
                  }
                  ... on ProjectV2IterationField {
                    id
                    name
                    dataType
                    configuration {
                      iterations {
                        startDate
                        id
                      }
                    }
                  }
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    dataType
                    options {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      `;
      const allFieldContextArray: any = await octokit.graphql(projFieldQuery);
      console.log(`Set projectfield context: ${this.orgName}/project/${this.projectNumber}/field/${this.fieldName}`);

      // There are total of 5 datatypes for GitHub Project Fields
      // The ProjectV2Field map to TEXT NUMBER DATE
      // While ProjectV2IterationField map to ITERATION, and ProjectV2SingleSelectField map to SINGLE_SELECT

      const fieldContext = allFieldContextArray.node.fields.nodes.find((field: Record<string, string>) => field.name === this.fieldName);

      if (!fieldContext) {
        throw new Error(`${this._fieldName} not found! Please check organization ${this.orgName} project ${this.projectNumber} and verify that field exist.`);
      }

      this._nodeId = fieldContext.id;
      this._fieldType = fieldContext.dataType;
      this._context = fieldContext;
    } catch (e) {
      console.error(`ERROR: ${e}`);
    }
  }

  public get fieldName(): string {
    return this._fieldName;
  }

  public get projectNumber(): number {
    return this._projectNumber;
  }

  public get fieldType(): string {
    return this._fieldType;
  }
}

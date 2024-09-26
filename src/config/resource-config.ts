/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { ProbotOctokit } from 'probot';
import { ResourceData, OrganizationData } from './types';
import { Resource } from '../service/resource/resource';
import { Organization } from '../service/resource/organization';
import { ProjectField } from '../service/resource/project-field';
import { Project } from '../service/resource/project';
import { Repository } from '../service/resource/repository';
import { Config } from './config';

export class ResourceConfig extends Config {
  private readonly _octokit: ProbotOctokit;

  private readonly _additionalResourceContext;

  private static readonly _configSchema = {
    type: 'object',
    properties: {
      organizations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            projects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  number: {
                    type: 'integer',
                  },
                  fields: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                        },
                      },
                      required: ['name'],
                    },
                  },
                },
                required: ['name', 'number'],
              },
            },
            repositories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                },
                required: ['name'],
              },
            },
          },
          required: ['name'],
        },
      },
    },
    required: ['organizations'],
  };

  constructor(octokit: ProbotOctokit, configPath: string, additionalResourceContext: boolean) {
    super('ResourceConfig');
    this._configData = ResourceConfig.readConfig(configPath);
    this._octokit = octokit;
    this._additionalResourceContext = additionalResourceContext;
    ResourceConfig.validateConfig(this.configData, ResourceConfig._configSchema);
  }

  private async _initProjects(orgData: OrganizationData): Promise<Map<number, Project>> {
    const projObjMap = new Map<number, Project>();

    await Promise.all(
      orgData.projects.map(async (projData) => {
        const projObj = new Project(orgData.name, projData.number);
        if (this._additionalResourceContext) await projObj.setContext(this._octokit);

        if (projData.fields) {
          await Promise.all(
            projData.fields.map(async (projFieldData) => {
              const projFieldObj = new ProjectField(orgData.name, projData.number, projFieldData.name);
              if (this._additionalResourceContext) await projFieldObj.setContext(this._octokit, projObj.nodeId);
              projObj.addField(projFieldObj);
            }),
          );
        }

        projObjMap.set(projData.number, projObj);
      }),
    );

    return projObjMap;
  }

  private async _initRepositories(orgData: OrganizationData): Promise<Map<string, Repository>> {
    const repoObjMap = new Map<string, Repository>();
    await Promise.all(
      orgData.repositories.map(async (repoData) => {
        const repoObj = new Repository(orgData.name, repoData.name);
        if (this._additionalResourceContext) await repoObj.setContext(this._octokit);
        repoObjMap.set(repoData.name, repoObj);
      }),
    );

    return repoObjMap;
  }

  private async _initOrganizations(): Promise<Map<string, Organization>> {
    const orgObjMap = new Map<string, Organization>();
    await Promise.all(
      (this.configData as ResourceData).organizations.map(async (orgData) => {
        const projObjMap = orgData.projects ? await this._initProjects(orgData) : new Map<number, Project>();
        const repoObjMap = orgData.repositories ? await this._initRepositories(orgData) : new Map<string, Repository>();

        const orgObj = new Organization(orgData.name, projObjMap, repoObjMap);
        if (this._additionalResourceContext) await orgObj.setContext(this._octokit);

        orgObjMap.set(orgData.name, orgObj);
      }),
    );
    return orgObjMap;
  }

  public async initResource(): Promise<Resource> {
    return new Resource(await this._initOrganizations());
  }
}

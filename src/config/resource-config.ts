import { ResourceData, OrganizationData } from './types';
import { Resource } from '../service/resource/resource';
import { Organization } from '../service/resource/organization';
import { ProjectField } from '../service/resource/project-field';
import { Project } from '../service/resource/project';
import { Repository } from '../service/resource/repository';
import { Config } from './config';
import { ProbotOctokit } from 'probot';

export class ResourceConfig extends Config {
  private octokit: ProbotOctokit;

  private static configSchema = {
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
                required: ['name', 'number', 'fields'],
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
          required: ['name', 'projects', 'repositories'],
        },
      },
    },
    required: ['organizations'],
  };

  constructor(configPath: string, octokit: ProbotOctokit) {
    super('ResourceConfig');
    this.configData = super.readConfig(configPath);
    this.configSchema = ResourceConfig.configSchema;
    super.validateConfig(this.configData, this.configSchema);
    this.octokit = octokit
  }

  private async __initProjects(orgData: OrganizationData): Promise<Map<number, Project>> {
    let projObjMap = new Map<number, Project>();
    for (const projData of orgData.projects) {
      const projObj = new Project(orgData.name, projData.number);
      await projObj.setContext(this.octokit);

      for (const projFieldData of projData.fields) {
        const projFieldObj = new ProjectField(orgData.name, projData.number, projFieldData.name);
        await projFieldObj.setContext(this.octokit, projObj.getNodeId());
        projObj.addField(projFieldObj);
      }
      projObjMap.set(projData.number, projObj);
    }
    return projObjMap;
  }

  private async __initRepositories(orgData: OrganizationData): Promise<Map<string, Repository>> {
    let repoObjMap = new Map<string, Repository>();
    for (const repoData of orgData.repositories) {
      const repoObj = new Repository(orgData.name, repoData.name);
      await repoObj.setContext(this.octokit);
      repoObjMap.set(repoData.name, repoObj);
    }
    return repoObjMap;
  }

  private async __initOrganizations(): Promise<Map<string, Organization>> {
    let orgObjMap = new Map<string, Organization>();
    for (const orgData of (this.configData as ResourceData).organizations) {
      const orgObj = new Organization(
        orgData.name,
        await this.__initProjects(orgData),
        await this.__initRepositories(orgData),
      );
      await orgObj.setContext(this.octokit);
      orgObjMap.set(orgData.name, orgObj);
    }
    return orgObjMap;
  }

  public async initResource(): Promise<Resource> {
    return new Resource(await this.__initOrganizations());
  }
}

import { ProbotOctokit } from 'probot';
import { Entity } from './entity';

export class ProjectField extends Entity {
  private fieldName: string; // uid

  private fieldType: string;

  private projectNumber: number;

  constructor(orgName: string, projNumber: number, fieldName: string) {
    super(orgName);
    this.projectNumber = projNumber;
    this.fieldName = fieldName;
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
      console.log(
        `Set projectfield context: ${this.orgName}/project/${this.projectNumber}/field/${this.fieldName}`,
      );

      // There are total of 5 datatypes for GitHub Project Fields
      // The ProjectV2Field map to TEXT NUMBER DATE
      // While ProjectV2IterationField map to ITERATION, and ProjectV2SingleSelectField map to SINGLE_SELECT
      for (const fieldContext of allFieldContextArray.node.fields.nodes) {
        if (this.fieldName === fieldContext.name) {
          this.nodeId = fieldContext.id;
          this.fieldType = fieldContext.dataType;
          this.context = fieldContext;
          break;
        }
      }
    } catch (e) {
      console.error(`ERROR: ${e}`);
    }
  }

  public getFieldName(): string {
    return this.fieldName;
  }

  public getProjectNumber(): number {
    return this.projectNumber;
  }

  public getFieldType(): string {
    return this.fieldType;
  }
}

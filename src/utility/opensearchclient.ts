/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { ApiResponse, Client as OpenSearchClient } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/lib/aws/index';

export class OpensearchClient {
  private readonly roleArn = process.env.ROLE_ARN;

  private readonly region = String(process.env.REGION);

  private readonly openSearchUrl = process.env.OPENSEARCH_URL;

  async getClient(): Promise<OpenSearchClient> {
    const stsClient = new STSClient({
      region: this.region,
    });

    const assumeRoleCommand = new AssumeRoleCommand({
      RoleArn: this.roleArn,
      RoleSessionName: 'githubWorkflowRunsMonitorSession',
    });

    const assumedRole = await stsClient.send(assumeRoleCommand);
    const credentials = assumedRole.Credentials;

    if (!credentials) {
      throw new Error('Failed to assume role: credentials are undefined.');
    }

    const client = new OpenSearchClient({
      ...AwsSigv4Signer({
        region: this.region,
        getCredentials: () =>
          Promise.resolve({
            accessKeyId: credentials.AccessKeyId!,
            secretAccessKey: credentials.SecretAccessKey!,
            sessionToken: credentials.SessionToken!,
          }),
      }),
      node: this.openSearchUrl,
    });

    return client;
  }

  async bulkIndex(index: string, documents: any[]): Promise<void> {
    const client = await this.getClient();
    const body: any[] = [];
    documents.forEach((doc) => {
      body.push({ index: { _index: index } });
      body.push(doc);
    });
    try {
      const response = (await client.bulk({ body })) as ApiResponse<any, any>;
      if (response.body.errors) {
        const errorDetails = response.body.items.filter((item: any) => item.index && item.index.error).map((item: any) => item.index.error);
        throw new Error(`Bulk indexing errors: ${JSON.stringify(errorDetails)}`);
      }
      console.log('Bulk indexing completed successfully.');
    } catch (error) {
      console.error(`Error during bulk indexing: ${error}`);
      throw error;
    }
  }
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

// Name         : githubEventsToS3
// Description  : Stores GitHub Events in an S3 Bucket

import { Probot } from 'probot';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Resource } from '../service/resource/resource';
import { validateResourceConfig } from '../utility/verification/verify-resource';

export default async function githubEventsToS3(app: Probot, context: any, resource: Resource): Promise<void> {
  if (!(await validateResourceConfig(app, context, resource))) return;

  const repoName = context.payload.repository?.name;

  const now = new Date();
  const [day, month, year] = [now.getDate(), now.getMonth() + 1, now.getFullYear()].map((num) => String(num).padStart(2, '0'));

  try {
    const s3Client = new S3Client({ region: String(process.env.REGION) });
    const putObjectCommand = new PutObjectCommand({
      Bucket: 'opensearch-project-github-events',
      Body: JSON.stringify(context),
      Key: `${context.name}.${context.payload.action}/${year}-${month}-${day}/${repoName}-${context.id}`,
    });
    await s3Client.send(putObjectCommand);
    app.log.info('GitHub Event uploaded to S3 successfully.');
  } catch (error) {
    app.log.error(`Error uploading GitHub Event to S3 : ${error}`);
  }
}

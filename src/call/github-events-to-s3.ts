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

export default async function githubEventsToS3(app: Probot, context: any): Promise<void> {
  // Removed validateResourceConfig to let this function listen on all repos, and filter for only the repos that are public.
  // This is done so when a new repo is made public, this app can automatically start processing its events.
  //
  // This is only for the s3 data lake specific case, everything else should still specify repos required to be listened in resource config.
  //
  // if (!(await validateResourceConfig(app, context, resource))) return;
  //
  const repoName = context.payload.repository?.name;
  if (context.payload.repository?.private === false) {
    const eventName = context.payload.action === undefined ? context.name : `${context.name}.${context.payload.action}`;

    context.uploaded_at = new Date().toISOString();

    const now = new Date();
    const [day, month, year] = [now.getDate(), now.getMonth() + 1, now.getFullYear()].map((num) => String(num).padStart(2, '0'));

    try {
      const s3Client = new S3Client({ region: String(process.env.REGION) });
      const putObjectCommand = new PutObjectCommand({
        Bucket: String(process.env.OPENSEARCH_EVENTS_BUCKET),
        Body: JSON.stringify(context),
        Key: `${eventName}/${year}-${month}-${day}/${repoName}-${context.id}`,
      });
      await s3Client.send(putObjectCommand);
      app.log.info('GitHub Event uploaded to S3 successfully.');
    } catch (error) {
      app.log.error(`Error uploading GitHub Event to S3 : ${error}`);
    }
  } else {
    app.log.error(`Event from ${repoName} skipped because it is a private repository.`);
  }
}

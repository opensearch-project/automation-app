/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

// Name         : githubLabelCanaryMonitor
// Description  : Handle canary event by sending CloudWatch Metrics for monitoring purposes
// Arguments    :
//   - nameSpace: (string) The namespace of the CloudWatch Metric you want to send data to.
//   - metricName: (string) The metric name of the CloudWatch Metric you want to send data to.
//   - value: (string) The value of the CloudWatch Metric you want to send.
//   - unit: (string) The unit of the CloudWatch Metric you want to send.

import { Probot } from 'probot';
import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch';
import { Resource } from '../service/resource/resource';

export interface LabelCanaryMonitorParams {
  nameSpace: string;
  metricName: string;
  value: string;
  unit: string;
}

export default async function githubLabelCanaryMonitor(
  app: Probot,
  context: any,
  resource: Resource,
  {
    nameSpace, metricName, value, unit,
  }: LabelCanaryMonitorParams,
): Promise<void> {
  // Removed validateResourceConfig to let this function listen on all repos, and filter for only the repos that are public.
  // This is done so when a new repo is made public, this app can automatically start processing its events.
  //
  // This is only for the s3 data lake specific case, everything else should still specify repos required to be listened in resource config.
  //
  // if (!(await validateResourceConfig(app, context, resource))) return;
  //
  const repoName = context.payload.repository?.name;
  if (context.payload.repository?.private === false) {
    // Handle canary event for monitoring purposes
    if (repoName === 'opensearch-metrics' && context.name === 'label' && context.payload.label?.name === 's3-data-lake-app-canary-label') {
      // Ignore if label was created
      if (context.payload.action === 'deleted') {
        try {
          const cloudWatchClient = new CloudWatchClient({ region: String(process.env.REGION) });
          const putMetricDataCommand = new PutMetricDataCommand({
            Namespace: nameSpace,
            MetricData: [
              {
                MetricName: metricName,
                Value: Number(value),
                Unit: unit as StandardUnit,
              },
            ],
          });
          await cloudWatchClient.send(putMetricDataCommand);
          app.log.info('CloudWatch metric for monitoring published.');
        } catch (error) {
          app.log.error(`Error Publishing CloudWatch metric for monitoring : ${error}`);
        }
      }
      // In the future, add `exit` right here to prevent subsequent tasks from running
    }
  }
}

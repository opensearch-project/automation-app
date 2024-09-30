/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Probot, ProbotOctokit } from 'probot';

export async function octokitAuth(app: Probot, installationId: number): Promise<ProbotOctokit> {
  if (!installationId) {
    throw new Error('Please provide installation id of your github app!');
  }
  return app.auth(installationId);
}

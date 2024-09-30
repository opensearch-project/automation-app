/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

// Name         : printToConsole
// Description  : print a message to the console
// Arguments    :
//   - text     : (string) the text string to be printed out

import { Probot } from 'probot';
import { Resource } from '../service/resource/resource';
import { validateResourceConfig } from '../utility/verification/verify-resource';

export interface PrintToConsoleParams {
  text: string;
}

export default async function printToConsole(app: Probot, context: any, resource: Resource, { text }: PrintToConsoleParams): Promise<void> {
  if (!(await validateResourceConfig(app, context, resource))) return;
  app.log.info(text);
}

export async function printToConsoleHelloWorld(app: Probot, context: any, resource: Resource): Promise<void> {
  if (!(await validateResourceConfig(app, context, resource))) return;
  app.log.info('Hello World');
}

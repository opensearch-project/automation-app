/**
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

export interface PrintToConsoleParams {
  text: string;
}

export default async function printToConsole(app: Probot, context: any, { text }: PrintToConsoleParams): Promise<void> {
  app.log.info(text);
}

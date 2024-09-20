// Name		: printToConsole
// Description	: print a message to the console
// Arguments	:
//   - text	: (string) the text string to be printed out

import { Probot } from 'probot';

export interface printToConsoleParams {
  text: string;
}

export default async function printToConsole(app: Probot, context: any, {text}: printToConsoleParams): Promise<void> {
  app.log.info(text);
}

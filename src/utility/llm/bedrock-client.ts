/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { BedrockRuntimeClient, ConverseCommand, ConverseCommandInput } from '@aws-sdk/client-bedrock-runtime';

export const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION_NAME || 'us-east-1' });

export async function bedrockConverse(
  promptText: string,
  modelId: string = 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  maxTokenSize: number = 4000,
  region: string = 'us-east-1',
): Promise<string> {
  const client = bedrockClient;

  const input: ConverseCommandInput = {
    modelId: `arn:aws:bedrock:${region}::inference-profile/${modelId}`,
    messages: [
      {
        role: 'user',
        content: [{ text: promptText }],
      },
    ],
    inferenceConfig: {
      maxTokens: maxTokenSize,
    },
  };

  const command = new ConverseCommand(input);
  const response = await client.send(command);
  const content = response.output?.message?.content?.[0];

  let textResponse: any;

  if (content && typeof content === 'object' && 'text' in content) {
    textResponse = content.text;
  } else {
    textResponse = 'ERROR_RESPONSE';
  }

  return textResponse;
}

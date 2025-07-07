/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient, bedrockConverse } from '../../../src/utility/llm/bedrock-client';

jest.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    ConverseCommand: jest.fn(),
  };
});

describe('bedrockClientFuncs', () => {
  const sendMock = jest.fn();

  beforeEach(() => {
    (bedrockClient as any).send = sendMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('bedrockConverse', () => {
    it('should call bedrock with correct parameters and return text response', async () => {
      const responseMock = {
        output: {
          message: {
            content: [
              {
                text: 'This is a test response',
              },
            ],
          },
        },
      };
      sendMock.mockResolvedValue(responseMock);

      const result = await bedrockConverse('Test prompt', 'test-model-id', 1000, 'us-west-2');

      expect(ConverseCommand).toHaveBeenCalledWith({
        modelId: 'arn:aws:bedrock:us-west-2::inference-profile/test-model-id',
        messages: [
          {
            role: 'user',
            content: [{ text: 'Test prompt' }],
          },
        ],
        inferenceConfig: {
          maxTokens: 1000,
        },
      });
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(result).toBe('This is a test response');
    });

    it('should use default parameters when not provided', async () => {
      const responseMock = {
        output: {
          message: {
            content: [
              {
                text: 'This is a test response',
              },
            ],
          },
        },
      };
      sendMock.mockResolvedValue(responseMock);

      const result = await bedrockConverse('Test prompt');

      expect(ConverseCommand).toHaveBeenCalledWith({
        modelId: 'arn:aws:bedrock:us-east-1::inference-profile/us.anthropic.claude-3-5-haiku-20241022-v1:0',
        messages: [
          {
            role: 'user',
            content: [{ text: 'Test prompt' }],
          },
        ],
        inferenceConfig: {
          maxTokens: 4000,
        },
      });
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(result).toBe('This is a test response');
    });

    it('should return ERROR_RESPONSE if there is no content in response', async () => {
      const responseMock = {
        output: {
          message: {
            content: [],
          },
        },
      };
      sendMock.mockResolvedValue(responseMock);

      const result = await bedrockConverse('Test prompt');

      expect(result).toBe('ERROR_RESPONSE');
    });

    it('should throw error when bedrock.send fails', async () => {
      sendMock.mockRejectedValue(new Error('Bedrock API failed'));

      await expect(bedrockConverse('Test prompt')).rejects.toThrow('Bedrock API failed');
      expect(sendMock).toHaveBeenCalledTimes(1);
    });
  });
});

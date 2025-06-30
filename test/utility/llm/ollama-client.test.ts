/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import ollama from 'ollama';
import { ollamaList, ollamaPull, isOllamaRunning, ollamaGenerate } from '../../../src/utility/llm/ollama-client';

jest.mock('ollama', () => ({
  list: jest.fn(),
  pull: jest.fn(),
  generate: jest.fn(),
}));

const consoleLogOriginal = console.log;
const consoleErrorOriginal = console.error;

describe('ollamaClientFuncs', () => {
  let consoleLogMock: jest.SpyInstance;
  let consoleErrorMock: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogMock.mockRestore();
    consoleErrorMock.mockRestore();
  });

  afterAll(() => {
    console.log = consoleLogOriginal;
    console.error = consoleErrorOriginal;
  });

  describe('ollamaList', () => {
    it('should throw error when ollama.list fails', async () => {
      (ollama.list as jest.Mock).mockRejectedValue(new Error('Failed to list models'));
      await expect(ollamaList()).rejects.toThrow('Failed to list models');
      expect(ollama.list).toHaveBeenCalledTimes(1);
    });
  });

  describe('ollamaPull', () => {
    it('should call ollama.pull with default model', async () => {
      (ollama.pull as jest.Mock).mockResolvedValue(undefined);
      await ollamaPull();
      expect(ollama.pull).toHaveBeenCalledWith({ model: 'llama3.2:1b' });
      expect(consoleLogMock).toHaveBeenCalledWith('Start ollama pull ...');
      expect(consoleLogMock).toHaveBeenCalledWith('Pulling model: llama3.2:1b');
    });

    it('should call ollama.pull with specified model', async () => {
      (ollama.pull as jest.Mock).mockResolvedValue(undefined);
      await ollamaPull('qwen2.5:3b');
      expect(ollama.pull).toHaveBeenCalledWith({ model: 'qwen2.5:3b' });
      expect(consoleLogMock).toHaveBeenCalledWith('Start ollama pull ...');
      expect(consoleLogMock).toHaveBeenCalledWith('Pulling model: qwen2.5:3b');
    });

    it('should throw error when ollama.pull fails', async () => {
      (ollama.pull as jest.Mock).mockRejectedValue(new Error('Failed to pull model'));
      await expect(ollamaPull()).rejects.toThrow('Failed to pull model');
      expect(ollama.pull).toHaveBeenCalledTimes(1);
    });
  });

  describe('isOllamaRunning', () => {
    it('should return true when ollama is running', async () => {
      (ollama.list as jest.Mock).mockResolvedValue({ models: [] });
      const result = await isOllamaRunning();
      expect(result).toBe(true);
      expect(consoleLogMock).toHaveBeenCalledWith('Check if ollama is running now...');
      expect(consoleLogMock).toHaveBeenCalledWith('Ollama is running ...');
    });

    it('should return false when ollama is not running', async () => {
      (ollama.list as jest.Mock).mockRejectedValue(new Error('Ollama not running'));
      const result = await isOllamaRunning();
      expect(result).toBe(false);
      expect(consoleLogMock).toHaveBeenCalledWith('Check if ollama is running now...');
      expect(consoleErrorMock).toHaveBeenCalledWith('ERROR: Error: Ollama not running');
      expect(consoleErrorMock).toHaveBeenCalledWith('Ollama not running ...');
    });
  });

  describe('ollamaGenerate', () => {
    it('should check if ollama is running and pull the model before generating', async () => {
      (ollama.list as jest.Mock).mockResolvedValue({ models: [] });
      (ollama.pull as jest.Mock).mockResolvedValue(undefined);
      (ollama.generate as jest.Mock).mockResolvedValue({ response: 'LLM Responses' });

      const result = await ollamaGenerate('Test prompt', 'qwen2.5:3b');

      expect(ollama.list).toHaveBeenCalledTimes(1);
      expect(ollama.pull).toHaveBeenCalledWith({ model: 'qwen2.5:3b' });
      expect(ollama.generate).toHaveBeenCalledWith({
        model: 'qwen2.5:3b',
        prompt: 'Test prompt',
        raw: false,
      });
      expect(result).toBe('LLM Responses');
      expect(consoleLogMock).toHaveBeenCalledWith('Check if ollama is running now...');
      expect(consoleLogMock).toHaveBeenCalledWith('Ollama is running ...');
      expect(consoleLogMock).toHaveBeenCalledWith('Start ollama pull ...');
      expect(consoleLogMock).toHaveBeenCalledWith('Pulling model: qwen2.5:3b');
      expect(consoleLogMock).toHaveBeenCalledWith('Start ollama generate ...');
      expect(consoleLogMock).toHaveBeenCalledWith('Model name: qwen2.5:3b');
    });

    it('should throw error when generate fails', async () => {
      (ollama.list as jest.Mock).mockResolvedValue({ models: [] });
      (ollama.pull as jest.Mock).mockResolvedValue(undefined);
      (ollama.generate as jest.Mock).mockRejectedValue(new Error('Failed to generate'));

      await expect(ollamaGenerate('Test prompt')).rejects.toThrow('Failed to generate');
    });
  });
});

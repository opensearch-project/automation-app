/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import ollama from 'ollama';

export async function ollamaList(): Promise<void> {
  await ollama.list();
}

export async function ollamaPull(modelName: string = 'llama3.2:1b'): Promise<void> {
  console.log('Start ollama pull ...');
  console.log(`Pulling model: ${modelName}`);
  await ollama.pull({ model: modelName });
}

export async function isOllamaRunning(): Promise<boolean> {
  console.log('Check if ollama is running now...');
  try {
    await ollamaList();
    console.log('Ollama is running ...');
    return true;
  } catch (e) {
    console.error(`ERROR: ${e}`);
    console.error('Ollama not running ...');
    return false;
  }
}

export async function ollamaGenerate(promptText: string, modelName: string = 'llama3.2:1b'): Promise<string> {
  await isOllamaRunning();
  await ollamaPull(modelName);
  console.log('Start ollama generate ...');
  console.log(`Model name: ${modelName}`);
  const response = await ollama.generate({
    model: modelName,
    prompt: promptText,
    raw: false,
  });
  return response.response;
}

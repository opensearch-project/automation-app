/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { load, YAMLException } from 'js-yaml';
import { readFileSync, realpathSync } from 'fs';
import { ResourceData, OperationData } from './types';

export abstract class Config {
  protected _configType: string;

  protected _configData: ResourceData | OperationData;

  constructor(configType: string) {
    this._configType = configType;
  }

  protected get configData(): ResourceData | OperationData {
    return this._configData;
  }

  protected static readConfig(filePath: string): any {
    const realFilePath = realpathSync(filePath);
    try {
      console.log(`Loading config: ${realFilePath}`);
      // Easier to convert YAML to JSON then parse and validate
      const yaml2json = JSON.stringify(load(readFileSync(realFilePath, 'utf-8')));
      console.log(yaml2json);
      return JSON.parse(yaml2json);
    } catch (e) {
      if (e instanceof YAMLException) {
        console.error('YAML parsing error:', e.message);
      } else {
        console.error('Error:', e);
      }
      return null;
    }
  }

  protected static validateConfig(data: ResourceData | OperationData, schema: any): void {
    console.log('Validating Schema......');
    const ajv = new Ajv();
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const isValid = validate(data);

    if (!isValid) {
      console.error('Invalid Config!');
      console.error(validate.errors);
      throw new Error();
    } else {
      console.log('Config Validated!');
    }
  }
}

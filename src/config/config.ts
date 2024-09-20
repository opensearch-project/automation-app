import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as yaml from 'js-yaml';
import { readFileSync, realpathSync } from 'fs';
import { ResourceData, OperationData } from './types';

export abstract class Config {
  protected configType: string;
  protected configData: ResourceData | OperationData;
  protected configSchema: any;

  constructor(configType: string) {
    this.configType = configType;
  }

  protected readConfig(filePath: string): any {
    const realFilePath = realpathSync(filePath);
    try {
      console.log(`Loading ${this.configType} config: ${realFilePath}`);
      // Easier to convert YAML to JSON then parse and validate
      const yaml2json = JSON.stringify(yaml.load(readFileSync(realFilePath, 'utf-8')));
      console.log(yaml2json)
      return JSON.parse(yaml2json)
    } catch (e) {
      if (e instanceof yaml.YAMLException) {
        console.error('YAML parsing error:', e.message);
      } else {
        console.error('Error:', e);
      }
    }
  }

  protected validateConfig(data: ResourceData | OperationData, schema: any): void {
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

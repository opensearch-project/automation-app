/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Organization } from './organization';

export class Resource {
  protected organizations: Map<string, Organization>;

  constructor(orgMap: Map<string, Organization>) {
    this.organizations = orgMap;
  }

  public getOrganizations(): Map<string, Organization> {
    return this.organizations;
  }
}

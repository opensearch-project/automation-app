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

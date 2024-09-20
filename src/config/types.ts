// Resource
export interface ResourceData {
  organizations: OrganizationData[];
}

export interface OrganizationData {
  name: string;
  projects: ProjectData[];
  repositories: RepositoryData[];
}

export interface ProjectData {
  name: string;
  number: number;
  fields: ProjectFieldData[];
}

export interface ProjectFieldData {
  name: string;
}

export interface RepositoryData {
  name: string;
}

// Operation
export interface OperationData {
  name: string;
  events: string[];
  tasks: TaskData[];
}

export interface TaskData {
  name?: string;
  call: string;
  args: TaskArgData;
}

export interface TaskArgData {
  [key: string]: string;
}

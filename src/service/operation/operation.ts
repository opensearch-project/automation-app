import { Task } from './task';

export class Operation {
  private name: string; // uid
  private events: string[];
  private tasks: Task[];

  constructor(name: string, events: string[], tasks: Task[]) {
    this.name = name;
    this.events = events;
    this.tasks = tasks;
  }

  public getName(): string {
    return this.name;
  }

  public getEvents(): string[] {
    return this.events;
  }

  public getTasks(): Task[] {
    return this.tasks;
  }
}

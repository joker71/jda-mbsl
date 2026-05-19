import { MbslError } from "./errors";
import { ModuleActionConfig, ModuleService, Token } from "./types";

export class ModuleAct {
  private stopped = false;
  private result: unknown;

  constructor(private readonly config: ModuleActionConfig) {}

  getActName(): string {
    return this.config.actName;
  }

  getResult(): unknown {
    return this.result;
  }

  isStopped(): boolean {
    return this.stopped;
  }

  isFilterAct(): boolean {
    return Boolean(this.config.filter);
  }

  getFilterObject() {
    return this.config.filter;
  }

  async exec(moduleService: ModuleService, ...args: unknown[]): Promise<void> {
    this.stopped = false;

    if (!moduleService) {
      throw new MbslError(`Action ${this.config.actName} cannot run without a module service`);
    }

    this.result = await moduleService.invoke(
      this.config.actName,
      args as Token,
      this.config.attribNames
    );
    this.stopped = true;
  }
}

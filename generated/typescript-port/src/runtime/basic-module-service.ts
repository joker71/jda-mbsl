import { ModuleContainerService, ModuleService, Token } from "../core/types";

type ActionHandler = (args: Token, attribNames?: string[]) => unknown | Promise<unknown>;

export class BasicModuleService implements ModuleContainerService {
  private readonly actions = new Map<string, ActionHandler>();
  private readonly children = new Map<string, ModuleService>();

  constructor(readonly name: string) {}

  registerAction(actionName: string, handler: ActionHandler): this {
    this.actions.set(actionName, handler);
    return this;
  }

  registerChild(ref: string, service: ModuleService): this {
    this.children.set(ref, service);
    return this;
  }

  getChildService(ref: string): ModuleService | undefined {
    return this.children.get(ref);
  }

  async invoke(actionName: string, args: Token, attribNames?: string[]): Promise<unknown> {
    const action = this.actions.get(actionName);
    if (!action) {
      throw new Error(`Service ${this.name} does not implement action ${actionName}`);
    }

    return action(args, attribNames);
  }
}

export type Token = unknown[];
export type MaybePromise<T> = T | Promise<T>;

export enum NodeType {
  Action = "Action",
  Decision = "Decision",
  Fork = "Fork",
  Join = "Join",
  Merge = "Merge",
  Coordinator = "Coordinator"
}

export interface FilterType {
  eval(args: Token): Token;
}

export interface ModuleActionConfig {
  actName: string;
  endStates?: string[];
  attribNames?: string[];
  filter?: FilterType;
}

export interface NodeConfig {
  ref: string;
  service?: string;
  label: string;
  nodeType?: NodeType;
  actSeq?: ModuleActionConfig[];
  outNodes?: string[];
  init?: boolean;
  zone?: string;
}

export interface ActivityDefinition {
  name: string;
  activityRef: string;
  nodes: NodeConfig[];
}

export interface ModuleService {
  readonly name: string;
  hasView?(): boolean;
  activateView?(): MaybePromise<void>;
  invoke(actionName: string, args: Token, attribNames?: string[]): MaybePromise<unknown>;
}

export interface ModuleContainerService extends ModuleService {
  getChildService(ref: string): ModuleService | undefined;
}

export interface StrategyRegistry {
  decisions?: Record<string, DecisionStrategy>;
  joins?: Record<string, JoinStrategy>;
  merges?: Record<string, MergeStrategy>;
}

export interface EdgeLike {
  getTarget(): NodeLike;
  exec(actModuleService: ModuleContainerService, ...args: unknown[]): Promise<void>;
}

export interface NodeLike {
  getLabel(): string;
  getRef(): string;
  getOut(): EdgeLike[];
}

export type DecisionStrategy = (node: NodeLike, args: Token) => MaybePromise<EdgeLike | undefined>;
export type JoinStrategy = (node: NodeLike, args: Token) => MaybePromise<Token>;
export type MergeStrategy = (node: NodeLike, src: NodeLike | null, args: Token) => MaybePromise<Token>;

import { MbslError } from "./errors";
import { ModuleAct } from "./module-act";
import {
  ActivityDefinition,
  DecisionStrategy,
  JoinStrategy,
  MergeStrategy,
  ModuleContainerService,
  ModuleService,
  NodeConfig,
  NodeLike,
  NodeType,
  StrategyRegistry,
  Token
} from "./types";

let nodeIdCounter = 0;
let edgeIdCounter = 0;

export class Edge {
  readonly id = ++edgeIdCounter;

  constructor(
    private readonly source: Node,
    private readonly target: Node
  ) {}

  getSource(): Node {
    return this.source;
  }

  getTarget(): Node {
    return this.target;
  }

  async exec(actModuleService: ModuleContainerService, ...args: unknown[]): Promise<void> {
    await this.target.exec(this.source, actModuleService, ...args);
  }

  toString(): string {
    return `Edge(${this.id}, ${this.source.toString()}, ${this.target.toString()})`;
  }
}

export class Node implements NodeLike {
  readonly id = ++nodeIdCounter;
  private actSeq: ModuleAct[] = [];
  private filterActs: ModuleAct[] = [];
  private out: Edge[] = [];
  private refModuleService?: ModuleService;
  private stopped = false;

  constructor(
    private readonly label: string,
    private readonly ref: string,
    private readonly service?: string
  ) {}

  setActSeq(actions: ModuleAct[]): void {
    this.actSeq = [];
    this.filterActs = [];

    for (const action of actions) {
      if (action.isFilterAct()) {
        this.filterActs.push(action);
      } else {
        this.actSeq.push(action);
      }
    }
  }

  addOutEdge(edge: Edge): void {
    if (!this.out.includes(edge)) {
      this.out.push(edge);
    }
  }

  getOut(): Edge[] {
    return this.out;
  }

  getRef(): string {
    return this.ref;
  }

  getLabel(): string {
    return this.label;
  }

  setRefModuleService(moduleService: ModuleService | undefined): void {
    this.refModuleService = moduleService;
  }

  getRefModuleService(): ModuleService | undefined {
    return this.refModuleService;
  }

  setStopped(stopped: boolean): void {
    this.stopped = stopped;
  }

  isStopped(): boolean {
    return this.stopped;
  }

  async exec(src: Node | null, actModuleService: ModuleContainerService, ...args: unknown[]): Promise<void> {
    this.stopped = false;
    this.validate();

    const receivedArgs = await this.execReceive(src, actModuleService, args as Token);
    const results = await this.execSelf(src, actModuleService, receivedArgs);
    await this.execOffer(src, actModuleService, receivedArgs, ...results);
  }

  protected async execReceive(
    _src: Node | null,
    _actModuleService: ModuleContainerService,
    args: Token
  ): Promise<Token> {
    let currentArgs = args;
    for (const filter of this.filterActs) {
      const filterObject = filter.getFilterObject();
      if (filterObject) {
        currentArgs = filterObject.eval(currentArgs);
      }
    }
    return currentArgs;
  }

  protected async execSelf(
    _src: Node | null,
    actModuleService: ModuleContainerService,
    args: Token
  ): Promise<Token> {
    const results: unknown[] = [];
    await this.activateRefModuleService(actModuleService);

    for (const action of this.actSeq) {
      const moduleService = this.refModuleService;
      if (!moduleService) {
        throw new MbslError(`Node ${this.label} has no referenced module service`);
      }

      await action.exec(moduleService, ...args);
      const result = action.getResult();
      if (result !== undefined && result !== null) {
        results.push(result);
      }
    }

    this.stopped = true;
    return results;
  }

  protected async execOffer(
    _src: Node | null,
    actModuleService: ModuleContainerService,
    _args: Token,
    ...results: unknown[]
  ): Promise<void> {
    if (this.out.length > 0) {
      await this.out[0].exec(actModuleService, ...results);
    }
  }

  protected async activateRefModuleService(_actModuleService: ModuleContainerService): Promise<void> {
    if (this.refModuleService?.hasView?.()) {
      await this.refModuleService.activateView?.();
    }
  }

  protected validate(): void {
    if (!(this instanceof ControlNode)) {
      if (!this.service) {
        throw new MbslError(`Node ${this.label} violates rule: action nodes require a service`);
      }
      if (this.actSeq.length === 0) {
        throw new MbslError(`Node ${this.label} violates rule: action nodes require an actSeq`);
      }
    }
  }

  toString(): string {
    return `${this.constructor.name}(${this.id}, ${this.label})`;
  }
}

export abstract class ControlNode extends Node {}

export class CoordinatorNode extends Node {
  protected override async execOffer(
    _src: Node | null,
    actModuleService: ModuleContainerService,
    args: Token
  ): Promise<void> {
    if (this.getOut().length > 0) {
      await this.getOut()[0].exec(actModuleService, ...args);
    }
  }
}

export class DecisionNode extends ControlNode {
  constructor(
    label: string,
    ref: string,
    service: string | undefined,
    private readonly decisionStrategy: DecisionStrategy
  ) {
    super(label, ref, service);
  }

  override async exec(src: Node | null, actModuleService: ModuleContainerService, ...args: unknown[]): Promise<void> {
    this.setStopped(false);
    this.validate();
    const receivedArgs = await this.execReceive(src, actModuleService, args as Token);
    const edge = await this.decisionStrategy(this, receivedArgs);
    this.setStopped(true);

    if (edge) {
      await edge.exec(actModuleService, ...receivedArgs);
    }
  }
}

export class ForkNode extends ControlNode {
  override async exec(src: Node | null, actModuleService: ModuleContainerService, ...args: unknown[]): Promise<void> {
    this.setStopped(false);
    this.validate();
    const receivedArgs = await this.execReceive(src, actModuleService, args as Token);
    await this.activateRefModuleService(actModuleService);
    await Promise.all(this.getOut().map((edge) => edge.exec(actModuleService, ...receivedArgs)));
    this.setStopped(true);
  }
}

export class JoinNode extends ControlNode {
  private readonly pre: Node[] = [];
  private readonly inputBuffer: Token[] = [];
  private joinChain: Promise<void> = Promise.resolve();

  constructor(
    label: string,
    ref: string,
    service: string | undefined,
    private readonly joinStrategy?: JoinStrategy
  ) {
    super(label, ref, service);
  }

  addPreNode(node: Node): void {
    if (!this.pre.includes(node)) {
      this.pre.push(node);
    }
  }

  override exec(src: Node | null, actModuleService: ModuleContainerService, ...args: unknown[]): Promise<void> {
    this.joinChain = this.joinChain.then(() => this.execSerial(src, actModuleService, args as Token));
    return this.joinChain;
  }

  private async execSerial(
    _src: Node | null,
    actModuleService: ModuleContainerService,
    args: Token
  ): Promise<void> {
    this.setStopped(false);
    this.validate();
    await this.activateRefModuleService(actModuleService);

    this.inputBuffer.push(args);
    if (this.inputBuffer.length < this.pre.length) {
      return;
    }

    const mergedInput = this.inputBuffer.flat();
    this.inputBuffer.length = 0;

    const results = this.joinStrategy
      ? await this.joinStrategy(this, mergedInput)
      : mergedInput;

    this.setStopped(true);
    if (this.getOut().length > 0) {
      await this.getOut()[0].exec(actModuleService, ...results);
    }
  }
}

export class MergeNode extends ControlNode {
  constructor(
    label: string,
    ref: string,
    service: string | undefined,
    private readonly mergeStrategy?: MergeStrategy
  ) {
    super(label, ref, service);
  }

  override async exec(src: Node | null, actModuleService: ModuleContainerService, ...args: unknown[]): Promise<void> {
    this.setStopped(false);
    this.validate();
    const receivedArgs = await this.execReceive(src, actModuleService, args as Token);
    await this.activateRefModuleService(actModuleService);

    const results = this.mergeStrategy
      ? await this.mergeStrategy(this, src, receivedArgs)
      : receivedArgs;

    this.setStopped(true);
    if (this.getOut().length > 0) {
      await this.getOut()[0].exec(actModuleService, ...results);
    }
  }
}

export class ActivityGraph {
  private readonly nodes: Node[] = [];
  private readonly edges: Edge[] = [];
  private readonly initNodes: Node[] = [];

  addNode(node: Node): void {
    if (!this.nodes.includes(node)) {
      this.nodes.push(node);
    }
  }

  addEdge(edge: Edge): void {
    if (!this.edges.includes(edge)) {
      this.edges.push(edge);
    }
  }

  addInitNode(node: Node): void {
    if (!this.initNodes.includes(node)) {
      this.initNodes.push(node);
    }
  }

  getInitNodes(): Node[] {
    return this.initNodes;
  }

  async exec(actModuleService: ModuleContainerService, ...args: unknown[]): Promise<void> {
    await Promise.all(this.initNodes.map((node) => node.exec(null, actModuleService, ...args)));
  }

  toString(): string {
    return `ActivityGraph(nodes=${this.nodes.length}, edges=${this.edges.length})`;
  }
}

export class NodeFactory {
  static createNode(config: NodeConfig, strategies: StrategyRegistry): Node {
    const type = config.nodeType ?? NodeType.Action;

    switch (type) {
      case NodeType.Action:
        return new Node(config.label, config.ref, config.service);
      case NodeType.Decision: {
        const decision = strategies.decisions?.[config.ref];
        if (!decision) {
          throw new MbslError(`Missing decision strategy for ${config.ref}`);
        }
        return new DecisionNode(config.label, config.ref, config.service, decision);
      }
      case NodeType.Fork:
        return new ForkNode(config.label, config.ref, config.service);
      case NodeType.Join:
        return new JoinNode(config.label, config.ref, config.service, strategies.joins?.[config.ref]);
      case NodeType.Merge:
        return new MergeNode(config.label, config.ref, config.service, strategies.merges?.[config.ref]);
      case NodeType.Coordinator:
        return new CoordinatorNode(config.label, config.ref, config.service);
      default:
        throw new MbslError(`Unsupported node type: ${String(type)}`);
    }
  }
}

export class ActivityModel {
  private readonly nodeConfigMap = new Map<string, NodeConfig>();
  private readonly initNodeLabels: string[] = [];
  private graph?: ActivityGraph;

  constructor(
    readonly definition: ActivityDefinition,
    private readonly strategies: StrategyRegistry = {}
  ) {
    for (const node of definition.nodes) {
      this.nodeConfigMap.set(node.label, node);
      if (node.init) {
        this.initNodeLabels.push(node.label);
      }
    }

    if (this.initNodeLabels.length === 0) {
      throw new MbslError(`Activity ${definition.name} has no initial nodes`);
    }
  }

  getInitNodes(): string[] {
    return [...this.initNodeLabels];
  }

  getGraph(actModuleService: ModuleContainerService): ActivityGraph {
    if (!this.graph) {
      this.graph = this.genGraph(actModuleService);
    }
    return this.graph;
  }

  async exec(actModuleService: ModuleContainerService, ...args: unknown[]): Promise<void> {
    await this.getGraph(actModuleService).exec(actModuleService, ...args);
  }

  private genGraph(actModuleService: ModuleContainerService): ActivityGraph {
    const graph = new ActivityGraph();
    const nodeMap = new Map<string, Node>();

    const initLabel = this.initNodeLabels[0];
    const initConfig = this.requireNodeConfig(initLabel);
    const initService = actModuleService.getChildService(initConfig.ref);

    this.genSubgraph(initConfig, actModuleService, initService, nodeMap, graph);
    return graph;
  }

  private genSubgraph(
    nodeConfig: NodeConfig,
    actModuleService: ModuleContainerService,
    refModuleService: ModuleService | undefined,
    nodeMap: Map<string, Node>,
    graph: ActivityGraph
  ): Node {
    const node = NodeFactory.createNode(nodeConfig, this.strategies);
    node.setActSeq((nodeConfig.actSeq ?? []).map((action) => new ModuleAct(action)));
    node.setRefModuleService(refModuleService);

    graph.addNode(node);
    if (nodeConfig.init) {
      graph.addInitNode(node);
    }

    nodeMap.set(nodeConfig.label, node);

    for (const outLabel of nodeConfig.outNodes ?? []) {
      let outNode = nodeMap.get(outLabel);

      if (!outNode) {
        const outConfig = this.requireNodeConfig(outLabel);
        const childService = this.resolveChildService(outConfig, actModuleService, nodeMap);
        outNode = this.genSubgraph(outConfig, actModuleService, childService, nodeMap, graph);
      }

      const edge = new Edge(node, outNode);
      if (outNode instanceof JoinNode) {
        outNode.addPreNode(node);
      }

      node.addOutEdge(edge);
      graph.addEdge(edge);
    }

    return node;
  }

  private resolveChildService(
    nodeConfig: NodeConfig,
    actModuleService: ModuleContainerService,
    nodeMap: Map<string, Node>
  ): ModuleService | undefined {
    const zone = nodeConfig.zone;
    if (!zone || zone === "top") {
      return actModuleService.getChildService(nodeConfig.ref);
    }

    const zoneNode = nodeMap.get(zone);
    if (!zoneNode) {
      throw new MbslError(`Zone node not found: ${zone}`);
    }

    const zoneModule = zoneNode.getRefModuleService();
    if (!zoneModule || !isModuleContainerService(zoneModule)) {
      return undefined;
    }

    return zoneModule.getChildService(nodeConfig.ref);
  }

  private requireNodeConfig(label: string): NodeConfig {
    const config = this.nodeConfigMap.get(label);
    if (!config) {
      throw new MbslError(`Node configuration not found: ${label}`);
    }
    return config;
  }
}

function isModuleContainerService(service: ModuleService): service is ModuleContainerService {
  return typeof (service as ModuleContainerService).getChildService === "function";
}

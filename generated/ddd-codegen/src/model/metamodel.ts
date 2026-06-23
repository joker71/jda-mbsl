/**
 * Intermediate Metamodel — inspired by:
 *  - DCSL (DClass, DAttr, DAssoc, DOpt) from "DDD with DCSL" paper
 *  - AGL (AGraph, ANode, MAct) from "AGL: Incorporating Behavioral Aspects into DDD"
 *  - RBAC₀/₁/₂ from Sandhu et al. 1996
 *  - Layered Microservices (Bounded Context decomposition)
 */

// ─── Primitive types ────────────────────────────────────────────────────────

export type Visibility = 'public' | 'private' | 'protected';
export type AssociationType = 'composition' | 'aggregation' | 'association' | 'dependency' | 'realization';
export type Multiplicity = '0..1' | '1' | '0..*' | '1..*' | '*';

/**
 * DDD stereotypes — maps directly to DCSL meta-concepts and AGL activity patterns.
 * AggregateRoot → DCSL DClass{mutable=true} + MOSA module owner
 * Entity        → DCSL DClass{mutable=true}
 * ValueObject   → DCSL DClass{mutable=false, immutable}
 * DomainService → DCSL DOpt{type=Service}, sits at domain layer
 * DomainEvent   → DCSL DClass{immutable}, emitted by aggregate actions (AGL MAct post-state)
 * Repository    → DCSL DAssoc + interface to infrastructure
 * UseCase       → AGL ANode (application-layer action sequence, SAA)
 * Role          → RBAC Role (Sandhu96 RBAC₁)
 */
export type DddStereotype =
  | 'AggregateRoot'
  | 'Entity'
  | 'ValueObject'
  | 'DomainService'
  | 'DomainEvent'
  | 'Repository'
  | 'UseCase'
  | 'Role';

// ─── Field / Method ──────────────────────────────────────────────────────────

/**
 * Corresponds to DCSL DAttr meta-concept.
 * Captures name, type, optional/required (DAttr.optional), length constraints.
 */
export interface DomainField {
  name: string;
  type: string;             // TypeScript type string
  visibility: Visibility;
  isOptional: boolean;      // DAttr.optional
  isCollection: boolean;    // DAssoc one-many / many-many
  isId: boolean;            // DOpt{type=AutoAttributeValueGen} → primary key
  defaultValue?: string;
}

/**
 * Corresponds to DCSL DOpt + AttrRef meta-concept.
 * Behavior types: Constructor, Getter, Setter, LinkAdderNew, LinkUpdater, LinkRemover, AutoAttributeValueGen
 */
export interface DomainMethod {
  name: string;
  visibility: Visibility;
  returnType: string;
  parameters: Array<{ name: string; type: string }>;
  isAsync: boolean;
  // AGL MAct mapping: which atomic action does this method implement?
  // open | newObject | setDataFieldValues | createObject | updateObject | deleteObject
  moduleAction?: string;
}

// ─── Association ─────────────────────────────────────────────────────────────

/**
 * Corresponds to DCSL DAssoc meta-concept.
 * ascType: One2One | One2Many | Many2Many
 */
export interface DomainAssociation {
  sourceClass: string;
  targetClass: string;
  type: AssociationType;
  sourceMultiplicity: Multiplicity;
  targetMultiplicity: Multiplicity;
  label: string;
  sourceRole?: string;
  targetRole?: string;
}

// ─── Class ───────────────────────────────────────────────────────────────────

/**
 * Core metamodel unit. Maps to DCSL DClass (structural) + AGL ANode (behavioral).
 *
 * In MOSA terms, each DomainClass with stereotype AggregateRoot becomes the
 * owner of a software module (ModuleClass = Domain + View + Controller).
 */
export interface DomainClass {
  name: string;
  stereotype: DddStereotype;
  boundedContext: string;
  fields: DomainField[];
  methods: DomainMethod[];
  isAbstract: boolean;
  /** DCSL DClass.mutable — false for ValueObject, DomainEvent */
  isMutable: boolean;
  /** RBAC permissions for Role stereotype (Sandhu96 RBAC₀ permission assignment) */
  permissions: string[];
  /** Role hierarchy: this role extends (inherits from) parentRole (RBAC₁) */
  extendsRole?: string;
  /** AGL AGraph: activity nodes linked to this aggregate */
  activityNodes?: AglActivityNode[];
}

// ─── AGL Activity Graph (behavioral layer) ───────────────────────────────────

/**
 * AGL ANode: represents an action node in the activity graph.
 * Maps to a use-case action sequence (SAA) at the application layer.
 * Corresponds to MOSA ModuleService action sequence.
 */
export interface AglActivityNode {
  label: string;
  refClass: string;          // referenced domain class (DomainClass.name)
  serviceClass: string;      // 'DataController' by default
  /** MAct sequence: ordered atomic actions (open→newObject→setDataFieldValues→createObject) */
  moduleActions: AglModuleAction[];
  outClasses: string[];      // target classes of outgoing edges
  isStart: boolean;          // ANode.init = true
  nodeType: 'Action' | 'Decision' | 'Fork' | 'Join' | 'Merge';
}

/**
 * AGL MAct: Structured Atomic Action (SAA).
 * preStates → postStates define the state machine of the module.
 */
export interface AglModuleAction {
  actName: 'open' | 'newObject' | 'setDataFieldValues' | 'createObject' | 'updateObject' | 'deleteObject' | 'reset' | 'cancel';
  postStates: string[];      // e.g. ['Created'], ['NewObject']
  fieldNames?: string[];     // for setDataFieldValues
}

// ─── RBAC (Sandhu96 RBAC₁) ──────────────────────────────────────────────────

/**
 * RBAC Role with permission assignment and role hierarchy.
 * RBAC₀: users, roles, permissions, sessions
 * RBAC₁: adds role hierarchy (extendsRole)
 * RBAC₂: adds static separation of duty constraints
 */
export interface RbacRole {
  name: string;
  permissions: string[];
  /** Role hierarchy (RBAC₁): this role inherits all permissions of parentRole */
  extendsRole?: string;
}

export interface RbacModel {
  roles: RbacRole[];
  /** Flat deduplicated permission list */
  allPermissions: string[];
}

// ─── Bounded Context ─────────────────────────────────────────────────────────

/**
 * Bounded Context from Evans DDD + Layered Microservices paper.
 * Each context → one NestJS module (microservice boundary).
 */
export interface BoundedContext {
  name: string;
  classes: DomainClass[];
  associations: DomainAssociation[];
}

// ─── Top-level Metamodel ─────────────────────────────────────────────────────

export interface DomainMetamodel {
  /** Project/app name */
  appName: string;
  boundedContexts: BoundedContext[];
  rbac: RbacModel;
}

// ─── Generator context (passed to Handlebars templates) ──────────────────────

export interface GeneratorContext {
  appName: string;
  className: string;
  classNameCamel: string;         // camelCase
  classNameKebab: string;         // kebab-case
  classNameSnake: string;         // snake_case
  contextName: string;
  contextNameCamel: string;
  contextNameKebab: string;
  fields: DomainField[];
  methods: DomainMethod[];
  associations: DomainAssociation[];
  stereotype: DddStereotype;
  isMutable: boolean;
  /** For Repository templates */
  aggregateClass?: string;
  /** For UseCase templates */
  useCaseName?: string;
  /** For RBAC templates */
  roles?: RbacRole[];
  permissions?: string[];
}

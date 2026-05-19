# TypeScript Port of `jda-mbsl`

This folder contains a TypeScript port of the core MBSL execution engine from the Java source in:

- `modules/mbsl/src/main/java/jda/modules/mbsl/model/ActivityModel.java`
- `modules/mbsl/src/main/java/jda/modules/mbsl/model/graph/*.java`
- `modules/mbsl/src/main/java/jda/modules/mbsl/model/appmodules/ModuleAct.java`

## What was ported

The TypeScript version keeps the main runtime concepts from the Java code:

- `ActivityModel` builds an `ActivityGraph` from declarative node configuration
- `Node`, `Edge`, and `NodeFactory` preserve the same graph structure
- `Decision`, `Fork`, `Join`, `Merge`, and `Coordinator` behaviors are represented as TypeScript subclasses
- `ModuleAct` still models executable module actions, but calls a lightweight `ModuleService` interface instead of JDA reflection

## Key adaptation from Java to TypeScript

The Java implementation relies on annotations like `@AGraph`, `@ANode`, `@MAct` and runtime reflection over `ModuleService`. TypeScript does not need that mechanism here, so the port replaces it with:

- plain configuration objects for graph definitions
- strategy registries for decision/join/merge logic
- a small `BasicModuleService` runtime used for examples and tests

This keeps the execution semantics while making the port runnable outside the original JDA framework.

## Example

The example under `src/examples/decisional` ports the decisional flow from the Java test example `EnrolmentMgmt` and `DHelpOrSClass`.

## Run

```powershell
npm install
npm run build
npm start
```

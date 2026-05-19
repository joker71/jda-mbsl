import { ActivityModel } from "../../core/graph";
import { BasicModuleService } from "../../runtime/basic-module-service";
import { ActivityDefinition, NodeType, StrategyRegistry } from "../../core/types";
import { DecisionalMysqlStore } from "./mysql-persistence";

interface Student {
  id: string;
  name: string;
  helpRequested: boolean;
}

interface HelpRequest {
  studentId: string;
  type: "help-request";
}

interface SClassRegistration {
  studentId: string;
  type: "sclass-registration";
}

const activityDefinition: ActivityDefinition = {
  name: "Enrolment Management",
  activityRef: "EnrolmentMgmt",
  nodes: [
    {
      label: "Student",
      ref: "Student",
      service: "DataController",
      init: true,
      actSeq: [{ actName: "newObject" }],
      outNodes: ["DHelpOrSClass"]
    },
    {
      label: "DHelpOrSClass",
      ref: "DHelpOrSClass",
      nodeType: NodeType.Decision,
      outNodes: ["HelpRequest", "SClassRegistration"]
    },
    {
      label: "HelpRequest",
      ref: "HelpRequest",
      service: "DataController",
      actSeq: [
        { actName: "newObject" },
        { actName: "setDataFieldValues", attribNames: ["studentId"] }
      ]
    },
    {
      label: "SClassRegistration",
      ref: "SClassRegistration",
      service: "DataController",
      actSeq: [
        { actName: "newObject" },
        { actName: "setDataFieldValues", attribNames: ["studentId"] }
      ]
    }
  ]
};

const strategies: StrategyRegistry = {
  decisions: {
    DHelpOrSClass: async (node, args) => {
      const student = args[0] as Student;
      const targetLabel = student.helpRequested ? "HelpRequest" : "SClassRegistration";
      return node.getOut().find((edge) => edge.getTarget().getLabel() === targetLabel);
    }
  }
};

async function main(): Promise<void> {
  const store = DecisionalMysqlStore.fromEnv();
  await store.init();

  const activityService = new BasicModuleService("EnrolmentMgmt");

  const studentService = new BasicModuleService("Student").registerAction("newObject", async (args) => {
    const student = args[0] as Student;
    await store.upsertStudent(student);
    console.log(`[Student.newObject] ${student.name}`);
    return student;
  });

  const helpRequestService = new BasicModuleService("HelpRequest")
    .registerAction("newObject", async () => {
      console.log("[HelpRequest.newObject] prepare form");
      return null;
    })
    .registerAction("setDataFieldValues", async (args, attribNames) => {
      const student = args[0] as Student;
      const payload: HelpRequest = { studentId: student.id, type: "help-request" };
      const id = await store.createHelpRequest(payload);
      console.log("[HelpRequest.setDataFieldValues]", attribNames, { id, ...payload });
      return payload;
    });

  const sclassRegistrationService = new BasicModuleService("SClassRegistration")
    .registerAction("newObject", async () => {
      console.log("[SClassRegistration.newObject] prepare form");
      return null;
    })
    .registerAction("setDataFieldValues", async (args, attribNames) => {
      const student = args[0] as Student;
      const payload: SClassRegistration = {
        studentId: student.id,
        type: "sclass-registration"
      };
      const id = await store.createSClassRegistration(payload);
      console.log("[SClassRegistration.setDataFieldValues]", attribNames, { id, ...payload });
      return payload;
    });

  activityService
    .registerChild("Student", studentService)
    .registerChild("HelpRequest", helpRequestService)
    .registerChild("SClassRegistration", sclassRegistrationService);

  const model = new ActivityModel(activityDefinition, strategies);

  console.log("Initial nodes:", model.getInitNodes());

  try {
    await model.exec(activityService, {
      id: "S2026",
      name: "Lan",
      helpRequested: true
    } satisfies Student);

    await model.exec(activityService, {
      id: "S2027",
      name: "Minh",
      helpRequested: false
    } satisfies Student);
  } finally {
    await store.close();
  }
}

main().catch((error) => {
  console.error(error);
});

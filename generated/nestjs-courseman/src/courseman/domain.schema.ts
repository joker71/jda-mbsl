export type PrimitiveType = 'number' | 'string' | 'boolean' | 'date';
export type FieldKind = PrimitiveType | 'reference' | 'referenceArray' | 'enum';

export interface FieldSchema {
  name: string;
  kind: FieldKind;
  required?: boolean;
  readonly?: boolean;
  generated?: boolean;
  target?: string;
  enumValues?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
}

export interface ResourceSchema {
  name: string;
  route: string;
  sourceJava: string;
  fields: FieldSchema[];
}

export const COURSEMAN_SCHEMA: ResourceSchema[] = [
  {
    name: 'Student',
    route: 'students',
    sourceJava: 'org.jda.example.courseman.modules.student.model.Student',
    fields: [
      { name: 'id', kind: 'number', required: true, readonly: true, generated: true, min: 1 },
      { name: 'name', kind: 'string', required: true, maxLength: 30 },
      { name: 'helpRequested', kind: 'boolean' },
      { name: 'sclassIds', kind: 'referenceArray', target: 'SClass' },
      { name: 'classRegistIds', kind: 'referenceArray', target: 'SClassRegistration' },
      { name: 'moduleIds', kind: 'referenceArray', target: 'CourseModule' },
      { name: 'enrolmentIds', kind: 'referenceArray', target: 'Enrolment' },
    ],
  },
  {
    name: 'CourseModule',
    route: 'course-modules',
    sourceJava: 'org.jda.example.courseman.modules.coursemodule.model.CourseModule',
    fields: [
      { name: 'id', kind: 'number', required: true, readonly: true, generated: true, min: 1 },
      { name: 'code', kind: 'string', readonly: true, generated: true, maxLength: 6 },
      { name: 'name', kind: 'string', required: true, maxLength: 30 },
      { name: 'semester', kind: 'number', required: true, min: 1, max: 10 },
      { name: 'credits', kind: 'number', required: true, min: 1, max: 5 },
      { name: 'studentIds', kind: 'referenceArray', target: 'Student' },
      { name: 'enrolmentIds', kind: 'referenceArray', target: 'Enrolment' },
    ],
  },
  {
    name: 'SClass',
    route: 'sclasses',
    sourceJava: 'org.jda.example.courseman.modules.sclass.model.SClass',
    fields: [
      { name: 'id', kind: 'number', required: true, readonly: true, generated: true, min: 1 },
      { name: 'name', kind: 'string', required: true, maxLength: 20 },
      { name: 'studentIds', kind: 'referenceArray', target: 'Student' },
      { name: 'classRegistIds', kind: 'referenceArray', target: 'SClassRegistration' },
    ],
  },
  {
    name: 'SClassRegistration',
    route: 'sclass-registrations',
    sourceJava: 'org.jda.example.courseman.modules.sclassregist.model.SClassRegistration',
    fields: [
      { name: 'id', kind: 'number', required: true, readonly: true, generated: true, min: 1 },
      { name: 'studentId', kind: 'reference', required: true, target: 'Student' },
      { name: 'sClassId', kind: 'reference', required: true, target: 'SClass' },
    ],
  },
  {
    name: 'Enrolment',
    route: 'enrolments',
    sourceJava: 'org.jda.example.courseman.modules.enrolment.model.Enrolment',
    fields: [
      { name: 'id', kind: 'number', required: true, readonly: true, generated: true, min: 1 },
      { name: 'studentId', kind: 'reference', required: true, target: 'Student' },
      { name: 'moduleId', kind: 'reference', required: true, target: 'CourseModule' },
      { name: 'internalMark', kind: 'number', min: 0, max: 10 },
      { name: 'examMark', kind: 'number', min: 0, max: 10 },
      { name: 'finalMark', kind: 'number', readonly: true, generated: true },
      { name: 'finalGrade', kind: 'string', readonly: true, generated: true, maxLength: 1 },
    ],
  },
  {
    name: 'Payment',
    route: 'payments',
    sourceJava: 'org.jda.example.courseman.modules.payment.model.Payment',
    fields: [
      { name: 'id', kind: 'number', required: true, readonly: true, generated: true, min: 1 },
      { name: 'studentId', kind: 'reference', required: true, target: 'Student' },
      { name: 'payDetails', kind: 'string', maxLength: 255 },
      { name: 'description', kind: 'string', maxLength: 255 },
      { name: 'status', kind: 'enum', enumValues: ['ACCEPTED', 'REJECTED'] },
    ],
  },
  {
    name: 'Authorisation',
    route: 'authorisations',
    sourceJava: 'org.jda.example.courseman.modules.authorisation.model.Authorisation',
    fields: [
      { name: 'id', kind: 'number', required: true, readonly: true, generated: true, min: 1 },
      { name: 'studentId', kind: 'reference', required: true, target: 'Student' },
      { name: 'authorDetails', kind: 'string', required: true, maxLength: 255 },
      { name: 'description', kind: 'string', maxLength: 255 },
      { name: 'status', kind: 'enum', required: true, enumValues: ['ACCEPTED', 'REJECTED'] },
    ],
  },
  {
    name: 'EnrolmentApproval',
    route: 'enrolment-approvals',
    sourceJava: 'org.jda.example.courseman.modules.enrolment.model.EnrolmentApproval',
    fields: [
      { name: 'id', kind: 'number', required: true, readonly: true, generated: true, min: 1 },
      { name: 'studentId', kind: 'reference', required: true, target: 'Student' },
      { name: 'paymentId', kind: 'reference', required: true, target: 'Payment' },
      { name: 'authorisationId', kind: 'reference', required: true, target: 'Authorisation' },
      { name: 'approved', kind: 'boolean', readonly: true, generated: true },
      { name: 'note', kind: 'string', maxLength: 255 },
    ],
  },
  {
    name: 'Orientation',
    route: 'orientations',
    sourceJava: 'org.jda.example.courseman.modules.orientation.model.Orientation',
    fields: [
      { name: 'id', kind: 'number', required: true, readonly: true, generated: true, min: 1 },
      { name: 'content', kind: 'string', maxLength: 10000 },
    ],
  },
  {
    name: 'HelpRequest',
    route: 'help-requests',
    sourceJava: 'org.jda.example.courseman.modules.helprequest.model.HelpRequest',
    fields: [
      { name: 'id', kind: 'number', required: true, readonly: true, generated: true, min: 1 },
      { name: 'studentId', kind: 'reference', required: true, target: 'Student' },
      { name: 'content', kind: 'string', maxLength: 255 },
    ],
  },
  {
    name: 'EnrolmentClosure',
    route: 'enrolment-closures',
    sourceJava: 'org.jda.example.courseman.modules.enrolment.model.EnrolmentClosure',
    fields: [
      { name: 'id', kind: 'number', required: true, readonly: true, generated: true, min: 1 },
      { name: 'closureDate', kind: 'date', required: true, readonly: true },
      { name: 'sclassRegistId', kind: 'reference', target: 'SClassRegistration' },
      { name: 'orientationId', kind: 'reference', target: 'Orientation' },
      { name: 'note', kind: 'string', maxLength: 255 },
    ],
  },
];

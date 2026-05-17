import { BadRequestException, Injectable } from '@nestjs/common';
import { ResourceRecord, ResourceStore } from '../common/resource-store';
import { COURSEMAN_SCHEMA, ResourceSchema } from './domain.schema';

@Injectable()
export class CoursemanService {
  constructor(private readonly store: ResourceStore) {}

  schemas(): ResourceSchema[] {
    return COURSEMAN_SCHEMA;
  }

  list(resource: string): ResourceRecord[] {
    return this.store.list(this.schema(resource).route);
  }

  find(resource: string, id: string): ResourceRecord {
    return this.store.find(this.schema(resource).route, id);
  }

  create(resource: string, payload: ResourceRecord): ResourceRecord {
    const schema = this.schema(resource);
    const prepared = this.applyDerivedFields(schema, payload);
    this.validateReferences(schema, prepared);
    return this.store.create(schema.route, prepared);
  }

  update(resource: string, id: string, payload: ResourceRecord): ResourceRecord {
    const schema = this.schema(resource);
    const current = this.store.find(schema.route, id);
    const prepared = this.applyDerivedFields(schema, { ...current, ...payload });
    this.validateReferences(schema, prepared);
    return this.store.update(schema.route, id, prepared);
  }

  remove(resource: string, id: string): void {
    this.store.remove(this.schema(resource).route, id);
  }

  private schema(resource: string): ResourceSchema {
    const schema = COURSEMAN_SCHEMA.find((item) => item.route === resource);
    if (!schema) {
      throw new BadRequestException(`Unsupported CourseMan resource: ${resource}`);
    }
    return schema;
  }

  private applyDerivedFields(schema: ResourceSchema, payload: ResourceRecord): ResourceRecord {
    if (schema.name === 'CourseModule') {
      return this.applyCourseModuleCode(payload);
    }
    if (schema.name === 'Enrolment') {
      return this.applyFinalMark(payload);
    }
    if (schema.name === 'EnrolmentApproval') {
      return this.applyApproval(payload);
    }
    return payload;
  }

  private applyCourseModuleCode(payload: ResourceRecord): ResourceRecord {
    if (payload.code || typeof payload.semester !== 'number') {
      return payload;
    }
    const semester = payload.semester;
    const existingCodes = this.store
      .list('course-modules')
      .map((item) => String(item.code ?? ''))
      .filter((code) => code.startsWith(`M${semester}`));
    const nextNumber =
      existingCodes
        .map((code) => Number(code.slice(1)))
        .filter((value) => Number.isFinite(value))
        .reduce((max, value) => Math.max(max, value), semester * 100) + 1;
    return { ...payload, code: `M${nextNumber}` };
  }

  private applyFinalMark(payload: ResourceRecord): ResourceRecord {
    if (typeof payload.internalMark !== 'number' || typeof payload.examMark !== 'number') {
      return payload;
    }
    const finalMark = Math.round(0.4 * payload.internalMark + 0.6 * payload.examMark);
    const finalGrade = finalMark < 5 ? 'F' : finalMark === 5 ? 'P' : finalMark <= 7 ? 'G' : 'E';
    return { ...payload, finalMark, finalGrade };
  }

  private applyApproval(payload: ResourceRecord): ResourceRecord {
    const payment =
      payload.paymentId === undefined ? undefined : this.store.find('payments', String(payload.paymentId));
    const authorisation =
      payload.authorisationId === undefined
        ? undefined
        : this.store.find('authorisations', String(payload.authorisationId));
    if (!payment || !authorisation) {
      return payload;
    }
    return {
      ...payload,
      approved: payment.status === 'ACCEPTED' && authorisation.status === 'ACCEPTED',
    };
  }

  private validateReferences(schema: ResourceSchema, payload: ResourceRecord): void {
    for (const field of schema.fields) {
      if (
        field.required &&
        !field.generated &&
        (payload[field.name] === undefined || payload[field.name] === null)
      ) {
        throw new BadRequestException(`${schema.name}.${field.name} is required`);
      }
      if (!field.target || payload[field.name] === undefined || payload[field.name] === null) {
        continue;
      }
      if (field.kind === 'reference') {
        this.store.find(this.routeFor(field.target), String(payload[field.name]));
      }
      if (field.kind === 'referenceArray') {
        const values = payload[field.name];
        if (!Array.isArray(values)) {
          throw new BadRequestException(`${schema.name}.${field.name} must be an array`);
        }
        values.forEach((value) => this.store.find(this.routeFor(field.target!), String(value)));
      }
    }
  }

  private routeFor(resourceName: string): string {
    const schema = COURSEMAN_SCHEMA.find((item) => item.name === resourceName);
    if (!schema) {
      throw new BadRequestException(`Unsupported CourseMan resource target: ${resourceName}`);
    }
    return schema.route;
  }
}

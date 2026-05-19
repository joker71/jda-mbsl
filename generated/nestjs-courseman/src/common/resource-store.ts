import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

export type ResourceRecord = Record<string, unknown> & { id?: number | string };

@Injectable()
export class ResourceStore {
  private readonly data = new Map<string, ResourceRecord[]>();
  private readonly counters = new Map<string, number>();

  list(resource: string): ResourceRecord[] {
    return [...this.bucket(resource)];
  }

  find(resource: string, id: string): ResourceRecord {
    const item = this.bucket(resource).find((record) => String(record.id) === id);
    if (!item) {
      throw new NotFoundException(`${resource} record ${id} was not found`);
    }
    return item;
  }

  create(resource: string, payload: ResourceRecord): ResourceRecord {
    const item = { ...payload };
    if (item.id === undefined || item.id === null || item.id === '') {
      item.id = this.nextId(resource);
    }
    const bucket = this.bucket(resource);
    if (bucket.some((record) => String(record.id) === String(item.id))) {
      throw new BadRequestException(`${resource} record ${item.id} already exists`);
    }
    bucket.push(item);
    return item;
  }

  update(resource: string, id: string, payload: ResourceRecord): ResourceRecord {
    const bucket = this.bucket(resource);
    const index = bucket.findIndex((record) => String(record.id) === id);
    if (index < 0) {
      throw new NotFoundException(`${resource} record ${id} was not found`);
    }
    const next = { ...bucket[index], ...payload, id: bucket[index].id };
    bucket[index] = next;
    return next;
  }

  remove(resource: string, id: string): void {
    const bucket = this.bucket(resource);
    const index = bucket.findIndex((record) => String(record.id) === id);
    if (index < 0) {
      throw new NotFoundException(`${resource} record ${id} was not found`);
    }
    bucket.splice(index, 1);
  }

  private bucket(resource: string): ResourceRecord[] {
    if (!this.data.has(resource)) {
      this.data.set(resource, []);
    }
    return this.data.get(resource)!;
  }

  private nextId(resource: string): number {
    const next = (this.counters.get(resource) ?? 0) + 1;
    this.counters.set(resource, next);
    return next;
  }
}

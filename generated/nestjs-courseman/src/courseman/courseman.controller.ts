import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ResourceRecord } from '../common/resource-store';
import { CoursemanService } from './courseman.service';

@Controller('courseman')
export class CoursemanController {
  constructor(private readonly courseman: CoursemanService) {}

  @Get('schema')
  schema() {
    return this.courseman.schemas();
  }

  @Get(':resource')
  list(@Param('resource') resource: string) {
    return this.courseman.list(resource);
  }

  @Get(':resource/:id')
  find(@Param('resource') resource: string, @Param('id') id: string) {
    return this.courseman.find(resource, id);
  }

  @Post(':resource')
  create(@Param('resource') resource: string, @Body() payload: ResourceRecord) {
    return this.courseman.create(resource, payload);
  }

  @Patch(':resource/:id')
  update(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() payload: ResourceRecord,
  ) {
    return this.courseman.update(resource, id, payload);
  }

  @Delete(':resource/:id')
  remove(@Param('resource') resource: string, @Param('id') id: string) {
    this.courseman.remove(resource, id);
    return { deleted: true };
  }
}

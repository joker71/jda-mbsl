import { Module } from '@nestjs/common';
import { ResourceStore } from '../common/resource-store';
import { CoursemanController } from './courseman.controller';
import { CoursemanService } from './courseman.service';

@Module({
  controllers: [CoursemanController],
  providers: [ResourceStore, CoursemanService],
})
export class CoursemanModule {}

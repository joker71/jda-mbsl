import { Module } from '@nestjs/common';
import { CoursemanModule } from './courseman/courseman.module';

@Module({
  imports: [CoursemanModule],
})
export class AppModule {}

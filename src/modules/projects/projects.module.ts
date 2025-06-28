import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './infrastructure/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity])],
  exports: [TypeOrmModule],
})
export class ProjectsModule {}
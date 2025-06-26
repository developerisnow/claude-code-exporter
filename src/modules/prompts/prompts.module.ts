import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptEntity } from '../../database/entities/prompt.entity';
import { TypeOrmPromptRepository } from './infrastructure/typeorm-prompt.repository';
import { PromptMapper } from './infrastructure/prompt.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([PromptEntity])],
  providers: [
    PromptMapper,
    {
      provide: 'IPromptRepository',
      useClass: TypeOrmPromptRepository,
    },
  ],
  exports: ['IPromptRepository'],
})
export class PromptsModule {}

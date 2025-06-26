import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicEntity } from '../../database/entities/topic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TopicEntity])],
  providers: [
    // Topic repository will be added when needed
  ],
  exports: [],
})
export class TopicsModule {}

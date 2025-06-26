import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from '../../database/entities/session.entity';
import { TypeOrmSessionRepository } from './infrastructure/typeorm-session.repository';
import { SessionMapper } from './infrastructure/session.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity])],
  providers: [
    SessionMapper,
    {
      provide: 'ISessionRepository',
      useClass: TypeOrmSessionRepository,
    },
  ],
  exports: ['ISessionRepository'],
})
export class SessionsModule {}

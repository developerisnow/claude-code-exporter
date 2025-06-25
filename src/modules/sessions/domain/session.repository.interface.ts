import { SessionId } from '../../common/domain/value-objects';
import { Session } from './session.entity';

export interface ISessionRepository {
  save(session: Session): Promise<void>;
  findById(id: SessionId): Promise<Session | null>;
  findByProjectPath(path: string): Promise<Session[]>;
  findByDateRange(start: Date, end: Date): Promise<Session[]>;
  delete(id: SessionId): Promise<void>;
  exists(id: SessionId): Promise<boolean>;
  count(): Promise<number>;
}
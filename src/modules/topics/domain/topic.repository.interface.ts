import { TopicId } from '../../common/domain/value-objects';
import { Topic } from './topic.entity';

export interface ITopicRepository {
  save(topic: Topic): Promise<void>;
  findById(id: TopicId): Promise<Topic | null>;
  findByName(name: string): Promise<Topic | null>;
  findAll(): Promise<Topic[]>;
  delete(id: TopicId): Promise<void>;
  exists(id: TopicId): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
}
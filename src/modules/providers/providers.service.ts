import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderEntity } from './entities/provider.entity';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(ProviderEntity)
    private providerRepo: Repository<ProviderEntity>,
  ) {}

  async getProvider(name: string): Promise<ProviderEntity> {
    const provider = await this.providerRepo.findOne({ 
      where: { name: name as any } 
    });
    if (!provider) {
      throw new NotFoundException(`Provider ${name} not found`);
    }
    return provider;
  }

  async getAllProviders(): Promise<ProviderEntity[]> {
    return this.providerRepo.find({ order: { name: 'ASC' } });
  }

  async updateProviderConfig(name: string, config: Record<string, any>): Promise<ProviderEntity> {
    const provider = await this.getProvider(name);
    provider.config = { ...provider.config, ...config };
    return this.providerRepo.save(provider);
  }
}
import { BaseRepository } from './base-repository';
import { CourtSchema, CreateCourtSchema } from '../validation/schemas';
import type { Court, CreateCourt } from '../validation/schemas';

export class CourtRepository extends BaseRepository<Court, CreateCourt> {
  constructor(initialData: Court[] = []) {
    super(CourtSchema, CreateCourtSchema, initialData);
  }

  protected getEntityPrefix(): string {
    return 'court';
  }

  findByLocation(location: string): Court[] {
    return this.findMany(court => court.location === location);
  }

  findIndoorCourts(): Court[] {
    return this.findMany(court => court.indoor);
  }

  findOutdoorCourts(): Court[] {
    return this.findMany(court => !court.indoor);
  }

  findByName(name: string): Court | undefined {
    return this.findOne(court => court.name === name);
  }

  isNameUnique(name: string, excludeId?: string): boolean {
    return !this.exists(court => court.name === name && court.id !== excludeId);
  }
}

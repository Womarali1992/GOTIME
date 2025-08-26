import { z } from 'zod';

// Enhanced error classes for better error handling
export class RepositoryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export class NotFoundError extends RepositoryError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends RepositoryError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Repository<T extends BaseEntity, TCreate = Omit<T, 'id' | 'createdAt'>, TUpdate = Partial<T> & { id: string }> {
  findAll(): T[];
  findById(id: string): T | undefined;
  findMany(predicate: (item: T) => boolean): T[];
  findOne(predicate: (item: T) => boolean): T | undefined;
  create(data: TCreate): T;
  createMany(data: TCreate[]): T[];
  update(id: string, data: Partial<T>): T;
  updateMany(updates: Array<{ id: string; data: Partial<T> }>): T[];
  delete(id: string): boolean;
  deleteMany(ids: string[]): number;
  exists(id: string): boolean;
  count(predicate?: (item: T) => boolean): number;
  clear(): void;
}

export interface IndexableEntity extends BaseEntity {
  [key: string]: unknown;
}

// Index for fast lookups
export class RepositoryIndex<T extends BaseEntity> {
  private indexes = new Map<string, Map<string, T[]>>();

  constructor(private getIndexKey: (item: T, field: string) => string) {}

  addItem(item: T, fields: string[]): void {
    fields.forEach(field => {
      const key = this.getIndexKey(item, field);
      if (!this.indexes.has(field)) {
        this.indexes.set(field, new Map());
      }
      const fieldIndex = this.indexes.get(field)!;

      if (!fieldIndex.has(key)) {
        fieldIndex.set(key, []);
      }
      fieldIndex.get(key)!.push(item);
    });
  }

  removeItem(item: T, fields: string[]): void {
    fields.forEach(field => {
      const key = this.getIndexKey(item, field);
      const fieldIndex = this.indexes.get(field);
      if (fieldIndex) {
        const items = fieldIndex.get(key);
        if (items) {
          const index = items.indexOf(item);
          if (index > -1) {
            items.splice(index, 1);
            if (items.length === 0) {
              fieldIndex.delete(key);
            }
          }
        }
      }
    });
  }

  findByField(field: string, value: string): T[] {
    const fieldIndex = this.indexes.get(field);
    return fieldIndex?.get(value) || [];
  }

  clear(): void {
    this.indexes.clear();
  }

  rebuildIndex(items: T[], fields: string[]): void {
    this.clear();
    items.forEach(item => this.addItem(item, fields));
  }
}

// Enhanced base repository with performance optimizations
export abstract class BaseRepository<T extends BaseEntity, TCreate = Omit<T, 'id' | 'createdAt'>, TUpdate = Partial<T> & { id: string }> implements Repository<T, TCreate, TUpdate> {
  protected data: T[] = [];
  protected index: RepositoryIndex<T>;
  protected cache = new Map<string, T>();
  private readonly cacheTimeout = 300000; // 5 minutes
  private cacheTimestamps = new Map<string, number>();

  constructor(
    protected schema: z.ZodSchema<T>,
    protected createSchema: z.ZodSchema<TCreate>,
    initialData: T[] = []
  ) {
    this.data = [...initialData];
    this.index = new RepositoryIndex<T>((item, field) => {
      const value = (item as Record<string, unknown>)[field];
      return value?.toString() || '';
    });
    this.buildIndexes();
  }

  // Index configuration - override in subclasses
  protected getIndexedFields(): string[] {
    return ['id'];
  }

  private buildIndexes(): void {
    const fields = this.getIndexedFields();
    this.data.forEach(item => {
      this.index.addItem(item, fields);
    });
  }

  findAll(): T[] {
    return [...this.data];
  }

  findById(id: string): T | undefined {
    // Check cache first
    const cached = this.getFromCache(id);
    if (cached) return cached;

    // Use index for fast lookup
    const results = this.index.findByField('id', id);
    const result = results[0];

    if (result) {
      this.setCache(id, result);
    }

    return result;
  }

  findMany(predicate: (item: T) => boolean): T[] {
    return this.data.filter(predicate);
  }

  findOne(predicate: (item: T) => boolean): T | undefined {
    return this.data.find(predicate);
  }

  create(data: TCreate): T {
    try {
      console.log('BaseRepository.create called with data:', data);
      console.log('Using createSchema:', this.createSchema);
      
      const validatedData = this.createSchema.parse(data);
      console.log('Data validated successfully:', validatedData);
      
      const newItem: T = {
        ...validatedData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
      } as T;
      console.log('New item created:', newItem);

      const validatedItem = this.schema.parse(newItem);
      console.log('Item validated against full schema:', validatedItem);

      // Add to data array
      this.data.push(validatedItem);

      // Update indexes
      const fields = this.getIndexedFields();
      this.index.addItem(validatedItem, fields);

      // Add to cache
      this.setCache(validatedItem.id, validatedItem);

      console.log('Item successfully created and stored');
      return validatedItem;
    } catch (error) {
      console.error('Error in BaseRepository.create:', error);
      if (error instanceof z.ZodError) {
        console.error('Zod validation error details:', error.issues);
        throw new ValidationError(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  createMany(data: TCreate[]): T[] {
    const created: T[] = [];
    const errors: Error[] = [];

    data.forEach((item, index) => {
      try {
        const createdItem = this.create(item);
        created.push(createdItem);
      } catch (error) {
        errors.push(new Error(`Failed to create item at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });

    if (errors.length > 0) {
      // For now, we'll still create successful items and log errors
      console.warn('Some items failed to create:', errors);
    }

    return created;
  }

  update(id: string, data: Partial<T>): T {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) {
      throw new NotFoundError('Entity', id);
    }

    const existingItem = this.data[index];
    const updatedItem = {
      ...existingItem,
      ...data,
      updatedAt: new Date().toISOString()
    };

    try {
      const validatedItem = this.schema.parse(updatedItem);

      // Remove old item from indexes
      const fields = this.getIndexedFields();
      this.index.removeItem(existingItem, fields);

      // Update data array
      this.data[index] = validatedItem;

      // Add new item to indexes
      this.index.addItem(validatedItem, fields);

      // Update cache
      this.setCache(id, validatedItem);

      return validatedItem;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  updateMany(updates: Array<{ id: string; data: Partial<T> }>): T[] {
    const updated: T[] = [];
    const errors: Error[] = [];

    updates.forEach((update, index) => {
      try {
        const updatedItem = this.update(update.id, update.data);
        updated.push(updatedItem);
      } catch (error) {
        errors.push(new Error(`Failed to update item at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });

    if (errors.length > 0) {
      console.warn('Some items failed to update:', errors);
    }

    return updated;
  }

  delete(id: string): boolean {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;

    const item = this.data[index];

    // Remove from indexes
    const fields = this.getIndexedFields();
    this.index.removeItem(item, fields);

    // Remove from data array
    this.data.splice(index, 1);

    // Remove from cache
    this.cache.delete(id);

    return true;
  }

  deleteMany(ids: string[]): number {
    let deletedCount = 0;

    ids.forEach(id => {
      if (this.delete(id)) {
        deletedCount++;
      }
    });

    return deletedCount;
  }

  exists(id: string): boolean {
    return this.findById(id) !== undefined;
  }

  count(predicate?: (item: T) => boolean): number {
    return predicate ? this.data.filter(predicate).length : this.data.length;
  }

  clear(): void {
    this.data = [];
    this.index.clear();
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  // Enhanced query methods
  findByField(field: string, value: unknown): T[] {
    if (this.getIndexedFields().includes(field)) {
      return this.index.findByField(field, String(value));
    }
    // Fallback to linear search
    return this.data.filter(item => (item as Record<string, unknown>)[field] === value);
  }

  findByMultipleFields(conditions: Record<string, unknown>): T[] {
    return this.data.filter(item => {
      return Object.entries(conditions).every(([field, value]) => {
        return (item as Record<string, unknown>)[field] === value;
      });
    });
  }

  // Pagination support
  findWithPagination(
    predicate?: (item: T) => boolean,
    page: number = 1,
    limit: number = 10,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
    let items = predicate ? this.data.filter(predicate) : [...this.data];

    // Sort if requested
    if (sortBy) {
      items.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortBy];
        const bVal = (b as Record<string, unknown>)[sortBy];

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      items: items.slice(startIndex, endIndex),
      total,
      page,
      limit,
      totalPages
    };
  }

  // Bulk operations with better performance
  bulkCreate(data: TCreate[]): T[] {
    return this.createMany(data);
  }

  bulkUpdate(updates: Array<{ id: string; data: Partial<T> }>): T[] {
    return this.updateMany(updates);
  }

  bulkDelete(ids: string[]): number {
    return this.deleteMany(ids);
  }

  // Cache management
  private getFromCache(id: string): T | undefined {
    const cached = this.cache.get(id);
    const timestamp = this.cacheTimestamps.get(id);

    if (cached && timestamp && Date.now() - timestamp < this.cacheTimeout) {
      return cached;
    }

    // Remove stale cache entry
    if (cached) {
      this.cache.delete(id);
      this.cacheTimestamps.delete(id);
    }

    return undefined;
  }

  private setCache(id: string, item: T): void {
    this.cache.set(id, item);
    this.cacheTimestamps.set(id, Date.now());

    // Clean up old cache entries periodically
    if (this.cache.size > 1000) {
      this.cleanCache();
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.cacheTimestamps.forEach((timestamp, id) => {
      if (now - timestamp > this.cacheTimeout) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => {
      this.cache.delete(id);
      this.cacheTimestamps.delete(id);
    });
  }

  protected generateId(): string {
    return `${this.getEntityPrefix()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected abstract getEntityPrefix(): string;

  // Validation helper
  validate(data: unknown, schema: z.ZodSchema): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  }
}

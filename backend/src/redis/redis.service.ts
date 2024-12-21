import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * RedisService is a service class that provides methods to interact with a Redis database.
 * It allows setting, getting, and deleting key-value pairs in the Redis store.
 *
 * @class
 */
@Injectable()
export class RedisService {
  private readonly client: Redis;

  /**
   * Creates an instance of RedisService.
   *
   * @constructor
   * @param {ConfigService} configService - The configuration service to retrieve Redis connection details.
   * @param {Logger} logger - The logger service to log errors and information.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.client = new Redis(this.configService.get<string>('REDIS_URL'));

    this.client.on('error', (e) => {
      this.logger.error(
        'Failed to initialise redis',
        e instanceof Error ? e.stack : undefined,
        RedisService.name,
      );

      throw new InternalServerErrorException();
    });
  }

  /**
   * Sets a key-value pair in the Redis store.
   *
   * @param {string} key - The key to set.
   * @param {any} value - The value to set.
   * @param {number} [ttl] - Optional time-to-live in seconds for the key.
   * @returns {Promise<void>} A promise that resolves when the key-value pair is set.
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (ttl !== undefined) {
      await this.client.set(key, serializedValue, 'EX', ttl);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  /**
   * Gets a value from the Redis store by key.
   *
   * @template T
   * @param {string} key - The key to retrieve.
   * @returns {Promise<T | null>} A promise that resolves to the value associated with the key, or null if the key does not exist.
   */
  async get<T>(key: string): Promise<T | null> {
    const serializedValue = await this.client.get(key);

    if (serializedValue === null) {
      return null;
    }

    return JSON.parse(serializedValue) as T;
  }

  /**
   * Deletes a key from the Redis store.
   *
   * @param {string} key - The key to delete.
   * @returns {Promise<void>} A promise that resolves when the key is deleted.
   */
  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}

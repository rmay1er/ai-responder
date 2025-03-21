/**
 * Interface representing a Cache with basic operations.
 * This interface defines the contract for cache implementations.
 */
export interface Cache {
  /**
   * Retrieves a value from the cache by its key.
   * @param key - The key associated with the value to retrieve.
   * @returns A promise that resolves to the value if found, or `null` if the key does not exist or has expired.
   */
  get(key: string): Promise<string | null>;

  /**
   * Stores a value in the cache with a specified key and expiration time.
   * @param key - The key to associate with the value.
   * @param value - The value to store in the cache.
   * @param mode - The mode of the cache operation (currently unused).
   * @param duration - The duration in seconds for which the value should be cached.
   * @returns A promise that resolves when the value is successfully stored.
   */
  set(
    key: string,
    value: string,
    mode: string,
    duration: number,
  ): Promise<void>;

  /**
   * Clears all entries from the cache.
   * @returns A promise that resolves when the cache is cleared.
   */
  flushall(): Promise<void>;

  /**
   * Closes the cache connection or releases resources.
   * @returns A promise that resolves when the cache is successfully closed.
   */
  quit(): Promise<void>;

  /**
   * Registers an event listener for cache events.
   * @param event - The event name to listen for.
   * @param callback - A callback function that is invoked when the event occurs.
   */
  on(event: string, callback: (error?: any) => void): void;
}

/**
 * In-memory implementation of the Cache interface.
 * This class stores cached data in a Map and supports basic cache operations.
 */
export class InMemoryCache implements Cache {
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();

  /**
   * Retrieves a value from the in-memory cache by its key.
   * @param key - The key associated with the value to retrieve.
   * @returns A promise that resolves to the value if found and not expired, or `null` otherwise.
   */
  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Stores a value in the in-memory cache with a specified key and expiration time.
   * @param key - The key to associate with the value.
   * @param value - The value to store in the cache.
   * @param mode - The mode of the cache operation (currently unused).
   * @param duration - The duration in seconds for which the value should be cached.
   * @returns A promise that resolves when the value is successfully stored.
   */
  async set(
    key: string,
    value: string,
    mode: string,
    duration: number,
  ): Promise<void> {
    const expiresAt = Date.now() + duration * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Clears all entries from the in-memory cache.
   * @returns A promise that resolves when the cache is cleared.
   */
  async flushall(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Closes the in-memory cache. This is a no-op for in-memory caches.
   * @returns A promise that resolves immediately.
   */
  async quit(): Promise<void> {
    // No action needed for in-memory cache
  }

  /**
   * Registers an event listener for cache events.
   * @param event - The event name to listen for.
   * @param callback - A callback function that is invoked when the event occurs.
   */
  on(event: string, callback: (error?: any) => void): void {}
}

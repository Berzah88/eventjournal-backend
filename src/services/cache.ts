import NodeCache from 'node-cache';

export class CacheManager {
  private cache: NodeCache;
  
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 14400, // 4 saat default
      checkperiod: 600, // Her 10 dakikada bir temizle
    });
  }
  
  /**
   * Cache'den al veya fetch et
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Cache kontrol
    const cached = this.cache.get<T>(key);
    if (cached !== undefined) {
      console.log(`✅ Cache HIT: ${key}`);
      return cached;
    }
    
    // Cache MISS - fetch et
    console.log(`❌ Cache MISS: ${key}`);
    const data = await fetcher();
    
    // Cache'e kaydet
    this.cache.set(key, data, ttl || 14400);
    
    return data;
  }
  
  /**
   * Cache key oluştur
   */
  generateKey(...parts: string[]): string {
    return parts.join(':');
  }
  
  /**
   * Cache'i temizle
   */
  clear(): void {
    this.cache.flushAll();
    console.log('🗑️ Cache cleared');
  }
  
  /**
   * İstatistikler
   */
  getStats() {
    return this.cache.getStats();
  }
}

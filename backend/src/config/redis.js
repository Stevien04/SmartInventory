import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;
const memoryCache = new Map();

export function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (!redisUrl && !redisHost) {
    console.warn('⚠️ [Redis] Variable REDIS_URL no encontrada. Usando motor de caché en memoria de respaldo.');
    return null;
  }

  try {
    redisClient = redisUrl
      ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 })
      : new Redis({
          host: redisHost || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          lazyConnect: true,
          maxRetriesPerRequest: 1
        });

    const client = redisClient;

    // Sin este manejador, ioredis escribe "Unhandled error event" en cada reintento.
    client.on('error', () => {});

    client.connect()
      .then(() => console.log('✅ [Redis] Conectado exitosamente a Redis Cloud / In-Memory Store'))
      .catch((err) => {
        console.warn(`⚠️ [Redis] No se pudo conectar a Redis (${err.message}). Usando caché en memoria.`);
        // Cortar los reintentos: si las credenciales son incorrectas, no se van a arreglar solas.
        client.disconnect();
        redisClient = null;
      });

    return redisClient;
  } catch (err) {
    console.warn('⚠️ [Redis] Error al inicializar cliente Redis:', err.message);
    redisClient = null;
    return null;
  }
}

/**
 * Helper para obtener valor de caché (Redis o Memoria)
 */
export async function getCache(key) {
  if (redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  return memoryCache.has(key) ? memoryCache.get(key) : null;
}

/**
 * Helper para guardar valor en caché con tiempo de expiración (TTL en segundos)
 */
export async function setCache(key, value, ttlSeconds = 60) {
  const serialized = JSON.stringify(value);
  if (redisClient) {
    try {
      await redisClient.set(key, serialized, 'EX', ttlSeconds);
      return;
    } catch {
      // Ignorar error y usar memoria
    }
  }
  memoryCache.set(key, value);
  setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
}

/**
 * Invalidar claves por prefijo o clave exacta
 */
export async function delCache(key) {
  if (redisClient) {
    try {
      await redisClient.del(key);
    } catch {
      // Ignorar error
    }
  }
  memoryCache.delete(key);
}

export function getRedisClient() {
  return redisClient;
}

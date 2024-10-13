const caches = new Map<string, { timeout?: number; value: any }>();
const cacheLockPromises = new Map<string, Promise<any>>();

// use to load memory to cache, keep for cretin period
// cache data size should keep small, because all those cache stored in memory
export async function memoryCache<T = any>(
  cacheName: string,
  getter: () => Promise<T>,
  { refreshTime, lock = false }: { refreshTime?: number; lock?: boolean }
): Promise<T> {
  let cachedValue = await getMemoryCache(cacheName);

  // when refresh time set, check should refresh cache
  const shouldRefresh = refreshTime && cachedValue?.timeout && cachedValue?.timeout < Date.now();

  if (!cachedValue || shouldRefresh) {
    const getterPromise = getter()
      .then(value => {
        cachedValue = {
          value,
          timeout: refreshTime && Date.now() + refreshTime * 1000
        };
        caches.set(cacheName, cachedValue!);
      })
      .catch(err => {
        console.error("memory cache refresh error:: ", err);
        // if there is no previous cache, throw error directly
        // otherwise continue, will return the old cache value
        if (!cachedValue) {
          throw err;
        } else {
          // on error refresh after 5mins
          cachedValue.timeout = Date.now() + 3000000;
          caches.set(cacheName, cachedValue);
        }
      })
      .finally(() => {
        // remove promise lock after cache been set
        if (cacheLockPromises.has(cacheName)) {
          cacheLockPromises.delete(cacheName);
        }
      });

    if (lock) {
      // set lock promise, remove when promise completes
      cacheLockPromises.set(cacheName, getterPromise);
    }
    // wait until promise completed
    await getterPromise;
  }

  return cachedValue!.value;
}

export const deleteMemoryCache = (cacheName: string) => {
  caches.delete(cacheName);
  cacheLockPromises.delete(cacheName);
};

export const getMemoryCache = async (cacheName: string) => {
  const cachedPromise = cacheLockPromises.get(cacheName);

  if (cachedPromise) {
    // lock second request, prevent cache miss
    await cachedPromise;
  }

  return caches.get(cacheName);
};

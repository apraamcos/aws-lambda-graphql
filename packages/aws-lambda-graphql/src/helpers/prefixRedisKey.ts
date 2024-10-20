export function prefixRedisKey(key: string): string {
  return `WebSocket:${key}`;
}

/**
 * GPS module integration reference.
 *
 * This project mounts websocket handlers from `modules/websocket` and exposes
 * GPS HTTP read APIs from `modules/gps/gps.routes.ts`.
 *
 * `index.ts` should:
 * 1. call `startGpsBatchWriter()`
 * 2. mount `.use(gpsRoutes)` under `/api/v1`
 * 3. flush pending pings during shutdown via `forceFlush()`
 */
export {};

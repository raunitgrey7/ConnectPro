/* ------------------------------------------------------------------ */
/* Health check API.                                                   */
/* ------------------------------------------------------------------ */

import { apiClient } from "./client";
import type { HealthResponse } from "@/lib/types/api";

/** GET /health — check backend health + DB connectivity. */
export function checkHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>("/health");
}

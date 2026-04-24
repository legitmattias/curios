// Shared helpers for HTTP calls to the Dossier REST API. The MCP client
// (dossier-client.ts) covers tool-use; this is for direct data reads.

export function getDossierApiUrl(): string {
  const url = process.env.DOSSIER_API_URL;
  if (!url) throw new Error("DOSSIER_API_URL is required");
  return url;
}

export function getDossierApiKey(): string {
  const key = process.env.DOSSIER_API_KEY;
  if (!key) throw new Error("DOSSIER_API_KEY is required");
  return key;
}

// Dossier GET with Bearer auth. Wraps network errors so callers (and the
// admin panel via sync_state.lastError) see "Dossier /path unreachable:
// <cause>" instead of the bare "fetch failed".
export async function dossierGet(
  path: string,
  query?: string,
): Promise<Response> {
  const url = `${getDossierApiUrl()}${path}${query ? `?${query}` : ""}`;
  try {
    return await fetch(url, {
      headers: { Authorization: `Bearer ${getDossierApiKey()}` },
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const cause =
      err instanceof Error && err.cause instanceof Error
        ? ` (${err.cause.message})`
        : "";
    throw new Error(`Dossier ${path} unreachable: ${raw}${cause}`);
  }
}

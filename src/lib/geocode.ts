// Free, no-key geocoding via Open-Meteo. Used by the admin "Find coordinates"
// assist (client-side); never on the public request path.

export async function geocodeCity(
  name: string,
): Promise<{ lng: number; lat: number } | null> {
  const query = name.split(",")[0].trim();
  if (!query) return null;
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: { longitude: number; latitude: number }[];
    };
    const hit = json.results?.[0];
    return hit ? { lng: hit.longitude, lat: hit.latitude } : null;
  } catch {
    return null;
  }
}

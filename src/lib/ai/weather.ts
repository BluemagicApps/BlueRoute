export type Weather = {
  tempC: number;
  precipMm: number;
  windKph: number;
  conditions: string;
};

// Compact WMO weather-code → label map (Open-Meteo `weather_code`).
const WMO: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

/** Pure: normalize an Open-Meteo forecast response. Returns null if shape is invalid. */
export function normalizeWeather(raw: unknown): Weather | null {
  if (!raw || typeof raw !== "object") return null;
  const cur = (raw as { current?: Record<string, unknown> }).current;
  if (!cur || typeof cur !== "object") return null;
  const tempC = Number(cur.temperature_2m);
  const precipMm = Number(cur.precipitation);
  const windKph = Number(cur.wind_speed_10m);
  const code = Number(cur.weather_code);
  if (![tempC, precipMm, windKph, code].every(Number.isFinite)) return null;
  return { tempC, precipMm, windKph, conditions: WMO[code] ?? "Unsettled" };
}

/** Best-effort IO wrapper. Never throws — returns null on any failure. */
export async function fetchWeather(lat: number, lng: number): Promise<Weather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&wind_speed_unit=kmh`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return normalizeWeather(await res.json());
  } catch {
    return null;
  }
}

import { describe, expect, it } from "vitest";
import { normalizeWeather } from "@/lib/ai/weather";

const sample = {
  current: { temperature_2m: 14.2, precipitation: 0.3, wind_speed_10m: 22.5, weather_code: 61 },
};

describe("normalizeWeather", () => {
  it("maps an Open-Meteo current payload", () => {
    expect(normalizeWeather(sample)).toEqual({
      tempC: 14.2,
      precipMm: 0.3,
      windKph: 22.5,
      conditions: "Light rain",
    });
  });
  it("labels a clear-sky code", () => {
    expect(normalizeWeather({ current: { temperature_2m: 20, precipitation: 0, wind_speed_10m: 5, weather_code: 0 } })?.conditions).toBe("Clear sky");
  });
  it("falls back for an unknown code", () => {
    expect(normalizeWeather({ current: { temperature_2m: 1, precipitation: 0, wind_speed_10m: 1, weather_code: 999 } })?.conditions).toBe("Unsettled");
  });
  it("returns null on a malformed payload", () => {
    expect(normalizeWeather({})).toBeNull();
    expect(normalizeWeather(null)).toBeNull();
  });
});

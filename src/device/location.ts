import { id, now, type LocationPoint } from "../domain/model";
import { repo } from "../data/repository";

export function getPosition(): Promise<GeolocationPosition> {
  if (!navigator.geolocation)
    return Promise.reject(
      new Error("To urządzenie nie udostępnia GPS. Wpisz miejsce ręcznie."),
    );
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        const messages: Record<number, string> = {
          1: "Brak zgody na lokalizację. Możesz zmienić ją w ustawieniach Safari albo wpisać adres ręcznie.",
          2: "Nie udało się ustalić pozycji. Spróbuj ponownie lub wpisz adres.",
          3: "Pobranie pozycji trwało zbyt długo. Spróbuj ponownie lub pomiń.",
        };
        reject(
          new Error(
            messages[error.code] ??
              "GPS jest niedostępny. Wpisz adres ręcznie.",
          ),
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    ),
  );
}

let previousLookup = 0;
const cache = new Map<string, string>();
// Adapter można wymienić bez zmiany domeny. Wyłącznie ręczne zapytania;
// brak autocomplete sieciowego, śledzenia i wysyłania treści zdarzeń.
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string> {
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
  if (cache.has(key)) return cache.get(key)!;
  if (!navigator.onLine) throw new Error("Brak internetu");
  const delay = Math.max(0, 1100 - (Date.now() - previousLookup));
  previousLookup = Date.now() + delay;
  if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lon),
      "accept-language": "pl",
      zoom: "18",
      layer: "address",
    });
    const endpoint =
      import.meta.env.VITE_GEOCODER_URL ||
      "https://nominatim.openstreetmap.org/reverse";
    const response = await fetch(`${endpoint}?${params}`, {
      signal: controller.signal,
      credentials: "omit",
    });
    if (!response.ok) throw new Error("Adres niedostępny");
    const data = await response.json();
    const a = data.address;
    if (!a) throw new Error("Adres niedostępny");
    const address = [
      [a.road || a.pedestrian || a.footway, a.house_number]
        .filter(Boolean)
        .join(" "),
      a.city || a.town || a.village,
      a.suburb,
    ]
      .filter(Boolean)
      .join(", ");
    if (!address) throw new Error("Adres niedostępny");
    cache.set(key, address);
    return address;
  } finally {
    clearTimeout(timer);
  }
}

export async function capturePosition(
  eventId: string,
  role: string,
  personRef?: string,
): Promise<LocationPoint> {
  const position = await getPosition();
  const point: LocationPoint = {
    id: id(),
    eventId,
    timestamp: now(),
    role,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    address: "",
    geocoded: false,
  };
  await repo.addLocation(eventId, point, personRef);
  return point;
}
export async function resolveAddress(eventId: string, point: LocationPoint) {
  const address = await reverseGeocode(point.latitude, point.longitude);
  await repo.mutate(eventId, (event) => {
    const current = event.locations.find((p) => p.id === point.id);
    // Ręczna korekta ma pierwszeństwo przed późną odpowiedzią sieci.
    if (!current || current.address) return;
    current.address = address;
    current.geocoded = true;
    const fact = event.facts.find((f) => f.locationPointId === point.id);
    if (fact) fact.payload.address = address;
  });
  return address;
}
export function mapsUrl(address: string) {
  return `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
}

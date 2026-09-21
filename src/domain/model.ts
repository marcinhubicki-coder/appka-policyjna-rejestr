export type EventStatus = "in_progress" | "needs_completion" | "completed";
export type SourceType =
  "observation" | "statement" | "action" | "doctor" | "facility";
export type Payload = Record<string, string | string[]>;
export interface Fact {
  id: string;
  eventId: string;
  type: string;
  timestamp: string;
  updatedAt?: string;
  personRef?: string;
  locationPointId?: string;
  sourceType?: SourceType;
  payload: Payload;
  includeInNote?: boolean;
  includeInBrief?: boolean;
}
export interface Person {
  ref: string;
  createdAt: string;
}
export interface LocationPoint {
  id: string;
  eventId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  role: string;
  geocoded: boolean;
}
export interface EventRecord {
  id: string;
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
  status: EventStatus;
  name: string;
  tags: string;
  place: string;
  persons: Person[];
  facts: Fact[];
  locations: LocationPoint[];
  demo?: boolean;
}
export const id = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export const statuses: Record<EventStatus, string> = {
  in_progress: "W toku",
  needs_completion: "Do uzupełnienia",
  completed: "Zakończone",
};
export function makeFact(
  eventId: string,
  type: string,
  payload: Payload = {},
  personRef?: string,
): Fact {
  return { id: id(), eventId, type, payload, personRef, timestamp: now() };
}
export function makeEvent(): EventRecord {
  const eventId = id();
  const time = now();
  return {
    id: eventId,
    schemaVersion: 1,
    createdAt: time,
    updatedAt: time,
    status: "in_progress",
    name: "",
    tags: "",
    place: "",
    persons: [],
    locations: [],
    facts: [{ ...makeFact(eventId, "start"), timestamp: time }],
  };
}
export function nextPersonRef(persons: Person[]) {
  let n = persons.length;
  let ref = "";
  do {
    ref = String.fromCharCode(65 + (n % 26)) + ref;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return ref;
}
export function chronological(event: EventRecord) {
  return [...event.facts].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
}
export function answer(
  event: EventRecord,
  personRef: string,
  field: string,
): string | string[] {
  return (
    event.facts.find(
      (f) =>
        f.type === "person_answer" &&
        f.personRef === personRef &&
        f.payload.field === field,
    )?.payload.value ?? ""
  );
}
export const textValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value.join(", ") : (value ?? "");
export const timeLabel = (time: string) =>
  new Date(time).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
export const dateLabel = (time: string) =>
  new Date(time).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
export function countLabel(count: number, forms: [string, string, string]) {
  const form = new Intl.PluralRules("pl").select(count);
  return `${count} ${forms[form === "one" ? 0 : form === "few" ? 1 : 2]}`;
}
export const toLocalInput = (time: string) => {
  const date = new Date(time);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

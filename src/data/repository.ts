import Dexie, { type Table } from "dexie";
import {
  makeEvent,
  makeFact,
  nextPersonRef,
  now,
  type EventRecord,
  type EventStatus,
  type Fact,
  type LocationPoint,
} from "../domain/model";

class RegisterDB extends Dexie {
  events!: Table<EventRecord, string>;
  constructor() {
    super("policyjna-rejestr");
    this.version(1).stores({ events: "id, status, updatedAt, createdAt" });
  }
}
export const db = new RegisterDB();
let pending = 0;
let storageError = "";
const listeners = new Set<() => void>();
let snapshot = { pending, error: storageError };
function publish() {
  snapshot = { pending, error: storageError };
  listeners.forEach((fn) => fn());
}
export const saveState = {
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  getSnapshot: () => snapshot,
};
async function tracked<T>(fn: () => Promise<T>): Promise<T> {
  pending++;
  publish();
  try {
    const result = await fn();
    return result;
  } catch (error) {
    storageError =
      "Nie udało się zapisać zmiany na urządzeniu. Sprawdź wolne miejsce i ponów zmianę.";
    throw error;
  } finally {
    pending--;
    publish();
  }
}
export function clearStorageError() {
  storageError = "";
  publish();
}
export const repo = {
  create: () =>
    tracked(async () => {
      const event = makeEvent();
      await db.events.add(event);
      return event.id;
    }),
  mutate: (eventId: string, change: (event: EventRecord) => void) =>
    tracked(() =>
      db.transaction("rw", db.events, async () => {
        const event = await db.events.get(eventId);
        if (!event) throw new Error("Nie odnaleziono zdarzenia");
        change(event);
        event.updatedAt = now();
        await db.events.put(event);
      }),
    ),
  addPerson: async (eventId: string) => {
    let ref = "";
    await repo.mutate(eventId, (event) => {
      ref = nextPersonRef(event.persons);
      event.persons.push({ ref, createdAt: now() });
      event.facts.push(makeFact(eventId, "person_added", {}, ref));
    });
    return ref;
  },
  answer: (
    eventId: string,
    ref: string,
    field: string,
    value: string | string[],
  ) =>
    repo.mutate(eventId, (event) => {
      let fact = event.facts.find(
        (f) =>
          f.type === "person_answer" &&
          f.personRef === ref &&
          f.payload.field === field,
      );
      if (!fact) {
        fact = makeFact(eventId, "person_answer", { field }, ref);
        event.facts.push(fact);
      }
      fact.payload.value = value;
      fact.updatedAt = now();
      fact.sourceType = "observation";
    }),
  addFact: async (
    eventId: string,
    type: string,
    personRef?: string,
    payload: Fact["payload"] = {},
  ) => {
    const fact = makeFact(eventId, type, payload, personRef);
    await repo.mutate(eventId, (event) => {
      event.facts.push(fact);
    });
    return fact.id;
  },
  patchFact: (eventId: string, factId: string, patch: Partial<Fact>) =>
    repo.mutate(eventId, (event) => {
      const fact = event.facts.find((f) => f.id === factId);
      if (!fact) throw new Error("Nie odnaleziono wpisu");
      Object.assign(fact, patch, {
        payload: { ...fact.payload, ...patch.payload },
        updatedAt: now(),
      });
      if (fact.type === "start") event.createdAt = fact.timestamp;
      if (fact.type === "place")
        event.place = String(fact.payload.address ?? "");
      if (fact.type === "gps" && fact.locationPointId) {
        const point = event.locations.find(
          (p) => p.id === fact.locationPointId,
        );
        if (point) {
          point.address = String(fact.payload.address ?? "");
          point.timestamp = fact.timestamp;
          point.role = String(fact.payload.role ?? point.role);
        }
      }
    }),
  place: (eventId: string, address: string) =>
    repo.mutate(eventId, (event) => {
      event.place = address;
      let fact = event.facts.find((f) => f.type === "place");
      if (!fact) {
        fact = makeFact(eventId, "place");
        event.facts.push(fact);
      }
      fact.payload.address = address;
    }),
  addLocation: (eventId: string, point: LocationPoint, personRef?: string) =>
    repo.mutate(eventId, (event) => {
      event.locations.push(point);
      event.facts.push({
        ...makeFact(
          eventId,
          "gps",
          { address: point.address, role: point.role },
          personRef,
        ),
        timestamp: point.timestamp,
        locationPointId: point.id,
      });
    }),
  status: (eventId: string, status: EventStatus) =>
    repo.mutate(eventId, (event) => {
      if (event.status === status) return;
      event.status = status;
      event.facts.push(makeFact(eventId, "status", { status }));
    }),
};

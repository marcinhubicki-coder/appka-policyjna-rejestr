import { db } from "../data/repository";
import { makeEvent, makeFact, type Fact } from "./model";
export async function createDemo() {
  const event = makeEvent();
  const base = new Date();
  base.setHours(21, 37, 0, 0);
  base.setDate(base.getDate() - 1);
  const at = (minutes: number) =>
    new Date(base.getTime() + minutes * 60000).toISOString();
  event.demo = true;
  event.name = "Przykład · IW → SOR → PDOZ";
  event.place = "ul. Sienkiewicza, Wrocław";
  event.createdAt = at(0);
  event.status = "needs_completion";
  event.persons = [{ ref: "A", createdAt: at(7) }];
  const fact = (
    type: string,
    minutes: number,
    payload: Fact["payload"],
    personRef?: string,
  ): Fact => ({
    ...makeFact(event.id, type, payload, personRef),
    timestamp: at(minutes),
  });
  event.facts = [
    fact("start", 0, {}),
    fact("place", 4, { address: event.place }),
    fact("person_added", 7, {}, "A"),
    fact(
      "person_answer",
      8,
      { field: "role", value: "Osoba objęta czynnościami" },
      "A",
    ),
    fact(
      "person_answer",
      9,
      { field: "state", value: "Oznaki nietrzeźwości" },
      "A",
    ),
    fact("person_answer", 10, { field: "behavior", value: ["Spokojne"] }, "A"),
    fact("person_answer", 11, { field: "injuries", value: "Brak" }, "A"),
    fact(
      "person_answer",
      12,
      { field: "identity", value: "Dowód osobisty" },
      "A",
    ),
    fact("sobriety", 15, { result: "1,8", unit: "‰" }, "A"),
    fact("preventive", 18, { result: "Nie ujawniono przedmiotów" }, "A"),
    fact("decision", 21, { result: "Doprowadzenie do IW" }, "A"),
    fact(
      "arrival",
      35,
      { facility: "Izba Wytrzeźwień", address: "ul. Sokolnicza 14, Wrocław" },
      "A",
    ),
    fact(
      "facility",
      40,
      { facility: "Izba Wytrzeźwień", result: "Odmowa przyjęcia" },
      "A",
    ),
    fact("decision", 43, { result: "Przejazd do SOR" }, "A"),
    fact("arrival", 60, { facility: "SOR" }, "A"),
    fact("medical", 88, { result: "Przeprowadzono" }, "A"),
    fact("clearance", 95, { result: "Potwierdzono" }, "A"),
    fact("decision", 98, { result: "Doprowadzenie do PDOZ" }, "A"),
    fact(
      "arrival",
      120,
      { facility: "PDOZ", address: "Podwale, Wrocław" },
      "A",
    ),
    fact("handover", 128, { result: "Przekazano" }, "A"),
    fact("status", 130, { status: "needs_completion" }),
  ];
  await db.events.add(event);
  return event.id;
}

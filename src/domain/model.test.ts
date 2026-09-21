import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { db, repo } from "../data/repository";
import { makeEvent, makeFact } from "./model";
import { gaps, renderDocument } from "./documents";

afterEach(async () => {
  await db.events.clear();
});
describe("Trwałość i chronologia", () => {
  it("tworzy zapisany rekord przed przejściem do pytań; odczytuje po otwarciu bazy", async () => {
    const eventId = await repo.create();
    db.close();
    await db.open();
    const event = await db.events.get(eventId);
    expect(event?.status).toBe("in_progress");
    expect(event?.facts[0].type).toBe("start");
  });
  it("nie gubi równoległych odpowiedzi i rozdziela osoby", async () => {
    const eventId = await repo.create();
    expect(await repo.addPerson(eventId)).toBe("A");
    expect(await repo.addPerson(eventId)).toBe("B");
    await Promise.all([
      repo.answer(eventId, "A", "state", "Oznaki nietrzeźwości"),
      repo.answer(eventId, "A", "identity", "Paszport"),
      repo.answer(eventId, "B", "identity", "Dowód osobisty"),
    ]);
    await repo.answer(eventId, "A", "identity", "Oświadczenie ustne");
    const event = (await db.events.get(eventId))!;
    expect(event.facts.filter((f) => f.type === "person_answer")).toHaveLength(
      3,
    );
    expect(
      event.facts.find(
        (f) => f.personRef === "B" && f.payload.field === "identity",
      )?.payload.value,
    ).toBe("Dowód osobisty");
  });
  it("zachowuje przerwane zdarzenia niezależnie od kolejnego oraz po wznowieniu", async () => {
    const eventId = await repo.create();
    await repo.status(eventId, "needs_completion");
    await repo.create();
    expect((await db.events.get(eventId))?.status).toBe("needs_completion");
    await repo.status(eventId, "in_progress");
    expect(await db.events.count()).toBe(2);
  });
});
describe("Dokumenty bez dopowiadania", () => {
  it("pomija niedokończone czynności i wskazuje braki, rozróżnia źródła", () => {
    const e = makeEvent();
    e.facts.push(makeFact(e.id, "sobriety", { result: "0" }, "A"));
    e.facts.push({
      ...makeFact(e.id, "general", { text: "uraz powstał wcześniej" }, "A"),
      sourceType: "statement",
    });
    const doc = renderDocument(e, "note");
    expect(doc).not.toContain("Przeprowadzono badanie trzeźwości");
    expect(doc).toContain("Osoba A oświadczyła");
    expect(gaps(e).some((g) => g.label.includes("niedokończony"))).toBe(true);
  });
  it("nie zamienia odmowy IW w przyjęcie ani braku potwierdzenia w zgodę", () => {
    const e = makeEvent();
    e.facts.push(
      makeFact(
        e.id,
        "facility",
        { facility: "IW", result: "Odmowa przyjęcia" },
        "A",
      ),
    );
    e.facts.push(
      makeFact(e.id, "clearance", { result: "Nie potwierdzono" }, "A"),
    );
    expect(renderDocument(e, "note")).toContain("Odmowa przyjęcia");
    expect(renderDocument(e, "note")).toContain("Lekarz nie potwierdził");
    expect(renderDocument(e, "note")).not.toContain("Przekazano do PDOZ");
  });
  it("uwzględnia korektę czasu, datę przez północ i wybór faktów do dokumentu", () => {
    const e = makeEvent();
    e.facts = [];
    e.facts.push({
      ...makeFact(e.id, "general", { text: "drugi" }),
      timestamp: "2026-09-21T22:01:00Z",
      includeInBrief: false,
    });
    e.facts.push({
      ...makeFact(e.id, "general", { text: "pierwszy" }),
      timestamp: "2026-09-21T21:59:00Z",
    });
    const note = renderDocument(e, "note");
    expect(note.indexOf("pierwszy")).toBeLessThan(note.indexOf("drugi"));
    expect(renderDocument(e, "brief")).not.toContain("drugi");
  });
});

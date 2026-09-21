import { activities, personLabels } from "./catalog";
import {
  answer,
  chronological,
  dateLabel,
  statuses,
  textValue,
  timeLabel,
  type EventRecord,
  type Fact,
} from "./model";

export function factTitle(f: Fact): string {
  if (f.type === "person_answer")
    return personLabels[String(f.payload.field)] ?? "Informacja o osobie";
  return (
    (
      {
        start: "Rozpoczęcie zdarzenia",
        person_added: "Dodano osobę",
        gps: "Zapisano punkt GPS",
        place: "Miejsce zdarzenia",
        injury: "Obrażenie",
        stage: "Miejsce etapu",
        arrival: "Przyjazd do placówki",
        status: "Status zdarzenia",
      } as Record<string, string>
    )[f.type] ??
    activities[f.type]?.label ??
    "Wpis"
  );
}
export function factDetail(f: Fact) {
  const p = f.payload;
  if (f.type === "person_answer") return textValue(p.value);
  if (f.type === "status")
    return statuses[p.status as keyof typeof statuses] ?? "";
  if (f.type === "injury")
    return [p.side, p.region, p.kind, p.origin, p.detail]
      .filter(Boolean)
      .join(" · ");
  if (f.type === "gps") return [p.role, p.address].filter(Boolean).join(" · ");
  return [
    p.facility,
    p.address,
    p.result &&
      `${p.result}${f.type === "sobriety" && p.unit ? ` ${p.unit}` : ""}`,
    p.text,
    p.note,
  ]
    .filter(Boolean)
    .join(" · ");
}
function isComplete(f: Fact) {
  if (f.type === "sobriety")
    return (
      /^\d+(?:[.,]\d+)?$/.test(textValue(f.payload.result).trim()) &&
      ["mg/l", "‰"].includes(textValue(f.payload.unit))
    );
  if (activities[f.type]?.options) return Boolean(f.payload.result);
  if (f.type === "general") return Boolean(f.payload.text);
  if (f.type === "injury") return Boolean(f.payload.region);
  return true;
}
export function phrase(f: Fact): string {
  const p = f.payload;
  const who = f.personRef ? `Osoba ${f.personRef}` : "";
  const person = f.personRef ? ` — osoba ${f.personRef}` : "";
  const detail = textValue(p.note);
  const suffix = detail ? ` Uwagi: ${detail}` : "";
  if (!isComplete(f)) return "";
  switch (f.type) {
    case "start":
      return "Rozpoczęto rejestrowanie zdarzenia.";
    case "place":
      return p.address ? `Miejsce zdarzenia: ${p.address}.` : "";
    case "gps":
      return `Zapisano pozycję${p.role ? ` (${p.role})` : ""}: ${p.address || "adres do uzupełnienia"}.`;
    case "person_added":
      return `${who} — oznaczenie w rejestrze.`;
    case "person_answer":
      return p.value && textValue(p.value)
        ? `${who} — ${factTitle(f).toLocaleLowerCase("pl")}: ${textValue(p.value)}.`
        : "";
    case "injury":
      return `${who ? who + " — " : ""}zapis obrażenia: ${[p.region, p.side, p.kind, p.detail].filter(Boolean).join(", ")}.${p.origin ? ` Okoliczności: ${p.origin}.` : ""}`;
    case "stage":
      return `Miejsce etapu: ${p.facility || "nie podano"}${p.address ? `, ${p.address}` : ""}${person}.`;
    case "arrival":
      return `Odnotowano przyjazd: ${p.facility || "placówka"}${p.address ? `, ${p.address}` : ""}${person}.`;
    case "sobriety":
      return `Przeprowadzono badanie trzeźwości${person}. Wynik: ${p.result} ${p.unit}.${p.device ? ` Urządzenie: ${p.device}.` : ""}${suffix}`;
    case "preventive":
      return p.result === "Odstąpiono"
        ? `Odstąpiono od sprawdzenia prewencyjnego${person}.${suffix}`
        : `Dokonano sprawdzenia prewencyjnego${person}. Wynik: ${p.result}.${suffix}`;
    case "personal_search":
      return `${p.result === "Przeprowadzono" ? "Przeprowadzono kontrolę osobistą" : "Nie przeprowadzono kontroli osobistej"}${person}.${suffix}`;
    case "luggage":
      return `${p.result === "Przeprowadzono" ? "Przeprowadzono kontrolę bagażu" : "Nie przeprowadzono kontroli bagażu"}${person}.${suffix}`;
    case "signature":
      return `${p.result === "Podpisano" ? "Odnotowano złożenie podpisu" : "Odnotowano odmowę podpisu"}${person}${p.text ? `; dokument: ${p.text}` : ""}.${suffix}`;
    case "ambulance":
      return `${p.result === "Wezwano" ? "Wezwano ZRM" : p.result === "ZRM na miejscu" ? "ZRM przybył na miejsce" : "Przekazano osobę ZRM"}${person}.${suffix}`;
    case "decision":
      return `Podjęto decyzję${person}: ${p.result}.${suffix}`;
    case "facility":
      return `Decyzja placówki${p.facility ? ` (${p.facility})` : ""}${person}: ${p.result}.${suffix}`;
    case "medical":
      return `${p.result === "Przeprowadzono" ? "Przeprowadzono badanie lekarskie" : "Nie przeprowadzono badania lekarskiego"}${person}.${suffix}`;
    case "clearance":
      return `Lekarz ${p.result === "Potwierdzono" ? "potwierdził" : "nie potwierdził"} możliwość pobytu w PDOZ${person}.${suffix}`;
    case "handover":
      return `${p.result === "Przekazano" ? "Przekazano do PDOZ" : "Nie przekazano do PDOZ"}${person}.${suffix}`;
    case "general": {
      const context = f.personRef
        ? ` w odniesieniu do osoby ${f.personRef}`
        : "";
      const prefixes = {
        observation: `Ustalono${context}, że`,
        statement: `${who || "Osoba"} oświadczyła, że`,
        action: `Dokonano${context}:`,
        doctor: `Lekarz wskazał${context}:`,
        facility: `Placówka przekazała${context}:`,
      };
      return `${prefixes[f.sourceType ?? "observation"]} ${p.text}${/[.!?]$/.test(textValue(p.text)) ? "" : "."}${suffix}`;
    }
    case "status":
      return p.status === "completed"
        ? "Oznaczono zdarzenie jako zakończone."
        : p.status === "needs_completion"
          ? "Przerwano rejestrowanie — zdarzenie do uzupełnienia."
          : "Wznowiono rejestrowanie zdarzenia.";
    default:
      return "";
  }
}
export function gaps(event: EventRecord) {
  const result: { label: string; route: string }[] = [];
  if (!event.place) result.push({ label: "Miejsce zdarzenia", route: "place" });
  event.persons.forEach((p) => {
    if (!answer(event, p.ref, "identity"))
      result.push({
        label: `Osoba ${p.ref} · źródło tożsamości`,
        route: `person/${p.ref}/identity`,
      });
    if (
      answer(event, p.ref, "injuries") === "Są" &&
      !event.facts.some(
        (f) => f.type === "injury" && f.personRef === p.ref && f.payload.region,
      )
    ) {
      result.push({
        label: `Osoba ${p.ref} · opis obrażeń`,
        route: `person/${p.ref}/injuries`,
      });
    }
  });
  event.facts.forEach((f) => {
    if (!isComplete(f))
      result.push({
        label: `${factTitle(f)}${f.personRef ? ` · osoba ${f.personRef}` : ""} · niedokończony wpis`,
        route: `fact/${f.id}`,
      });
    if (f.type === "gps" && !f.payload.address)
      result.push({ label: "Punkt GPS · adres", route: `fact/${f.id}` });
  });
  return result;
}
export function renderDocument(
  event: EventRecord,
  mode: "note" | "brief",
): string {
  const header =
    mode === "note"
      ? "NOTATKA URZĘDOWA — PROJEKT"
      : "SKRÓT DO NOTATNIKA SŁUŻBOWEGO";
  const facts = chronological(event).filter((f) =>
    mode === "note" ? f.includeInNote !== false : f.includeInBrief !== false,
  );
  const lines = facts
    .map((f) => {
      const text = phrase(f);
      if (!text) return "";
      const timestamp = `${dateLabel(f.timestamp)} ${timeLabel(f.timestamp)}`;
      return `${timestamp} — ${mode === "brief" ? `${factTitle(f)}${f.personRef ? ` · ${f.personRef}` : ""}${factDetail(f) ? `: ${factDetail(f)}` : ""}` : text}`;
    })
    .filter(Boolean);
  return [
    header,
    event.demo
      ? "DANE DEMONSTRACYJNE — nie dotyczy rzeczywistej interwencji"
      : "",
    `Data rozpoczęcia: ${dateLabel(event.createdAt)}, godz. ${timeLabel(event.createdAt)}`,
    event.name ? `Nazwa: ${event.name}` : "",
    `Status: ${statuses[event.status]}`,
    "",
    ...lines,
    "",
    mode === "note"
      ? "Sporządzający: ................................................................\nJednostka / oznaczenie służby: ................................................."
      : "",
    mode === "note" && event.persons.length
      ? "Dane osób — wyłącznie do ręcznego uzupełnienia na wydruku:\n" +
        event.persons
          .map(
            (p) =>
              `Osoba ${p.ref}: ................................................................`,
          )
          .join("\n")
      : "",
    mode === "note"
      ? "\nPodpis: ......................................................................."
      : "",
  ]
    .filter((line, i, arr) => line || arr[i - 1])
    .join("\n");
}

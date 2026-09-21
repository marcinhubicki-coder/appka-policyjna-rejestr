import { useState } from "react";
import { ArrowRight, ClipboardList, MapPin, Plus } from "lucide-react";
import { repo } from "../data/repository";
import {
  activities,
  personLabels,
  sources,
  stages,
  type Stage,
} from "../domain/catalog";
import { factTitle } from "../domain/documents";
import {
  textValue,
  toLocalInput,
  type EventRecord,
  type Fact,
  type SourceType,
} from "../domain/model";
import {
  Button,
  Choices,
  Field,
  FlowFooter,
  PageHeading,
  Toggle,
  eventPath,
  go,
  useTask,
} from "./shared";
import { InjuryEditor } from "./Person";

export function AddFact({ event }: { event: EventRecord }) {
  const { run, busy } = useTask();
  const [person, setPerson] = useState(
    event.persons.length === 1 ? event.persons[0].ref : "",
  );
  return (
    <>
      <PageHeading
        eyebrow="KAŻDY WPIS Z WŁASNĄ GODZINĄ"
        title="Dodaj fakt"
        subtitle="Wybierz czynność lub zapisz własną obserwację."
      />
      <label className="field">
        <span>Dotyczy osoby · opcjonalnie</span>
        <select value={person} onChange={(e) => setPerson(e.target.value)}>
          <option value="">Całe zdarzenie</option>
          {event.persons.map((p) => (
            <option key={p.ref} value={p.ref}>
              Osoba {p.ref}
            </option>
          ))}
        </select>
      </label>
      {[...new Set(Object.values(activities).map((a) => a.group))].map(
        (group) => (
          <section key={group}>
            <div className="section-top">
              <h2>{group}</h2>
            </div>
            <div className="activity-list">
              {Object.entries(activities)
                .filter(([, a]) => a.group === group)
                .map(([key, activity]) => (
                  <button
                    key={key}
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        const id = await repo.addFact(
                          event.id,
                          key,
                          person || undefined,
                        );
                        go(eventPath(event, `fact/${id}`));
                      })
                    }
                  >
                    <span>{activity.label}</span>
                    <Plus size={18} />
                  </button>
                ))}
            </div>
          </section>
        ),
      )}
      <section>
        <div className="section-top">
          <h2>Miejsca i etapy</h2>
        </div>
        <div className="stage-links">
          {Object.entries(stages).map(([key, stage]) => (
            <button
              key={key}
              onClick={() => go(eventPath(event, `stage/${key}/${person}`))}
            >
              <MapPin size={19} />
              {stage.title}
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
      </section>
      <FlowFooter
        next={() => go(eventPath(event))}
        nextLabel="Wróć do zdarzenia"
      />
    </>
  );
}
function Inclusion({
  fact,
  set,
}: {
  fact: Fact;
  set: (patch: Partial<Fact>) => void;
}) {
  return (
    <div className="inclusion">
      <label>
        <span>W notatce urzędowej</span>
        <Toggle
          role="switch"
          checked={fact.includeInNote !== false}
          onChange={(value) => set({ includeInNote: value })}
        />
      </label>
      <label>
        <span>W skrócie do notatnika</span>
        <Toggle
          role="switch"
          checked={fact.includeInBrief !== false}
          onChange={(value) => set({ includeInBrief: value })}
        />
      </label>
    </div>
  );
}
export function FactEditor({
  event,
  factId,
}: {
  event: EventRecord;
  factId: string;
}) {
  const fact = event.facts.find((f) => f.id === factId);
  const { save } = useTask();
  if (!fact) return <p>Nie odnaleziono wpisu.</p>;
  const set = (patch: Partial<Fact>) =>
    save(repo.patchFact(event.id, factId, patch));
  const payload = (field: string, value: string | string[]) =>
    set({ payload: { [field]: value } });
  const activity = activities[fact.type];
  const result = textValue(fact.payload.result);
  return (
    <>
      <PageHeading
        eyebrow="EDYCJA WPISU · ZAPIS AUTOMATYCZNY"
        title={factTitle(fact)}
      />
      <Field
        label="Data i godzina faktu"
        type="datetime-local"
        value={toLocalInput(fact.timestamp)}
        onChange={(value) => {
          const date = new Date(value);
          if (Number.isFinite(date.getTime()))
            set({ timestamp: date.toISOString() });
        }}
      />
      {activity && (
        <label className="field">
          <span>Dotyczy osoby</span>
          <select
            value={fact.personRef ?? ""}
            onChange={(e) => set({ personRef: e.target.value || undefined })}
          >
            <option value="">Całe zdarzenie</option>
            {event.persons.map((p) => (
              <option key={p.ref} value={p.ref}>
                Osoba {p.ref}
              </option>
            ))}
          </select>
        </label>
      )}
      {fact.type === "sobriety" && (
        <>
          <Field
            label="Wynik badania"
            value={result}
            inputMode="decimal"
            onChange={(v) => payload("result", v)}
            placeholder="Np. 0,42"
            maxLength={12}
          />
          <label className="field">
            <span>Jednostka z urządzenia</span>
          </label>
          <Choices
            options={["mg/l", "‰"]}
            value={fact.payload.unit ?? ""}
            onChange={(v) => payload("unit", v)}
            compact
          />
          {result && !/^\d+(?:[.,]\d+)?$/.test(result.trim()) && (
            <p className="amber small">
              Wpisz liczbę nieujemną, np. 0,42. Niepoprawny wynik nie trafi do
              dokumentu.
            </p>
          )}
          <Field
            label="Urządzenie · opcjonalnie"
            value={textValue(fact.payload.device)}
            onChange={(v) => payload("device", v)}
            placeholder="Oznaczenie urządzenia"
          />
          <p className="hint">
            Wynik jest zapisywany w wybranej jednostce, bez przeliczeń.
          </p>
        </>
      )}
      {activity?.options && (
        <>
          <label className="field">
            <span>
              {fact.type === "decision"
                ? "Podjęta decyzja"
                : "Wynik / stan czynności"}
            </span>
          </label>
          <Choices
            options={activity.options}
            value={fact.payload.result ?? ""}
            onChange={(v) => payload("result", v)}
          />
        </>
      )}
      {["facility", "medical", "clearance", "handover"].includes(fact.type) && (
        <Field
          label="Placówka · opcjonalnie"
          value={textValue(fact.payload.facility)}
          onChange={(v) => payload("facility", v)}
          placeholder="Nazwa placówki"
        />
      )}
      {fact.type === "general" && (
        <label className="field">
          <span>Źródło informacji</span>
          <select
            value={fact.sourceType ?? "observation"}
            onChange={(e) => set({ sourceType: e.target.value as SourceType })}
          >
            {Object.entries(sources).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      {activity?.field && fact.type !== "sobriety" && (
        <Field
          label={activity.field}
          value={textValue(fact.payload.text)}
          onChange={(v) => payload("text", v)}
          multiline
          placeholder="Bez danych osobowych"
        />
      )}
      {fact.type === "person_answer" && (
        <div className="panel">
          <p>
            Osoba {fact.personRef} ·{" "}
            {personLabels[textValue(fact.payload.field)]}
          </p>
          <p className="fact-value">
            {textValue(fact.payload.value) || "Bez odpowiedzi"}
          </p>
          <Button
            onClick={() => {
              const field = textValue(fact.payload.field);
              const step = [
                "role",
                "state",
                "behavior",
                "injuries",
                "identity",
              ].includes(field)
                ? field
                : field === "note"
                  ? "role"
                  : "description";
              go(eventPath(event, `person/${fact.personRef}/${step}`));
            }}
          >
            Zmień odpowiedź
            <ArrowRight size={18} />
          </Button>
        </div>
      )}
      {fact.type === "person_added" && (
        <Button
          onClick={() => go(eventPath(event, `person/${fact.personRef}/role`))}
        >
          Przejdź do osoby {fact.personRef}
          <ArrowRight size={18} />
        </Button>
      )}
      {["place", "gps", "stage", "arrival"].includes(fact.type) && (
        <>
          {["stage", "arrival"].includes(fact.type) && (
            <Field
              label="Placówka"
              value={textValue(fact.payload.facility)}
              onChange={(v) => payload("facility", v)}
            />
          )}
          <Field
            label="Adres / opis miejsca"
            value={textValue(fact.payload.address)}
            onChange={(v) => payload("address", v)}
            placeholder="Możesz wpisać dowolne miejsce"
          />
          {fact.type === "gps" && (
            <Field
              label="Rola punktu"
              value={textValue(fact.payload.role)}
              onChange={(v) => payload("role", v)}
            />
          )}
        </>
      )}
      {fact.type === "injury" && (
        <InjuryEditor
          event={event}
          personRef={fact.personRef ?? ""}
          initialId={fact.id}
        />
      )}
      {activity && (
        <Field
          label={
            fact.type === "facility"
              ? "Powód / uwagi · opcjonalnie"
              : "Uwagi · opcjonalnie"
          }
          value={textValue(fact.payload.note)}
          onChange={(v) => payload("note", v)}
          multiline
          placeholder="Tylko istotne fakty, bez danych osobowych"
        />
      )}
      {(fact.type === "start" || fact.type === "status") && (
        <p className="hint">
          Możesz poprawić godzinę. Bieżący status zmienisz przez „Zakończ” lub
          „Wznów czynności”.
        </p>
      )}
      <details className="panel details-panel">
        <summary>Użycie w dokumentacji</summary>
        <Inclusion fact={fact} set={set} />
      </details>
      <FlowFooter next={() => go(eventPath(event))} nextLabel="Do zdarzenia" />
    </>
  );
}

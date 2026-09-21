import { useState } from "react";
import { ArrowRight, Plus, UserRound } from "lucide-react";
import {
  bodyRegions,
  identityOptions,
  injuryOrigins,
  personLabels,
  roles,
} from "../domain/catalog";
import {
  answer,
  countLabel,
  textValue,
  type EventRecord,
  type Fact,
} from "../domain/model";
import { repo } from "../data/repository";
import {
  Button,
  Choices,
  Field,
  FlowFooter,
  PageHeading,
  SwipePanel,
  eventPath,
  go,
  useTask,
} from "./shared";

const questionTitles: Record<string, string> = {
  role: "Kim jest ta osoba?",
  state: "Jaki jest stan osoby?",
  behavior: "Jak się zachowuje?",
  injuries: "Czy widać obrażenia?",
  identity: "Skąd ustalono tożsamość?",
  description: "Co pomaga opisać osobę?",
};
export function PersonScreen({
  event,
  personRef,
  step,
}: {
  event: EventRecord;
  personRef: string;
  step: string;
}) {
  const { save } = useTask();
  const steps = [
    "role",
    "state",
    "behavior",
    "injuries",
    "identity",
    ...(answer(event, personRef, "identity") === "Tożsamości nie ustalono" ||
    step === "description"
      ? ["description"]
      : []),
  ];
  const index = steps.indexOf(step);
  const value = answer(event, personRef, step);
  const set = (field: string, val: string | string[]) =>
    save(repo.answer(event.id, personRef, field, val));
  const next = () =>
    go(
      index >= 0 && index < steps.length - 1
        ? eventPath(event, `person/${personRef}/${steps[index + 1]}`)
        : eventPath(event),
    );
  const back = () =>
    go(
      index > 0
        ? eventPath(event, `person/${personRef}/${steps[index - 1]}`)
        : eventPath(event),
    );
  if (!event.persons.some((p) => p.ref === personRef))
    return <p>Nie odnaleziono osoby.</p>;
  return (
    <SwipePanel onNext={next} onBack={back}>
      <div className="person-heading">
        <span className="avatar large">{personRef}</span>
        <span>
          <strong>Osoba {personRef}</strong>
          <small>
            {index + 1} z {steps.length} · każde pytanie można pominąć
          </small>
        </span>
      </div>
      <div className="step-track" aria-hidden="true">
        {steps.map((s) => (
          <span
            key={s}
            className={
              s === step
                ? "current"
                : textValue(answer(event, personRef, s))
                  ? "done"
                  : ""
            }
          />
        ))}
      </div>
      <PageHeading title={questionTitles[step] || "Informacje o osobie"} />
      {step === "role" && (
        <>
          <Choices
            options={roles}
            value={value}
            onChange={(v) => set(step, v)}
          />
          <Field
            label="Informacje dodatkowe · opcjonalnie"
            value={textValue(answer(event, personRef, "note"))}
            onChange={(v) => set("note", v)}
            multiline
            placeholder="Kontekst, bez danych osobowych"
          />
          <Button
            onClick={() =>
              go(eventPath(event, `person/${personRef}/description`))
            }
          >
            <UserRound size={18} /> Cechy osoby / rysopis
            <ArrowRight size={18} />
          </Button>
        </>
      )}
      {step === "state" && (
        <>
          <Choices
            options={[
              "Bez zauważalnych zaburzeń",
              "Oznaki nietrzeźwości",
              "Kontakt utrudniony",
              "Nieprzytomna",
              "Inny stan",
            ]}
            value={value}
            onChange={(v) => set(step, v)}
          />
          <p className="hint">
            Wynik badania trzeźwości zapiszesz jako osobną czynność.
          </p>
        </>
      )}
      {step === "behavior" && (
        <>
          <p className="muted">Możesz wybrać kilka odpowiedzi.</p>
          <Choices
            options={[
              "Spokojne",
              "Pobudzone",
              "Agresywne",
              "Opór",
              "Współpraca",
              "Inne",
            ]}
            value={value}
            onChange={(v) => set(step, v)}
            multi
          />
        </>
      )}
      {step === "identity" && (
        <>
          <Choices
            options={identityOptions}
            value={value}
            onChange={(v) => set(step, v)}
          />
          <p className="hint">
            Zapisujemy wyłącznie źródło ustalenia tożsamości.
          </p>
          {value === "Tożsamości nie ustalono" && (
            <div className="info-box">
              <UserRound size={19} />
              <span>
                Dalej możesz dodać rysopis. Ten krok również jest opcjonalny.
              </span>
            </div>
          )}
        </>
      )}
      {step === "injuries" && (
        <>
          <Choices
            options={["Brak", "Są"]}
            value={value}
            onChange={(v) => set(step, v)}
            compact
          />
          {value === "Są" && (
            <InjuryEditor event={event} personRef={personRef} />
          )}
        </>
      )}
      {step === "description" && (
        <>
          <p className="muted">
            Uzupełnij tylko cechy przydatne do późniejszego opisu.
          </p>
          <label className="field">
            <span>Płeć</span>
          </label>
          <Choices
            compact
            options={["Kobieta", "Mężczyzna", "Nie określono"]}
            value={answer(event, personRef, "sex")}
            onChange={(v) => set("sex", v)}
          />
          {[
            "age",
            "height",
            "build",
            "hair",
            "facialHair",
            "features",
            "clothing",
          ].map((field) => (
            <Field
              key={field}
              label={personLabels[field]}
              value={textValue(answer(event, personRef, field))}
              onChange={(v) => set(field, v)}
              placeholder={
                field === "age"
                  ? "Np. około 40 lat"
                  : field === "height"
                    ? "Np. 175–180 cm"
                    : "Opcjonalnie"
              }
            />
          ))}
        </>
      )}
      <FlowFooter
        back={back}
        skip={next}
        next={next}
        nextLabel={index === steps.length - 1 ? "Do zdarzenia" : "Dalej"}
      />
      <div className="question-jumps">
        {steps.map((s) => (
          <button
            key={s}
            onClick={() => go(eventPath(event, `person/${personRef}/${s}`))}
            className={s === step ? "active" : ""}
          >
            {
              (
                {
                  role: "Rola",
                  state: "Stan",
                  behavior: "Zachowanie",
                  injuries: "Obrażenia",
                  identity: "Tożsamość",
                  description: "Rysopis",
                } as Record<string, string>
              )[s]
            }
          </button>
        ))}
      </div>
    </SwipePanel>
  );
}

function BodyMap({
  region,
  side,
  onChange,
}: {
  region: string;
  side: string;
  onChange: (value: string) => void;
}) {
  const shapes = [
    <ellipse key="head" cx="110" cy="31" rx="21" ry="25" />,
    <path
      key="torso"
      d="M82 63 Q110 54 138 63 L145 136 131 168 89 168 75 136Z"
    />,
    <path key="rarm" d="M76 65 62 72 43 152 51 176 63 168 70 126 82 89Z" />,
    <path
      key="larm"
      d="M144 65 158 72 177 152 169 176 157 168 150 126 138 89Z"
    />,
    <path
      key="rleg"
      d="M88 172 106 172 104 226 100 286 74 291 75 278 80 220Z"
    />,
    <path
      key="lleg"
      d="M114 172 132 172 140 220 145 278 146 291 120 286 116 226Z"
    />,
  ];
  return (
    <div className="body-map">
      <svg
        viewBox="0 0 220 310"
        role="group"
        aria-label={`Mapa ciała · ${side.toLocaleLowerCase("pl")}`}
      >
        {shapes.map((shape, i) => {
          const label =
            side === "Tył" && i >= 2
              ? bodyRegions[i % 2 === 0 ? i + 1 : i - 1]
              : bodyRegions[i];
          return (
            <g
              key={label}
              role="button"
              tabIndex={0}
              aria-label={label}
              aria-pressed={region === label}
              className={region === label ? "selected" : ""}
              onClick={() => onChange(label)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(label);
                }
              }}
            >
              <title>{label}</title>
              {shape}
            </g>
          );
        })}
      </svg>
      <span>{side} · prawa/lewa po stronie osoby</span>
    </div>
  );
}
export function InjuryEditor({
  event,
  personRef,
  initialId,
}: {
  event: EventRecord;
  personRef: string;
  initialId?: string;
}) {
  const injuries = event.facts.filter(
    (f) => f.type === "injury" && f.personRef === personRef,
  );
  const [selected, setSelected] = useState(
    initialId ?? injuries.at(-1)?.id ?? "",
  );
  const [side, setSide] = useState(
    String(injuries.find((f) => f.id === selected)?.payload.side || "Przód"),
  );
  const { run, save } = useTask();
  const fact = event.facts.find((f) => f.id === selected);
  const patch = (field: string, value: string | string[]) => {
    if (fact)
      save(repo.patchFact(event.id, fact.id, { payload: { [field]: value } }));
  };
  const region = (value: string) => {
    if (fact) patch("region", value);
    else
      run(async () =>
        setSelected(
          await repo.addFact(event.id, "injury", personRef, {
            region: value,
            side,
          }),
        ),
      );
  };
  return (
    <div className="injury-editor">
      <div className="section-top">
        <h2>Mapa obrażeń</h2>
        <span className="small muted">
          {countLabel(injuries.length, ["zapis", "zapisy", "zapisów"])}
        </span>
      </div>
      <Choices
        options={["Przód", "Tył"]}
        value={side}
        onChange={(v) => {
          if (!v) return;
          setSide(String(v));
          patch("side", v);
        }}
        compact
      />
      <BodyMap
        region={String(fact?.payload.region ?? "")}
        side={side}
        onChange={region}
      />
      <Choices
        options={bodyRegions}
        value={fact?.payload.region ?? ""}
        onChange={(v) => region(String(v))}
        compact
      />
      {fact && (
        <div key={fact.id} className="panel injury-details">
          <h3>
            {textValue(fact.payload.region)} · {textValue(fact.payload.side)}
          </h3>
          <Field
            label="Dokładniejsze miejsce"
            value={textValue(fact.payload.detail)}
            onChange={(v) => patch("detail", v)}
            placeholder="Np. okolica łokcia"
          />
          <label className="field">
            <span>Rodzaj obrażenia</span>
          </label>
          <Choices
            options={["Otarcie", "Zasinienie", "Rana", "Obrzęk", "Inne"]}
            value={fact.payload.kind ?? ""}
            onChange={(v) => patch("kind", v)}
            compact
          />
          <label className="field">
            <span>Pochodzenie / okoliczności</span>
          </label>
          <Choices
            options={injuryOrigins}
            value={fact.payload.origin ?? ""}
            onChange={(v) => patch("origin", v)}
          />
        </div>
      )}
      {injuries.length > 0 && (
        <>
          <div className="injury-list">
            {injuries.map((f) => (
              <button
                key={f.id}
                className={f.id === selected ? "active" : ""}
                onClick={() => {
                  setSelected(f.id);
                  setSide(String(f.payload.side || "Przód"));
                }}
              >
                {textValue(f.payload.region) || "Obszar do uzupełnienia"}
                <small>
                  {[f.payload.side, f.payload.kind].filter(Boolean).join(" · ")}
                </small>
              </button>
            ))}
          </div>
          <Button onClick={() => setSelected("")}>
            <Plus size={18} /> Dodaj kolejne obrażenie
          </Button>
          {!selected && (
            <p className="hint">Wskaż na mapie miejsce kolejnego obrażenia.</p>
          )}
        </>
      )}
    </div>
  );
}

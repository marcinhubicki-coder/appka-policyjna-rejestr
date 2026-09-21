import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  Navigation,
  Plus,
  Search,
} from "lucide-react";
import { repo } from "../data/repository";
import { stages, streets, type Stage } from "../domain/catalog";
import { textValue, timeLabel, type EventRecord } from "../domain/model";
import { capturePosition, resolveAddress } from "../device/location";
import {
  Button,
  Field,
  FlowFooter,
  MapLink,
  PageHeading,
  Success,
  eventPath,
  go,
  useTask,
} from "./shared";

export function GPS({
  event,
  context = "",
  personRef,
}: {
  event: EventRecord;
  context?: string;
  personRef?: string;
}) {
  const stage = stages[context as Stage];
  const role =
    context === "start"
      ? "Punkt startowy"
      : (stage?.title ?? "Miejsce zdarzenia");
  const [pointId, setPointId] = useState(
    event.locations.filter((p) => p.role === role).at(-1)?.id ?? "",
  );
  const [addressState, setAddressState] = useState("");
  const { run, save, busy } = useTask();
  const point = event.locations.find((p) => p.id === pointId);
  const next = () =>
    go(
      eventPath(
        event,
        context === "start" || context === "place"
          ? "place"
          : stage
            ? `stage/${context}/${personRef ?? ""}`
            : "live",
      ),
    );
  const capture = () =>
    run(async () => {
      setAddressState("");
      const position = await capturePosition(event.id, role, personRef);
      setPointId(position.id);
      setAddressState("Punkt zapisany. Szukam adresu…");
      try {
        await resolveAddress(event.id, position);
        setAddressState("Adres z GPS — sprawdź, czy odpowiada miejscu.");
      } catch {
        setAddressState(
          "Punkt i czas zapisane. Adres jest niedostępny — możesz wpisać go ręcznie.",
        );
      }
    });
  return (
    <>
      <PageHeading
        eyebrow={role.toLocaleUpperCase("pl")}
        title={point ? "Pozycja zapisana" : "Dodaj swoją pozycję"}
        subtitle={
          point
            ? "Czas i punkt GPS są już w rejestrze."
            : "Zapisz punkt i godzinę. Możesz też pominąć ten krok."
        }
      />
      <div className={`gps-visual ${point ? "captured" : ""}`}>
        <span />
        <span />
        <span />
        <div>{point ? <Check size={40} /> : <Navigation size={36} />}</div>
      </div>
      {point && (
        <div className="panel location-result" key={point.id}>
          <div className="location-address">
            <MapPin />
            <strong>
              {point.address || "Punkt GPS · adres do uzupełnienia"}
            </strong>
          </div>
          <p className="small muted">
            {timeLabel(point.timestamp)} · dokładność ±
            {Math.round(point.accuracy)} m
          </p>
          <Field
            key={`${point.id}-${point.geocoded}`}
            label="Adres / korekta miejsca"
            value={point.address}
            onChange={(address) => {
              const fact = event.facts.find(
                (f) => f.locationPointId === point.id,
              );
              if (fact)
                save(
                  repo.patchFact(event.id, fact.id, { payload: { address } }),
                );
            }}
            placeholder="Wpisz ulicę lub opis miejsca"
          />
          <MapLink address={point.address} />
          {context === "place" && point.address && (
            <Button
              tone="primary"
              onClick={() =>
                run(async () => {
                  await repo.place(event.id, point.address);
                  next();
                })
              }
            >
              Użyj jako miejsca zdarzenia
            </Button>
          )}
          <details className="small muted">
            <summary>Dane punktu</summary>
            <p>
              {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
            </p>
          </details>
        </div>
      )}
      <p className="hint" aria-live="polite">
        {addressState}
      </p>
      <Button
        tone={point ? "secondary" : "primary"}
        className="full"
        onClick={capture}
        disabled={busy}
      >
        <Navigation size={19} />
        {busy
          ? "Pobieram pozycję…"
          : point
            ? "Zapisz kolejny punkt"
            : "Pobierz GPS teraz"}
      </Button>
      <p className="small muted">
        Adres: OpenStreetMap / Nominatim. Ręczne pobranie GPS wysyła współrzędne
        w celu ustalenia ulicy.
      </p>
      <FlowFooter next={next} nextLabel={point ? "Dalej" : "Pomiń"} />
    </>
  );
}
export function Place({ event }: { event: EventRecord }) {
  const { save } = useTask();
  const [draft, setDraft] = useState(event.place);
  const [show, setShow] = useState(false);
  const normalized = draft.toLocaleLowerCase("pl").replace(/^ul\.?\s*/, "");
  const suggestions =
    normalized.length > 1 && !normalized.includes(",")
      ? streets
          .filter((street) =>
            street
              .toLocaleLowerCase("pl")
              .includes(normalized.replace(/\s+\d.*$/, "")),
          )
          .slice(0, 5)
      : [];
  const change = (value: string) => {
    setDraft(value);
    save(repo.place(event.id, value));
  };
  return (
    <>
      <PageHeading
        eyebrow="GDZIE DZIEJE SIĘ ZDARZENIE?"
        title="Miejsce zdarzenia"
        subtitle="Podaj ulicę lub opisz miejsce własnymi słowami."
      />
      <label className="field">
        <span>Adres lub opis miejsca</span>
        <div className="address-input">
          <Search size={19} />
          <input
            autoComplete="off"
            aria-label="Adres lub opis miejsca"
            value={draft}
            onFocus={() => setShow(true)}
            onChange={(e) => change(e.target.value)}
            placeholder="Np. Sienkiewicza 23, Wrocław"
          />
          {draft && (
            <button onClick={() => change("")} aria-label="Wyczyść adres">
              ×
            </button>
          )}
        </div>
      </label>
      {show && suggestions.length > 0 && (
        <div className="street-suggestions">
          {suggestions.map((street) => (
            <button
              key={street}
              onClick={() => {
                const number = draft.match(/\s+(\d\S*)$/)?.[1];
                change(
                  `${street.startsWith("plac ") ? "" : "ul. "}${street}${number ? ` ${number}` : ""}, Wrocław`,
                );
                setShow(false);
              }}
            >
              <MapPin size={18} />
              <span>
                {street}
                <small>Wrocław</small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
      )}
      <p className="hint">
        Podpowiedzi działają offline. Dowolny wpis jest akceptowany.
      </p>
      <Button
        className="full"
        onClick={() => go(eventPath(event, "gps/place"))}
      >
        <Navigation size={19} /> Użyj bieżącej pozycji
      </Button>
      {event.place && <MapLink address={event.place} />}
      <FlowFooter
        skip={() => go(eventPath(event))}
        next={() => go(eventPath(event))}
        nextLabel="Do zdarzenia"
      />
    </>
  );
}
export function StageScreen({
  event,
  stageKey,
  personRef,
}: {
  event: EventRecord;
  stageKey: Stage;
  personRef?: string;
}) {
  const stage = stages[stageKey];
  const { run, save, busy } = useTask();
  const [selectedPerson, setSelectedPerson] = useState(
    personRef || (event.persons.length === 1 ? event.persons[0].ref : ""),
  );
  const matching = event.facts.filter(
    (f) =>
      f.type === "stage" &&
      f.payload.stageKey === stageKey &&
      (f.personRef ?? "") === selectedPerson,
  );
  const stageFact = matching.at(-1);
  const address = stageFact
    ? textValue(stageFact.payload.address)
    : stage.address;
  const [draftAddress, setDraftAddress] = useState(address);
  const arrivals = event.facts.filter(
    (f) =>
      f.type === "arrival" &&
      f.payload.facility === stage.title &&
      (f.personRef ?? "") === selectedPerson,
  );
  if (!stage) return <p>Nie ma takiego etapu.</p>;
  const add = (type: string) =>
    run(async () => {
      const id = await repo.addFact(
        event.id,
        type,
        selectedPerson || undefined,
        { facility: stage.title },
      );
      go(eventPath(event, `fact/${id}`));
    });
  const editAddress = (value: string) => {
    setDraftAddress(value);
    save(
      repo.mutate(event.id, (e) => {
        let current = e.facts.find(
          (f) =>
            f.type === "stage" &&
            f.payload.stageKey === stageKey &&
            (f.personRef ?? "") === selectedPerson,
        );
        if (!current) {
          current = {
            id: crypto.randomUUID(),
            eventId: event.id,
            type: "stage",
            timestamp: new Date().toISOString(),
            personRef: selectedPerson || undefined,
            payload: { stageKey, facility: stage.title },
          };
          e.facts.push(current);
        }
        current.payload.address = value;
      }),
    );
  };
  return (
    <>
      <PageHeading
        eyebrow="MIEJSCE I KOLEJNE FAKTY"
        title={stage.title}
        subtitle="Zapisuj tylko to, co nastąpiło."
      />
      <label className="field">
        <span>Osoba</span>
        <select
          value={selectedPerson}
          onChange={(e) => {
            const ref = e.target.value;
            setSelectedPerson(ref);
            const f = event.facts.find(
              (f) =>
                f.type === "stage" &&
                f.payload.stageKey === stageKey &&
                (f.personRef ?? "") === ref,
            );
            setDraftAddress(f ? textValue(f.payload.address) : stage.address);
          }}
        >
          <option value="">Bez powiązania z osobą</option>
          {event.persons.map((p) => (
            <option key={p.ref} value={p.ref}>
              Osoba {p.ref}
            </option>
          ))}
        </select>
      </label>
      <section className="panel">
        <Field
          key={`${stageKey}-${selectedPerson}`}
          label="Adres placówki"
          value={draftAddress}
          onChange={editAddress}
          placeholder={
            stageKey === "sor"
              ? "Wpisz adres wybranego SOR"
              : "Adres lub opis miejsca"
          }
        />
        {stageKey !== "sor" && !stageFact && (
          <p className="small muted">Adres z przykładu. Możesz go zmienić.</p>
        )}
        <div className="stack">
          <MapLink address={draftAddress} />
          <Button
            onClick={() =>
              go(eventPath(event, `gps/${stageKey}/${selectedPerson}`))
            }
          >
            <Navigation size={18} /> Zapisz punkt GPS
          </Button>
          <Button
            tone="primary"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await repo.addFact(
                  event.id,
                  "arrival",
                  selectedPerson || undefined,
                  { facility: stage.title, address: draftAddress },
                );
              })
            }
          >
            <Clock3 size={18} /> Odnotuj przyjazd teraz
          </Button>
        </div>
        {arrivals.length > 0 && (
          <Success>
            Przyjazd zapisany o {timeLabel(arrivals.at(-1)!.timestamp)}
          </Success>
        )}
      </section>
      <div className="section-top">
        <h2>Wynik czynności</h2>
      </div>
      <div className="stack">
        {stageKey === "iw" && (
          <Button onClick={() => add("facility")}>
            Przyjęcie / odmowa przyjęcia
            <ArrowRight size={18} />
          </Button>
        )}
        {stageKey === "sor" && (
          <>
            <Button onClick={() => add("medical")}>
              Badanie lekarskie
              <ArrowRight size={18} />
            </Button>
            <Button onClick={() => add("clearance")}>
              Możliwość pobytu w PDOZ
              <ArrowRight size={18} />
            </Button>
          </>
        )}
        {stageKey === "pdoz" && (
          <Button onClick={() => add("handover")}>
            Przekazanie osoby
            <ArrowRight size={18} />
          </Button>
        )}
        <Button onClick={() => add("general")}>
          <Plus size={18} /> Inny fakt
        </Button>
      </div>
      <FlowFooter next={() => go(eventPath(event))} nextLabel="Do zdarzenia" />
    </>
  );
}

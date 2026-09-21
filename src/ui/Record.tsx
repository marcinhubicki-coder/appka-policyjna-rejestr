import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  Navigation,
  Plus,
  Route,
  UserPlus,
  Users,
} from "lucide-react";
import { activities, stages, type Stage } from "../domain/catalog";
import {
  answer,
  chronological,
  dateLabel,
  statuses,
  textValue,
  timeLabel,
  type EventRecord,
} from "../domain/model";
import { factDetail, factTitle, gaps } from "../domain/documents";
import { repo } from "../data/repository";
import {
  Button,
  DetailLink,
  Empty,
  Field,
  PageHeading,
  eventPath,
  go,
  useTask,
} from "./shared";

export function Timeline({
  event,
  limit,
}: {
  event: EventRecord;
  limit?: number;
}) {
  const all = chronological(event);
  const facts = limit ? all.slice(-limit) : all;
  let previousDate = "";
  return (
    <div className="timeline">
      {facts.map((fact, i) => {
        const date = dateLabel(fact.timestamp);
        const newDate = previousDate !== date;
        previousDate = date;
        return (
          <div key={fact.id}>
            {newDate && <div className="timeline-date">{date}</div>}
            <button
              className={`timeline-row ${i === facts.length - 1 ? "latest" : ""}`}
              onClick={() => go(eventPath(event, `fact/${fact.id}`))}
            >
              <span className="timeline-hour">{timeLabel(fact.timestamp)}</span>
              <span
                className={`timeline-node ${fact.type === "gps" ? "location" : ""}`}
              />
              <span className="timeline-content">
                <span className="timeline-title">
                  {factTitle(fact)}
                  {fact.personRef && (
                    <span className="person-mini">{fact.personRef}</span>
                  )}
                </span>
                {factDetail(fact) && (
                  <span className="timeline-detail">{factDetail(fact)}</span>
                )}
                {activities[fact.type] &&
                  !fact.payload.result &&
                  !fact.payload.text && (
                    <span className="small amber">Wpis do uzupełnienia</span>
                  )}
              </span>
              <ChevronRight size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
export function Live({ event }: { event: EventRecord }) {
  const { run, busy } = useTask();
  const [ref, setRef] = useState(event.persons[0]?.ref ?? "");
  const relevant = chronological(event).filter(
    (f) => !ref || f.personRef === ref,
  );
  const lastDecision = relevant
    .filter((f) =>
      ["decision", "facility", "clearance", "handover"].includes(f.type),
    )
    .at(-1);
  let suggestion: { title: string; text: string; route: string } | undefined;
  if (
    lastDecision?.type === "facility" &&
    lastDecision.payload.result === "Odmowa przyjęcia"
  )
    suggestion = {
      title: "Co po odmowie przyjęcia?",
      text: "Możesz odnotować etap SOR lub dodać inną czynność.",
      route: `stage/sor/${ref}`,
    };
  if (
    lastDecision?.type === "clearance" &&
    lastDecision.payload.result === "Potwierdzono"
  )
    suggestion = {
      title: "Dalszy etap: PDOZ",
      text: "Zapisz przyjazd i wynik przekazania, jeśli nastąpią.",
      route: `stage/pdoz/${ref}`,
    };
  if (
    (lastDecision?.type === "facility" &&
      lastDecision.payload.result === "Przyjęcie") ||
    (lastDecision?.type === "handover" &&
      lastDecision.payload.result === "Przekazano")
  )
    suggestion = {
      title: "Możesz przejść do dokumentacji",
      text: "Dodaj pozostałe fakty lub zakończ zdarzenie.",
      route: "documents",
    };
  if (lastDecision?.type === "decision") {
    const target = (
      {
        "Doprowadzenie do IW": "iw",
        "Przejazd do SOR": "sor",
        "Doprowadzenie do PDOZ": "pdoz",
      } as Record<string, Stage>
    )[String(lastDecision.payload.result)];
    if (target)
      suggestion = {
        title: stages[target].title,
        text: "Zapisz miejsce, czas przyjazdu i dalsze czynności.",
        route: `stage/${target}/${ref}`,
      };
  }
  return (
    <>
      <PageHeading
        eyebrow={`${dateLabel(event.createdAt)} · OD ${timeLabel(event.createdAt)}`}
        title={event.name || event.place || "Zdarzenie w toku"}
        subtitle={event.place && event.name ? event.place : undefined}
      />
      {event.status !== "in_progress" && (
        <div className="resume-banner">
          <span>{statuses[event.status]} · możesz edytować</span>
          <Button
            onClick={() => run(() => repo.status(event.id, "in_progress"))}
          >
            Wznów czynności
          </Button>
        </div>
      )}
      <div className="quick-grid">
        <button
          className="quick-action accent"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const person = await repo.addPerson(event.id);
              go(eventPath(event, `person/${person}/role`));
            })
          }
        >
          <UserPlus />
          <span>Dodaj osobę</span>
          <Plus size={16} />
        </button>
        <button
          className="quick-action"
          onClick={() => go(eventPath(event, "add"))}
        >
          <Plus />
          <span>Dodaj fakt</span>
          <ChevronRight size={16} />
        </button>
        <button
          className="quick-action"
          onClick={() => go(eventPath(event, "gps"))}
        >
          <Navigation />
          <span>Zapisz GPS</span>
          <ChevronRight size={16} />
        </button>
        <button
          className="quick-action"
          onClick={() => go(eventPath(event, "place"))}
        >
          <MapPin />
          <span>Miejsce</span>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="section-top">
        <h2>Osoby</h2>
        <span className="small muted">Bez danych osobowych</span>
      </div>
      {!event.persons.length ? (
        <button
          className="empty-person"
          onClick={() =>
            run(async () => {
              const person = await repo.addPerson(event.id);
              go(eventPath(event, `person/${person}/role`));
            })
          }
        >
          <Users size={22} />
          <span>
            Dodaj osobę A<small>Rola, stan i źródło tożsamości</small>
          </span>
          <Plus size={20} />
        </button>
      ) : (
        <div className="people-list">
          {event.persons.map((person) => (
            <button
              className="person-card"
              key={person.ref}
              onClick={() => go(eventPath(event, `person/${person.ref}/role`))}
            >
              <span className="avatar">{person.ref}</span>
              <span>
                <strong>Osoba {person.ref}</strong>
                <small>
                  {textValue(answer(event, person.ref, "role")) ||
                    "Rola do uzupełnienia"}
                </small>
                <small>{textValue(answer(event, person.ref, "state"))}</small>
              </span>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      )}
      {event.persons.length > 1 && (
        <label className="field">
          <span>Podpowiedzi dla osoby</span>
          <select value={ref} onChange={(e) => setRef(e.target.value)}>
            {event.persons.map((p) => (
              <option key={p.ref} value={p.ref}>
                Osoba {p.ref}
              </option>
            ))}
          </select>
        </label>
      )}
      {suggestion && (
        <button
          className="suggestion"
          onClick={() => go(eventPath(event, suggestion!.route))}
        >
          <Route size={21} />
          <span>
            <strong>{suggestion.title}</strong>
            <small>{suggestion.text}</small>
          </span>
          <ArrowRight size={19} />
        </button>
      )}
      <div className="section-top">
        <h2>Przebieg zdarzenia</h2>
        <a href={`#${eventPath(event, "timeline")}`}>
          Cała oś czasu
          <ArrowRight size={15} />
        </a>
      </div>
      <Timeline event={event} limit={4} />
      <Button className="full" onClick={() => go(eventPath(event, "add"))}>
        <Plus size={18} /> Dodaj kolejny wpis
      </Button>
    </>
  );
}
export function TimelineScreen({ event }: { event: EventRecord }) {
  const { save } = useTask();
  return (
    <>
      <PageHeading
        eyebrow={`${event.facts.length} WPISÓW`}
        title="Oś czasu"
        subtitle="Dotknij wpisu, aby poprawić treść lub godzinę."
      />
      <details className="panel details-panel">
        <summary>Nazwa i tagi zdarzenia</summary>
        <Field
          label="Nazwa własna"
          value={event.name}
          onChange={(name) =>
            save(
              repo.mutate(event.id, (e) => {
                e.name = name;
              }),
            )
          }
          placeholder="Opcjonalnie, bez danych osobowych"
        />
        <Field
          label="Tagi / słowa kluczowe"
          value={event.tags}
          onChange={(tags) =>
            save(
              repo.mutate(event.id, (e) => {
                e.tags = tags;
              }),
            )
          }
          placeholder="Np. doprowadzenie, Śródmieście"
        />
      </details>
      <Timeline event={event} />
      <Button
        tone="primary"
        className="full"
        onClick={() => go(eventPath(event, "add"))}
      >
        <Plus size={19} /> Dodaj wpis
      </Button>
      <div className="section-top">
        <h2>Punkty GPS</h2>
        <button
          className="text-button"
          onClick={() => go(eventPath(event, "gps"))}
        >
          Dodaj punkt
        </button>
      </div>
      {event.locations.length ? (
        event.locations.map((point) => (
          <DetailLink
            key={point.id}
            title={point.address || "Adres do uzupełnienia"}
            detail={`${timeLabel(point.timestamp)} · ${point.role} · dokładność ±${Math.round(point.accuracy)} m`}
            onClick={() => {
              const fact = event.facts.find(
                (f) => f.locationPointId === point.id,
              );
              if (fact) go(eventPath(event, `fact/${fact.id}`));
            }}
          />
        ))
      ) : (
        <p className="muted small">Nie zapisano punktów GPS.</p>
      )}
    </>
  );
}
export function Finish({ event }: { event: EventRecord }) {
  const { run, busy } = useTask();
  const [slide, setSlide] = useState(0);
  const missing = gaps(event);
  const pause = () =>
    run(async () => {
      await repo.status(event.id, "needs_completion");
      go("/");
    });
  const finish = () =>
    run(async () => {
      await repo.status(event.id, "completed");
      go(eventPath(event, "documents"));
    });
  return (
    <>
      <PageHeading
        eyebrow="MOŻESZ WRÓCIĆ W KAŻDEJ CHWILI"
        title="Zakończ na teraz"
        subtitle="Dotychczasowe odpowiedzi są już zapisane."
      />
      <section className="panel finish-panel">
        <span className="empty-icon">
          <Clock3 size={28} />
        </span>
        <h2>Uzupełnię później</h2>
        <p>Odłóż to zdarzenie i przejdź od razu do następnego.</p>
        <label className="finish-slider">
          <span>
            {slide > 80 ? "Puść, aby odłożyć" : "Przesuń, aby odłożyć →"}
          </span>
          <input
            type="range"
            aria-label="Przesuń, aby oznaczyć do uzupełnienia"
            min="0"
            max="100"
            value={slide}
            onChange={(e) => setSlide(Number(e.target.value))}
            onPointerUp={() => {
              if (slide >= 90) pause();
              setSlide(0);
            }}
            onKeyUp={(e) => {
              if (e.key === "End" || (e.key === "ArrowRight" && slide >= 90))
                pause();
            }}
          />
        </label>
        <button className="text-button" onClick={pause} disabled={busy}>
          Oznacz jako do uzupełnienia
        </button>
      </section>
      <section className="panel finish-panel">
        <h2>Wszystko gotowe</h2>
        <p>
          Oznacz zdarzenie jako zakończone. Nadal możesz edytować fakty i
          wygenerować dokumenty.
        </p>
        <Button tone="primary" onClick={finish} disabled={busy}>
          <Check size={19} /> Zakończ zdarzenie
        </Button>
      </section>
      {!!missing.length && (
        <section>
          <div className="section-top">
            <h2>Do przejrzenia</h2>
            <span className="small amber">{missing.length}</span>
          </div>
          <p className="muted small">Te braki nie blokują zakończenia.</p>
          {missing.map((gap, i) => (
            <DetailLink
              key={i}
              title={gap.label}
              onClick={() => go(eventPath(event, gap.route))}
            />
          ))}
        </section>
      )}
      <Button
        tone="ghost"
        className="full"
        onClick={() => go(eventPath(event))}
      >
        Wróć do zdarzenia
        <ArrowRight size={18} />
      </Button>
    </>
  );
}

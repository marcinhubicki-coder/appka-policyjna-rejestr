import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Database,
  FileCheck2,
  History,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from "lucide-react";
import {
  chronological,
  countLabel,
  dateLabel,
  statuses,
  timeLabel,
  type EventRecord,
  type EventStatus,
} from "../domain/model";
import { factDetail, factTitle } from "../domain/documents";
import { createDemo } from "../domain/demo";
import { repo } from "../data/repository";
import { requestPersistence } from "../device/platform";
import {
  Back,
  Button,
  Empty,
  PageHeading,
  eventPath,
  go,
  useTask,
} from "./shared";

export function EventCard({ event }: { event: EventRecord }) {
  const last = chronological(event)
    .filter(
      (f) =>
        ![
          "status",
          "start",
          "person_added",
          "person_answer",
          "place",
          "gps",
        ].includes(f.type) &&
        (f.payload.result || f.payload.text || f.payload.region),
    )
    .at(-1);
  const summary = last
    ? `${factTitle(last)}${last.payload.result ? ` · ${last.payload.result}` : ""}`
    : `${event.persons.length} os. · ${countLabel(event.facts.length, ["wpis", "wpisy", "wpisów"])}`;
  return (
    <button className="event-card" onClick={() => go(eventPath(event))}>
      <span className={`event-symbol ${event.status}`}>
        <MapPin size={21} />
      </span>
      <span className="event-info">
        <span className="event-date">
          {dateLabel(event.createdAt)}
          <span>·</span>
          {timeLabel(event.createdAt)}
          {event.demo && <span className="demo-label">PRZYKŁAD</span>}
        </span>
        <strong>{event.name || event.place || "Zdarzenie bez nazwy"}</strong>
        <span className="muted">
          {event.name ? event.place || summary : summary}
        </span>
        <span className={`status-label ${event.status}`}>
          {statuses[event.status]}
        </span>
      </span>
      <ChevronRight size={19} className="muted" />
    </button>
  );
}
export function Home({
  events,
  history = false,
}: {
  events: EventRecord[];
  history?: boolean;
}) {
  const { run, busy } = useTask();
  const [filter, setFilter] = useState<EventStatus | "all">("all");
  const [search, setSearch] = useState("");
  const start = () =>
    run(async () => {
      const eventId = await repo.create();
      void requestPersistence();
      go(eventPath(eventId, "gps/start"));
    });
  const filtered = events.filter((event) => {
    const haystack = [
      event.name,
      event.tags,
      event.place,
      dateLabel(event.createdAt),
      event.createdAt.slice(0, 10),
      ...event.facts.map(factDetail),
    ]
      .join(" ")
      .toLocaleLowerCase("pl");
    return (
      (filter === "all" || event.status === filter) &&
      haystack.includes(search.toLocaleLowerCase("pl"))
    );
  });
  return (
    <>
      <PageHeading
        eyebrow={new Date().toLocaleDateString("pl-PL", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title={history ? "Historia zdarzeń" : "Twój rejestr"}
        subtitle={
          history
            ? "Wróć do faktów, godzin i dokumentacji."
            : "Wszystko zaczyna się od faktów."
        }
      />
      {!history && (
        <button className="new-event" onClick={start} disabled={busy}>
          <span className="plus-circle">
            <Plus size={30} />
          </span>
          <span>
            <strong>Nowe zdarzenie</strong>
            <small>Zapisz pierwszy fakt. Resztę dodasz po drodze.</small>
          </span>
          <ArrowRight size={24} />
        </button>
      )}
      <div className="status-cards" aria-label="Filtruj zdarzenia">
        {(
          ["in_progress", "needs_completion", "completed"] as EventStatus[]
        ).map((status, i) => {
          const Icon = [Clock3, BookOpen, FileCheck2][i];
          return (
            <button
              key={status}
              className={`stat ${status} ${filter === status ? "active" : ""}`}
              aria-pressed={filter === status}
              onClick={() => setFilter(filter === status ? "all" : status)}
            >
              <Icon size={20} />
              <strong>
                {events.filter((e) => e.status === status).length}
              </strong>
              <span>{statuses[status]}</span>
            </button>
          );
        })}
      </div>
      <div className="section-top">
        <h2>
          {filter === "all"
            ? history
              ? "Wszystkie zdarzenia"
              : "Ostatnie zdarzenia"
            : statuses[filter]}
        </h2>
        {filter !== "all" ? (
          <button className="text-button" onClick={() => setFilter("all")}>
            Wszystkie
          </button>
        ) : !history && events.length > 5 ? (
          <a href="#/history">
            Pełna historia <ArrowRight size={15} />
          </a>
        ) : (
          <span className="small muted">
            {events.length
              ? `${events.length} w rejestrze`
              : "Na tym urządzeniu"}
          </span>
        )}
      </div>
      {(history || events.length > 3) && (
        <label className="search">
          <Search size={19} />
          <input
            aria-label="Szukaj zdarzeń"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Data, miejsce, nazwa lub fraza…"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Wyczyść wyszukiwanie"
            >
              ×
            </button>
          )}
        </label>
      )}
      <div className="event-list">
        {filtered
          .slice(0, history || search || filter !== "all" ? undefined : 5)
          .map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
      </div>
      {!filtered.length && (
        <Empty
          icon={<History size={30} />}
          title={
            events.length
              ? "Nie ma takich zdarzeń"
              : "Jeszcze nic tu nie zapisano"
          }
        >
          {events.length
            ? "Zmień filtr lub szukaną frazę."
            : "Rozpocznij zdarzenie. Możesz pominąć pytania i wrócić do nich później."}
        </Empty>
      )}
      {!history && (
        <div className="case-card">
          <div className="case-top">
            <span className="small eyebrow">POZNAJ PRZEPŁYW</span>
            <span className="demo-label">DANE PRZYKŁADOWE</span>
          </div>
          <h3>Jedno zdarzenie. Różne drogi.</h3>
          <p>Przejrzyj rozgałęzioną interwencję i jej dokumentację.</p>
          <div className="path-chips">
            <span>IW · odmowa</span>
            <ArrowRight size={15} />
            <span>SOR</span>
            <ArrowRight size={15} />
            <span>PDOZ</span>
          </div>
          <button
            className="text-button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const existing = events.find((e) => e.demo);
                go(eventPath(existing?.id ?? (await createDemo()), "timeline"));
              })
            }
          >
            Otwórz przykład
            <ArrowRight size={17} />
          </button>
        </div>
      )}
      <p className="local-foot">
        <ShieldCheck size={15} /> Dane zdarzeń pozostają na tym urządzeniu.
      </p>
    </>
  );
}
export function Settings() {
  const [persistent, setPersistent] = useState<boolean | undefined>();
  const [offlineReady, setOfflineReady] = useState(false);
  const { run } = useTask();
  useEffect(() => {
    navigator.storage
      ?.persisted?.()
      .then(setPersistent)
      .catch(() => {});
    navigator.serviceWorker
      ?.getRegistration()
      .then((r) => setOfflineReady(Boolean(r?.active)))
      .catch(() => {});
  }, []);
  return (
    <>
      <PageHeading eyebrow="NA TYM URZĄDZENIU" title="Ustawienia" />
      <section className="panel settings-panel">
        <Smartphone />
        <h2>Dodaj do ekranu początkowego</h2>
        <p>
          W Safari wybierz <strong>Udostępnij</strong>, a następnie{" "}
          <strong>Do ekranu początkowego</strong>. Otwieraj Rejestr z tej samej
          ikony.
        </p>
      </section>
      <section className="panel settings-panel">
        <WifiOff />
        <h2>Praca bez internetu</h2>
        <p>
          {offlineReady
            ? "Aplikacja jest przygotowana do uruchamiania offline."
            : "Otwórz aplikację online i poczekaj na pobranie plików do pracy offline."}{" "}
          Fakty i dokumenty działają bez sieci. Pobranie nazwy ulicy wymaga
          internetu; adres możesz zawsze wpisać ręcznie.
        </p>
      </section>
      <section className="panel settings-panel">
        <Database />
        <h2>Zapis lokalny</h2>
        <p>
          Każda odpowiedź zapisuje się od razu. Wskaźnik u góry potwierdza
          zakończenie zapisu. Usunięcie danych witryny usuwa również zdarzenia.
          Dane nie przechodzą między urządzeniami ani różnymi adresami
          aplikacji.
        </p>
        <p className="small muted">
          {persistent === true
            ? "Przeglądarka przyznała trwałe przechowywanie."
            : "Przeglądarka zarządza miejscem na dane. Tryb prywatny nie służy do trwałego rejestru."}
        </p>
        {persistent !== true && (
          <Button
            onClick={() =>
              run(async () => {
                setPersistent(await requestPersistence());
              })
            }
          >
            Poproś o trwałe przechowywanie
          </Button>
        )}
      </section>
      <section className="panel settings-panel">
        <ShieldCheck />
        <h2>Osoby A/B/C</h2>
        <p>
          W uwagach i rysopisie pomijaj imiona, nazwiska, PESEL, numery
          dokumentów i wyniki sprawdzeń w systemach. Dane osób możesz uzupełnić
          ręcznie na wydruku.
        </p>
      </section>
      <p className="small muted">
        Rejestr · MVP 0.1.0
        <br />
        Adresy GPS:{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          © OpenStreetMap contributors
        </a>{" "}
        / Nominatim. Po ręcznym pobraniu GPS współrzędne służą do wyszukania
        adresu. Treść zdarzeń nie jest wysyłana.
      </p>
      <Back onClick={() => go("/")} label="Do rejestru" />
    </>
  );
}

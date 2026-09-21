import React, { useEffect, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { useLiveQuery } from "dexie-react-hooks";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  ArrowLeft,
  Check,
  Clock3,
  History,
  Home as HomeIcon,
  Pause,
  Settings2,
  ShieldCheck,
  WifiOff,
  X,
} from "lucide-react";
import { clearStorageError, db, saveState } from "./data/repository";
import { statuses } from "./domain/model";
import { stages, type Stage } from "./domain/catalog";
import { Home, Settings } from "./ui/Home";
import { Live, TimelineScreen, Finish } from "./ui/Record";
import { PersonScreen } from "./ui/Person";
import { AddFact, FactEditor } from "./ui/Facts";
import { GPS, Place, StageScreen } from "./ui/Places";
import { Documents } from "./ui/Documents";
import { Brand, Button, NoticeContext, eventPath, go } from "./ui/shared";
import "./styles.css";

function useRoute() {
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  useEffect(() => {
    const changed = () => {
      setRoute(location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  return route;
}
function App() {
  const route = useRoute();
  const parts = route.split("/").filter(Boolean);
  const events = useLiveQuery(() =>
    db.events.orderBy("updatedAt").reverse().toArray(),
  );
  const saving = useSyncExternalStore(
    saveState.subscribe,
    saveState.getSnapshot,
  );
  const [online, setOnline] = useState(navigator.onLine);
  const [notice, setNotice] = useState("");
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError() {
      setNotice(
        "Nie udało się przygotować pracy offline. Połącz się z internetem i odśwież aplikację.",
      );
    },
  });
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    addEventListener("online", update);
    addEventListener("offline", update);
    return () => {
      removeEventListener("online", update);
      removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  const event =
    parts[0] === "event" ? events?.find((e) => e.id === parts[1]) : undefined;
  const screen = parts[2] || "live";
  const navigation = [
    { route: "/", title: "Rejestr", icon: HomeIcon },
    { route: "/history", title: "Historia", icon: History },
    { route: "/settings", title: "Ustawienia", icon: Settings2 },
  ];
  let content: React.ReactNode;
  if (!events)
    content = (
      <div className="loading" role="status">
        <span className="spinner" />
        Otwieram rejestr…
      </div>
    );
  else if (parts[0] === "event" && !event)
    content = (
      <div className="empty">
        <h1>Nie odnaleziono zdarzenia</h1>
        <p>
          Dane są dostępne tylko w przeglądarce i pod adresem, gdzie je
          zapisano.
        </p>
        <Button onClick={() => go("/")}>Wróć do rejestru</Button>
      </div>
    );
  else if (event) {
    switch (screen) {
      case "timeline":
        content = <TimelineScreen event={event} />;
        break;
      case "documents":
        content = <Documents event={event} />;
        break;
      case "finish":
        content = <Finish event={event} />;
        break;
      case "place":
        content = <Place event={event} />;
        break;
      case "gps":
        content = <GPS event={event} context={parts[3]} personRef={parts[4]} />;
        break;
      case "person":
        content = (
          <PersonScreen
            event={event}
            personRef={parts[3]}
            step={parts[4] || "role"}
          />
        );
        break;
      case "add":
        content = <AddFact event={event} />;
        break;
      case "fact":
        content = <FactEditor event={event} factId={parts[3]} />;
        break;
      case "stage":
        content =
          parts[3] in stages ? (
            <StageScreen
              event={event}
              stageKey={parts[3] as Stage}
              personRef={parts[4]}
            />
          ) : (
            <Live event={event} />
          );
        break;
      default:
        content = <Live event={event} />;
    }
  } else if (parts[0] === "settings") content = <Settings />;
  else content = <Home events={events} history={parts[0] === "history"} />;
  return (
    <NoticeContext.Provider value={setNotice}>
      <div className="app-shell">
        <aside className="sidebar">
          <a href="#/" aria-label="Rejestr — ekran główny">
            <Brand />
          </a>
          <div className="sidebar-divider" />
          <span className="nav-caption">MIEJSCE NA FAKTY</span>
          <nav>
            {navigation.map(({ route: href, title, icon: Icon }) => (
              <a
                key={href}
                href={`#${href}`}
                className={
                  route === href || (href === "/" && !!event) ? "active" : ""
                }
              >
                <Icon size={21} />
                {title}
              </a>
            ))}
          </nav>
          <div className="sidebar-note">
            <ShieldCheck size={25} />
            <strong>
              Minimum danych.
              <br />
              Pełny przebieg.
            </strong>
            <p>
              Osoby A/B/C.
              <br />
              Zapis na Twoim urządzeniu.
            </p>
            <small>Rejestr · MVP 0.1.0</small>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <a href="#/" className="mobile-brand">
              <Brand />
            </a>
            <div className="desktop-context">
              Appka policyjna <span>/</span> Rejestr
            </div>
            <span
              className={`save-status ${saving.error ? "error" : ""}`}
              role="status"
            >
              {saving.error ? (
                <>
                  <span>!</span> Błąd zapisu
                </>
              ) : saving.pending ? (
                <>
                  <span className="spinner" /> Zapisuję…
                </>
              ) : (
                <>
                  <Check size={15} /> Zapis lokalny
                </>
              )}
              {!online && <WifiOff size={16} aria-label="Bez internetu" />}
            </span>
          </header>
          {saving.error && (
            <div className="error-banner" role="alert">
              <p>{saving.error}</p>
              <button onClick={clearStorageError}>
                Rozumiem — ponowię zmianę
              </button>
            </div>
          )}
          {(needRefresh || offlineReady) && (
            <div className="update-banner">
              <span>
                {needRefresh
                  ? "Nowa wersja jest gotowa."
                  : "Rejestr jest gotowy do pracy offline."}
              </span>
              {needRefresh ? (
                <>
                  <button
                    disabled={saving.pending > 0 || !!saving.error}
                    onClick={() => void updateServiceWorker(true)}
                  >
                    Aktualizuj
                  </button>
                  <button
                    aria-label="Później"
                    onClick={() => setNeedRefresh(false)}
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <button
                  aria-label="Zamknij"
                  onClick={() => setOfflineReady(false)}
                >
                  <X size={17} />
                </button>
              )}
            </div>
          )}
          {event && (
            <div className="event-navigation">
              <div className="event-nav-top">
                <button className="back-link" onClick={() => go("/")}>
                  <ArrowLeft size={17} />
                  Rejestr
                </button>
                <span className={`status-label ${event.status}`}>
                  {event.demo ? "PRZYKŁAD · " : ""}
                  {statuses[event.status]}
                </span>
                <button
                  className="end-button"
                  onClick={() => go(eventPath(event, "finish"))}
                >
                  <Pause size={16} /> Zakończ
                </button>
              </div>
              <nav aria-label="Nawigacja zdarzenia">
                <a
                  className={
                    !["timeline", "documents"].includes(screen) ? "active" : ""
                  }
                  href={`#${eventPath(event)}`}
                >
                  Bieżące
                </a>
                <a
                  className={screen === "timeline" ? "active" : ""}
                  href={`#${eventPath(event, "timeline")}`}
                >
                  <Clock3 size={16} /> Oś czasu{" "}
                  <span>{event.facts.length}</span>
                </a>
                <a
                  className={screen === "documents" ? "active" : ""}
                  href={`#${eventPath(event, "documents")}`}
                >
                  Dokumenty
                </a>
              </nav>
            </div>
          )}
          <main className={event ? "event-main" : ""} key={route}>
            {content}
          </main>
          {!event && (
            <nav className="bottom-nav" aria-label="Nawigacja główna">
              {navigation.map(({ route: href, title, icon: Icon }) => (
                <a
                  key={href}
                  href={`#${href}`}
                  className={route === href ? "active" : ""}
                >
                  <Icon size={21} />
                  <span>{title}</span>
                </a>
              ))}
            </nav>
          )}
        </div>
        {notice && (
          <div className="toast" role="status">
            <span>{notice}</span>
            <button
              aria-label="Zamknij komunikat"
              onClick={() => setNotice("")}
            >
              <X size={17} />
            </button>
          </div>
        )}
      </div>
    </NoticeContext.Provider>
  );
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="fatal-error">
        <h1>Nie udało się otworzyć rejestru</h1>
        <p>
          Sprawdź dostęp do pamięci przeglądarki i wolne miejsce. Nie usuwaj
          danych witryny — to usunęłoby zdarzenia.
        </p>
        <button className="button primary" onClick={() => location.reload()}>
          Spróbuj ponownie
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

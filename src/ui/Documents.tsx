import { useState } from "react";
import { ArrowRight, Copy, FileText, Printer, Share2 } from "lucide-react";
import { repo } from "../data/repository";
import { chronological, timeLabel, type EventRecord } from "../domain/model";
import { factTitle, gaps, phrase, renderDocument } from "../domain/documents";
import { copyText, printDocument, shareText } from "../device/platform";
import {
  Button,
  DetailLink,
  PageHeading,
  Toggle,
  eventPath,
  go,
  useTask,
} from "./shared";

export function Documents({ event }: { event: EventRecord }) {
  const [mode, setMode] = useState<"note" | "brief">("note");
  const { run, save, notify } = useTask();
  const text = renderDocument(event, mode);
  const missing = gaps(event);
  return (
    <>
      <div className="no-print">
        <PageHeading
          eyebrow="JEDNO ZDARZENIE · DWA DOKUMENTY"
          title="Dokumentacja"
          subtitle="Tekst z zapisanych faktów. Przejrzyj go przed użyciem."
        />
        <div
          className="document-tabs"
          role="tablist"
          aria-label="Rodzaj dokumentu"
        >
          <button
            role="tab"
            aria-selected={mode === "note"}
            className={mode === "note" ? "active" : ""}
            onClick={() => setMode("note")}
          >
            <FileText size={18} /> Notatka urzędowa
          </button>
          <button
            role="tab"
            aria-selected={mode === "brief"}
            className={mode === "brief" ? "active" : ""}
            onClick={() => setMode("brief")}
          >
            Skrót do notatnika
          </button>
        </div>
        {!!missing.length && (
          <details className="panel details-panel gaps">
            <summary>Do przejrzenia · {missing.length}</summary>
            <p className="small muted">
              Niedokończone czynności nie są dopowiadane w dokumencie.
            </p>
            {missing.map((gap, i) => (
              <DetailLink
                key={i}
                title={gap.label}
                onClick={() => go(eventPath(event, gap.route))}
              />
            ))}
          </details>
        )}
        <div className="document-actions">
          <Button
            onClick={() =>
              run(async () => {
                await copyText(text);
                notify("Skopiowano tekst dokumentu.");
              })
            }
          >
            <Copy size={18} /> Kopiuj
          </Button>
          <Button onClick={() => run(() => shareText(text))}>
            <Share2 size={18} /> Udostępnij
          </Button>
          <Button tone="primary" onClick={printDocument}>
            <Printer size={18} /> Druk / PDF
          </Button>
        </div>
        <details className="panel details-panel">
          <summary>Wybierz fakty do tego dokumentu</summary>
          <div className="fact-inclusions">
            {chronological(event).map((fact) => (
              <label key={`${mode}-${fact.id}`}>
                <Toggle
                  checked={
                    mode === "note"
                      ? fact.includeInNote !== false
                      : fact.includeInBrief !== false
                  }
                  onChange={(value) =>
                    save(
                      repo.patchFact(
                        event.id,
                        fact.id,
                        mode === "note"
                          ? { includeInNote: value }
                          : { includeInBrief: value },
                      ),
                    )
                  }
                />
                <span>
                  <strong>
                    {timeLabel(fact.timestamp)} · {factTitle(fact)}
                    {fact.personRef ? ` · ${fact.personRef}` : ""}
                  </strong>
                  <small>
                    {phrase(fact) || "Niepełny wpis — pominięty w tekście"}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </details>
        <div className="section-top">
          <h2>Podgląd do druku</h2>
          <span className="small muted">
            A4 · {mode === "note" ? "projekt notatki" : "skrót"}
          </span>
        </div>
      </div>
      <article className="paper print-area">
        <pre>{text}</pre>
      </article>
      <p className="hint no-print">
        „Druk / PDF” otwiera drukowanie systemowe. Dane osób i podpis uzupełnisz
        ręcznie na wydruku.
      </p>
      <Button
        className="full no-print"
        onClick={() => go(eventPath(event, "finish"))}
      >
        Zakończ lub uzupełnij później
        <ArrowRight size={18} />
      </Button>
    </>
  );
}

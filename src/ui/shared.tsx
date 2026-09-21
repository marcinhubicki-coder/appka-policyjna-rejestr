import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  MapPin,
  Shield,
  X,
} from "lucide-react";
import { haptic } from "../device/platform";
import { mapsUrl } from "../device/location";
import type { EventRecord } from "../domain/model";

export const NoticeContext = createContext<(text: string) => void>(() => {});
export function useTask() {
  const notify = useContext(NoticeContext);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const run = async (work: () => Promise<unknown>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await work();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Nie udało się wykonać czynności. Spróbuj ponownie.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  // Autosave wywoływany dla każdej zmiany, bez odrzucania szybkich odpowiedzi.
  const save = (work: Promise<unknown>) => {
    work.catch((error) =>
      notify(error instanceof Error ? error.message : "Nie udało się zapisać."),
    );
  };
  return { run, save, busy, notify };
}
export function go(path: string) {
  location.hash = path.startsWith("/") ? path : `/${path}`;
}
export function eventPath(event: EventRecord | string, route = "live") {
  return `/event/${typeof event === "string" ? event : event.id}/${route}`;
}
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon">
        <Shield size={25} strokeWidth={1.7} />
        <span />
      </span>
      <span>
        Rejestr<small>Appka policyjna</small>
      </span>
    </div>
  );
}
export function Button({
  children,
  onClick,
  tone = "secondary",
  className = "",
  disabled = false,
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type="button"
      className={`button ${tone} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
export function Choice({
  value,
  selected,
  onClick,
  children,
}: {
  value: string;
  selected: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`choice ${selected ? "selected" : ""}`}
      aria-pressed={selected}
      onClick={() => {
        haptic();
        onClick();
      }}
    >
      {children || value}
    </button>
  );
}
// Natychmiastowy stan kontrolki; wcześniejszy odczyt IDB nie cofa nowszego tapnięcia.
export function useBufferedValue<T>(value: T): [T, (next: T) => void] {
  const [current, setCurrent] = useState(value);
  const pending = useRef<{ value: T } | null>(null);
  const signature = JSON.stringify(value);
  useEffect(() => {
    if (pending.current && JSON.stringify(pending.current.value) !== signature)
      return;
    pending.current = null;
    setCurrent(value);
  }, [signature]);
  return [
    current,
    (next) => {
      pending.current = { value: next };
      setCurrent(next);
    },
  ];
}
export function Toggle({
  checked,
  onChange,
  ...props
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  role?: "switch";
}) {
  const [value, setValue] = useBufferedValue(checked);
  return (
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => {
        setValue(e.target.checked);
        onChange(e.target.checked);
      }}
      {...props}
    />
  );
}
export function Choices({
  options,
  value,
  onChange,
  multi = false,
  compact = false,
}: {
  options: string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multi?: boolean;
  compact?: boolean;
}) {
  const [selected, setSelected] = useBufferedValue(value);
  const change = (next: string | string[]) => {
    setSelected(next);
    onChange(next);
  };
  return (
    <div className={`choices ${compact ? "compact" : ""}`}>
      {options.map((option) => (
        <Choice
          key={option}
          value={option}
          selected={
            Array.isArray(selected)
              ? selected.includes(option)
              : selected === option
          }
          onClick={() => {
            if (multi) {
              const values = Array.isArray(selected) ? selected : [];
              change(
                values.includes(option)
                  ? values.filter((v) => v !== option)
                  : [...values, option],
              );
            } else change(selected === option ? "" : option);
          }}
        />
      ))}
    </div>
  );
}
export function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
  inputMode,
  id,
  maxLength = 2000,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
  inputMode?: "decimal" | "numeric";
  id?: string;
  maxLength?: number;
}) {
  // Lokalny bufor chroni kursor przy asynchronicznych odczytach IndexedDB.
  const [draft, setDraft] = useBufferedValue(value);
  const props = {
    value: draft,
    id,
    placeholder,
    maxLength,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setDraft(e.target.value);
      onChange(e.target.value);
    },
  };
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea {...props} rows={3} />
      ) : (
        <input
          {...props}
          type={type}
          inputMode={inputMode}
          autoComplete="off"
        />
      )}
    </label>
  );
}
export function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function Back({
  onClick,
  label = "Wróć",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button className="back-link" onClick={onClick}>
      <ArrowLeft size={18} />
      {label}
    </button>
  );
}
export function Empty({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function MapLink({ address }: { address: string }) {
  return address ? (
    <a
      className="button secondary"
      href={mapsUrl(address)}
      target="_blank"
      rel="noreferrer"
    >
      <MapPin size={18} /> Otwórz w Mapach
    </a>
  ) : null;
}
export function SwipePanel({
  onNext,
  onBack,
  children,
}: {
  onNext: () => void;
  onBack: () => void;
  children: ReactNode;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const down = (event: TouchEvent) => {
    if (
      (event.target as HTMLElement).closest(
        "input, textarea, select, button, a",
      )
    ) {
      start.current = null;
      return;
    }
    start.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  };
  const up = (event: TouchEvent) => {
    if (!start.current) return;
    const dx = event.changedTouches[0].clientX - start.current.x;
    const dy = event.changedTouches[0].clientY - start.current.y;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.7)
      dx < 0 ? onNext() : onBack();
    start.current = null;
  };
  return (
    <section className="question" onTouchStart={down} onTouchEnd={up}>
      {children}
    </section>
  );
}
export function FlowFooter({
  next,
  back,
  skip,
  nextLabel = "Dalej",
}: {
  next: () => void;
  back?: () => void;
  skip?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flow-footer">
      {back && (
        <Button tone="ghost" onClick={back}>
          <ArrowLeft size={18} /> Wstecz
        </Button>
      )}
      {skip && (
        <Button tone="ghost" onClick={skip}>
          Pomiń
        </Button>
      )}
      <Button tone="primary" onClick={next}>
        {nextLabel}
        <ArrowRight size={19} />
      </Button>
    </div>
  );
}
export function Success({ children }: { children: ReactNode }) {
  return (
    <div className="success-line">
      <Check size={17} />
      {children}
    </div>
  );
}
export function DetailLink({
  title,
  detail,
  onClick,
}: {
  title: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button className="detail-link" onClick={onClick}>
      <span>
        {title}
        {detail && <small>{detail}</small>}
      </span>
      <ChevronRight size={19} />
    </button>
  );
}
export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="icon-button" aria-label="Zamknij" onClick={onClick}>
      <X size={20} />
    </button>
  );
}

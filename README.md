# Appka policyjna — Rejestr

PWA do szybkiego rejestrowania przebiegu interwencji i późniejszego generowania dokumentacji służbowej.

## Założenie

Aplikacja nie jest drugim systemem policyjnym i nie ma powielać danych z systemów służbowych. Jej rolą jest zapis minimalnego zestawu faktów potrzebnych do:
- odtworzenia chronologii interwencji,
- zapamiętania kluczowych miejsc i godzin,
- późniejszego uzupełnienia braków,
- wygenerowania różnych form dokumentacji z jednego zestawu faktów.

## Najważniejsze zasady MVP

- PWA projektowana przede wszystkim pod iPhone.
- Offline-first.
- Każde nowe zdarzenie jest zapisywane od razu.
- Każda odpowiedź/fakt zapisuje się natychmiast.
- Reload lub ubicie PWA przez iOS nie może powodować utraty danych.
- Brak danych osobowych osób A/B/C.
- Nie kopiujemy wyników z policyjnych systemów.
- Tożsamość: zapisujemy tylko źródło ustalenia (np. dowód, paszport, prawo jazdy, oświadczenie ustne).
- GPS: zapisujemy ręcznie tylko potrzebne punkty i czas; użytkownik widzi adres/ulicę, współrzędne techniczne mogą pozostać w tle.
- Brak własnej nawigacji — opcjonalne otwarcie zewnętrznej aplikacji Mapy.
- Brak LLM w generatorze dokumentów MVP — tekst składa się z kontrolowanych, gotowych fraz.
- Jedno zdarzenie może wygenerować wiele wyjść, np. notatkę urzędową i skrót do notatnika służbowego.
- Użytkownik może pominąć pytanie lub zakończyć zdarzenie jako „Do uzupełnienia” i wrócić później.

## Dokumentacja

- `AGENTS.md` — zasady pracy dla Codexa.
- `docs/SPEC-MVP.md` — specyfikacja funkcjonalna MVP.
- `docs/CASE-STUDY.md` — referencyjny scenariusz testowy.
- `docs/PRODUCTION-PLAN.md` — kolejność implementacji i kryteria odbioru.

## Uruchomienie MVP

Wymagany Node.js 22.12+ (lub 24).

```sh
npm ci
npm run dev
```

Build i podgląd wersji z działaniem offline:

```sh
npm run build
npm run preview
```

Service worker działa w buildzie produkcyjnym. Do GPS i instalacji PWA wymagane jest HTTPS albo localhost. Konfiguracja Vercela znajduje się w `vercel.json`.

## Zaimplementowany zakres

- Start zdarzenia i każda zmiana zapisane w IndexedDB, wiele równoległych zdarzeń, historia i wyszukiwanie.
- Osoby A/B/C, krótkie pomijalne pytania, swipe między pytaniami, źródło tożsamości, opcjonalny rysopis.
- Mapa obrażeń przód/tył z osobnym rodzajem i pochodzeniem każdego obrażenia.
- Czynności, wyniki i decyzje jako oddzielne fakty; edytowalne daty/godziny.
- GPS na żądanie, lokalne podpowiedzi ulic, dowolne adresy, link do Map.
- Etapy IW/SOR/PDOZ, krótkie i długie zakończenia, slider „uzupełnię później”.
- Notatka i skrót ze wspólnych faktów, niezależny wybór faktów dla każdego dokumentu, kopiowanie, udostępnianie, druk/PDF A4.
- PWA, aktualizacja na żądanie, działanie offline i komunikaty błędów zapisu.

Na ekranie głównym „Otwórz przykład” tworzy jawnie oznaczone dane demonstracyjne. Nie ma domyślnie wypełnionego rejestru.

## Architektura

- `src/domain/` — jawny model, katalog czynności i lokalnych ulic, regułowy renderer dokumentów, przykład.
- `src/data/repository.ts` — transakcje IndexedDB / Dexie i stan zapisu. Mutacje czytają aktualny rekord w transakcji, aby nie nadpisywać równoległych zmian.
- `src/device/` — adaptery GPS, reverse geocoding, Mapy, share, schowek, druk i haptics.
- `src/ui/` — ekrany i kontrolki React. Hash routing nie wymaga backendu ani reguł przekierowań.

Pozycja jest utrwalana **przed** zapytaniem o adres. Brak sieci lub odmowa geokodowania nie usuwa punktu. Adres z GPS wymaga sprawdzenia przez użytkownika; może wskazywać pobliski obiekt.

Domyślny adapter adresów korzysta z Nominatim / OpenStreetMap, wyłącznie po ręcznym pobraniu GPS. Przesyła współrzędne, nigdy treść zdarzeń. Posiada ograniczenie częstotliwości, cache w sesji i timeout. Dostawcę można zastąpić przez `VITE_GEOCODER_URL` (kontrakt odpowiedzi Nominatim) lub wymianę adaptera; autocomplete pozostaje lokalne. Źródła: [API](https://nominatim.org/release-docs/latest/api/Reverse/), [warunki użycia](https://operations.osmfoundation.org/policies/nominatim/).

## Weryfikacja

```sh
npm test
npx playwright install chromium
npm run build
npm run test:e2e
```

Testy domenowe sprawdzają zapis, rozdzielenie osób, korekty i brak dopowiadania faktów. Testy przeglądarkowe przechodzą długą i krótką ścieżkę, reload, ponowne otwarcie offline, GPS bez sieci/zgody, druk i wybór treści dokumentów. Opcjonalna zmienna `PLAYWRIGHT_CHROMIUM_EXECUTABLE` wskazuje własny Chromium w środowisku testowym.

## Granice MVP

Dane są związane z urządzeniem, profilem przeglądarki i adresem witryny. Skasowanie danych Safari usuwa rejestr. Aplikacja prosi przeglądarkę o trwałe przechowywanie, lecz nie może zagwarantować zachowania danych po usunięciu pamięci przez system. Nie jest to kopia zapasowa.

Generator tworzy **projekt** dokumentacji, bez ustalania podstaw prawnych, automatycznych decyzji i uzupełniania niepodanych wyników. Wynik badania wymaga jawnej jednostki; mg/l i ‰ nie są przeliczane. Braki nie blokują zakończenia zdarzenia.

Przed pracą terenową pozostaje sprawdzenie na fizycznym iPhonie: instalacja z Safari, rzeczywisty GPS, klawiatura, zamknięcie PWA przez system oraz AirPrint/PDF. Emulacja mobilna nie zastępuje tych prób.

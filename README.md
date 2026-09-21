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

Na tym etapie repo celowo zawiera najpierw specyfikację. Kod powinien powstać dopiero na jej podstawie.

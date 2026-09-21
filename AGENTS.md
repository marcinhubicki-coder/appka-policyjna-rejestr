# AGENTS.md — instrukcje dla Codexa

## Cel

Budujemy MVP PWA „Appka policyjna — Rejestr”: osobisty, terenowy rejestr faktów i chronologii interwencji, z którego później można wygenerować dokumentację.

Projekt jest **personal-first**: priorytetem jest szybkość i wygoda autora projektu, nie uśrednione wzorce UX.

## Najważniejsze ograniczenia

1. Nie zapisuj rzeczywistych danych osobowych osób objętych interwencją.
2. Osoby oznaczamy A/B/C.
3. Nie implementuj kopiowania wyników z KSIP/SIS/CEPiK ani innych systemów.
4. Dla tożsamości zapisujemy tylko źródło ustalenia:
   - dowód osobisty,
   - paszport,
   - prawo jazdy,
   - inny dokument,
   - oświadczenie ustne,
   - tożsamości nie ustalono.
5. Nie używaj LLM do tworzenia tekstu dokumentacji w MVP.
6. Generator dokumentów ma używać kontrolowanych fraz i reguł.
7. Nie buduj własnej nawigacji ani śledzenia GPS w tle w MVP.
8. GPS pobieramy na żądanie użytkownika.
9. Po pobraniu GPS pokazuj czytelny adres/ulicę przez reverse geocoding; współrzędne mogą zostać technicznie zapisane w tle.
10. Każdy ekran i każde pytanie musi mieć możliwość pominięcia, jeśli dane nie są konieczne do zapisania bieżącego stanu.

## Trwałość danych — wymóg krytyczny

Nie istnieje stan „niezapisany”.

- Kliknięcie „Nowe zdarzenie” natychmiast tworzy rekord ze statusem `in_progress`.
- Każdy fakt i każda odpowiedź są zapisywane od razu w lokalnej bazie.
- Nie czekaj na przycisk „Zapisz cały formularz”.
- Po reloadzie / ubiciu aplikacji użytkownik musi móc kontynuować zdarzenie.
- Ekran główny pokazuje aktywne i niedokończone zdarzenia.

Preferowana lokalna baza: IndexedDB z prostą warstwą repozytorium.

## Statusy zdarzenia

- `in_progress` — w toku,
- `needs_completion` — czynności przerwane/zakończone, ale dane lub dokumentacja wymagają uzupełnienia,
- `completed` — zakończone.

Użytkownik może mieć więcej niż jedno niedokończone zdarzenie.

## Model UX

Dwa poziomy:

### Tryb bieżący
- maksymalnie szybki,
- duże pytania,
- swipe / tap / płynne toggle,
- minimum tekstu,
- liquid-glass / glass-and-layered feeling,
- obsługa jedną ręką,
- aktywny wybór sygnalizowany tłem — bez dodatkowego checkmarka, jeśli tło już jasno pokazuje stan.

### Edycja po zdarzeniu
- pełny podgląd,
- oś czasu,
- osoby A/B/C,
- fakty,
- punkty GPS,
- braki,
- dokumenty.

## Oś czasu

Oś czasu jest rdzeniem systemu i musi być dostępna z każdego ekranu roboczego.

Każdy fakt powinien zawierać co najmniej:
- `eventId`,
- `type`,
- `timestamp`,
- opcjonalnie `personRef` (A/B/C),
- opcjonalnie `locationPointId`,
- `payload`,
- opcjonalnie `sourceType`.

Nie narzucaj typu zdarzenia na początku. Znaczenie i kategoria wynikają z faktów post factum.

## Miejsca i GPS

Przy tworzeniu zdarzenia:
1. opcjonalnie „Dodaj swoją pozycję” — punkt startowy,
2. potem miejsce/adres docelowy.

Adres docelowy:
- zwykły input,
- autocomplete ulic Wrocławia-Śródmieścia jako ułatwienie,
- wybór z listy nigdy nie jest obowiązkowy,
- dowolny tekst musi być akceptowany.

Przy każdym ważnym etapie/miejscu powinien być opcjonalny „Zapisz punkt GPS”, który zapisuje:
- czas,
- współrzędne techniczne,
- dokładność,
- czytelny adres/ulicę,
- powiązanie z etapem/faktem.

Nawigacja: tylko link/akcja „Otwórz w Mapach”.

## Pytania i logika warunkowa

Pytania mogą być:
- binarne,
- 3-stanowe,
- multiselect,
- wybór + pole uzupełniające,
- wybór, który otwiera dalszą gałąź.

Przykład:
- obrażenia: brak / są,
- jeśli są → mapa ciała + rodzaj + pochodzenie,
- jeśli tożsamości nie ustalono → opcjonalny generator rysopisu.

System nie może wymuszać pełnego uzupełnienia podczas dynamicznej interwencji.

## Dokumentacja

Z jednego zbioru faktów generujemy różne wyjścia:
- pełna notatka urzędowa,
- skrót do notatnika służbowego,
- później inne wzory.

Silnik fraz powinien rozróżniać m.in.:
- „ustalono, że…”,
- „osoba oświadczyła, że…”,
- „dokonano…”,
- „ujawniono…”,
- „lekarz podjął decyzję…”.

System nie dopowiada faktów i nie tworzy narracji ponad zapisane dane.

## Styl kodu i zakres MVP

- Nie over-engineeruj.
- Nie dodawaj backendu, logowania, synchronizacji ani kont użytkowników w pierwszym MVP.
- Nie dodawaj funkcji, których nie ma w spec.
- PWA ma działać lokalnie i offline.
- Projektuj kod tak, aby warstwa urządzenia (GPS, share, druk, haptics) była odseparowana od domeny; ułatwi to późniejsze opakowanie przez Capacitor i przejście do iOS.
- Preferuj małe moduły domenowe i jawny model danych.
- Mobile-first, testowane przede wszystkim na iPhone 13 Pro / Safari / PWA.

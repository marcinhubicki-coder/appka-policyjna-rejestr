# Plan produkcji MVP dla Codexa

## Założenie

Najpierw budujemy działający pionowy przekrój produktu, a nie wszystkie warianty procedur.

Priorytety:
1. trwałość danych,
2. szybkość obsługi,
3. oś czasu,
4. GPS na żądanie,
5. historia,
6. prosty silnik dokumentacji.

## Faza 0 — bootstrap projektu

Cel:
- uruchomiona instalowalna PWA,
- dev build i production build,
- podstawowy routing,
- styl mobilny,
- brak logiki biznesowej.

Preferowany stack:
- React + TypeScript + Vite,
- prosty router,
- IndexedDB przez małą bibliotekę typu Dexie,
- PWA przez vite-plugin-pwa,
- CSS własny / lekkie komponenty, bez ciężkiego UI frameworka.

Kryterium odbioru:
- działa w Safari,
- można dodać do ekranu początkowego,
- shell uruchamia się offline.

## Faza 1 — model danych i autosave

Implementacja:
- Event,
- Fact,
- PersonRef,
- LocationPoint,
- statusy,
- repozytorium IndexedDB.

Najpierw testy modelu, potem UI.

Kryterium:
- „Nowe zdarzenie” od razu istnieje w bazie,
- po reloadzie nadal jest,
- każda zmiana zapisuje się bez końcowego „Save”.

## Faza 2 — ekran główny + historia

Ekran główny:
- Nowe zdarzenie,
- W toku,
- Do uzupełnienia,
- Ostatnie zakończone.

Historia:
- lista,
- status,
- data/czas,
- nazwa opcjonalna,
- wyszukiwanie po nazwie/frazie.

Kryterium:
- można rozpocząć, zamknąć aplikację i wrócić przez „Dokończ”.

## Faza 3 — lokalizacja startowa i miejsce zdarzenia

- „Dodaj swoją pozycję”,
- Geolocation API,
- reverse geocoding za adapterem,
- czytelny adres,
- „Pomiń”,
- miejsce docelowe jako input,
- autocomplete ulic Wrocławia-Śródmieścia,
- dowolny tekst dozwolony.

Ważne:
- słownik ulic ma być źródłem lokalnym/plikowym,
- brak sieci nie może blokować wpisania miejsca.

## Faza 4 — tryb bieżący + oś czasu

- stała nawigacja do osi czasu,
- dodawanie faktów,
- natychmiastowe timestampy,
- edycja istniejącego wpisu,
- opcjonalne „Zapisz punkt GPS” w dowolnym momencie.

Kryterium:
- oś czasu jest źródłem chronologii i nie ginie po reloadzie.

## Faza 5 — osoby A/B/C i szybkie pytania

- osoby bez danych osobowych,
- role,
- źródło tożsamości,
- zachowanie,
- stan,
- swipe/toggle,
- pomijanie pytań.

UI:
- liquid-glass / glass-and-layered,
- duże cele dotykowe,
- obsługa jedną ręką,
- tło wyboru wystarcza do oznaczenia aktywności.

## Faza 6 — obrażenia + rysopis

- mapa ciała przód/tył,
- wybór obszaru,
- typ obrażenia,
- pochodzenie,
- rysopis jako opcjonalna gałąź.

Nie budować medycznego systemu; tylko dane potrzebne do późniejszego opisu.

## Faza 7 — zestaw czynności demonstracyjnych

Implementować tylko potrzebne do pionowego case:
- badanie trzeźwości,
- sprawdzenie prewencyjne,
- kontrola osobista/bagażu,
- odmowa podpisu,
- decyzja o doprowadzeniu,
- decyzja IW,
- SOR/badanie,
- PDOZ/przekazanie.

Każda czynność jako fakt, nie jako osobny monolityczny formularz.

## Faza 8 — zakończenie i braki

- slider „Zakończ teraz — uzupełnię później”,
- `needs_completion`,
- powrót do braków,
- brak blokujących walidacji.

Kryterium:
- użytkownik może w każdej chwili przerwać flow bez utraty danych.

## Faza 9 — silnik dokumentacji

Najpierw prosty deterministic renderer.

Wejście:
- fakty.

Wyjście:
- notatka urzędowa,
- skrót do notatnika służbowego.

Biblioteka fraz osobno od UI.

Nie używać LLM.

## Faza 10 — PDF / druk

- podgląd A4,
- eksport/druk przez możliwości przeglądarki,
- pola na ręczne uzupełnienie danych osobowych,
- brak trwałego eksportu danych osobowych z aplikacji.

## Faza 11 — stabilizacja PWA

Testy:
- reload na każdym etapie,
- przełączenie aplikacji,
- offline,
- powrót po dłuższym czasie,
- instalacja PWA,
- mały ekran,
- prefers-reduced-motion,
- brak sieci podczas GPS/reverse geocoding.

## Poza MVP

Nie implementować na początku:
- backendu,
- logowania,
- synchronizacji między ludźmi,
- danych osobowych,
- integracji z systemami Policji,
- automatycznego GPS w tle,
- własnej nawigacji,
- LLM,
- pełnej biblioteki wszystkich procedur,
- wersji natywnej.

## Definicja gotowego MVP

MVP jest gotowe do testu terenowego, jeśli użytkownik potrafi:
1. rozpocząć zdarzenie w kilka sekund,
2. zapisać punkt startowy lub go pominąć,
3. podać miejsce zdarzenia,
4. dodawać osoby A/B/C,
5. zaznaczać szybkie fakty,
6. dodawać punkty GPS,
7. widzieć i poprawiać oś czasu,
8. przerwać i wrócić później,
9. przejść demonstracyjną ścieżkę IW → odmowa → SOR → PDOZ,
10. wygenerować notatkę i skrót do notatnika,
11. nie stracić danych po reloadzie/ubiciu PWA.

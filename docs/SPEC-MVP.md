# SPEC MVP — Appka policyjna Rejestr

Wersja: 0.1

## 1. Cel produktu

MVP ma sprawdzić, czy cyfrowy, anonimowy rejestr faktów i chronologii realnie skraca czas pracy podczas interwencji i późniejszego przygotowania dokumentacji.

Aplikacja nie ma zastępować systemów służbowych. Ma działać jako osobista warstwa pamięci i organizacji przebiegu interwencji.

## 2. Zasada nadrzędna

**Minimum danych, maksimum kontekstu.**

Nową informację zapisujemy tylko wtedy, gdy pomaga:
- odtworzyć przebieg,
- zachować istotny czas/miejsce,
- przygotować dokumentację,
- pamiętać, jak wykonano konkretną czynność.

## 3. Start zdarzenia

Kliknięcie „Nowe zdarzenie”:
- natychmiast tworzy rekord,
- zapisuje czas startu,
- nadaje status `in_progress`,
- przechodzi do trybu bieżącego.

Nie pytamy na początku o „rodzaj zdarzenia”.

### Krok lokalizacji

Najpierw opcjonalny ekran:
- „Dodaj swoją pozycję”,
- „Pobierz GPS teraz”,
- „Pomiń”.

Następnie:
- pole „Miejsce zdarzenia”,
- wpisywanie z klawiatury,
- autocomplete ulic Wrocławia-Śródmieścia,
- możliwość wpisania dowolnego tekstu,
- możliwość użycia bieżącej pozycji,
- „Pomiń”.

## 4. Tryb bieżący

Główne akcje:
- dodaj osobę,
- dodaj fakt/czynność,
- zapisz punkt GPS,
- przejdź do osi czasu,
- zakończ teraz / uzupełnij później.

Nie ma obowiązku przechodzenia całej sekwencji pytań.

## 5. Osoby A/B/C

Brak danych osobowych.

Minimalny zestaw możliwych faktów:
- rola osoby,
- płeć, jeśli potrzebna,
- przybliżony wiek, jeśli potrzebny,
- zachowanie,
- stan,
- obrażenia,
- źródło ustalenia tożsamości.

### Źródło tożsamości

Dozwolone wartości:
- dowód osobisty,
- paszport,
- prawo jazdy,
- inny dokument,
- oświadczenie ustne,
- tożsamości nie ustalono.

Nie zapisujemy numerów dokumentów, nazwisk, PESEL ani wyników sprawdzeń w systemach.

### Rysopis

Jeśli tożsamości nie ustalono, można opcjonalnie dodać rysopis:
- płeć,
- przybliżony wiek,
- wzrost / przedział,
- budowa ciała,
- włosy,
- zarost,
- cechy szczególne,
- ubiór.

## 6. Szybkie pytania

Interfejs:
- duże pełnoekranowe pytania,
- swipe lewo/prawo,
- tap w opcję,
- liquid-glass / płynne toggle,
- przycisk „Pomiń”,
- przycisk „Zakończ na teraz”.

Aktywny wybór:
- wyraźne tło / pozycja przełącznika,
- bez redundantnego checkmarka.

Pytania są kontekstowe i mogą otwierać kolejne pytania.

## 7. Obrażenia

Pytanie:
- brak,
- są.

Jeżeli „są”:
- mapa ciała przód/tył,
- obszary: głowa, tułów, prawa/lewa ręka, prawa/lewa noga,
- opcjonalnie bardziej szczegółowy obszar,
- rodzaj obrażenia,
- pochodzenie/okoliczności:
  - ujawniono przed czynnościami,
  - osoba oświadczyła, że powstały wcześniej,
  - powstały podczas interwencji,
  - nie ustalono.

## 8. Fakty i czynności

MVP powinno obsłużyć przynajmniej:
- badanie trzeźwości + wynik,
- sprawdzenie prewencyjne + wynik,
- kontrola osobista tak/nie,
- kontrola bagażu tak/nie,
- podpis/odmowa podpisu,
- wezwanie ZRM,
- decyzję o doprowadzeniu,
- decyzję placówki: przyjęcie/odmowa,
- badanie lekarskie,
- potwierdzenie możliwości pobytu w PDOZ,
- przekazanie do PDOZ,
- ogólny fakt/uwaga.

Każdy zapis otrzymuje timestamp.

## 9. Punkty GPS

GPS działa na żądanie użytkownika.

Każdy punkt:
- timestamp,
- latitude,
- longitude,
- accuracy,
- czytelny adres z reverse geocoding,
- opcjonalny opis/rola punktu,
- powiązanie ze zdarzeniem.

Po zapisaniu użytkownik widzi przede wszystkim ulicę/adres, nie współrzędne.

Przy ważnych miejscach/etapach dostępny jest przycisk „Zapisz punkt GPS”.

## 10. Oś czasu

Oś czasu dostępna stale z trybu bieżącego.

Pokazuje chronologicznie:
- start,
- punkty GPS,
- osoby,
- czynności,
- wyniki,
- decyzje,
- zmiany miejsc,
- zakończenie.

Po zdarzeniu użytkownik może edytować godzinę lub fakt.

## 11. Zakończenie i wznowienie

Dwa tryby:
- zakończone,
- „Zakończ teraz — uzupełnię później”.

Drugi wariant:
- ustawia `needs_completion`,
- zapisuje całość,
- pozwala natychmiast rozpocząć nowe zdarzenie.

Po ponownym otwarciu PWA ekran główny pokazuje:
- zdarzenia w toku,
- do uzupełnienia,
- ostatnio zakończone.

## 12. Historia

Lista zdarzeń:
- data,
- godzina startu,
- opcjonalna nazwa własna,
- status,
- krótki neutralny opis oparty na faktach.

Wyszukiwanie:
- data,
- nazwa,
- fraza/tag.

Możliwość powrotu do edycji.

## 13. Dokumentacja

### A. Notatka urzędowa
Generowana z wybranych faktów przy użyciu biblioteki kontrolowanych fraz.

### B. Skrót do notatnika służbowego
Kompaktowa forma:
- godziny,
- skróty,
- czynności,
- źródło ustalenia tożsamości,
- kluczowe miejsca i wyniki.

Nie wszystkie fakty muszą być użyte w obu wyjściach.

MVP nie korzysta z LLM.

## 14. Referencyjny przypadek

Dane demonstracyjne:
- Wrocław,
- Izba Wytrzeźwień: ul. Sokolnicza 14,
- dalszy SOR bez twardo zakodowanego adresu,
- PDOZ: Podwale, Wrocław — bez wymyślania numeru adresowego.

Case study celowo pokazuje długą gałąź:
interwencja → doprowadzenie → IW → odmowa → SOR → badanie/potwierdzenie → PDOZ → dokumentacja.

Jednocześnie aplikacja musi wspierać krótsze zakończenia, np. przyjęcie w IW.

## 15. PWA / technologia

Wymagane:
- instalowalna PWA,
- offline shell,
- IndexedDB,
- service worker,
- manifest,
- mobile-first,
- bez backendu w MVP,
- bez logowania,
- bez chmury,
- bez telemetryki zawierającej treść zdarzeń.

Architektura powinna pozwolić później opakować aplikację przez Capacitor bez przepisywania logiki domenowej.

## 16. Kryterium sukcesu MVP

Najważniejsze pytanie:
**czy użytkownik szybciej i pewniej odtwarza przebieg oraz przygotowuje dokumentację niż przy obecnym procesie?**

Mierzymy praktycznie:
- czas od startu dokumentacji do gotowego tekstu,
- liczbę ręcznie wpisywanych elementów,
- liczbę informacji, które trzeba odtwarzać z pamięci,
- liczbę sytuacji wymagających przepisywania dokumentu.

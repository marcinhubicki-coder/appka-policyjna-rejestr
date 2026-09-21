# Case study — długa, rozgałęziona interwencja

Cel: pokazać możliwości systemu, nie wzorzec każdej interwencji.

Case study ma demonstrować, że aplikacja nie prowadzi sztywnym formularzem. Najpierw zapisuje fakty, a kolejne gałęzie pojawiają się dopiero wtedy, gdy wynikają z przebiegu.

## Etap 1 — rozpoczęcie

Patrol rozpoczyna nowe zdarzenie podczas służby.

Aplikacja:
- natychmiast tworzy rekord `in_progress`,
- zapisuje godzinę startu,
- proponuje opcjonalne „Dodaj swoją pozycję”.

Użytkownik może zapisać punkt startowy GPS albo pominąć.

## Etap 2 — miejsce zdarzenia

Użytkownik wpisuje ulicę.

Autocomplete:
- podpowiada ulice Wrocławia-Śródmieścia,
- nie blokuje ręcznego wpisu,
- nie wymaga wyboru z listy.

Na miejscu można kliknąć „Zapisz punkt GPS”; aplikacja zapisuje czas i pokazuje czytelny adres.

## Etap 3 — pierwsze fakty

Na miejscu patrol zastaje osobę A.

Użytkownik może szybko zaznaczyć:
- rolę,
- stan/zachowanie,
- oznaki nietrzeźwości,
- obrażenia/brak.

Każdy wybór zapisuje się od razu.

## Etap 4 — obrażenia

Jeśli obrażenia są obecne:
- otwiera się mapa ciała,
- użytkownik wskazuje obszar,
- rodzaj,
- okoliczności/pochodzenie.

Jeśli brak — przechodzi dalej bez dodatkowych pytań.

## Etap 5 — źródło tożsamości

Aplikacja pyta tylko, skąd ustalono dane osoby:
- dokument,
- oświadczenie ustne,
- nie ustalono.

Nie wpisujemy danych osobowych i nie kopiujemy wyników z systemów.

Jeśli tożsamości nie ustalono, opcjonalnie uruchamia się generator rysopisu.

## Etap 6 — czynności

W scenariuszu:
- badanie trzeźwości,
- zapis wyniku,
- sprawdzenie prewencyjne,
- ewentualne dodatkowe fakty.

Wszystko trafia na oś czasu z godziną.

## Etap 7 — decyzja post factum

Dopiero na podstawie zebranych faktów patrol podejmuje decyzję o doprowadzeniu w celu wytrzeźwienia.

Nie była ona deklarowana na starcie.

## Etap 8 — Izba Wytrzeźwień

Placówka demonstracyjna:
**Izba Wytrzeźwień, ul. Sokolnicza 14, Wrocław.**

Opcje:
- „Otwórz w Mapach”,
- „Zapisz punkt GPS” po przyjeździe,
- „Pomiń”.

### Gałąź krótka
Jeśli osoba zostaje przyjęta:
- zapis decyzji,
- czynności terenowe mogą się zakończyć,
- przejście do dokumentacji.

### Gałąź długa — używana w case study
Placówka odmawia przyjęcia.

Zapisujemy:
- decyzję,
- godzinę,
- ewentualny powód.

## Etap 9 — SOR

Powstaje kolejny etap.

Użytkownik:
- może otworzyć zewnętrzne Mapy,
- po przyjeździe zapisuje punkt GPS,
- zapisuje fakt badania lekarskiego,
- zapisuje wynik: lekarz potwierdza możliwość przebywania osoby w PDOZ.

Nie kodujemy na sztywno adresu SOR w MVP case study.

## Etap 10 — PDOZ

Kolejny etap:
- PDOZ, Podwale, Wrocław,
- opcjonalny zapis punktu GPS,
- czas przyjazdu,
- przekazanie osoby.

Dopiero po przekazaniu kończą się czynności terenowe w długiej gałęzi.

## Możliwe dodatkowe rozgałęzienia

Case study powinno komunikować, że fakty mogą otworzyć inne ścieżki:
- agresja / opór,
- ZRM,
- problemy medyczne,
- niebezpieczne przedmioty,
- substancje zabronione,
- dodatkowe czynności,
- większy zakres dokumentacji.

MVP nie musi implementować wszystkich gałęzi produkcyjnie, ale model danych i UI nie mogą zakładać jednej sztywnej sekwencji.

## Etap 11 — zakończenie / do uzupełnienia

Jeśli sytuacja jest dynamiczna, użytkownik może w dowolnym momencie:
- zakończyć na teraz,
- oznaczyć `needs_completion`,
- rozpocząć kolejne zdarzenie.

Dane są już zapisane.

## Etap 12 — dokumentacja

Po powrocie do zdarzenia aplikacja:
- pokazuje oś czasu,
- wskazuje braki,
- pozwala poprawić godziny/fakty,
- generuje z jednego zestawu danych:
  1. notatkę urzędową,
  2. skrót do notatnika służbowego.

Generator korzysta z kontrolowanych fraz, nie LLM.

## Najważniejszy przekaz case study

**Fakty najpierw. Sens i dokumentacja później.**

Aplikacja ma rosnąć wraz ze złożonością sytuacji, a nie zmuszać użytkownika do przewidywania przebiegu na początku.

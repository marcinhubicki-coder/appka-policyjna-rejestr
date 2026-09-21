import type { SourceType } from "./model";
export const identityOptions = [
  "Dowód osobisty",
  "Paszport",
  "Prawo jazdy",
  "Inny dokument",
  "Oświadczenie ustne",
  "Tożsamości nie ustalono",
];
export const roles = [
  "Osoba objęta czynnościami",
  "Zgłaszający",
  "Pokrzywdzony",
  "Świadek",
  "Sprawca",
  "Inna osoba",
];
export const personLabels: Record<string, string> = {
  role: "Rola",
  state: "Stan osoby",
  behavior: "Zachowanie",
  identity: "Źródło tożsamości",
  injuries: "Obrażenia",
  sex: "Płeć",
  age: "Przybliżony wiek",
  height: "Wzrost / przedział",
  build: "Budowa ciała",
  hair: "Włosy",
  facialHair: "Zarost",
  features: "Cechy szczególne",
  clothing: "Ubiór",
  note: "Dodatkowe informacje",
};
export const bodyRegions = [
  "Głowa",
  "Tułów",
  "Prawa ręka",
  "Lewa ręka",
  "Prawa noga",
  "Lewa noga",
];
export const injuryOrigins = [
  "Ujawniono przed czynnościami",
  "Osoba oświadczyła, że powstały wcześniej",
  "Powstały podczas interwencji",
  "Nie ustalono",
];
export const sources: Record<SourceType, string> = {
  observation: "Ustalono / zaobserwowano",
  statement: "Osoba oświadczyła",
  action: "Dokonano",
  doctor: "Decyzja lekarza",
  facility: "Informacja placówki",
};
export interface ActivityDef {
  label: string;
  group: string;
  options?: string[];
  field?: string;
  source?: SourceType;
}
export const activities: Record<string, ActivityDef> = {
  sobriety: {
    label: "Badanie trzeźwości",
    group: "Czynności",
    field: "Wynik badania",
    source: "action",
  },
  preventive: {
    label: "Sprawdzenie prewencyjne",
    group: "Czynności",
    options: [
      "Nie ujawniono przedmiotów",
      "Ujawniono przedmioty",
      "Odstąpiono",
    ],
    source: "action",
  },
  personal_search: {
    label: "Kontrola osobista",
    group: "Czynności",
    options: ["Przeprowadzono", "Nie przeprowadzono"],
    source: "action",
  },
  luggage: {
    label: "Kontrola bagażu",
    group: "Czynności",
    options: ["Przeprowadzono", "Nie przeprowadzono"],
    source: "action",
  },
  signature: {
    label: "Podpis / odmowa podpisu",
    group: "Czynności",
    options: ["Podpisano", "Odmowa podpisu"],
    field: "Czego dotyczy podpis?",
    source: "action",
  },
  ambulance: {
    label: "Wezwanie ZRM",
    group: "Pomoc i decyzje",
    options: ["Wezwano", "ZRM na miejscu", "Przekazano ZRM"],
    source: "action",
  },
  decision: {
    label: "Decyzja o dalszych czynnościach",
    group: "Pomoc i decyzje",
    options: [
      "Doprowadzenie do IW",
      "Przejazd do SOR",
      "Doprowadzenie do PDOZ",
      "Pouczenie",
      "Zakończenie na miejscu",
      "Inne czynności",
    ],
    source: "action",
  },
  facility: {
    label: "Decyzja placówki",
    group: "Placówki",
    options: ["Przyjęcie", "Odmowa przyjęcia"],
    source: "facility",
  },
  medical: {
    label: "Badanie lekarskie",
    group: "Placówki",
    options: ["Przeprowadzono", "Nie przeprowadzono"],
    source: "doctor",
  },
  clearance: {
    label: "Możliwość pobytu w PDOZ",
    group: "Placówki",
    options: ["Potwierdzono", "Nie potwierdzono"],
    source: "doctor",
  },
  handover: {
    label: "Przekazanie do PDOZ",
    group: "Placówki",
    options: ["Przekazano", "Nie przekazano"],
    source: "action",
  },
  general: {
    label: "Fakt / uwaga",
    group: "Inne",
    field: "Treść faktu",
    source: "observation",
  },
};
export const stages = {
  iw: { title: "Izba Wytrzeźwień", address: "ul. Sokolnicza 14, Wrocław" },
  sor: { title: "SOR", address: "" },
  pdoz: { title: "PDOZ", address: "Podwale, Wrocław" },
};
export type Stage = keyof typeof stages;
// Lokalna lista podpowiedzi. Dowolny adres pozostaje dozwolony.
export const streets = [
  "Sienkiewicza",
  "Jedności Narodowej",
  "Nowowiejska",
  "Wyszyńskiego",
  "Bolesława Prusa",
  "Daszyńskiego",
  "Jaracza",
  "Wygodna",
  "Słowiańska",
  "Ołbińska",
  "Poniatowskiego",
  "Drobnera",
  "Dubois",
  "Pomorska",
  "Łokietka",
  "Paulińska",
  "Rydygiera",
  "Trzebnicka",
  "Kleczkowska",
  "Reymonta",
  "Na Polance",
  "Pasterska",
  "Żeromskiego",
  "Orzeszkowej",
  "Barlickiego",
  "Reja",
  "Górnickiego",
  "Grunwaldzka",
  "Piastowska",
  "Curie-Skłodowskiej",
  "Norwida",
  "Wyspiańskiego",
  "plac Grunwaldzki",
  "plac Bema",
  "plac Staszica",
  "plac Strzelecki",
  "Świętokrzyska",
  "Katedralna",
  "Staromłyńska",
  "Długa",
  "Sokolnicza",
  "Podwale",
];

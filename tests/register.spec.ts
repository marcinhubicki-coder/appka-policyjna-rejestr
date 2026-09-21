import { test, expect, type Page } from "@playwright/test";

const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
async function saved(page: Page) {
  await expect(page.locator(".save-status")).toContainText("Zapis lokalny");
}
async function route(page: Page, value: string) {
  await page.evaluate((hash) => {
    location.hash = hash;
  }, value);
}
async function records(page: Page): Promise<any[]> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("policyjna-rejestr");
        open.onsuccess = () => {
          const db = open.result;
          const request = db
            .transaction("events")
            .objectStore("events")
            .getAll();
          request.onsuccess = () => {
            resolve(request.result);
            db.close();
          };
          request.onerror = () => reject(request.error);
        };
        open.onerror = () => reject(open.error);
      }),
  );
}
async function add(page: Page, base: string, type: string) {
  await route(page, base + "/add");
  await button(page, type).click();
  await expect(page.locator("h1")).toHaveText(type);
  return page.url().split("#")[1];
}

test("długa ścieżka, autosave, osoby, obrażenia, dokumenty i ponowne otwarcie offline", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 51.119,
    longitude: 17.05,
    accuracy: 12,
  });
  await page.route("https://nominatim.openstreetmap.org/**", (r) =>
    r.fulfill({
      json: {
        address: { road: "Sienkiewicza", house_number: "23", city: "Wrocław" },
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: /Nowe zdarzenie/ }).click();
  await expect(page.locator("h1")).toHaveText("Dodaj swoją pozycję");
  const base = page.url().split("#")[1].replace("/gps/start", "");
  expect((await records(page))[0].status).toBe("in_progress");
  await button(page, "Pobierz GPS teraz").click();
  await expect(
    page.getByRole("textbox", { name: "Adres / korekta miejsca" }),
  ).toHaveValue("Sienkiewicza 23, Wrocław");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Pozycja zapisana");
  await button(page, "Dalej").click();
  await page
    .getByRole("textbox", { name: "Adres lub opis miejsca" })
    .fill("Park przy moście — własny opis");
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Adres lub opis miejsca" }),
  ).toHaveValue("Park przy moście — własny opis");
  await button(page, "Do zdarzenia").click();
  await button(page, "Dodaj osobę").click();
  await button(page, "Osoba objęta czynnościami").click();
  await saved(page);
  await button(page, "Dalej").click();
  await button(page, "Oznaki nietrzeźwości").click();
  await saved(page);
  await button(page, "Dalej").click();
  await button(page, "Pobudzone").click();
  await saved(page);
  await button(page, "Opór").click();
  await saved(page);
  await button(page, "Dalej").click();
  await button(page, "Są").click();
  await saved(page);
  await page
    .locator(".body-map")
    .getByRole("button", { name: "Prawa ręka", exact: true })
    .click();
  await button(page, "Otarcie").click();
  await saved(page);
  await button(page, "Osoba oświadczyła, że powstały wcześniej").click();
  await saved(page);
  await page.reload();
  await expect(button(page, "Otarcie")).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: "test-results/obrazenia-mobile.png",
    fullPage: true,
  });
  await button(page, "Dalej").click();
  await button(page, "Tożsamości nie ustalono").click();
  await saved(page);
  await button(page, "Dalej").click();
  await page
    .getByRole("textbox", { name: "Przybliżony wiek" })
    .fill("około 40 lat");
  await page.getByRole("textbox", { name: "Ubiór" }).fill("granatowa kurtka");
  await saved(page);
  await button(page, "Do zdarzenia").click();
  await button(page, "Dodaj osobę").click();
  await button(page, "Świadek").click();
  await saved(page);
  await route(page, base + "/person/B/identity");
  await button(page, "Paszport").click();
  await saved(page);
  await add(page, base, "Badanie trzeźwości");
  await page
    .getByRole("combobox", { name: "Dotyczy osoby", exact: true })
    .selectOption("A");
  await page.getByRole("textbox", { name: "Wynik badania" }).fill("1,8");
  await button(page, "‰").click();
  await saved(page);
  await add(page, base, "Sprawdzenie prewencyjne");
  await page
    .getByRole("combobox", { name: "Dotyczy osoby", exact: true })
    .selectOption("A");
  await button(page, "Nie ujawniono przedmiotów").click();
  await saved(page);
  await add(page, base, "Decyzja o dalszych czynnościach");
  await page
    .getByRole("combobox", { name: "Dotyczy osoby", exact: true })
    .selectOption("A");
  await button(page, "Doprowadzenie do IW").click();
  await saved(page);
  await route(page, base + "/stage/iw/A");
  await button(page, "Odnotuj przyjazd teraz").click();
  await expect(page.getByText(/Przyjazd zapisany/)).toBeVisible();
  await button(page, "Przyjęcie / odmowa przyjęcia").click();
  await button(page, "Odmowa przyjęcia").click();
  await saved(page);
  await route(page, base + "/live");
  await expect(page.getByText("Co po odmowie przyjęcia?")).toBeVisible();
  await page.getByRole("button", { name: /Co po odmowie/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Adres placówki" }),
  ).toHaveValue("");
  await page
    .getByRole("textbox", { name: "Adres placówki" })
    .fill("SOR — adres podany na miejscu");
  await saved(page);
  await button(page, "Odnotuj przyjazd teraz").click();
  await button(page, "Badanie lekarskie").click();
  await button(page, "Przeprowadzono").click();
  await saved(page);
  await route(page, base + "/stage/sor/A");
  await button(page, "Możliwość pobytu w PDOZ").click();
  await button(page, "Potwierdzono").click();
  await saved(page);
  await route(page, base + "/live");
  await page.getByRole("button", { name: /Dalszy etap: PDOZ/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Adres placówki" }),
  ).toHaveValue("Podwale, Wrocław");
  await button(page, "Odnotuj przyjazd teraz").click();
  await button(page, "Przekazanie osoby").click();
  await button(page, "Przekazano").click();
  await saved(page);
  await route(page, base + "/finish");
  await button(page, "Oznacz jako do uzupełnienia").click();
  await expect(page.locator("h1")).toHaveText("Twój rejestr");
  await page.getByRole("button", { name: /Nowe zdarzenie/ }).click();
  await expect(page.locator("h1")).toHaveText("Dodaj swoją pozycję");
  expect(await records(page)).toHaveLength(2);
  await route(page, base + "/documents");
  await expect(page.locator(".paper")).toContainText("Odmowa przyjęcia");
  await expect(page.locator(".paper")).toContainText("Lekarz potwierdził");
  await expect(page.locator(".paper")).toContainText("Przekazano do PDOZ");
  await expect(page.locator(".paper")).toContainText("1,8 ‰");
  await expect(page.locator(".paper")).toContainText(
    "Osoba B — źródło tożsamości: Paszport",
  );
  await expect(page.locator(".paper")).toContainText(
    "Osoba oświadczyła, że powstały wcześniej",
  );
  await page.getByRole("tab", { name: "Skrót do notatnika" }).click();
  await expect(page.locator(".paper")).toContainText("SKRÓT DO NOTATNIKA");
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: "test-results/dokument-a4.pdf",
    format: "A4",
    printBackground: true,
  });
  await page.emulateMedia({ media: "screen" });
  await route(page, base + "/live");
  await page.screenshot({
    path: "test-results/zdarzenie-mobile.png",
    fullPage: true,
  });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Park przy moście — własny opis");
  await add(page, base, "Fakt / uwaga");
  await page
    .getByRole("textbox", { name: "Treść faktu" })
    .fill("Wpis bez internetu");
  await saved(page);
  const next = await context.newPage();
  await page.close();
  await next.goto("/#" + base + "/documents");
  await expect(next.locator(".paper")).toContainText("Wpis bez internetu");
  expect(
    (await records(next)).find((e) => e.id === base.split("/")[2]).persons,
  ).toHaveLength(2);
  expect(errors).toEqual([]);
  await context.setOffline(false);
  await next.setViewportSize({ width: 1440, height: 1000 });
  await route(next, base + "/live");
  await next.screenshot({
    path: "test-results/zdarzenie-desktop.png",
    fullPage: true,
  });
});

test("krótka ścieżka IW, wykluczanie faktów i brak dopisanych etapów", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Nowe zdarzenie/ }).click();
  await expect(page.locator("h1")).toHaveText("Dodaj swoją pozycję");
  const base = page.url().split("#")[1].replace("/gps/start", "");
  await button(page, "Pomiń").click();
  await button(page, "Pomiń").click();
  await button(page, "Dodaj osobę").click();
  await route(page, base + "/stage/iw/A");
  await button(page, "Przyjęcie / odmowa przyjęcia").click();
  await button(page, "Przyjęcie").click();
  await saved(page);
  await route(page, base + "/live");
  await expect(page.getByText("Możesz przejść do dokumentacji")).toBeVisible();
  await route(page, base + "/finish");
  await button(page, "Zakończ zdarzenie").click();
  await expect(page.locator(".paper")).toContainText("Przyjęcie");
  await expect(page.locator(".paper")).not.toContainText("SOR");
  await expect(page.locator(".paper")).not.toContainText("PDOZ");
  await page
    .getByText("Wybierz fakty do tego dokumentu", { exact: true })
    .click();
  await page
    .locator(".fact-inclusions label")
    .filter({ hasText: "Decyzja placówki" })
    .getByRole("checkbox")
    .uncheck();
  await saved(page);
  await expect(page.locator(".paper")).not.toContainText("Przyjęcie");
  await page.getByRole("tab", { name: "Skrót do notatnika" }).click();
  await expect(page.locator(".paper")).toContainText("Przyjęcie");
});

test("GPS bez geokodowania, odmowa lokalizacji, mały ekran i edycja daty", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 51.11,
    longitude: 17.03,
    accuracy: 50,
  });
  await page.route("https://nominatim.openstreetmap.org/**", (r) => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: /Nowe zdarzenie/ }).click();
  await expect(page.locator("h1")).toHaveText("Dodaj swoją pozycję");
  const base = page.url().split("#")[1].replace("/gps/start", "");
  await button(page, "Pobierz GPS teraz").click();
  await expect(
    page.getByText(
      "Punkt i czas zapisane. Adres jest niedostępny — możesz wpisać go ręcznie.",
    ),
  ).toBeVisible();
  expect((await records(page))[0].locations).toHaveLength(1);
  await page
    .getByRole("textbox", { name: "Adres / korekta miejsca" })
    .fill("Miejsce wpisane offline");
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Adres / korekta miejsca" }),
  ).toHaveValue("Miejsce wpisane offline");
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (_success, error) => {
      error?.({
        code: 1,
        message: "denied",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    };
  });
  await button(page, "Zapisz kolejny punkt").click();
  await expect(page.getByText(/Brak zgody na lokalizację/)).toBeVisible();
  expect((await records(page))[0].locations).toHaveLength(1);
  await add(page, base, "Fakt / uwaga");
  await page
    .getByRole("textbox", { name: "Treść faktu" })
    .fill("<img src=x onerror=alert(1)> obserwacja");
  await page.getByLabel("Data i godzina faktu").fill("2026-09-20T23:55");
  await saved(page);
  await page.reload();
  await expect(page.getByLabel("Data i godzina faktu")).toHaveValue(
    "2026-09-20T23:55",
  );
  await route(page, base + "/documents");
  await expect(page.locator(".paper")).toContainText(
    "<img src=x onerror=alert(1)> obserwacja",
  );
  expect(await page.locator(".paper img").count()).toBe(0);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".paper")).toBeVisible();
});

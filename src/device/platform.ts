export function haptic() {
  if ("vibrate" in navigator) navigator.vibrate(8);
}
export async function requestPersistence() {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
export async function copyText(text: string) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.top = "-10000px";
  document.body.append(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("Zaznacz tekst dokumentu i skopiuj ręcznie.");
}
export async function shareText(text: string) {
  if (navigator.share)
    await navigator.share({ title: "Rejestr — dokumentacja", text });
  else await copyText(text);
}
export const printDocument = () => window.print();

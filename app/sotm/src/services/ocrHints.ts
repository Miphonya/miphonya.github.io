export interface CardHints {
  name: string;
  set: string;
  collectorNumber: string;
  confidence: number;
  text: string;
}
export function extractCardHints(text: string, confidence: number): CardHints {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const name =
    lines
      .slice(0, 5)
      .find(
        (s) =>
          s.length >= 3 &&
          s.length <= 100 &&
          /\p{L}/u.test(s) &&
          !/^magic\s*:?\s*the gathering|^illustrat|^copyright/i.test(s),
      )
      ?.replace(/\s+[0-9XWUBRG{}()\/]+$/, "")
      .replace(/\s+[&$€£@]+$/, "")
      .trim() ?? "";
  const footer = lines.slice(-7).join("\n");
  const collectorNumber =
    footer.match(/\b(\d{1,4}[a-z]?)\s*\/\s*\d{1,4}\b/i)?.[1] ??
    footer.match(/(?:^|\n)\s*(\d{3,4}[a-z]?)\s+[CURMSL]\b/i)?.[1] ??
    footer.match(/(?:^|\n)\s*[CURMSL]\s+(\d{3,4}[a-z]?)\b/i)?.[1] ??
    "";
  const set =
    footer
      .match(
        /\b([A-Z0-9]{2,5})\s*[•·|]\s*(?:EN|FR|DE|ES|IT|PT|JA|KO|RU|ZHS|ZHT)\b/i,
      )?.[1]
      ?.toLowerCase() ?? "";
  return {
    name,
    set,
    collectorNumber,
    confidence: Number.isFinite(confidence)
      ? Math.min(100, Math.max(0, confidence))
      : 0,
    text,
  };
}
export function photoQuery(name: string, set: string, number: string) {
  const safeName = name.replace(/["\\]/g, "").trim();
  if (!safeName) throw Error("Vérifiez le nom de la carte.");
  if (set && !/^[a-z0-9]{2,8}$/i.test(set))
    throw Error("Code d’extension invalide.");
  if (number && !/^[a-z0-9★†-]{1,16}$/i.test(number))
    throw Error("Numéro de carte invalide.");
  return `name:"${safeName}"${set ? ` set:${set.toLowerCase()}` : ""}${number ? ` cn:${number.replace(/^0+(?=\d)/, "")}` : ""}`;
}

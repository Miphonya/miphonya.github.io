import type { Card } from "../schemas/models";
const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
export function compareCollectorNumbers(a: Card, b: Card) {
  return (
    natural.compare(a.collector_number, b.collector_number) ||
    a.name.localeCompare(b.name) ||
    a.id.localeCompare(b.id)
  );
}

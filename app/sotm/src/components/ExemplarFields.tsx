import { languages } from "../schemas/languages";
import type { Exemplar } from "../schemas/exemplar";
export const finishLabel = (finish: string) => finish === "nonfoil" ? "Non foil" : finish === "foil" ? "Foil" : "Etched";
export function ExemplarFields({ value, onChange, finishes = ["nonfoil", "foil", "etched"], hideFinish = false }: { value: Exemplar; onChange: (value: Exemplar) => void; finishes?: string[]; hideFinish?: boolean }) {
  return <><div className="form-grid">
    <label>Langue<select aria-label="Langue de l’exemplaire" value={value.language} onChange={e => onChange({ ...value, language: e.target.value })}>{[...new Set([value.language, ...Object.keys(languages)])].map(code => <option key={code} value={code}>{languages[code as keyof typeof languages] ?? code}</option>)}</select></label>
    <label>État<select aria-label="État de l’exemplaire" value={value.condition} onChange={e => onChange({ ...value, condition: e.target.value as Exemplar["condition"] })}>{["MT", "NM", "EX", "GD", "LP", "PL", "PO"].map(condition => <option key={condition}>{condition}</option>)}</select></label>
    {!hideFinish && <label>Finition<select aria-label="Finition de l’exemplaire" value={value.finish} onChange={e => onChange({ ...value, finish: e.target.value as Exemplar["finish"] })}>{finishes.filter(f => ["nonfoil", "foil", "etched"].includes(f)).map(finish => <option key={finish} value={finish}>{finishLabel(finish)}</option>)}</select></label>}
  </div><div className="checks"><label><input type="checkbox" checked={value.signed} onChange={e => onChange({ ...value, signed: e.target.checked })} /> Signée</label><label><input type="checkbox" checked={value.altered} onChange={e => onChange({ ...value, altered: e.target.checked })} /> Altérée</label></div>
  <label>Notes<textarea aria-label="Notes de l’exemplaire" value={value.notes} maxLength={4000} onChange={e => onChange({ ...value, notes: e.target.value })} /></label></>;
}

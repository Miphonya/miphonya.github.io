import { useVaultPreferences } from "../hooks/usePricing";
import { Languages } from "lucide-react";
import { updatePrefs } from "../db";
import { languages, type CardLanguage } from "../schemas/languages";
export function LanguageOptions() {
  return (
    <>
      {Object.entries(languages).map(([code, label]) => (
        <option value={code} key={code}>
          {label}
        </option>
      ))}
    </>
  );
}
export function LanguageSettings() {
  const p = useVaultPreferences();
  return (
    <section className="panel setting">
      <Languages />
      <h2>Langue des cartes</h2>
      <p>
        La langue présélectionnée pour vos nouveaux exemplaires, lors d’un ajout
        individuel ou par liste. Les lots existants restent inchangés.
      </p>
      <label>
        Langue par défaut
        <select
          aria-label="Langue par défaut des cartes"
          value={p.defaultLanguage}
          onChange={(e) =>
            void updatePrefs({
              defaultLanguage: e.target.value as CardLanguage,
            })
          }
        >
          <LanguageOptions />
        </select>
      </label>
      <p className="muted">
        Ce réglage décrit vos exemplaires physiques. Les noms et images du
        catalogue Scryfall conservent leur langue d’origine.
      </p>
    </section>
  );
}

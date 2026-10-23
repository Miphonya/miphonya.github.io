import { BrandName } from "./BrandName";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import { prefs, updatePrefs } from "../db";
import type { Preferences } from "../schemas/models";
import type { CardLanguage } from "../schemas/languages";
import { LanguageOptions } from "./LanguageSettings";
import { Button } from "./ui/button";
const logo = import.meta.env.BASE_URL + "app/sotm/logo.svg";
const steps = ["Bienvenue", "Apparence", "Devise", "Langue", "Données"];
function Welcome({ initial }: { initial: Preferences }) {
  const [step, setStep] = useState(0),
    [draft, setDraft] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = draft.theme;
  }, [draft.theme]);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  async function finish() {
    setBusy(true);
    setError("");
    try {
      await updatePrefs({
        theme: draft.theme,
        currency: draft.currency,
        defaultLanguage: draft.defaultLanguage,
        onboardingCompleted: true,
      });
    } catch {
      setError(
        "Impossible d’enregistrer vos préférences. Vérifiez que le stockage du navigateur est autorisé.",
      );
      setBusy(false);
    }
  }
  return (
    <div className="onboarding">
      <div className="onboarding-brand">
        <img src={logo} alt="" />
        <BrandName />
      </div>
      <main
        className="onboarding-panel panel"
        aria-label="Première configuration"
      >
        <ol className="onboarding-steps" aria-label="Étapes de configuration">
          {steps.map((name, i) => (
            <li
              key={name}
              aria-current={i === step ? "step" : undefined}
              className={i <= step ? "reached" : ""}
            >
              <span>{i < step ? <Check size={13} /> : i + 1}</span>
              <small>{name}</small>
            </li>
          ))}
        </ol>
        <div className="onboarding-content">
          <p className="eyebrow">
            L’ARCHIVE S’ÉVEILLE · {step + 1} / {steps.length}
          </p>
          <h1 ref={heading} tabIndex={-1}>
            {
              [
                <>
                  Gloire à <BrandName />
                </>,
                "Entre ombre et porcelaine.",
                "La valeur de votre archive.",
                "Chaque carte a sa langue.",
                "Votre collection. Chez vous.",
              ][step]
            }
          </h1>
          {step === 0 && (
            <>
              <p>
                Un sanctuaire pour vos cartes. Réunissez votre collection,
                retrouvez vos exemplaires et donnez forme à votre archive
                personnelle.
              </p>
              <div className="onboarding-promise">
                <ShieldCheck size={22} />
                <div>
                  <strong>
                    Votre collection reste confidentielle, chez vous.
                  </strong>
                  <p>
                    Sans compte. Sans serveur de collection.
                    <br />
                    Enregistrée uniquement dans ce navigateur, sur cet appareil.
                  </p>
                </div>
              </div>
              <p className="muted">
                Quelques choix pour commencer, modifiables à tout moment dans
                les paramètres. Pensez ensuite à exporter régulièrement une
                sauvegarde JSON.
              </p>
            </>
          )}
          {step === 1 && (
            <>
              <p>Choisissez l’atmosphère de votre collection.</p>
              <div className="theme-choices">
                {(["dark", "light"] as const).map((theme) => (
                  <button
                    type="button"
                    key={theme}
                    aria-pressed={draft.theme === theme}
                    onClick={() => setDraft({ ...draft, theme })}
                    className={
                      "theme-choice " +
                      theme +
                      (draft.theme === theme ? " chosen" : "")
                    }
                  >
                    {theme === "dark" ? <Moon size={24} /> : <Sun size={24} />}
                    <strong>
                      {theme === "dark" ? "Obsidienne" : "Porcelaine"}
                    </strong>
                    <small>
                      {theme === "dark"
                        ? "Noir profond, rouge sang et ivoire."
                        : "Ivoire minéral et détails bordeaux."}
                    </small>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <p>
                Les prix restent indicatifs. Choisissez votre devise
                d’affichage.
              </p>
              <label>
                Devise
                <select
                  aria-label="Devise de départ"
                  value={draft.currency}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      currency: e.target.value as Preferences["currency"],
                    })
                  }
                >
                  <option value="CHF">CHF · Franc suisse</option>
                  <option value="EUR">EUR · Euro</option>
                  <option value="USD">USD · Dollar US</option>
                </select>
              </label>
              <p className="muted">
                CHF est proposé par défaut : conversion du prix EUR avec un taux
                daté. EUR et USD proviennent directement de Scryfall.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <p>
                La langue présélectionnée lors de vos ajouts, à l’unité ou par
                liste.
              </p>
              <label>
                Langue de vos exemplaires
                <select
                  aria-label="Langue de départ"
                  value={draft.defaultLanguage}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      defaultLanguage: e.target.value as CardLanguage,
                    })
                  }
                >
                  <LanguageOptions />
                </select>
              </label>
              <p className="muted">
                Vous pourrez modifier la langue pour chaque lot. Les images du
                catalogue Scryfall ne sont pas traduites par ce réglage.
              </p>
            </>
          )}
          {step === 4 && (
            <>
              <p><strong>Votre collection reste confidentielle, chez vous.</strong> Vos exemplaires et réglages sont enregistrés dans ce navigateur, sans compte.</p>
              <div className="onboarding-promise"><ShieldCheck size={22} /><p>Scryfall fournit les cartes et leurs prix. Seules les recherches nécessaires au catalogue lui sont transmises.</p></div>
              <p className="muted">Exportez régulièrement une sauvegarde depuis les paramètres pour conserver votre collection si les données du navigateur sont effacées.</p>
            </>
          )}
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="onboarding-actions">
          {step > 0 ? (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} /> Précédent
            </Button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              {step === 0 ? "Commencer" : "Continuer"}
              <ArrowRight size={16} />
            </Button>
          ) : (
            <Button disabled={busy} onClick={() => void finish()}>
              {busy ? (
                "Ouverture…"
              ) : (
                <>
                  Ouvrir <BrandName />
                </>
              )}
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </main>
      <p className="onboarding-footnote">
        VOTRE COLLECTION. SOUS VOTRE SEUL CONTRÔLE.
      </p>
    </div>
  );
}
export function OnboardingGate({ children }: { children: ReactNode }) {
  const p = useLiveQuery(prefs, []);
  if (!p)
    return (
      <div className="vault-loading" role="status">
        <img src={logo} alt="" />
        Ouverture de šotm…
      </div>
    );
  return p.onboardingCompleted ? <>{children}</> : <Welcome initial={p} />;
}

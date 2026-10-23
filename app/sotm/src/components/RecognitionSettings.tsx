import { useState } from "react";
import { ScanText, ShieldCheck, KeyRound, ExternalLink } from "lucide-react";
import {
  useVisionSession,
  providerLabels,
  type VisionProvider,
} from "../stores/vision";
import { Button } from "./ui/button";
export function RecognitionSettings() {
  const [input, setInput] = useState(""),
    [error, setError] = useState("");
  const active = useVisionSession((s) => !!s.apiKey),
    provider = useVisionSession((s) => s.provider),
    setProvider = useVisionSession((s) => s.setProvider),
    setKey = useVisionSession((s) => s.setKey),
    clear = useVisionSession((s) => s.clear);
  return (
    <section className="panel setting recognition-settings">
      <ScanText />
      <h2>Reconnaissance des cartes</h2>
      <div className="recognition-tier">
        <ShieldCheck size={18} />
        <div>
          <h3>Base · locale, sans clé</h3>
          <p>
            OCR français/anglais dans le navigateur. Vos photos restent sur
            l’appareil. Seuls les champs corrigés sont utilisés pour rechercher
            une carte sur Scryfall.
          </p>
        </div>
      </div>
      <div className="recognition-tier">
        <KeyRound size={18} />
        <div>
          <h3>+ · vision facultative</h3>
          <p>
            Analyse de l’image complète avec votre clé personnelle. Chaque photo
            nécessite votre confirmation avant transmission au fournisseur
            choisi. Ses conditions de traitement et de facturation s’appliquent.
          </p>
        </div>
      </div>
      <label>
        Fournisseur du mode +
        <select
          aria-label="Fournisseur du mode +"
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value as VisionProvider);
            setInput("");
            setError("");
          }}
        >
          <option value="gemini">Google Gemini · quota gratuit possible</option>
          <option value="openai">OpenAI · API payante</option>
        </select>
      </label>
      {provider === "gemini" ? (
        <div className="provider-info">
          <p>
            Gemini Flash prend en charge les images. Un palier gratuit peut être
            disponible selon votre modèle, votre compte, votre pays et les
            quotas en vigueur. La gratuité n’est pas illimitée ni garantie :
            vérifiez les tarifs dans Google AI Studio avant usage.
          </p>
          <p>
            Les conditions d’utilisation des photos peuvent différer entre
            offres gratuites et payantes. L’OCR local reste disponible sans
            compte ni clé.
          </p>
          <div className="provider-links">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
            >
              Obtenir une clé Gemini <ExternalLink size={13} />
            </a>
            <a
              href="https://ai.google.dev/gemini-api/docs/pricing"
              target="_blank"
              rel="noreferrer"
            >
              Tarifs et quotas officiels <ExternalLink size={13} />
            </a>
          </div>
        </div>
      ) : (
        <p>
          OpenAI utilise une facturation API distincte d’un éventuel abonnement
          ChatGPT.
        </p>
      )}
      <p className="muted">
        La clé reste dans la mémoire de cet onglet, sans sauvegarde ni stockage
        local. Un rechargement ou un changement de fournisseur l’oublie.
        Utilisez uniquement une instance de l’app à laquelle vous faites
        confiance. Aucune clé du projet n’est fournie.
      </p>
      {active ? (
        <div className="key-active">
          <p>
            {providerLabels[provider]} disponible pour cette session. L’accès
            réel sera vérifié lors de votre première analyse explicite.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              clear();
              setInput("");
            }}
          >
            Oublier ma clé
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (input.trim().length < 20) {
              setError("Vérifiez que vous avez saisi une clé API complète.");
              return;
            }
            setKey(input);
            setInput("");
          }}
        >
          <label>
            Clé API personnelle {providerLabels[provider]}
            <input
              type="password"
              aria-label={"Clé API personnelle " + providerLabels[provider]}
              autoComplete="off"
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Clé utilisée uniquement dans cet onglet"
            />
          </label>
          <Button type="submit" variant="outline" disabled={!input.trim()}>
            Activer + pour cette session
          </Button>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

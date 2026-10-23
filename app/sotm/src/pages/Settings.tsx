import { TradeSettings } from "../components/TradeSettings";
import { DeckCollectionSetting } from "../components/DeckCollectionSetting";
import { useQueryClient } from "@tanstack/react-query";
import { resetAppData } from "../services/reset";
import { useVisionSession } from "../stores/vision";
import { LanguageSettings } from "../components/LanguageSettings";
import { CurrencySettings } from "../components/CurrencySettings";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Database,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageHead, usePreferences } from "../components/CollectionShared";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/dialog";
import { clearCatalog, exportBackup, importBackup, savePrefs } from "../db";
import { backupSchema, type Backup, type Preferences } from "../schemas/models";
import { useUI } from "../stores/ui";

export default function Settings() {
  const queryClient = useQueryClient();
  const p = usePreferences();
  const notify = useUI((s) => s.notify);
  const [backup, setBackup] = useState<Backup | null>(null);
  const [replace, setReplace] = useState(false);
  const [clear, setClear] = useState(false);
  const [reset, setReset] = useState(false),
    [resetConfirmed, setResetConfirmed] = useState(false),
    [resetBusy, setResetBusy] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState("");
  useEffect(() => {
    void navigator.storage
      ?.estimate()
      .then((e) =>
        setUsage(
          `${((e.usage ?? 0) / 1048576).toFixed(1)} Mo utilisés sur ${((e.quota ?? 0) / 1073741824).toFixed(1)} Go disponibles`,
        ),
      );
  }, []);
  async function download() {
    try {
      const b = await exportBackup();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(b, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `sotm-backup-${b.exportedAt.slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Sauvegarde exportée");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function read(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 20 * 1024 * 1024)
        throw Error("Fichier trop volumineux (20 Mo maximum)");
      setBackup(backupSchema.parse(JSON.parse(await file.text())));
    } catch {
      setError(
        "Sauvegarde invalide : vérifiez le format, la version 1 et les quantités de chaque lot.",
      );
    }
  }
  return (
    <>
      <PageHead
        eyebrow="LES FONDATIONS DE ŠOTM"
        title="Paramètres"
        description="Vos cartes vous appartiennent. Vos données aussi."
      />
      <section className="settings-grid">
        <CurrencySettings />
        <LanguageSettings />
        <DeckCollectionSetting />
        <TradeSettings />
        <div className="panel setting">
          <ShieldCheck />
          <h2>Local, par nature</h2>
          <p>
            Votre collection et vos decks sont stockés dans ce navigateur, sur cet
            appareil. Aucun compte, aucun backend. Exportez régulièrement une
            sauvegarde : effacer les données du navigateur supprime la
            collection et les decks locaux.
          </p>
          <p className="muted">{usage}</p>
          <Button
            variant="outline"
            onClick={async () => {
              const ok = await navigator.storage?.persist();
              notify(
                ok
                  ? "Stockage persistant accordé"
                  : "Stockage persistant non accordé par le navigateur",
              );
            }}
          >
            Demander le stockage persistant
          </Button>
        </div>
        <div className="panel setting">
          <ArrowDownToLine />
          <h2>Sauvegarde JSON</h2>
          <p>
            Exportez vos lots, decks, extensions suivies et préférences. Les decks
            incluent leurs métadonnées de cartes et les liens des images, pas les fichiers image ni le catalogue complet.
          </p>
          <div className="actions">
            <Button onClick={() => void download()}>
              <ArrowDownToLine size={16} /> Exporter
            </Button>
            <label className="button outline file-button">
              <ArrowUpFromLine size={16} /> Importer
              <input
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  void read(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </div>
        <div className="panel setting">
          <Sparkles />
          <h2>Apparence</h2>
          <p>Porcelaine et ombres, selon votre préférence.</p>
          <label>
            Thème
            <select
              aria-label="Thème"
              value={p.theme}
              onChange={(e) =>
                void savePrefs({
                  ...p,
                  theme: e.target.value as Preferences["theme"],
                })
              }
            >
              <option value="dark">Sombre · Phyrexiane</option>
              <option value="light">Clair · Porcelaine</option>
            </select>
          </label>
        </div>
        <div className="panel setting">
          <Database />
          <h2>Cache Scryfall</h2>
          <p>
            Catalogue : {p.metadataDays} jours. Prix : {p.priceHours} heures.
            Les recherches sont conservées 24 heures. Les prix restent
            indicatifs, particulièrement pour les cartes signées ou altérées.
          </p>
          <div className="form-grid">
            <label>
              Catalogue (jours)
              <input
                type="number"
                min="1"
                value={p.metadataDays}
                onChange={(e) => {
                  if (Number(e.target.value) > 0)
                    void savePrefs({
                      ...p,
                      metadataDays: Number(e.target.value),
                    });
                }}
              />
            </label>
            <label>
              Prix (heures)
              <input
                type="number"
                min="1"
                value={p.priceHours}
                onChange={(e) => {
                  if (Number(e.target.value) > 0)
                    void savePrefs({
                      ...p,
                      priceHours: Number(e.target.value),
                    });
                }}
              />
            </label>
          </div>
          <Button variant="outline" onClick={() => setClear(true)}>
            Vider le cache du catalogue
          </Button>
          <p className="muted">
            Vos lots et préférences sont toujours conservés. Les images
            utilisent uniquement le cache HTTP du navigateur.
          </p>
        </div>
      </section>
      <section className="panel setting reset-settings">
        <h2>Réinitialiser šotm</h2>
        <p>
          Efface définitivement la collection, les lots Trade, les préférences,
          le catalogue et le cache OCR de ce navigateur. L’accueil de première
          utilisation sera affiché à nouveau. Aucun autre appareil n’est
          affecté.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setReset(true);
            setResetConfirmed(false);
            setError("");
          }}
        >
          Réinitialiser l’application
        </Button>
      </section>
      {reset && (
        <Modal
          title="Tout effacer sur cet appareil ?"
          onClose={() => {
            if (!resetBusy) setReset(false);
          }}
        >
          <p>
            Cette suppression est définitive, decks compris. Exportez vos données avant de
            continuer si vous souhaitez la conserver.
          </p>
          <Button variant="outline" onClick={() => void download()}>
            Exporter avant de réinitialiser
          </Button>
          <label className="reset-confirm">
            <input
              type="checkbox"
              checked={resetConfirmed}
              onChange={(e) => setResetConfirmed(e.target.checked)}
            />
            Je comprends que toute ma collection locale sera supprimée.
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="actions">
            <Button
              variant="outline"
              disabled={resetBusy}
              onClick={() => setReset(false)}
            >
              Annuler
            </Button>
            <Button
              disabled={!resetConfirmed || resetBusy}
              onClick={async () => {
                setResetBusy(true);
                try {
                  useVisionSession.getState().clear();
                  await resetAppData();
                  queryClient.clear();
                  useUI.setState({ message: "" });
                } catch {
                  setError(
                    "Réinitialisation impossible. Réessayez après avoir fermé les autres onglets de l’app.",
                  );
                  setResetBusy(false);
                }
              }}
            >
              {resetBusy ? "Effacement…" : "Tout effacer"}
            </Button>
          </div>
        </Modal>
      )}
      {backup && (
        <Modal
          title="Restaurer une sauvegarde"
          onClose={() => {
            setBackup(null);
            setReplace(false);
          }}
        >
          <p>
            {backup.decks.length} decks · {backup.lots.length} lots ·{" "}
            {backup.lots.reduce((n, l) => n + l.quantity, 0)} exemplaires ·{" "}
            {backup.preferences.tracked.length} extensions suivies.
          </p>
          <p>Export du {new Date(backup.exportedAt).toLocaleString("fr-FR")}</p>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
            />{" "}
            Remplacement complet (supprime les lots et decks actuels)
          </label>
          <p className="muted">
            En fusion, l’identifiant stable du lot évite les doublons. La
            version la plus récente est conservée ; les quantités ne sont pas
            additionnées.
          </p>
          <Button
            onClick={async () => {
              try {
                await importBackup(backup, replace);
                setBackup(null);
                setReplace(false);
                notify("Sauvegarde restaurée");
              } catch (e) {
                notify("Import annulé : " + (e as Error).message);
              }
            }}
          >
            {replace
              ? "Confirmer le remplacement complet"
              : "Fusionner la sauvegarde"}
          </Button>
        </Modal>
      )}
      {clear && (
        <Modal
          title="Vider le catalogue local ?"
          onClose={() => setClear(false)}
        >
          <p>
            Les données Scryfall devront être téléchargées à nouveau. La
            collection, les decks et les quantités Trade restent intacts.
          </p>
          <Button
            onClick={async () => {
              await clearCatalog();
              setClear(false);
              notify("Catalogue vidé ; collection conservée");
            }}
          >
            Confirmer
          </Button>
        </Modal>
      )}
    </>
  );
}

import { usePreferences } from "./CollectionShared";
import { updatePrefs } from "../db";
import { useVisionSession, providerLabels } from "../stores/vision";
import { identifyWithVision } from "../services/vision";
import { Modal } from "./ui/dialog";
import { Camera, ImagePlus, ScanText, Square, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { SearchResults } from "./SearchResults";
import { photoQuery } from "../services/ocrHints";
import type { OCRProgress } from "../services/ocr";
export function Scanner() {
  const preferences = usePreferences();
  const apiKey = useVisionSession((s) => s.apiKey);
  const provider = useVisionSession((s) => s.provider);
  const providerName = providerLabels[provider];
  const [source, setSource] = useState<"local" | "plus">("local"),
    [plusConfirm, setPlusConfirm] = useState(false);
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    controller = useRef<AbortController | null>(null),
    mounted = useRef(true),
    requestId = useRef(0);
  const [active, setActive] = useState(false),
    [photo, setPhoto] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState<OCRProgress>({
      label: "Préparation OCR",
      progress: 0,
    });
  const [name, setName] = useState(""),
    [set, setSet] = useState(""),
    [number, setNumber] = useState(""),
    [raw, setRaw] = useState(""),
    [confidence, setConfidence] = useState<number | null>(null),
    [query, setQuery] = useState("");
  function stopCamera() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }
  function cancel() {
    requestId.current++;
    controller.current?.abort();
    controller.current = null;
    if (source === "plus") setSource("local");
    setBusy(false);
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current++;
      controller.current?.abort();
      stopCamera();
    };
  }, []);
  useEffect(() => {
    if (active && video.current) {
      video.current.srcObject = stream.current;
      void video.current.play().catch(() => {
        stopCamera();
        if (mounted.current) {
          setActive(false);
          setError("Lecture caméra impossible. Importez une photo.");
        }
      });
    }
  }, [active]);
  async function start() {
    cancel();
    const id = ++requestId.current;
    stopCamera();
    setError("");
    try {
      if (!navigator.mediaDevices)
        throw Error(
          "La caméra nécessite HTTPS ou localhost et un navigateur compatible.",
        );
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (!mounted.current || id !== requestId.current) {
        next.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = next;
      setActive(true);
      setPhoto("");
      setQuery("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function readImage(src: string) {
    cancel();
    stopCamera();
    setActive(false);
    setPhoto(src);
    setSource("local");
    setError("");
    setQuery("");
    setRaw("");
    setName("");
    setSet("");
    setNumber("");
    setConfidence(null);
    const id = ++requestId.current;
    const aborter = new AbortController();
    controller.current = aborter;
    setBusy(true);
    setProgress({ label: "Préparation OCR", progress: 0 });
    try {
      const { recognizeCard } = await import("../services/ocr");
      if (aborter.signal.aborted) return;
      const result = await recognizeCard(
        src,
        (p) => {
          if (mounted.current && id === requestId.current) setProgress(p);
        },
        aborter.signal,
      );
      if (mounted.current && id === requestId.current) {
        setName(result.name);
        setSet(result.set);
        setNumber(result.collectorNumber);
        setRaw(result.text);
        setConfidence(result.confidence);
        if (!result.name)
          setError(
            "Aucun nom lisible. Reprenez une photo plus nette ou saisissez le nom manuellement.",
          );
      }
    } catch (e) {
      if (
        mounted.current &&
        id === requestId.current &&
        !aborter.signal.aborted
      )
        setError(
          "Lecture OCR impossible. Vous pouvez saisir le nom manuellement ou reprendre une photo. " +
            (e instanceof Error ? e.message : ""),
        );
    } finally {
      if (mounted.current && id === requestId.current) {
        setBusy(false);
        controller.current = null;
      }
    }
  }
  async function analyzeVisual() {
    if (!photo || !apiKey) return;
    cancel();
    const id = ++requestId.current;
    const aborter = new AbortController();
    controller.current = aborter;
    setPlusConfirm(false);
    setSource("plus");
    setConfidence(null);
    setBusy(true);
    setError("");
    setQuery("");
    setProgress({ label: "Analyse visuelle +", progress: 0 });
    try {
      const result = await identifyWithVision(
        photo,
        apiKey,
        aborter.signal,
        provider,
      );
      if (mounted.current && id === requestId.current) {
        setName(result.name);
        setSet(result.set);
        setNumber(result.collectorNumber);
        setRaw(JSON.stringify(result, null, 2));
        if (!result.name)
          setError(
            "La carte n’a pas pu être identifiée. Reprenez une photo ou corrigez le nom manuellement.",
          );
      }
    } catch (e) {
      if (
        mounted.current &&
        id === requestId.current &&
        !aborter.signal.aborted
      ) {
        setError((e as Error).message);
        setSource("local");
      }
    } finally {
      if (mounted.current && id === requestId.current) {
        setBusy(false);
        controller.current = null;
      }
    }
  }
  function capture() {
    const v = video.current;
    if (!v?.videoWidth) {
      setError("Attendez que la caméra affiche une image.");
      return;
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1800 / Math.max(v.videoWidth, v.videoHeight));
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height);
    void readImage(canvas.toDataURL("image/jpeg", 0.92));
  }
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choisissez une image JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Image trop volumineuse : 20 Mo maximum.");
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      if (!mounted.current) return;
      const scale = Math.min(2, 1800 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      await readImage(c.toDataURL("image/jpeg", 0.95));
    } catch {
      if (mounted.current)
        setError("Cette image ne peut pas être lue. Essayez un JPEG ou PNG.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return (
    <>
      {!preferences.scannerPrivacySeen && (
        <aside className="scanner-first-use panel">
          <h3>Votre photo, votre choix</h3>
          <p>
            <strong>Base locale :</strong> OCR sur votre appareil, aucune clé
            nécessaire. <strong>Mode + facultatif :</strong> ajoutez votre clé
            personnelle dans les paramètres, puis confirmez chaque envoi de
            photo au fournisseur choisi (Gemini ou OpenAI). Le service peut être
            payant ; la clé reste uniquement en mémoire jusqu’au rechargement.
          </p>
          <Button
            variant="outline"
            onClick={() => void updatePrefs({ scannerPrivacySeen: true })}
          >
            Compris, rester maître de mes photos
          </Button>
        </aside>
      )}
      <section className="photo-scanner panel" aria-label="Ajout par photo">
        <div className="method-intro">
          <p className="eyebrow">CAPTURE ASSISTÉE</p>
          <h2>La carte prend la parole.</h2>
          <p className="muted">
            Photographiez une carte bien droite et nette, ou choisissez une
            image. L’OCR français/anglais lit le texte sur cet appareil.
          </p>
        </div>
        <div className="actions">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void start()}
          >
            <Camera size={17} />
            {photo ? "Reprendre une photo" : "Activer la caméra"}
          </Button>
          <label className="button outline file-button">
            <ImagePlus size={17} /> Choisir une image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              aria-label="Image de carte pour OCR"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void upload(file);
              }}
            />
          </label>
        </div>
        {active && (
          <div className="camera-stage">
            <video ref={video} autoPlay playsInline muted />
            <p>Placez la carte entière dans l’image, sans reflets.</p>
            <div className="actions">
              <Button onClick={capture}>
                <Camera size={16} /> Capturer et lire
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  stopCamera();
                  setActive(false);
                }}
              >
                Fermer la caméra
              </Button>
            </div>
          </div>
        )}
        {photo && (
          <div className="ocr-workspace">
            <img
              className="captured-card"
              src={photo}
              alt="Photo locale de la carte à identifier"
            />
            <div className="ocr-review">
              {busy ? (
                <div className="ocr-progress" role="status">
                  <ScanText size={25} />
                  <h3>{progress.label}</h3>
                  <progress
                    max={100}
                    value={source === "plus" ? undefined : progress.progress}
                    aria-label="Progression OCR"
                  />
                  <p>
                    {source === "plus"
                      ? `Photo transmise à ${providerName} à votre demande…`
                      : `${progress.progress} % · Le premier chargement peut prendre quelques secondes.`}
                  </p>
                  <Button variant="outline" onClick={cancel}>
                    <Square size={13} /> Annuler la lecture
                  </Button>
                </div>
              ) : (
                <>
                  <div className="ocr-status">
                    <ScanText size={17} />
                    {source === "plus"
                      ? "Suggestion visuelle + · à vérifier"
                      : confidence === null
                        ? "Recherche manuelle assistée"
                        : `Lecture terminée · confiance indicative ${Math.round(confidence)} %`}
                  </div>
                  <p className="muted">
                    Vérifiez et corrigez ces champs. Le texte reconnu peut être
                    inexact ; aucune carte n’est ajoutée automatiquement.
                  </p>
                  {apiKey && (
                    <Button
                      className="vision-action"
                      type="button"
                      variant="outline"
                      onClick={() => setPlusConfirm(true)}
                    >
                      Analyser l’image avec +
                    </Button>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setError("");
                      try {
                        setQuery(photoQuery(name, set, number));
                      } catch (err) {
                        setError((err as Error).message);
                      }
                    }}
                  >
                    <label>
                      Nom reconnu
                      <input
                        aria-label="Nom reconnu"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Nom de la carte"
                      />
                    </label>
                    <div className="form-grid">
                      <label>
                        Extension (facultatif)
                        <input
                          aria-label="Extension reconnue"
                          placeholder="ONE"
                          value={set}
                          onChange={(e) => setSet(e.target.value)}
                        />
                      </label>
                      <label>
                        Numéro (facultatif)
                        <input
                          aria-label="Numéro reconnu"
                          placeholder="10"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="actions">
                      <Button type="submit" disabled={!name.trim()}>
                        Vérifier sur Scryfall
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void readImage(photo)}
                      >
                        <RotateCcw size={14} /> Relire
                      </Button>
                    </div>
                  </form>
                  {raw && (
                    <details className="ocr-raw">
                      <summary>
                        {source === "plus"
                          ? "Voir la proposition visuelle"
                          : "Voir le texte reconnu"}
                      </summary>
                      <pre>{raw}</pre>
                    </details>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <p className="scanner-privacy">
          En mode Base, votre photo reste sur cet appareil. Les champs validés
          sont envoyés à Scryfall pour rechercher une impression. Le mode +
          n’envoie la photo au fournisseur choisi qu’après votre confirmation.
          La photo n’est pas conservée par šotm.
        </p>
      </section>
      {plusConfirm && (
        <Modal
          title="Envoyer cette photo pour analyse + ?"
          onClose={() => setPlusConfirm(false)}
        >
          <p>
            Cette photo sera transmise à {providerName} avec votre clé
            personnelle pour identifier la carte. Le fournisseur peut facturer
            cet appel et ses conditions de traitement s’appliquent. Votre
            collection complète n’est pas envoyée. La proposition devra être
            vérifiée avant tout ajout.
          </p>
          <div className="actions">
            <Button variant="outline" onClick={() => setPlusConfirm(false)}>
              Rester en local
            </Button>
            <Button onClick={() => void analyzeVisual()}>
              Envoyer cette photo à {providerName}
            </Button>
          </div>
        </Modal>
      )}
      <SearchResults key={query} query={query} />
    </>
  );
}

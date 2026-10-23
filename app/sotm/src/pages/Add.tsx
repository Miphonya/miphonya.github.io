import { FilePlus2, Search } from "lucide-react";
import { PageHead, usePreferences } from "../components/CollectionShared";
import { NameSearch } from "../components/NameSearch";
import { ListImporter } from "../components/ListImporter";
import { updatePrefs } from "../db";
const methods = [
  { id: "name", name: "Par nom", icon: Search },
  { id: "batch", name: "Par lot", icon: FilePlus2 },
] as const;
export default function Add() {
  const p = usePreferences();
  const method = p.addMethod === "batch" ? "batch" : "name";
  return (
    <>
      <PageHead
        eyebrow="AGRANDISSEZ L’ARCHIVE"
        title="Ajouter des cartes"
        description="Un nom ou une liste. À vous de choisir."
      />
      <div className="add-methods" role="tablist" aria-label="Méthode d’ajout">
        {methods.map(({ id, name, icon: Icon }, i) => (
          <button
            key={id}
            id={"method-" + id}
            type="button"
            role="tab"
            aria-selected={method === id}
            aria-controls={"panel-" + id}
            tabIndex={method === id ? 0 : -1}
            onClick={() => void updatePrefs({ addMethod: id })}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const index =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? methods.length - 1
                      : (i + (e.key === "ArrowRight" ? 1 : methods.length - 1)) % methods.length;
                void updatePrefs({ addMethod: methods[index].id });
                document.getElementById("method-" + methods[index].id)?.focus();
              }
            }}
          >
            <Icon size={18} />
            <span>{name}</span>
          </button>
        ))}
      </div>
      <section
        className="add-method-panel"
        role="tabpanel"
        id={"panel-" + method}
        aria-labelledby={"method-" + method}
      >
        {method === "name" ? (
          <NameSearch />
        ) : (
          <ListImporter />
        )}
      </section>
    </>
  );
}

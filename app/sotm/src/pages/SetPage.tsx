import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import CardBrowser from "../components/CardBrowser";
import { PageHead, QueryState, useCollectionView } from "../components/CollectionShared";
import { Button } from "../components/ui/button";
import { db } from "../db";
import { scryfallService } from "../services/scryfall";

export default function SetPage() {
  const { code = "" } = useParams();
  const nav = useNavigate();
  const q = useQuery({
    queryKey: ["set", code],
    queryFn: () => scryfallService.setCards(code),
  });
  const local = useCollectionView().cards.filter(card => card.set === code);
  const set = useLiveQuery(() => db.sets.get(code), [code]);
  return (
    <>
      <Button variant="ghost" onClick={() => nav("/")}>
        <ArrowLeft size={16} /> Extensions
      </Button>
      <PageHead
        eyebrow={code.toUpperCase()}
        title={set?.name ?? "Catalogue de l’extension"}
        description="Explorez les impressions, identifiez les manquantes et ajoutez vos exemplaires."
      />
      <QueryState loading={q.isPending && !local?.length} error={q.error} />
      <CardBrowser key={code} markMissing cards={q.data ?? local ?? []} />
    </>
  );
}

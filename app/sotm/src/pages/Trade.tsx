import { Link } from "react-router-dom";
import { PageHead, usePreferences } from "../components/CollectionShared";
import LotsPanel from "../components/LotsPanel";
export default function Trade() {
  const p = usePreferences();
  return <><PageHead eyebrow="VOS CARTES À TRANSMETTRE" title="Les échanges" description={p.autoTradeDuplicates ? "Vos doublons sont proposés automatiquement. Un exemplaire par extension et numéro reste réservé, en priorité foil ou etched." : "Vos exemplaires disponibles à l’échange, choisis manuellement."} />
    <p className="notice">{p.autoTradeDuplicates ? "Gestion automatique activée" : "Gestion manuelle activée"} · <Link to="/settings">Modifier dans les paramètres →</Link></p>
    <LotsPanel tradeOnly />
  </>;
}

# šotm

Gestionnaire personnel de cartes Magic: The Gathering, statique, local-first et sans compte. Interface française inspirée de la porcelaine et des architectures biomécaniques, sous le nom humain **šotm**, avec l’emblème original et le nom phyrexian affiché en image (`public/app/sotm/wordmark.svg`), comme avant l’essai de police. Ce SVG est l’adaptation vectorielle précédemment utilisée, et non le fichier image original joint. Le nom accessible et le remplacement en cas d’image indisponible restent **šotm**.

## Développement

Node.js 22.12+ ou 24, npm.

Depuis la racine du dépôt :

```sh
cd app/sotm
npm ci
npm run dev
npm test
npm run build
```

Les tâches cloud utilisent le checkout existant ; aucun worktree supplémentaire n’est nécessaire.

## Hébergement public

Le code source et les outils sont dans `app/sotm/` ; seul `index.html` reste à la racine, avec les métadonnées Git/GitHub. Le workflow `.github/workflows/deploy.yml` vérifie les tests et compile depuis `app/sotm`, puis publie le contenu de `app/sotm/dist` sur GitHub Pages à chaque push sur `main`. Il fournit aussi une archive téléchargeable `sotm-site`.

Dans le dépôt GitHub, ouvrir **Settings → Pages → Build and deployment**, puis choisir **GitHub Actions** comme source. Dans **Actions → Validate and deploy Pages**, suivre l’exécution ou cliquer sur **Run workflow** avec la branche `main`. Après réussite, le site est accessible à `https://miphonya.github.io/PhyrexiaCodex/`. Aucun dossier source ni branche `gh-pages` n’est à sélectionner : le workflow publie les fichiers compilés.

Pour publier sur un autre hébergeur statique, exécuter `npm run build` depuis `app/sotm`, puis copier **le contenu** de `app/sotm/dist/` à l’emplacement voulu :

```text
index.html
sw.js                 # petit chargeur nécessaire au cache hors ligne de l’index
app/sotm/
  assets/             # JavaScript et CSS compilés
  logo.svg
  wordmark.svg
  favicon.svg
  fonts/
  ocr/
  sw.js               # code principal du service worker
```

Le `sw.js` de racine est une exception technique pour l’ouverture hors ligne : sans en-tête `Service-Worker-Allowed` personnalisé sur l’hébergeur, un worker placé seulement dans `app/sotm/` ne peut pas contrôler l’index de racine. La base relative et le routage par hash permettent une publication à la racine d’un domaine ou dans un sous-dossier. Ne pas publier le code source tel quel : l’index source contient une entrée TypeScript que Vite doit compiler. Pour le développement, `npm run dev` sert directement l’index source à la racine.

Une collection existante reste disponible si l’origine (protocole, domaine et port) reste la même. Pour changer de domaine ou d’hébergeur, exporter puis réimporter les données JSON.

Ne jamais ajouter de sauvegarde personnelle, de jeton ou de fichier `.env` contenant des secrets au dépôt public. Il n’existe aucun secret requis et aucune clé Cardmarket côté client. Un dépôt public n’expose pas les données IndexedDB des visiteurs. Les appels Scryfall, ses images et le taux de change sont néanmoins des requêtes externes ; ce n’est pas une application dépourvue de toute communication réseau.

## Données et architecture

- `src/schemas/models.ts` : types stricts et validation Zod. Les lots possèdent un UUID stable et des caractéristiques indépendantes : impression Scryfall, langue, finition, état, signature, altération et notes.
- `src/db` : Dexie/IndexedDB, lots, catalogue, préférences et cache. Le Trade est un champ du lot, jamais une seconde collection.
- `src/services` : Scryfall indépendant de React, file de requêtes espacées de 120 ms, pagination, reprise limitée des HTTP 429/5xx, cache périssable et fournisseur de prix EUR/USD et conversion CHF datée.
- `src/pages` : extensions, détail de set, collection globale, ajout assisté et paramètres.
- `src/components` : composants de collection et de lots, capture caméra, primitives UI shadcn adaptées avec Radix Dialog et CVA.
- `src/stores` : état UI Zustand ; TanStack Query orchestre le chargement API et Dexie conserve les données.
- `src/styles.css` : tokens CSS de couleurs, typographie, raretés, surfaces, focus et transitions. Tous les écrans partagent ces composants. Thèmes porcelaine clair et sombre, navigation mobile, clavier et réduction des animations.

Les lots ne sont fusionnés explicitement que si toutes leurs caractéristiques, notes comprises, concordent. Les quantités physiques et Trade sont alors additionnées dans une transaction. Une modification Trade seule n’affecte jamais la quantité possédée.

## Sauvegardes

Dans Paramètres, exporter le JSON régulièrement : effacer les données du navigateur, changer d’origine ou d’appareil ne transfère pas la collection. L’export contient le schéma version 1, les lots, les decks, les préférences et les extensions suivies. Les decks embarquent leurs instantanés Scryfall (avec les URL des images), pas les fichiers image ni le catalogue complet.

L’import valide le document entier avant une transaction. La fusion fait un upsert par UUID : un réimport n’additionne pas les quantités et la version avec `updatedAt` le plus récent est conservée. Les lots avec des UUID différents restent distincts. Le remplacement complet nécessite une confirmation explicite. Les métadonnées manquantes après restauration peuvent être récupérées depuis « Toutes mes cartes » ; les lots restent visibles sans ces métadonnées.

## Cache et hors ligne

Les données IndexedDB déjà chargées peuvent être consultées sans réseau. En production HTTPS, un service worker garde le shell et les ressources JS/CSS de l’application pour permettre une réouverture hors ligne après une première visite réussie. Les processus de développement et les permissions caméra ne sont pas persistants.

Le cache des réponses API est limité à environ 25 Mo et évincé par ancienneté, avec une rétention maximale de 90 jours. Le catalogue garde au maximum 15 000 impressions non protégées par des lots possédés ; les cartes possédées sont conservées, ce qui peut dépasser cette limite. Les métadonnées de set se rafraîchissent selon le délai configuré et le catalogue d’un set selon le plus court des délais catalogue/prix. Les résultats de recherche restent en cache 24 h. Le bouton « Actualiser les prix » recharge les impressions possédées par groupes de 75.

Les images utilisent le cache HTTP du navigateur ; elles ne sont pas systématiquement stockées dans IndexedDB et leur disponibilité hors ligne n’est pas garantie. Le shell conserve au maximum 50 ressources. Vider le cache du catalogue ne supprime jamais les lots ou les préférences. Le quota réel dépend du navigateur, et une demande de stockage persistant est proposée dans les paramètres.

## API externes et limites

Domaines requis : `api.scryfall.com`, `cards.scryfall.io`, `svgs.scryfall.io` ; `cdn.jsdelivr.net` pour le taux EUR → CHF.

La liste des extensions provient de Scryfall ; le compteur affiche les impressions distinctes possédées rapportées au `card_count` du set, et non le nombre de cartes Oracle uniques. Ce dénominateur peut inclure des variantes ou des produits qui ne figurent pas dans le filtre papier : il s’agit d’un indicateur de catalogue, pas d’une définition universelle de complétion.

La recherche supporte la syntaxe Scryfall, l’autocomplétion, les impressions et le chargement des pages suivantes. Les filtres s’appliquent aux résultats chargés. Les lots peuvent indiquer leur langue ; la recherche `lang:fr` permet de choisir explicitement une impression localisée. Les prix sont indicatifs, datés dans le catalogue local, et ne reflètent pas l’état, les signatures ou les altérations. Les prix etched sont indisponibles si Scryfall ne fournit pas de champ EUR adapté. Aucun prix manquant n’est inventé.

Fonction en pause, conservée dans les sources : une caméra ou une image JPEG/PNG/WebP fournissait une photo temporaire à Tesseract.js, exécuté dans un Web Worker local. Les modèles français et anglais sont fournis par le site. Le texte reconnu doit être vérifié et corrigé avant une recherche Scryfall, puis l’impression et l’ajout doivent être confirmés manuellement. Scryfall ne reconnaît aucune image : seuls les champs de recherche validés lui sont envoyés. Le recadrage manuel et un fournisseur Cardmarket officiel ne sont pas intégrés. Il n’y a ni scraping ni synchronisation distante.

Magic: The Gathering et les images de cartes appartiennent à Wizards of the Coast. Données et images fournies par Scryfall. Application indépendante, non affiliée à ces sociétés.

## Vérification

`npm test` exerce les contraintes des lots, le Trade, la compatibilité de fusion, la progression par impression, la validation des imports, le réimport idempotent, la conservation des données au nettoyage, les prix absents, les images recto verso, les erreurs API, la pagination et le cache hors ligne. `npm run build` vérifie les types TypeScript et produit les ressources statiques.

### Validation de cette implémentation

Les 44 tests Vitest et la compilation de production ont passé. Un parcours navigateur sur les véritables réponses Scryfall a chargé les 479 impressions papier de ONE (pagination incluse), leurs images, une recherche « Elesh Norn set:one », et la mise à jour des prix via `/cards/collection`. Ajout de trois exemplaires, édition de la quantité Trade, thèmes, export, réimport sans doublon, absence de débordement mobile et rechargement hors ligne de la production ont été vérifiés sans exception JavaScript.

Dans la machine cloud, le navigateur automatisé ne fait pas confiance au certificat du proxy. Le parcours réel a donc utilisé un adaptateur de test relayant les requêtes par `curl`, avec validation TLS et certificats système conservés. Les réponses provenaient de Scryfall, sans fixtures. Cet adaptateur ne fait pas partie de l’application ; les visiteurs utilisent directement `fetch` dans leur navigateur. La capture caméra réelle nécessite un appareil et une autorisation utilisateur ; elle n’a pas été validée sur du matériel physique. La publication GitHub Pages utilise le contenu du dossier compilé.

## Devises, suivi et ajout par liste

Le sélecteur des paramètres propose CHF (par défaut), EUR et USD ; il n’apparaît pas dans la barre supérieure. La devise est aussi choisie lors de la première configuration. EUR/USD utilisent les champs Scryfall de la finition demandée ; CHF convertit le prix EUR avec le taux quotidien de la Currency API de Fawaz Ahmed distribuée via jsDelivr. La source, la date et le taux figurent dans les paramètres. Le taux est conservé dans les préférences et dans les sauvegardes ; les données sont rafraîchies au maximum une fois par 24 heures, sauf demande explicite. Hors ligne ou en cas d’erreur, le dernier taux est conservé et son ancienneté signalée. Sans taux ou prix fiable, le résultat est N/A. Les totaux et le tri par valeur utilisent la devise sélectionnée.

Le bouton « Extensions suivies uniquement » est mémorisé dans IndexedDB : navigation et rechargement ne le réinitialisent pas. Dans le détail d’une extension, les impressions non possédées sont grisées et marquées « Manquante ». Le filtre « Possession » propose toutes, possédées et manquantes.

Dans Ajouter / Scanner, collez une carte par ligne :

```text
1 Elesh Norn, Mother of Machines (ONE) 10 *F*
2 Elesh Norn, Mother of Machines (ONE) 10
```

`*F*` signifie foil, `*E*` etched ; l’absence de marqueur signifie non-foil. Les astérisques échappés `\*F\*` sont également acceptés. Les impressions sont résolues par extension et numéro en appels groupés de 75 maximum (les impressions anglaises déjà en cache sont réutilisées). L’aperçu vérifie le nom et la disponibilité de la finition. Une erreur bloque tout l’ajout. Choisissez un état commun, puis confirmez : chaque ligne crée un lot avec la langue par défaut choisie dans les paramètres, sans signature ni altération et avec une quantité d’échange manuelle initiale à zéro ; les doublons sont calculés automatiquement si le réglage est actif. Maximum 1 000 lignes par analyse. Une même confirmation ne peut pas être exécutée deux fois ; analyser à nouveau une liste crée volontairement de nouveaux exemplaires. Pour restaurer une sauvegarde sans doublons, utilisez l’import JSON des paramètres.

Les anciennes préférences et sauvegardes version 1 reçoivent automatiquement les nouveaux paramètres par défaut sans effacer la collection.

## Première configuration et interface simplifiée

Au premier lancement de cette version sur un navigateur, cinq étapes présentent le fonctionnement local, permettent de choisir apparence, devise et langue des nouveaux exemplaires, puis expliquent le stockage local et les requêtes de catalogue. Les choix sont enregistrés ensemble à la dernière étape. Une fois terminé, l’onboarding ne réapparaît pas après un rechargement. Les utilisateurs des versions précédentes passent une fois par ce nouvel accueil en conservant leurs lots et leurs paramètres existants. Importer une ancienne sauvegarde ne relance pas un onboarding déjà terminé.

La langue des nouveaux lots est réglable dans les paramètres (français par défaut), présélectionnée dans l’éditeur et appliquée aux listes. Elle ne change ni les lots existants, ni les noms ou images Scryfall ; les exemplaires physiques et le catalogue ont des langues distinctes. L’éditeur permet de modifier la langue pour un lot précis.

Le détail d’une extension trie par numéro de carte avec un ordre naturel (`1`, `2`, `10`, `10a`). Les contrôles visibles se limitent à la recherche, la possession, la rareté et le tri. Couleur et type restent accessibles dans « Plus de filtres ». Le filtre d’extension est directement visible dans Toutes mes cartes, avec le nom et le code de chaque extension. Dans les recherches, il reste dans les options avancées lorsqu’il y a plusieurs éditions. Il n’est pas affiché dans le catalogue d’une extension unique. Aucun filtre de finition n’est affiché ; la finition reste un attribut modifiable à l’ajout. La barre d’ajout propose Nom → Lot. Un seul formulaire est affiché à la fois et la dernière méthode utilisée est conservée dans les préférences locales et les sauvegardes.

La page Échanges affiche les exemplaires disponibles. Le mode automatique est activé par défaut : une copie par couple extension + numéro de collection est conservée, en priorité foil ou etched ; à finition égale, le lot le plus ancien est conservé. Les autres exemplaires sont proposés à l’échange, langues et états confondus. Deux cartes portant le même nom mais des numéros ou extensions différents restent distinctes (notamment les terrains normaux et full art). Les numéros alphanumériques sont conservés intégralement, sans conversion numérique. Les entrées de decks ne sont pas proposées, même lorsqu’elles sont comptées dans la vue de collection. Le mode automatique est un calcul de vue : les quantités manuelles stockées sont préservées et réapparaissent si l’option est désactivée dans les paramètres.

## Ajout par photo et OCR local (historique, en pause)

`npm ci` exécute `scripts/prepare-ocr.mjs` : il copie le worker, les quatre variantes du cœur WebAssembly et les modèles français/anglais des paquets npm verrouillés vers `public/app/sotm/ocr/` (dossier généré et ignoré par Git). La compilation les inclut dans `dist/app/sotm/ocr/`. Aucune clé ni dépendance à un service de reconnaissance externe n’est nécessaire pour le mode Base. Les fichiers occupent environ 21 Mo dans le site compilé ; le navigateur ne charge que le cœur adapté à son appareil et les deux modèles au premier usage.

Dans Ajouter / Scanner, les trois boutons Nom, Photo et Lot changent la méthode active et mémorisent ce choix. Photo précède Lot ; on peut importer une image ou ouvrir la caméra. La lecture affiche son avancement et peut être annulée. Le worker OCR est terminé après lecture ou annulation ; la caméra est arrêtée lorsqu’on quitte cette méthode. Les photos ne sont pas enregistrées par šotm dans IndexedDB, dans les sauvegardes ou sur un serveur. Le mode + facultatif transmet uniquement la photo sélectionnée au fournisseur après confirmation explicite.

L’OCR propose un nom et, lorsqu’ils sont lisibles, un numéro et un code d’extension. Ce sont des suggestions faillibles, notamment pour les reflets, les photographies inclinées, les traitements foil et les cadres alternatifs. Les modèles couvrent le français et l’anglais, pas l’écriture phyrexiane ni toutes les langues de cartes. Le score indique la confiance du moteur sur le texte, pas une certitude d’identification. L’utilisateur peut tout corriger ; une recherche explicite sur Scryfall précède toujours l’ajout manuel d’un lot. La reconnaissance visuelle du mode + reste également une proposition à vérifier.

En production, les ressources OCR utilisées sont conservées dans un Cache Storage séparé, limité à 12 fichiers statiques ; aucune photo personnelle n’y est mise. La lecture peut donc fonctionner hors ligne après un premier chargement complet. Les résultats Scryfall non encore chargés et les images de catalogue nécessitent toujours une connexion. Vider les données du site supprime ces ressources et la collection locale ; exportez vos sauvegardes.

Le changement de nom conserve volontairement l’identifiant IndexedDB historique `phyrexian-vault` et le schéma de sauvegarde version 1, afin de retrouver les collections existantes à la même origine. Le dépôt et le chemin GitHub Pages ne sont pas renommés.

Le parcours navigateur a exécuté le vrai moteur sur l’image non modifiée d’Elesh Norn, identifié son nom, puis testé la correction et la recherche réelle Scryfall avant ajout explicite. La lecture a été répétée avec succès hors ligne après rechargement. Le test a aussi vérifié les trois méthodes, leur persistance, l’arrêt d’une caméra simulée et le fonctionnement sous `/PhyrexiaCodex/`. Une caméra physique de téléphone ou Mac reste à vérifier sur l’appareil de l’utilisateur.

## Capture photo en pause

La capture caméra, l’import photo, l’OCR et le mode + ne sont plus accessibles dans l’interface. Aucun réglage de clé ou de fournisseur n’est affiché. L’ajout propose uniquement « Par nom » et « Par lot », avec mémorisation de la dernière méthode. Une ancienne préférence « photo » ouvre désormais « Par nom » sans modifier les lots existants. Les modules de reconnaissance restent dans les sources pour une éventuelle reprise, mais ne sont plus importés par les pages.

Scryfall fournit le catalogue et les prix ; seules les recherches nécessaires lui sont transmises. La collection et les réglages restent dans IndexedDB. Les vérifications de cette révision couvrent les extensions et la recherche réelle d’Elesh Norn, les deux méthodes d’ajout et le rendu entre 320 et 1 440 pixels. Le signalement de connexion Scryfall n’a pas pu être reproduit dans cet environnement.

## Mobile et réinitialisation

L’interface mobile privilégie les zones tactiles, des champs de taille lisible sans zoom forcé, un en-tête compact, une navigation basse flottante avec marges de zone sûre, des extensions présentées en cartes horizontales et des dialogues en panneaux bas. Dans Toutes mes cartes, la gestion détaillée des lots reste accessible dans « Gérer mes exemplaires » pour laisser la grille au premier plan. Le nom phyrexian et l’ancien emblème sont des éléments distincts ; l’image du nom remplace l’essai de police.

Les paramètres permettent de réinitialiser la collection locale. Le dialogue propose d’abord un export JSON et exige une confirmation explicite avant l’effacement. Une transaction supprime lots (y compris Trade), catalogue, réponses API et préférences ; la clé de l’onglet et les données de requêtes en mémoire sont aussi oubliées. Le cache OCR est nettoyé lorsque le navigateur le permet, mais le shell statique est conservé pour pouvoir afficher l’onboarding même hors ligne. L’onboarding recommence ensuite. Les autres appareils et le compte API du fournisseur ne sont pas modifiés ; une clé oubliée par l’app n’est pas révoquée chez le fournisseur.

## Actions sur les cartes

Dans la recherche d’ajout, cliquer sur l’image ouvre le formulaire d’ajout. Dans une extension ou Toutes mes cartes, cliquer sur une impression possédée ouvre ses lots pour les modifier ou les supprimer après confirmation ; une carte manquante ouvre l’ajout. Le bouton + reste disponible. Les images sont aussi accessibles au clavier. Les cartes réversibles Scryfall peuvent porter leur type uniquement sur leurs faces : le filtre utilise ces types sans supposer un champ principal présent.

## Decks

L’onglet Decks crée des listes stockées indépendamment pour Commander, Standard, Pioneer, Modern, Legacy, Vintage, Pauper, Duel Commander et Brawl Standard (60 cartes). Une migration IndexedDB version 2 ajoute la table `decks` sans toucher aux lots existants. Chaque entrée conserve ses propres métadonnées Scryfall : aucun ajout au deck ne crée de lot ni ne remplit le catalogue de collection. Le nettoyage du catalogue préserve les decks ; la réinitialisation les efface.

Le commandant est choisi séparément et fournit la couverture du deck. Un second commandant peut être ajouté pour les capacités compatibles (Partner, Partner with, Friends forever, Choose a Background, Doctor’s companion) ; la première carte fournit l’image. Les quantités se modifient dans la liste, les retraits et la suppression du deck demandent confirmation. Les formats construits ont une réserve. Le changement de format conserve la liste et déplace les commandants vers le principal si le nouveau format n’en utilise pas. Export texte de la liste et notes locales disponibles.

La recherche en haut de l’accueil Decks filtre tous les decks contenant le nom saisi, sans tenir compte de la casse ni des accents : principal, commandants et réserve sont inclus. La recherche Scryfall du sélecteur de cartes accepte aussi sa syntaxe habituelle (`!"Plains"`, par exemple).

Le contrôle de légalité utilise les statuts `legalities` Scryfall enregistrés avec chaque carte, le nombre de cartes, les quantités par identité Oracle entre impressions et zones, les restrictions Vintage, les exceptions explicites de quantité, les terrains de base, la réserve, l’éligibilité générale des commandants et leur identité couleur. Les règles manquantes sont signalées. « Actualiser les règles » recharge les cartes en lots de 75 sans écraser une modification concurrente du deck. Ce contrôle ne remplace pas une homologation : compagnons, cartes bannies uniquement comme commandant selon un format, interactions ou exceptions particulières restent à vérifier. L’ancienneté des instantanés est indiquée.

Le bracket Commander est **déclaré par l’utilisateur**, jamais certifié automatiquement. La liste `is:gamechanger` est téléchargée à la demande depuis Scryfall, datée et conservée localement : repères de 0 en brackets 1/2, au plus 3 en bracket 3. L’app demande une revue des combos précoces, enchaînements de tours et déni massif de terrains ; ces questions ne couvrent pas tous les critères du cadre. Les alertes ne déterminent pas le niveau réel d’un deck. Référence : [présentation officielle des brackets](https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta). La documentation Wizards était inaccessible depuis le réseau de développement ; la liste réelle Scryfall et ses statuts ont été vérifiés, mais pas une certification des critères actuels de Wizards.

L’export JSON inclut les decks avec leurs instantanés. Les anciennes sauvegardes version 1 restent importables ; en fusion, elles ne suppriment pas les decks. Les UUID évitent les doublons, les dates arbitrent les versions et le document entier est validé avant toute écriture. Un remplacement complet supprime les lots et decks actuels avant restauration.

### Comptage des decks dans la collection

L’interrupteur « Compter les cartes des decks dans la collection » apparaît uniquement dans Paramètres. Il pilote la même préférence locale `includeDeckCards`, désactivée par défaut, conservée au rechargement et dans les exports JSON. Les anciennes sauvegardes reçoivent `false`.

Activé, il ajoute les quantités du principal, des commandants et des réserves à la vue de collection, aux totaux, à la valeur indicative et à la progression des extensions. Les copies déjà saisies dans les lots s’additionnent avec celles des decks ; une même carte dans plusieurs decks est comptée pour chaque liste. Les impressions restent distinctes, les identités Oracle servent au nombre de cartes différentes. Les lots restent physiquement séparés dans IndexedDB : aucune copie synthétique n’est sauvegardée comme lot. Les cartes de deck utilisent leur finition enregistrée pour l’estimation ; les anciennes entrées sans caractéristiques prennent les valeurs disponibles de leur impression (non-foil en priorité, langue de la carte, NM).

Une carte visible grâce à un deck ouvre un accès vers son deck d’origine pour modifier ses quantités ou la retirer. Modifier ou supprimer une entrée du deck actualise la vue de collection lorsque le comptage est activé. Désactiver l’option masque ces quantités sans effacer les decks ni les lots. L’actualisation des prix depuis Toutes mes cartes recharge aussi les instantanés des decks quand ils sont inclus.

## Import de decks et caractéristiques

Un clic sur une carte du sélecteur de deck ouvre une configuration avant ajout : quantité, langue (préférence de l’app par défaut), finition disponible, état, signature, altération et notes. Les commandants utilisent le même formulaire, avec quantité fixée à un. Le bouton Modifier de chaque entrée et Caractéristiques du commandant permettent une édition ultérieure. Les variantes d’une même impression sont séparées lorsque leurs caractéristiques diffèrent ; la légalité et les doublons du deck continuent à compter par identité Oracle, indépendamment de la finition ou langue.

Importer une liste depuis le deck utilise le même analyseur que l’ajout à la collection : `1 Elesh Norn, Mother of Machines (ONE) 10 *F*`, ou `*E*` pour etched. L’aperçu vérifie impression, nom et finition avant confirmation. La destination est le principal ou la réserve si le format l’autorise ; le commandant se choisit séparément. Langue, état, signature, altération et notes communs sont appliqués à l’import, puis modifiables par entrée. Les écritures sont atomiques et l’identifiant de l’aperçu empêche un double ajout. Aucun lot de collection ni métadonnée dans son catalogue n’est créé par cet import. Les caractéristiques sont conservées dans la sauvegarde JSON et la projection optionnelle de collection ; l’export texte conserve les marqueurs de finition.

Le réglage d’échange automatique est enregistré sous `autoTradeDuplicates` (valeur par défaut `true`, y compris pour les anciens réglages). L’ajout et l’édition d’une carte de collection affichent un aperçu automatique et désactivent le champ manuel lorsque le réglage est actif. Désactivé, le champ est modifiable. Les doublons sont recalculés immédiatement après les ajouts unitaires ou en lot, changements de quantité et suppressions, sans modifier les quantités possédées ni les affectations aux decks.

## Noms français et suppression des decks

L’import par liste accepte le nom anglais canonique, le nom français officiel et les traductions de la langue par défaut choisie dans l’app. En cas de nom différent du canonique, les traductions Scryfall sont recherchées par groupes de dix impressions puis comparées au nom saisi, à l’extension, au numéro et à l’identité Oracle. Les alias vérifiés sont mis en cache pendant 30 jours pour réutilisation hors ligne ; aucune carte approximative n’est acceptée automatiquement. La langue du lot reste celle choisie dans les réglages ou le formulaire d’import.

Une corbeille sur chaque deck à l’accueil et le bouton Supprimer le deck en haut de sa page ouvrent une confirmation. La suppression retire uniquement le deck et ses cartes comptées optionnellement ; les lots saisis directement dans la collection sont conservés.

Les échanges utilisent en priorité l’extension et le numéro des métadonnées Scryfall de l’impression, plutôt qu’un ancien numéro éventuellement incorrect dans un lot. Les cartes à deux noms restent un seul exemplaire. Chaque proposition automatique affiche le total de l’impression et le détail des lots concernés ; un marquage manuel est explicitement identifié. La navigation principale est Collection → Decks → Échanges → Scan, avec Paramètres séparé en bas sur ordinateur et conservé dans la navigation mobile.

## Sélection et modification en masse

Dans Toutes mes cartes et le catalogue d’une extension, « Sélectionner des cartes » active les cases de sélection sur les impressions possédées. Cliquer sur une image sélectionne ou désélectionne aussi la carte. « Tout sélectionner (cartes affichées) » respecte les filtres ; les cartes sélectionnées puis masquées restent sélectionnées et leur nombre est indiqué. Les cartes manquantes ne sont pas sélectionnables.

« Modifier la sélection » ouvre un aperçu des impressions, du nombre de lots de collection et, si leur comptage est activé, des entrées de decks concernées. Seuls les champs cochés changent : langue, finition, état, quantité par lot/entrée, signature, altération et notes. L’échange manuel est disponible uniquement si l’automatisation est désactivée et ne concerne pas les decks. Les autres caractéristiques restent intactes. Une quantité réduite borne les anciennes quantités d’échange manuelles.

Les validations de toutes les sources précèdent les écritures dans une transaction IndexedDB : une finition indisponible, une quantité de commandant différente de un ou une quantité d’échange excessive annule toute l’opération. Les modifications d’entrées de decks ne créent aucun lot supplémentaire. Les cartes supprimées entre l’ouverture du formulaire et son application ne sont pas recréées.

Après suppression d’un lot depuis la fiche d’une carte, la confirmation et la fenêtre de gestion parent se ferment ensemble, sans fond superposé ni blocage de la navigation. Dans la gestion des lots affichée directement sur la page, seule la confirmation se ferme.

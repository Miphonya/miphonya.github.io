# Publication

Dans Settings → Pages → Build and deployment, choisir **GitHub Actions** comme source (et non Deploy from a branch).

Le workflow pages.yml conserve la page d’accueil et les autres pages statiques, compile l’application avec npm depuis app/sotm, puis publie son résultat sous /sotm/. L’ancien chemin /sotm.html redirige vers /sotm/.

Le remplacement temporaire de index.html a lieu uniquement dans le checkout du runner, après copie du site principal dans _site ; il ne modifie pas le fichier du dépôt.

Ne pas publier directement sotm.html et les sources TypeScript : le navigateur a besoin des fichiers JavaScript compilés par Vite. Les données des collections restent dans le navigateur des visiteurs.

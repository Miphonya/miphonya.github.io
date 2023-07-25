const translations = {
           en: {
             abme: "About me",
             age: "🎂 Age: +18",
             occupation: "💼 Occupation: IT Professional & Developer",
             interests: "🔎 Interests: New technologies, IT and JDR",
             location: "🌍 Location: Switzerland",
             skills: "🖥️ Skills: HTML5, CSS3, JavaScript, Java, C#, and eating coconuts",
             languages: "📢 Languages: French (with sign language), English",
             hobbies: "🎲 Hobbies: Dungeons and Dragons, Video Games, Achievement Hunting, Computing",
             favgames: "🎮 Favorite Video Games: Bad End Theater, OneShot, DDLC+, Baldur's Gate 3, and Subnautica",
             favtvmov: "📺 Favorite Series/Movies: The Alien franchise and Shadows House",

             zahrutext: "Zahru is basically a new tab/start page for web browser, which I created in my spare time to get my hands on JS.",
             btnzahru: "View Project",

             dndprojname: "D&D 5e Tools",
             dndtext: "As the name suggests, this project gathers several small tools that I have developed to assist myself as a player or DM in my role-playing game sessions.",
             btndndname: "Names generator",

             soon: "Soon...",


           },
           fr: {
             abme: "À propos de moi",
             age: "🎂 Âge : +18",
             occupation: "💼 Profession : Professionnel de l'informatique et développeur",
             interests: "🔎 Intérêts : Nouvelles technologies, informatique et jeux de rôle",
             location: "🌍 Lieu : Suisse",
             skills: "🖥️ Compétences : HTML5, CSS3, JavaScript, Java, C# et manger des noix de coco",
             languages: "📢 Langues : Français (avec langue des signes), Anglais",
             hobbies: "🎲 Loisirs : Donjons et Dragons, Jeux vidéo, Informatique",
             favgames: "🎮 Jeux vidéo préférés : Bad End Theater, OneShot, DDLC+, Baldur's Gate 3 et Subnautica",
             favtvmov: "📺 Séries/Films préférés : La franchise Alien et Shadows House",

             zahrutext: "Zahru est essentiellement une nouvelle page d'acceuil / page de démarrage de navigateur web que j'ai créée pendant mon temps libre pour me familiariser avec JS.",
             btnzahru: "Voir le projet",

             dndprojname: "Outils D&D 5e",
             dndtext: "Comme son nom l'indique, ce projet regroupe plusieurs petits outils que j'ai développés pour m'aider en tant que joueuse ou MJ lors de mes sessions de jeu de rôle.",
             btndndname: "Générateur de noms",

             soon: "Bientôt...",
           },
       };

       function changeLanguage() {
        const select = document.getElementById('language-select');
        const selectedLanguage = select.value;

        // Obtenir tous les éléments qui doivent être traduits
        const elements = document.querySelectorAll('.personal-info p, .project-card h2, .project-card p, .portfolio-button');

        // Mettre à jour le contenu en fonction de la langue sélectionnée
        elements.forEach((element) => {
          const id = element.id;
          if (translations[selectedLanguage][id]) {
            element.textContent = translations[selectedLanguage][id];
          }
        });

        // Mettre à jour le titre de l'onglet du navigateur avec la langue sélectionnée
        document.title = `Miphonya.ch - ${translations[selectedLanguage]["abme"]}`;
      }

      // Définir la langue par défaut en fonction de la langue du navigateur
      const defaultLanguage = navigator.language.slice(0, 2); // Obtenir les deux premières lettres du code de langue
      const select = document.getElementById('language-select');
      select.value = defaultLanguage;
      changeLanguage(); // Mettre à jour le contenu en fonction de la langue par défaut

      // Écouteur d'événements pour changer de langue lorsque la liste déroulante est modifiée
      select.addEventListener('change', changeLanguage);

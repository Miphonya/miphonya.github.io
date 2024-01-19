const translations = {
           en: {
             abme: "About me",
             age: "🎂 Age: +18",
             occupation: "💼 Occupation: IT Professional & Developer",
             location: "🌍 Location: Switzerland",
             skills: "🖥️ Skills: HTML5, CSS3, JavaScript, Java",
             languages: "📢 Languages: French (with sign language), English",
             hobbies: "🎲 Hobbies: Dungeons and Dragons, Video Games, Airsoft, Computing",
             favgames: "🎮 Favorite Video Games: Bad End Theater, OneShot, DDLC+, Child of the light and many other !",
             favtvmov: "📺 Favorite Series/Movies: The Alien franchise and Shadows House",

             tradcurrentforphonemessage:"I'm sorry, but you can see what I'm currently doing only in landscape mode... <br><br> 👩🏼‍💻+👾=😁",

             zahrutext: "Zahru is basically a new tab/start page for web browser, which I created in my spare time to get my hands on JS.",
             btnzahru: "View Project",

             dndprojname: "D&D 5e Tools",
             dndtext: "As the name suggests, this project gathers several small tools that I have developed to assist myself as a player or DM in my role-playing game sessions.",
             btndndname: "Names generator",

             soon: "Soon...",

             gentool: "General Tools",
             gentooltext: "As the name suggests, this project gathers several small tools for many things",
             btntoolpassword: "Password generator",

           },
           fr: {
             abme: "À propos de moi",
             age: "🎂 Âge : +18",
             occupation: "💼 Profession : Professionnelle de l'informatique et développeuse",
             location: "🌍 Lieu : Suisse",
             skills: "🖥️ Compétences : HTML5, CSS3, JavaScript, Java",
             languages: "📢 Langues : Français (avec langue des signes), Anglais",
             hobbies: "🎲 Loisirs : Donjons et Dragons, Jeux Vidéo, Airsoft, Informatique",
             favgames: "🎮 Jeux vidéo préférés : Bad End Theater, OneShot, DDLC+, Child of the light et plein d'autre !",
             favtvmov: "📺 Séries/Films préférés : La franchise Alien et Shadows House",

             tradcurrentforphonemessage:"Je suis désolée, mais vous ne pouvez voir ce que je fais actuellement qu'en mode paysage... <br><br> 👩🏼‍💻+👾=😁",

             zahrutext: "Zahru est essentiellement une nouvelle page d'acceuil / page de démarrage de navigateur web que j'ai créée pendant mon temps libre pour me familiariser avec JS.",
             btnzahru: "Voir le projet",

             dndprojname: "Outils D&D 5e",
             dndtext: "Comme son nom l'indique, ce projet regroupe plusieurs petits outils que j'ai développés pour m'aider en tant que joueuse ou MJ lors de mes sessions de jeu de rôle.",
             btndndname: "Générateur de noms",

             soon: "Bientôt...",

             gentool: "Outils en tout genre",
             gentooltext: "Comme son nom l'indique, ce projet regroupe plusieurs petits outils pour de nombreuses choses.",
             btntoolpassword: "Générateur de mot de passe",
           },
       };

       function changeLanguage() {
           const select = document.getElementById('language-select');
           const selectedLanguage = select.value;

           // Get all elements that need to be translated
           const elements = document.querySelectorAll('.personal-info p, .project-card h2, .project-card p, .portfolio-button');

           // Update the content based on the selected language
           elements.forEach((element) => {
               const id = element.id;
               if (translations[selectedLanguage][id]) {
                   element.textContent = translations[selectedLanguage][id];
               }
           });

           // Update the title of the browser tab with the selected language
           document.title = `Miphonya.ch - ${translations[selectedLanguage]["abme"]}`;

           // Update the 'tradcurrentforphonemessage' element with the translated content
           const tradcurrentforphonemessageElement = document.getElementById('tradcurrentforphonemessage');
           if (translations[selectedLanguage]['tradcurrentforphonemessage']) {
               tradcurrentforphonemessageElement.innerHTML = translations[selectedLanguage]['tradcurrentforphonemessage'];
           }
       }

       // Set the default language based on the language of the browser
       const defaultLanguage = navigator.language.slice(0, 2); // Get the first two letters of the language code
       const select = document.getElementById('language-select');
       select.value = defaultLanguage;
       changeLanguage(); // Update the content based on the default language

       // Event listener to change the language when the dropdown is modified
       select.addEventListener('change', changeLanguage);

//------------------------------------------------------------------------------------------------------------------
function refreshIframe() {
           var iframe = document.getElementById('iframeSta');
           iframe.src = iframe.src; // Recharge l'iframe en réaffectant la même URL
       }

       // Rafraîchissement toutes les 10 secondes (10000 millisecondes)
       setInterval(refreshIframe, 1000);

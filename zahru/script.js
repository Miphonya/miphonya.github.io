
// ----------------------------------------------------- AMORCEUR DE PARAMETTRE  -----------------------------------------------------
function loadsettings() {
  // Récupère la valeur de la clé "lang" dans l'objet localStorage
  const lang = localStorage.getItem("lang");
  // Récupère la valeur de la clé "searchEngine" dans l'objet localStorage
  const searchEngine = localStorage.getItem("searchEngine");

  // Déclare un tableau d'options pour la langue
  const langOptions = ["en", "de", "es", "fr", "it", "nl", "mw", "ro", "jp", "cn", "ru", "ar", "kr", "pl"];
  // Déclare un tableau d'options pour les moteurs de recherche
  const searchEngineOptions = ["google", "bing", "brave", "duckduckgo"];

  // Change la langue actuelle en fonction de la valeur récupérée ou utilise la langue par défaut "en"
  changeLang(langOptions.includes(lang) ? lang : "en");
  // Change le moteur de recherche actuel en fonction de la valeur récupérée ou utilise le moteur de recherche par défaut "google"
  changeSearchEngine(searchEngineOptions.includes(searchEngine) ? searchEngine : "google");

  // Récupère la valeur de la clé "nom2" de l'objet localStorage et l'assigne à l'élément d'ID "savednom"
  document.getElementById("savednom").value = localStorage.getItem("nom2") || "";

  // Sélectionne l'index du moteur de recherche actuel dans la liste déroulante en fonction de sa valeur récupérée
  document.getElementById("searchEngineSelect").selectedIndex = searchEngineOptions.indexOf(searchEngine);
}
// ----------------------------------------------------- CHANGEUR DE LANGUE -----------------------------------------------------

function changeLang(lang) {
  // Définit un objet contenant les options de langue pour chaque langue disponible
  const langOptions = {
    en: {
      placeholder: "Search on ",
      tooltip: "Enter ONE word here to change the background theme. For faster results, use common English words such as «Wallpaper». Specific words like «Duck» will work, but they may slow down the page loading, as will words in languages other than English. Leave it blank to reset.",
      urlPlaceholder: "Change background",
      title: "New tab",
      savednomPlaceholder: "What is your name ?"
    },
    de: {
      placeholder: "Suche auf ",
      tooltip: "Geben Sie hier EIN wort, um das Hintergrundthema zu ändern. Verwenden Sie für schnellere Ergebnisse gängige englische Wörter wie «Wallpaper». Spezifische Wörter wie «Ente» funktionieren, können jedoch das Laden der Seite verlangsamen, genauso wie Wörter in anderen Sprachen als Englisch. Leer lassen, um zurückzusetzen.",
      urlPlaceholder: "Hintergrund ändern",
      title: "Neue Registerkarte",
      savednomPlaceholder: "Wie ist Ihr Name ?"
    },
    es: {
      placeholder: "Buscar en ",
      tooltip: "Escriba una palabra aquí para cambiar el tema de fondo. Para obtener resultados más rápidos, use palabras en inglés comunes como «Wallpaper». Palabras específicas como 'Duck' pueden funcionar, pero pueden ralentizar la carga de la página, al igual que las palabras en otros idiomas que no sean el inglés. Dejar vacío para restablecer.",
      urlPlaceholder: "Cambiar el fondo",
      title: "Nueva pestaña",
      savednomPlaceholder: "Cómo te llamas ?"
    },
    fr: {
      placeholder: "Rechercher sur ",
      tooltip: "Entrez ici UN mot pour changer le thème du fond. Pour des résultats plus rapides, utilisez des mots courants en anglais tels que «Wallpaper». Les mots spécifiques comme «Duck» fonctionnent, mais ils peuvent ralentir le chargement de la page, tout comme les mots dans d'autres langues que l'anglais. Laissez vide pour réinitialiser.",
      urlPlaceholder: "Modifier le fond",
      title: "Nouvel onglet",
      savednomPlaceholder: "Quel est votre nom ?"
    },
    it: {
      placeholder: "Zoeken op ",
      tooltip: "Inserisci QUI una PAROLA per cambiare il tema di sfondo. Per risultati più veloci, utilizza parole comuni in inglese come «Wallpaper». Parole specifiche come «Duck» funzionano, ma possono rallentare il caricamento della pagina, così come le parole in altre lingue diverse dall'inglese. Lascia vuoto per ripristinare le impostazioni predefinite.",
      urlPlaceholder: "Modificare lo sfondo",
      title: "Nuova scheda",
      savednomPlaceholder: "Come ti chiami ?"
    },
    nl: {
      placeholder: "Cercare su ",
      tooltip: "Voeg HIER een woord in om het thema van de achtergrond te wijzigen. Gebruik voor snellere resultaten veelvoorkomende Engelse woorden zoals «Wallpaper». Specifieke woorden zoals «Duck» werken wel, maar kunnen de laadtijd van de pagina vertragen, evenals woorden in andere talen dan het Engels. Laat leeg om te resetten.",
      urlPlaceholder: "Verander de achtergrond",
      title: "Nieuw tabblad",
      savednomPlaceholder: "Hoe heet je ?"
    },
    pl: {
      placeholder: "Szukaj na ",
      tooltip: "Wpisz tutaj JEDNO słowo, aby zmienić motyw tła. Aby uzyskać szybsze wyniki, użyj popularnych angielskich słów, takich jak „Tapeta”. Konkretne słowa, takie jak „Kaczka”, również będą działać, ale mogą spowolnić ładowanie strony, podobnie jak słowa w innych językach niż angielski. Pozostaw puste, aby zresetować.",
      urlPlaceholder: "Zmień tło",
      title: "Nowa karta",
      savednomPlaceholder: "Jak masz na imię?"

    },
    pt: {
      placeholder: "Pesquisar em ",
      tooltip: "Insira AQUI uma palavra para alterar o tema de fundo. Use palavras em inglês comuns, como 'Wallpaper', para resultados mais rápidos. Palavras específicas, como 'Pato', funcionam, mas podem retardar o tempo de carregamento da página, assim como palavras em outros idiomas que não o inglês. Deixe em branco para redefinir.",
      urlPlaceholder: "Mudar o plano de fundo",
      title: "Nova guia",
      savednomPlaceholder: "Qual é o seu nome?"
    },
    ro: {
      placeholder: "Căutați pe ",
      tooltip: "Introduceți UN cuvânt aici pentru a schimba tema de fundal. Pentru rezultate mai rapide, utilizați cuvinte comune în limba engleză, cum ar fi „Wallpaper”. Cuvinte specifice, cum ar fi „Rata”, vor funcționa, dar pot încetini încărcarea paginii, la fel cum se întâmplă și cu cuvintele în alte limbi decât engleza. Lăsați gol pentru a reseta.",
      urlPlaceholder: "Schimbați fundalul",
      title: "Tab nou",
      savednomPlaceholder: "Care este numele tău?"
    },
    jp: {
      placeholder: "で検索する ",
      tooltip: "背景テーマを変更するには、ここに1つの単語を入力してください。より速い結果を得るには、「壁紙」などの一般的な英語の単語を使用してください。 「アヒル」などの特定の単語は機能しますが、英語以外の言語の単語と同様にページの読み込み速度を遅くする可能性があります。リセットするには空白のままにしてください。",
      urlPlaceholder: "背景を変更する",
      title: "新しいタブ",
      savednomPlaceholder: "あなたの名前は何ですか？"
    },
    cn: {
      placeholder: "在...上搜索",
      tooltip: "在此输入一个词来更改背景主题。 为了更快的结果，请使用常见的英语单词，如“壁纸”。特定的单词（如“鸭子”）将起作用，但是其他语言的单词将减慢页面加载速度。保留为空白以重置。",
      urlPlaceholder: "更改背景",
      title: "新选项卡",
      savednomPlaceholder: "您的名字是什么？"
    },
    ru: {
      placeholder: "Поиск на ",
      tooltip: "Введите ОДНО слово здесь, чтобы изменить тему фона. Для более быстрых результатов используйте общие английские слова, такие как «Wallpaper». Определенные слова, такие как «Утка», будут работать, но они могут замедлить загрузку страницы, так же как и слова на других языках, кроме английского. Оставьте поле пустым, чтобы сбросить настройки.",
      urlPlaceholder: "Изменить фон",
      title: "Новая вкладка",
      savednomPlaceholder: "Как вас зовут?"
    },
    ar: {
      placeholder: "البحث عن ",
      tooltip: "أدخل كلمة واحدة هنا لتغيير خلفية النافذة. للحصول على نتائج أسرع ، استخدم كلمات إنجليزية مشتركة مثل \"Wallpaper\". الكلمات المحددة مثل \"Duck\" ستعمل ، ولكنها قد تبطئ تحميل الصفحة ، كما ستفعل الكلمات في لغات أخرى غير الإنجليزية. اتركه فارغًا لإعادة التعيين.",
      urlPlaceholder: "تغيير الخلفية",
      title: "علامة تبويب جديدة",
      savednomPlaceholder: "ما هو اسمك ؟"
    },
    kr: {
      placeholder: "검색 ",
      tooltip: "여기에 하나의 단어를 입력하여 배경 테마를 변경하십시오. 더 빠른 결과를 얻으려면 \"배경화면\"과 같은 일반적인 영어 단어를 사용하십시오. \"오리\"와 같은 특정 단어도 작동하지만, 영어 이외의 언어의 단어와 마찬가지로 페이지 로딩 속도가 느려질 수 있습니다. 초기화하려면 비워두세요.",
      urlPlaceholder: "배경 변경",
      title: "새 탭",
      savednomPlaceholder: "당신의 이름은 무엇인가요?"
    },


    mw: {
      placeholder: "Seow meow ",
      tooltip: "Type ONE meow meeeow to meowify the meackground meow. For meowtasticly fast meosult, use commeoon English meows such as «Wallpaper». Spesimeow meows like «Duck» will alsmeow , but theow may meowder the meage meowding time, just meow meows in other meowguage meosides English. Leave it meowpty and meow the saveow button to reset. Meow meow!",
      urlPlaceholder: "Meeoooww meow moew ",
      title: "Meeow meowglet",
      savednomPlaceholder: "Weom meow meow ?"
    }
  };

  // Récupère les éléments HTML nécessaires
  const searchBar = document.getElementById("searchBar");
  const langSelect = document.getElementById("langSelect");
  const inputElement = document.getElementById("urlImage");
  const tooltipElement = document.getElementById("tooltip");

  // Définit la langue de la page HTML
  document.documentElement.lang = lang;
  // Change le placeholder du champ de recherche en fonction de la langue choisie
  searchBar.placeholder = langOptions[lang].placeholder + placeholderValue + "...";
  // Enregistre la langue choisie dans l'objet localStorage
  localStorage.setItem("lang", lang);
  // Sélectionne la langue choisie dans la liste déroulante
  langSelect.selectedIndex = Object.keys(langOptions).indexOf(lang);
  // Change le texte du tooltip en fonction de la langue choisie
  tooltipElement.innerText = langOptions[lang].tooltip;
  // Change le placeholder de l'input pour changer l'image de fond en fonction de la langue choisie
  urlImage.placeholder = langOptions[lang].urlPlaceholder;

  // Change le placeholder du champ "savednom" en fonction de la langue choisie
  document.getElementById("savednom").placeholder = langOptions[lang].savednomPlaceholder;
  // Change le titre de la page en fonction de la langue choisie
  document.title = langOptions[lang].title;

  // Ajoute un événement pour afficher un tooltip lorsque l'utilisateur saisit un texte dans le champ de modification d'image de fond
  inputElement.addEventListener("input", function () {
    if (inputElement.value.length > 0) {
      tooltipElement.style.display = "block";
      tooltipElement.style.top = inputElement.offsetTop + inputElement.offsetHeight + 5 + "px";
      tooltipElement.style.left = inputElement.offsetLeft + "px";
    } else {
      tooltipElement.style.display = "none";
    }
  });

  // Ajoute un événement pour masquer le tooltip lorsque l'utilisateur quitte le champ de modification d'image de fond
  inputElement.addEventListener("blur", function () {
    tooltipElement.style.display = "none";
  });
}

// ----------------------------------------------------- MENU  -----------------------------------------------------
// Cette fonction permet de basculer l'affichage du menu en fonction de son état actuel
function toggleMenu() {
  // Récupère l'élément menu par son id
  const menu = document.getElementById("menu");
  // Si le menu est actuellement affiché
  if (menu.style.display === "block") {
    // Animer la fermeture du menu
    menu.style.animation = "menu-close 0.3s ease-out";
    // Attendre 300ms pour s'assurer que l'animation de fermeture est terminée
    setTimeout(() => {
      // Cacher le menu
      menu.style.display = "none";
      // Réinitialiser l'animation du menu
      menu.style.animation = "";
    }, 300);
  } else {
    // Afficher le menu
    menu.style.display = "block";
    // Animer l'ouverture du menu
    menu.style.animation = "menu-open 0.3s ease-out";
  }
}

// -----------------------------------------------------  INFOBULLE -----------------------------------------------------
// Récupération des éléments HTML
const inputElement = document.getElementById("urlImage");
const tooltipElement = document.getElementById("tooltip");

// Fonction pour gérer l'affichage de la tooltip en fonction de la saisie utilisateur
function handleInput() {
  if (inputElement.value.length > 0) {
    tooltipElement.style.display = "block";
    tooltipElement.style.top = (inputElement.offsetTop + inputElement.offsetHeight + 5) + "px";
    tooltipElement.style.left = inputElement.offsetLeft + "px";
  } else {
    tooltipElement.style.display = "none";
  }
}

// Fonction pour masquer la tooltip
function hideTooltip() {
  tooltipElement.style.display = "none";
}

// Ajout des écouteurs d'événements
inputElement.addEventListener("input", handleInput);
inputElement.addEventListener("blur", hideTooltip);

// -----------------------------------------------------  #CUSTOM DIMENSION -----------------------------------------------------
// Récupération de l'élément select et du choix sauvegardé
const resolutionSelect = document.getElementById('resolutionSelect');
const savedResolution = localStorage.getItem('resolution');

// Initialisation de la résolution de l'image avec la valeur sauvegardée ou la valeur par défaut
let imageResolution = localStorage.getItem('imageResolution') || "http://source.unsplash.com/1920x1080/?";

// Si un choix a été sauvegardé, on restaure la valeur sélectionnée
if (savedResolution) {
  resolutionSelect.value = savedResolution;
}

// Fonction appelée lorsque l'utilisateur change de résolution
function changeResolution(value) {
  // Choix de la résolution de l'image en fonction de la valeur sélectionnée
  switch(value) {
    case "fullhd":
    imageResolution = "http://source.unsplash.com/1920x1080/?";
    break;
    case "qhd":
    imageResolution = "http://source.unsplash.com/2560x1440/?";
    break;
    case "wqhd":
    imageResolution = "http://source.unsplash.com/3440x1440/?";
    break;
    case "quatrek":
    imageResolution = "http://source.unsplash.com/4096x2160/?";
    break;
    default:
    imageResolution = "http://source.unsplash.com/1920x1080/?";
  }

  // Sauvegarde de la résolution choisie et de la résolution de l'image
  localStorage.setItem('resolution', value);
  localStorage.setItem('imageResolution', imageResolution);

  // Modification de l'image de fond avec la nouvelle résolution
  document.documentElement.style.backgroundImage = `url('${imageResolution}wallpaper,landscape')`;
}

// Appel initial de la fonction pour mettre à jour l'image de fond
changeResolution(savedResolution || "fullhd");


// --------------------------  CUSTOM WALLPAPER + Première visite  --------------------------
// --------------------------  Première visite --------------------------
// Vérifier si l'utilisateur a déjà visité le site
if (!localStorage.getItem('firstVisit')) {
  // Afficher un message de bienvenue à l'utilisateur
  // alert("Bienvenue sur notre site! C'est votre première visite ici.");

  // Mettre le premier fond d'écran
  document.documentElement.style.backgroundImage = "url('http://source.unsplash.com/1920x1080/?wallpaper')";

  // Créer un élément carré avec du texte, deux selects et des options à l'intérieur
  const square = document.createElement("div");
  square.id = "square";
  square.innerHTML = `
  <div>
  <div>
  <a id="textzahru">ZahRu</a>
  <img class="hi-hand" src="assets/other/wave-hello.gif" alt="wave-hello" onclick="toggleMenu()">
  <br>
  <div class="select">
  <select id="langSelect" onchange="changeLang(this.value)">
  <option value="en">💂‍♀️English</option>
  <option value="de">🍺Deutsch</option>
  <option value="es">🌶️Español</option>
  <option value="fr">🥖Français</option>
  <option value="it">🍝Italiano</option>
  <option value="nl">🚲Nederlands</option>
  <option value="pl">🎻Polski</option>
  <option value="pt">🏰Português</option>
  <option value="ro">🧛‍♀️Română</option>
  <option value="jp">⛩日本語</option>
  <option value="cn">🀄中文</option>
  <option value="ru">❄Русский</option>
  <option value="ar">🐫عربي</option>
  <option value="kr">👾한국어</option>
  <option value="mw">🐱Meowguage</option>
  </select>
  </div>
  </div>
  <br>
  <div>
  <div class="select">
  <select id="searchEngineSelect" onchange="changeSearchEngine(this.value)">
  <option value="google">🤖Google</option>
  <option value="bing">🔎Bing</option>
  <option value="brave">🦁Brave Search</option>
  <option value="duckduckgo">🦆DuckDuckGo</option>
  </select>
  </div>
  </div>
  <br>
  <div>
  <div class="select">
  <select id="resolutionSelect" onchange="changeResolution(this.value)">
  <option value="fullhd">📼 FullHD (⚡⚡⚡⚡)</option>
  <option value="qhd">🎞 QHD (⚡⚡⚡)</option>
  <option value="wqhd">📺 WQHD (‍⚡⚡)</option>
  <option value="quatrek">🖥 4K(⚡)</option>
  </select>
  </div>
  </div>
  <br>
  
  <button class="button is-medium" onclick="welcomsaver()">⇾ 💾 ⇽</button>
  </div>
  `;

  // Ajouter l'élément carré à la page
  document.body.appendChild(square);
} else {

  // --------------------------  #déjà visité ( fond ecran)  --------------------------
  // Afficher un message de remerciement à l'utilisateur
  //  alert("Merci de visiter notre site à nouveau.");

  // Définir l'image de fond par défaut
  var defaultImage = "http://source.unsplash.com/1920x1080/?";

  function changerImage() {
    var nouvelleImage = document.getElementById("urlImage").value;
    if (nouvelleImage !== "") {
      localStorage.setItem("image_fond", nouvelleImage);
      document.querySelector("html").style.backgroundImage = "url('" + defaultImage + nouvelleImage + "')";
    }
    else {
      localStorage.removeItem("image_fond");
      document.querySelector("html").style.backgroundImage = "url('" + defaultImage + "wallpaper,landscape" + "')";
    }
    document.getElementById("urlImage").value = nouvelleImage;
  }

  // Appel de la fonction d'initialisation au chargement de la page
  window.addEventListener('load', init);

  // Écouteur d'événement pour détecter les changements dans l'input "urlImage"
  document.getElementById("urlImage").addEventListener('input', changerImage);

  // Fonction d'initialisation pour restaurer les valeurs stockées dans le localStorage
  function init() {
    let nouvelleImage = localStorage.getItem("image_fond");

    if (nouvelleImage !== null) {
      document.querySelector("html").style.backgroundImage = "url('" + defaultImage + nouvelleImage + "')";
      document.getElementById("urlImage").value = nouvelleImage;
    } else {
      localStorage.removeItem("image_fond");
      document.querySelector("html").style.backgroundImage = "url('" + defaultImage + "wallpaper,landscape" + "')";
    }
  }
}

// -----------------------------------------------------  welcomsaver -----------------------------------------------------
function welcomsaver() {
  var square = document.getElementById("square"); // Ajout d'une variable pour récupérer l'élément à masquer
    // Enregistrer la visite de l'utilisateur dans le stockage local
    localStorage.setItem("firstVisit", true);
    // Fait disparaitre le carré de bienvenue
    square.style.display = "none";

}



  // -----------------------------------------------------  SALUTATIONS -----------------------------------------------------
  // Définition de constantes pour les salutations en différentes langues
  const BONJOUR_FR = "Bonjour";
  const BONJOUR_EN = "Good morning";
  const BONJOUR_DE = "Guten Morgen";
  const BONJOUR_ES = "Buenos días";
  const BONJOUR_IT = "Buongiorno";
  const BONJOUR_NL = "Goedemorgen";
  const BONJOUR_PT = "Bom dia";
  const BONJOUR_MW = "Meowning";
  const BONJOUR_RO = "Bună dimineața";
  const BONJOUR_JP = "おはようございます";
  const BONJOUR_CN = "早上好";
  const BONJOUR_RU = "Доброе утро";
  const BONJOUR_AR = "صباح الخير";
  const BONJOUR_KR = "안녕하세요";
  const BONJOUR_PL = "Dzień dobry";

  const BON_APRES_MIDI_FR = "Bon après-midi";
  const BON_APRES_MIDI_EN = "Good afternoon";
  const BON_APRES_MIDI_ES = "Buenas tardes";
  const BON_APRES_MIDI_DE = "Guten Tag";
  const BON_APRES_MIDI_IT = "Buongiorno";
  const BON_APRES_MIDI_NL = "Goedemiddag";
  const BON_APRES_MIDI_PT = "Boa tarde";
  const BON_APRES_MIDI_MW = "Meownoon";
  const BON_APRES_MIDI_RO = "Bună după-amiază";
  const BON_APRES_MIDI_JP = "こんにちは";
  const BON_APRES_MIDI_CN = "下午好";
  const BON_APRES_MIDI_RU = "Добрый день";
  const BON_APRES_MIDI_AR = "طاب مساؤك";
  const BON_APRES_MIDI_KR = "안녕하세요";
  const BON_APRES_MIDI_PL = "Dzień dobry";

  const BONSOIR_FR = "Bonsoir";
  const BONSOIR_EN = "Good evening";
  const BONSOIR_ES = "Buenas noches";
  const BONSOIR_DE = "Guten Abend";
  const BONSOIR_IT = "Buonasera";
  const BONSOIR_NL = "Goedenavond";
  const BONSOIR_PT = "Boa noite";
  const BONSOIR_MW = "Meowing";
  const BONSOIR_RO = "Bună seara";
  const BONSOIR_JP = "こんばんは";
  const BONSOIR_CN = "晚上好";
  const BONSOIR_RU = "Добрый вечер";
  const BONSOIR_AR = "مساء الخير";
  const BONSOIR_KR = "안녕하세요";
  const BONSOIR_PL = "Dobry wieczór";

  // Récupération des éléments HTML avec lesquels on va travailler
  const inputNom = document.getElementById("savednom");
  const messageEl = document.getElementById("message");

  // Fonction qui va sauvegarder le nom de l'utilisateur dans le stockage local
  function autosaveName() {
    localStorage.setItem("nom2", inputNom.value);
  }

  // Fonction qui va afficher le message de salutation en fonction de l'heure et de la langue choisie
  function afficherMessage() {
    const nom = localStorage.getItem("nom2");
    const heure = new Date().getHours();
    const lang = document.documentElement.lang;
    let message = "";

    if (nom) {
      if (heure >= 6 && heure < 12) {
        message = (lang === "fr") ? BONJOUR_FR :
        (lang === "en") ? BONJOUR_EN :
        (lang === "de") ? BONJOUR_DE :
        (lang === "es") ? BONJOUR_ES :
        (lang === "it") ? BONJOUR_IT :
        (lang === "nl") ? BONJOUR_NL :
        (lang === "pt") ? BONJOUR_PT :
        (lang === "mw") ? BONJOUR_MW :
        (lang === "ro") ? BONJOUR_RO :
        (lang === "jp") ? BONJOUR_JP :
        (lang === "cn") ? BONJOUR_CM :
        (lang === "ru") ? BONJOUR_RU :
        (lang === "ar") ? BONJOUR_AR :
        (lang === "kr") ? BONJOUR_KR :
        (lang === "pl") ? BONJOUR_PL :
        "";
      } else if (heure >= 12 && heure < 17) {
        message = (lang === "fr") ? BON_APRES_MIDI_FR :
        (lang === "en") ? BON_APRES_MIDI_EN :
        (lang === "de") ? BON_APRES_MIDI_DE :
        (lang === "es") ? BON_APRES_MIDI_ES :
        (lang === "it") ? BON_APRES_MIDI_IT :
        (lang === "nl") ? BON_APRES_MIDI_NL :
        (lang === "pt") ? BON_APRES_MIDI_PT :
        (lang === "mw") ? BON_APRES_MIDI_MW :
        (lang === "ro") ? BON_APRES_MIDI_RO :
        (lang === "jp") ? BON_APRES_MIDI_JP :
        (lang === "cn") ? BON_APRES_MIDI_CN :
        (lang === "ru") ? BON_APRES_MIDI_RU :
        (lang === "ar") ? BON_APRES_MIDI_AR :
        (lang === "kr") ? BON_APRES_MIDI_KR :
        (lang === "pl") ? BON_APRES_MIDI_PL :
        "";
      } else {
        message = (lang === "fr") ? BONSOIR_FR :
        (lang === "en") ? BONSOIR_EN :
        (lang === "de") ? BONSOIR_DE :
        (lang === "es") ? BONSOIR_ES :
        (lang === "it") ? BONSOIR_IT :
        (lang === "nl") ? BONSOIR_NL :
        (lang === "pt") ? BONSOIR_PT :
        (lang === "mw") ? BONSOIR_MW :
        (lang === "ro") ? BONSOIR_RO :
        (lang === "jp") ? BONSOIR_JP :
        (lang === "cn") ? BONSOIR_CN :
        (lang === "ru") ? BONSOIR_RU :
        (lang === "ar") ? BONSOIR_AR :
        (lang === "kr") ? BONSOIR_KR :
        (lang === "pl") ? BONSOIR_PL :
        "";
      }

      message += ", " + nom + ".";

    }

    // On affiche le message dans l'élément HTML messageEl
    messageEl.textContent = message;
  }

  // On écoute les changements dans l'élément inputNom et on appelle les fonctions de sauvegarde et d'affichage
  inputNom.addEventListener("input", () => {
    autosaveName();
    afficherMessage();
  });

  // On appelle la fonction afficherMessage toutes les secondes pour mettre à jour l'affichage de l'heure
  setInterval(afficherMessage, 50);
  // ----------------------------------------------------- MODIFICATION DU MOTEUR -----------------------------------------------------

  let placeholderValue = "";

  function changeSearchEngine(engine) {
    const searchForm = document.getElementById("searchForm");
    if (engine === "google") {
      searchForm.action = "https://www.google.com/search";
      placeholderValue = "Google";
      localStorage.setItem("searchEngine", "google"); // stocker la valeur "google" dans le local storage

    } else if (engine === "bing") {
      searchForm.action = "https://www.bing.com/search";
      placeholderValue = "Bing";
      localStorage.setItem("searchEngine", "bing"); // stocker la valeur "bing" dans le local storage

    } else if (engine === "brave") {
      searchForm.action = "https://search.brave.com/search";
      placeholderValue = "Brave Search";
      localStorage.setItem("searchEngine", "brave"); // stocker la valeur "brave" dans le local storage

    }else if (engine === "duckduckgo") {
      searchForm.action = "https://duckduckgo.com/";
      placeholderValue = "DuckDuckGo";
      localStorage.setItem("searchEngine", "duckduckgo"); // stocker la valeur "DuckDuckGo" dans le local storage
    }

    // Appeler la fonction changeLang() pour mettre à jour le placeholder
    changeLang(localStorage.getItem("lang"));
  }

  // ----------------------------------------------------- VALIDATION SEARCHBAR -----------------------------------------------------

  // Cette fonction est appelée lorsqu'un formulaire de recherche est soumis
  function validateSearch(event) {
    // Récupère l'élément de formulaire de recherche par son ID
    const searchInput = document.getElementById("searchBar");

    // Vérifie si l'entrée de recherche est vide ou composée uniquement d'espaces blancs
    if (searchInput.value.trim() === "") {
      // Ajoute une classe CSS pour faire vibrer l'entrée de recherche
      searchInput.classList.add("shake");
      // Supprime la classe CSS "shake" après une seconde
      setTimeout(() => searchInput.classList.remove("shake"), 1000);
      // Change la couleur de la bordure de l'entrée de recherche en rouge
      searchInput.style.borderColor = "red";
      // Rétablit la couleur de la bordure de l'entrée de recherche après 500 ms
      setTimeout(() => searchInput.style.borderColor = "", 500);
      // Empêche l'envoi du formulaire
      event.preventDefault();
      // Retourne faux pour indiquer que la validation a échoué
      return false;
    }
    // Retourne vrai pour indiquer que la validation a réussi
    return true;
  }

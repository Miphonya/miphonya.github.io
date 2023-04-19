
// ----------------------------------------------------- AMORCEUR DE PARAMETTRE  -----------------------------------------------------

function loadsettings() {
  const lang = localStorage.getItem("lang");
  const searchEngine = localStorage.getItem("searchEngine");
  if (lang === "fr") {
      changeLang("fr");
  } else if (lang === "de") {
      changeLang("de");
  } else if (lang === "mw") {
    changeLang("mw");
  } else {
    changeLang("en"); // set default language to English
  }

  var savedName = localStorage.getItem("nom2");
  if (savedName !== null) {
    document.getElementById("savednom").value = savedName;
  }

  if (searchEngine === "google") {
      changeSearchEngine("google");
      document.getElementById("searchEngineSelect").selectedIndex = 0;

  }   else if (searchEngine === "bing") {
      changeSearchEngine("bing");
      document.getElementById("searchEngineSelect").selectedIndex = 1;

  }  else if (searchEngine === "brave") {
      changeSearchEngine("brave");
      document.getElementById("searchEngineSelect").selectedIndex = 2;

  }  else if (searchEngine === "duckduckgo") {
     changeSearchEngine("duckduckgo");
     document.getElementById("searchEngineSelect").selectedIndex = 3;
  } else {
     changeSearchEngine("google"); // set default search engine to Google
     document.getElementById("searchEngineSelect").selectedIndex = 0;
  }
}



// ----------------------------------------------------- CHANGEUR DE LANGUE -----------------------------------------------------
function changeLang(lang) {
  const searchBar = document.getElementById("searchBar");
  const langSelect = document.getElementById("langSelect");
  const inputElement = document.getElementById("urlImage");
  const tooltipElement = document.getElementById("tooltip");

  if (lang === "fr") {
    document.documentElement.lang = "fr";
    searchBar.placeholder = "Rechercher sur " + placeholderValue + "...";
    localStorage.setItem("lang", "fr"); // stocker la langue choisie dans le local storage
    langSelect.selectedIndex = 0; // ajouter l'attribut "selected" à l'option française
    tooltipElement.innerText = "Entrez ici UN mot pour changer le thème du fond. Pour des résultats plus rapides, utilisez des mots courants en anglais tels que «Wallpaper». Les mots spécifiques comme «Duck» fonctionnent, mais ils peuvent ralentir le chargement de la page, tout comme les mots dans d'autres langues que l'anglais. Laissez vide et enregistrer pour réinitialiser.";
    urlImage.placeholder = "Modifier le fond"
  } else if (lang === "en") {
    document.documentElement.lang = "en";
    searchBar.placeholder = "Search on " + placeholderValue + "...";
    localStorage.setItem("lang", "en"); // stocker la langue choisie dans le local storage
    langSelect.selectedIndex = 1; // ajouter l'attribut "selected" à l'option anglaise
    tooltipElement.innerText = "Enter ONE word here to change the background theme. For faster results, use common English words such as «Wallpaper». Specific words like «Duck» will work, but they may slow down the page loading, as will words in languages other than English. Leave it blank and save to reset.";
    urlImage.placeholder = "Change background"
  } else if (lang === "de") {
    document.documentElement.lang = "de";
    searchBar.placeholder = "Suche auf " + placeholderValue + "...";
    localStorage.setItem("lang", "de"); // stocker la langue choisie dans le local storage
    langSelect.selectedIndex = 2; // ajouter l'attribut "selected" à l'option allemande
    tooltipElement.innerText = "Geben Sie hier EIN wort, um das Hintergrundthema zu ändern. Verwenden Sie für schnellere Ergebnisse gängige englische Wörter wie «Wallpaper». Spezifische Wörter wie «Ente» funktionieren, können jedoch das Laden der Seite verlangsamen, genauso wie Wörter in anderen Sprachen als Englisch. Lassen Sie es leer und speichern Sie es, um es zurückzusetzen.";
    urlImage.placeholder = "Hintergrund ändern"
  } else if (lang === "mw") {

    document.documentElement.lang = "mw";
    searchBar.placeholder = "Seow meow " + placeholderValue + "...";
    localStorage.setItem("lang", "mw"); // stocker la langue choisie dans le local storage
    langSelect.selectedIndex = 3; // ajouter l'attribut "selected" à l'option mw
    tooltipElement.innerText = "Type ONE meow meeeow to meowify the meackground meow. For meowtasticly fast meosult, use commeoon English meows such as «Wallpaper». Spesimeow meows like «Duck» will alsmeow , but theow may meowder the meage meowding time, just meow meows in other meowguage meosides English. Leave it meowpty and meow the saveow button to reset. Meow meow!";
    urlImage.placeholder = "Meeoooww meow moew "
  }

  if (document.documentElement.lang === "fr") {
    document.getElementById("savednom").placeholder = "Quel est votre nom ?";
  } else if (document.documentElement.lang === "en") {
    document.getElementById("savednom").placeholder = "What is your name ?";
  } else if (document.documentElement.lang === "de") {
    document.getElementById("savednom").placeholder = "Wie ist Ihr Name ?";
  } else if (document.documentElement.lang === "mw") {
    document.getElementById("savednom").placeholder = "Weom meow meow ?";
  }

  if (lang === "fr") {
    document.title = "Nouvel onglet";
    // ...
  } else if (lang === "en") {
    document.title = "New tab";
    // ...
  } else if (lang === "de") {
    document.title = "Neue Registerkarte";
    // ...
  } else if (lang === "mw") {
    document.title = "Meeow meowglet";
    // ...
  }

  inputElement.addEventListener("input", function () {
    if (inputElement.value.length > 0) {
      tooltipElement.style.display = "block";
      tooltipElement.style.top = inputElement.offsetTop + inputElement.offsetHeight + 5 + "px";
      tooltipElement.style.left = inputElement.offsetLeft + "px";
    } else {
      tooltipElement.style.display = "none";
    }
  });

  inputElement.addEventListener("blur", function () {
    tooltipElement.style.display = "none";
  });
}


// ----------------------------------------------------- MENU  -----------------------------------------------------


function toggleMenu() {
    var menu = document.getElementById("menu");
    if (menu.style.display === "block") {
      menu.style.animation = "menu-close 0.3s ease-out";
      setTimeout(function() {
        menu.style.display = "none";
        menu.style.animation = "";
      }, 300);
    } else {
      menu.style.display = "block";
      menu.style.animation = "menu-open 0.3s ease-out";
    }
  }




// -----------------------------------------------------  INFOBULLE -----------------------------------------------------


var inputElement = document.getElementById("urlImage");
  var tooltipElement = document.getElementById("tooltip");

  inputElement.addEventListener("input", function() {
    if (inputElement.value.length > 0) {
      tooltipElement.style.display = "block";
      tooltipElement.style.top = (inputElement.offsetTop + inputElement.offsetHeight + 5) + "px";
      tooltipElement.style.left = inputElement.offsetLeft + "px";
    } else {
      tooltipElement.style.display = "none";
    }
  });

  inputElement.addEventListener("blur", function() {
    tooltipElement.style.display = "none";
  });


  // -----------------------------------------------------  CUSTOM DIMENSION -----------------------------------------------------
     // Récupération de l'élément select et du choix sauvegardé
     const resolutionSelect = document.getElementById('resolutionSelect');
     const savedResolution = localStorage.getItem('resolution');

     // Déclaration de la variable globale pour stocker la résolution de l'image
     window.imageResolution = "";

     // Si un choix a été sauvegardé, on restaure la valeur sélectionnée
     if (savedResolution) {
       resolutionSelect.value = savedResolution;
     }

     // Restaurer la résolution stockée dans localStorage
     window.imageResolution = localStorage.getItem('imageResolution');

     // Fonction appelée lorsque l'utilisateur change de résolution
     function changeResolution(value) {
       // Choix de la résolution de l'image en fonction de la valeur sélectionnée
       switch(value) {
         case "fullhd":
           window.imageResolution = "http://source.unsplash.com/1920x1080/?";
           break;
         case "qhd":
           window.imageResolution = "http://source.unsplash.com/2560x1440/?";
           break;
         case "wqhd":
           window.imageResolution = "http://source.unsplash.com/3440x1440/?";
           break;
         case "quatrek":
           window.imageResolution = "http://source.unsplash.com/4096x2160/?";
           break;
         default:
           window.imageResolution = "http://source.unsplash.com/1920x1080/?";
       }

       // Sauvegarde de la résolution choisie et de la résolution de l'image
       localStorage.setItem('resolution', value);
       localStorage.setItem('imageResolution', window.imageResolution);

       // Modification de l'image de fond avec la nouvelle résolution
       document.querySelector("html").style.backgroundImage = "url('" + window.imageResolution + "wallpaper,landscape" + "')";
     }

 // --------------------------  CUSTOM WALLPAPER + Première visite  --------------------------

 // --------------------------  Première visite --------------------------

 // Vérifier si l'utilisateur a déjà visité le site
 if (!localStorage.getItem('firstVisit')) {
   // Afficher un message de bienvenue à l'utilisateur
 //  alert("Bienvenue sur notre site! C'est votre première visite ici.");

   // Mettre le premier fond d'écran
   document.querySelector("html").style.backgroundImage = "url('http://source.unsplash.com/1920x1080/?wallpaper')";

   // Créer un élément carré avec du texte, deux selects et des options à l'intérieur
   var square = document.createElement("div");
   square.id = "square";
   square.innerHTML = `

 <div>
 <div>
  <a id=textzahru>ZahRu<a>
  	<img class="hi-hand" src="assets/other/wave-hello.gif" alt="wave-hello" onclick="toggleMenu()">
 <br>
     <div class="select">
       <select id="langSelect" onchange="changeLang(this.value)">
         <option value="en">💂‍♀️English</option>
         <option value="fr">🥖Français</option>
         <option value="de">🍺Deutch</option>
         <option value="mw">🐱Meowguage</option>
       </select>
     </div>
 </div>
   <br>
 <div>
 <!--	<a> Quel moteur de recherche utilisez vous ?</a>  <br>-->
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
 <!--    <a> Quel résolution souhaitez vous utilisez ? </a> <br>
  <a> Plus la résolution est haute, plus le temps de chargement est élevé, mais il peut être néssésaire d'utilisez des résolutions plus élvever pour evité les bords blanc sur sertain éran.</a>
   <br>  -->
   <div class="select">
       <select id="resolutionSelect" onchange="changeResolution(this.value)">
         <option value="fullhd">📼 FullHD (🚴‍♀️)</option>
         <option value="qhd">🎞 QHD (🏃‍♀️)</option>
         <option value="wqhd">📺 WQHD (‍🚶‍♀️)</option>
         <option value="quatrek">🖥 4K(🐌)</option>
       </select>
     </div>
 </div>

     <button onclick="welcomsaver()">OK !</button>
 </div>
   `;

   // Ajouter l'élément carré à la page
   document.body.appendChild(square);



 } else {

   // --------------------------  déjà visité ( fond ecran)  --------------------------

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
   // Enregistrer la visite de l'utilisateur dans le stockage local
   localStorage.setItem("firstVisit", true);
   square.style.display = "none";
 }





// -----------------------------------------------------  SALUTATIONS -----------------------------------------------------

		function autosaveName() {
			var name = document.getElementById("savednom").value;
			localStorage.setItem("nom2", name);
		}

		function showName() {
			var savedName = localStorage.getItem("nom2");
			alert("nom2: " + savedName);
		}


// ------------------------- END NAME SAVER ------------------------------

// ------------------------- fake button ---------------------

function changeColor() {
  var myButton = document.getElementById("btnname");

  // Ajoute la classe "clicked" pour changer la couleur du bouton
  myButton.classList.add("clicked");

  // Attends 1 secondes avant de supprimer la classe "clicked"
  setTimeout(function() {
    myButton.classList.remove("clicked");
  }, 1000);

}


// ------------------------- END PLACEHOLDER ------------------------------

function afficherMessage() {
  var nom = localStorage.getItem("nom2");
  var date = new Date();
  var heure = date.getHours();

  var message = "";

  if (nom != null && nom !== "") { // Vérifie si nom n'est pas nul ou vide
    if (heure >= 6 && heure < 12) {
      if (document.documentElement.lang === "fr") {
        message = "Bonjour";
      } else if (document.documentElement.lang === "en") {
        message = "Good morning";
      } else if (document.documentElement.lang === "de") {
        message = "Guten Morgen";
      } else if (document.documentElement.lang === "mw") {
        message = "Meowning";
      }
    } else if (heure >= 12 && heure < 17) {
      if (document.documentElement.lang === "fr") {
        message = "Bon après-midi";
      } else if (document.documentElement.lang === "en") {
        message = "Good afternoon";
      } else if (document.documentElement.lang === "de") {
        message = "Guten Tag";
      } else if (document.documentElement.lang === "mw") {
        message = "Meownoon";
      }
    } else {
      if (document.documentElement.lang === "fr") {
        message = "Bonsoir";
      } else if (document.documentElement.lang === "en") {
        message = "Good evening";
      } else if (document.documentElement.lang === "de") {
        message = "Guten Abend";
      } else if (document.documentElement.lang === "mw") {
        message = "Meowing";
      }
    }

    message += ", " + nom + ".";
  }

  document.getElementById("message").innerHTML = message;
}

setInterval(afficherMessage, 1000);


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

function validateSearch(event) {
    var searchInput = document.getElementById("searchBar");
    if (searchInput.value.trim() === "") {
        searchInput.classList.add("shake"); // ajouter la classe "shake"
        setTimeout(function() {
            searchInput.classList.remove("shake"); // enlever la classe "shake" après 1 seconde
        }, 1000);
        searchInput.style.borderColor = "red"; // changer la couleur de fond
        setTimeout(function() {
            searchInput.style.borderColor = ""; // enlever la couleur de fond après 1 seconde
        }, 500);
        event.preventDefault(); // empêcher l'envoi du formulaire
        return false;
    }
    return true;
}

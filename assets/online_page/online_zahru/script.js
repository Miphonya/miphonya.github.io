
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


// -----------------------------------------------------  CUSTOM WALLPAPER -----------------------------------------------------


let defaultImage = "http://source.unsplash.com/1920x1080?";
let nouvelleImage = localStorage.getItem("image_fond");

if (nouvelleImage !== null) {
  document.querySelector("html").style.backgroundImage = "url('" + defaultImage + nouvelleImage + "')";
  document.getElementById("urlImage").value = nouvelleImage; // Ajout de cette ligne
}

function changerImage() {
  var nouvelleImage = document.getElementById("urlImage").value;
  if (nouvelleImage !== "") {
    localStorage.setItem("image_fond", nouvelleImage);
    document.querySelector("html").style.backgroundImage = "url('" + defaultImage + nouvelleImage + "')";
  }
  else {
    localStorage.removeItem("image_fond");
    document.querySelector("html").style.backgroundImage = "";
  }
  document.getElementById("urlImage").value = nouvelleImage; // Ajout de cette ligne
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





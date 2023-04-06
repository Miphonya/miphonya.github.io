var menuText = document.getElementById('menu-text');
var menuLinks = document.querySelectorAll('#menu a[data-url]');
var pdfIframe = document.getElementById('pdf');

// Fonction qui met à jour le texte du menu en fonction de l'URL du PDF chargé dans l'iframe
function updateMenuText(url) {
    var pdfName = url.substring(url.lastIndexOf('/')+1, url.length);
    var message = '';
    if (pdfName === 'Double05-11.pdf#toolbar=0') {
      message = 'Contexte : Cette courte présentation de personnage a été créée pour un RolePlay. Ce texte décrit une personne chargé de prendre le rôle de doublure officielle de 05-11, également appelé le père du mensonge.\nPublication le 06.04.2023';
    } else if (pdfName === 'RobotBeyond.pdf#toolbar=0') {
        message = 'Contexte : Cette fiche technique a été créée pour un jeu de rôle (RolePlay). Elle parle du projet de robot créé par une entreprise du nom de BeyondLogistique, et plus précisément de la base Reyonbot, ainsi que des unités RTU, RMU et RSU, ainsi que de la technologie SIO. Publication le 06.04.2023.';
    } else if (pdfName === 'livre3.pdf#toolbar=0') {
        message = 'Vous consultez actuellement le livre 3.';
    } else {
        message = 'Sélectionnez un livre pour afficher son contexte.';
    }
    menuText.textContent = message;
}

// Ajoute un écouteur d'événement sur chaque lien du menu
menuLinks.forEach(function(link) {
    link.addEventListener('click', function(event) {
        event.preventDefault();
        var url = this.getAttribute('data-url');
        pdfIframe.src = url;
        updateMenuText(url);
    });
});

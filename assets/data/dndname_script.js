const raceButtons = document.querySelectorAll(".race-button");
const numberOfNamesInput = document.getElementById("number-of-names");
const namesListElement = document.getElementById("names-list");

const elfePrefixes = [
  "El", "Thal", "Lor", "Gala", "Ara", "Anu", "Fin", "Nar", "Cael", "Am",
  "Aer", "Thel", "Al", "Mel", "Ith", "Lan", "Cele", "Orin", "Galad", "Lom",
  // Ajoutez ici d'autres préfixes pour les elfes
];

const elfeInfixes = [
  "ad", "an", "ar", "el", "il", "in", "ol", "or", "ur", "ith",
  "elv", "anu", "ithi", "lor", "lan", "lath", "ond", "anor", "ald", "dor",
  // Ajoutez ici d'autres infixes pour les elfes
];

const elfeSuffixes = [
  "as", "en", "is", "el", "in", "ion", "iel", "il", "ion", "or",
  "lor", "mar", "thor", "ionel", "yndel", "wen", "wyn", "rion", "riand", "vandor",
  // Ajoutez ici d'autres suffixes pour les elfes
];

const nainPrefixes = [
  "Dur", "Thrain", "Balin", "Gim", "Kil", "Oin", "Thor", "Thror", "Gloin", "Dor",
  "Dal", "Har", "Bor", "Forn", "Mori", "Aza", "Bar", "Far", "Gor", "Hel",
  // Ajoutez ici d'autres préfixes pour les nains
];

const nainInfixes = [
  "da", "din", "dun", "gar", "kaz", "gan", "kaz", "duin", "glin", "grim",
  "gal", "nar", "rim", "mur", "dar", "dor", "del", "mir", "gor", "drin",
  // Ajoutez ici d'autres infixes pour les nains
];

const nainSuffixes = [
  "ak", "in", "or", "un", "an", "ain", "orin", "mir", "dur", "grim",
  "li", "inli", "dil", "inor", "anor", "dorin", "lin", "um", "ur", "mir",
  // Ajoutez ici d'autres suffixes pour les nains
];

const humainPrefixes = [
  "Ara", "Cal", "Dor", "Gal", "Val", "Al", "Bor", "Cor", "Dar", "El",
  "Fel", "Gil", "Har", "Ith", "Jan", "Kor", "Lan", "Mal", "Nor", "Ol",
  // Ajoutez ici d'autres préfixes pour les humains
];

const humainInfixes = [
  "al", "an", "en", "ic", "is", "on", "or", "ar", "ir", "el",
  "elv", "ian", "ath", "ion", "onar", "elar", "ianor", "inor", "inar", "elar",
  // Ajoutez ici d'autres infixes pour les humains
];

const humainSuffixes = [
  "ar", "in", "or", "us", "an", "ius", "ius", "on", "inon", "orin",
  "dan", "dan", "don", "lin", "ian", "ion", "mond", "thor", "iar", "wen",
  // Ajoutez ici d'autres suffixes pour les humains
];
const thieflingPrefixes = [
  "Ash", "Bael", "Cyr", "Dre", "Gra",
  "Hel", "Kael", "Lyr", "Mael", "Nex",
  "Pyx", "Quel", "Rax", "Syr", "Thex",
  "Urx", "Vex", "Wyx", "Zyr", "Xal",
];

const thieflingInfixes = [
  "es", "ar", "in", "or", "yx",
  "an", "el", "ir", "um", "ix",
  "ol", "ul", "ex", "al", "us",
  "ax", "er", "ed", "en", "et",
];

const thieflingSuffixes = [
  "as", "or", "al", "us", "ix",
  "yx", "ar", "er", "en", "ul",
  "el", "os", "en", "or", "ix",
  "yx", "al", "us", "or", "an",
];

const orcPrefixes = [
  "Gor", "Throk", "Drax", "Brut", "Skar",
  "Urk", "Rak", "Grom", "Durg", "Vrak",
  "Urg", "Hruk", "Trak", "Zog", "Narg",
  "Mug", "Zak", "Korg", "Thrak", "Grek",
];

const orcInfixes = [
  "or", "ug", "ak", "um", "ar",
  "og", "ek", "uk", "az", "ur",
  "ak", "or", "ik", "og", "ar",
  "ur", "ek", "um", "or", "ag",
];

const orcSuffixes = [
  "or", "og", "ak", "um", "ar",
  "og", "ek", "uk", "az", "ur",
  "ak", "or", "ik", "og", "ar",
  "ur", "ek", "um", "or", "ag",
];

const halfelinPrefixes = [
  "Sam", "Fro", "Pip", "Mar", "Ger",
  "Wil", "Jas", "Ben", "Ber", "Lin",
  "Per", "Rob", "Tar", "Gol", "Dal",
  "Tim", "Tom", "Gil", "Mar", "Lob",
];

const halfelinInfixes = [
  "foot", "ber", "man", "per", "al",
  "don", "roc", "mil", "mor", "kin",
  "ber", "win", "low", "ber", "gol",
  "don", "tin", "pot", "kin", "gam",
];

const halfelinSuffixes = [
  "foot", "ber", "man", "per", "al",
  "don", "roc", "mil", "mor", "kin",
  "ber", "win", "low", "ber", "gol",
  "don", "tin", "pot", "kin", "gam",
];

const goliathPrefixes = [
  "Gor", "Vor", "Kor", "Thar", "Bor",
  "Dor", "Gar", "Har", "Lor", "Mor",
  "Nor", "Ror", "Sor", "Tor", "Yor",
  "Zor", "Xor", "Wor", "Jor", "For",
];

const goliathInfixes = [
  "go", "ga", "ka", "ba", "bo",
  "ko", "ko", "da", "ha", "la",
  "mo", "no", "ro", "so", "to",
  "yo", "zo", "xo", "wo", "jo",
];

const goliathSuffixes = [
  "liath", "lith", "loth", "loath", "gar",
  "nor", "gor", "tar", "xar", "jar",
  "far", "mar", "dar", "var", "war",
  "kar", "sar", "zar", "rar", "par",
];

const gnomePrefixes = [
  "Al", "Bliz", "Cran", "Doo", "Er",
  "Fim", "Gim", "Hib", "Iz", "Jam",
  "Kip", "Lum", "Mib", "Nim", "Op",
  "Pim", "Quib", "Raz", "Sim", "Tib",
];

const gnomeInfixes = [
  "ble", "fle", "gle", "kle", "ple",
  "ble", "zle", "ble", "tle", "ble",
  "fle", "gle", "zle", "mle", "ble",
  "tle", "ble", "ble", "zle", "tle",
];

const gnomeSuffixes = [
  "lin", "len", "lon", "lon", "ler",
  "lir", "lin", "len", "lon", "zer",
  "tan", "zun", "zin", "len", "zin",
  "lan", "leb", "lon", "zur", "lur",
];

const aarakocraPrefixes = [
  "Ar", "Ba", "Ca", "Do", "Ee",
  "Fa", "Go", "Ha", "Ii", "Ja",
  "Ko", "La", "Ma", "Na", "Oo",
  "Pa", "Qua", "Ra", "Sa", "Taa",
];

const aarakocraInfixes = [
  "ir", "ar", "er", "or", "ur",
  "ir", "ar", "er", "or", "ur",
  "ir", "ar", "er", "or", "ur",
  "ir", "ar", "er", "or", "ur",
];

const aarakocraSuffixes = [
  "ka", "kai", "ke", "ki", "ko",
  "ku", "la", "li", "lu", "lo",
  "ma", "mi", "me", "mo", "mu",
  "na", "ni", "ne", "no", "nu",
];

function generateRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(race) {
  let name = "";
  switch (race) {
    case "elfe":
      name = generateRandomElement(elfePrefixes) + generateRandomElement(elfeInfixes) + generateRandomElement(elfeSuffixes);
      break;
    case "nain":
      name = generateRandomElement(nainPrefixes) + generateRandomElement(nainInfixes) + generateRandomElement(nainSuffixes);
      break;
    case "humain":
      name = generateRandomElement(humainPrefixes) + generateRandomElement(humainInfixes) + generateRandomElement(humainSuffixes);
      break;
      case "orc":
        name = generateRandomElement(orcPrefixes) + generateRandomElement(orcInfixes) + generateRandomElement(orcSuffixes);
        break;
        case "halfelin":
          name = generateRandomElement(halfelinPrefixes) + generateRandomElement(halfelinInfixes) + generateRandomElement(halfelinSuffixes);
          break;
          case "goliath":
            name = generateRandomElement(goliathPrefixes) + generateRandomElement(goliathInfixes) + generateRandomElement(goliathSuffixes);
            break;
            case "gnome":
              name = generateRandomElement(gnomePrefixes) + generateRandomElement(gnomeInfixes) + generateRandomElement(gnomeSuffixes);
              break;
              case "aarakocra":
                name = generateRandomElement(aarakocraPrefixes) + generateRandomElement(aarakocraInfixes) + generateRandomElement(aarakocraSuffixes);
                break;
                case "thiefling":
                  name = generateRandomElement(thieflingPrefixes) + generateRandomElement(thieflingInfixes) + generateRandomElement(thieflingSuffixes);
                  break;
    // Ajoutez ici les autres cas pour les autres races
    default:
      name = "Veuillez choisir une race.";
  }
  return name;
}
// ... (unchanged code) ...

const maxNamesToGenerate = 5;
let currentlySelectedRace = "elfe"; // Default race when the page loads

function generateNames() {
  const selectedRace = currentlySelectedRace;
  const numberOfNames = parseInt(numberOfNamesInput.value);

  if (numberOfNames > maxNamesToGenerate) {
    alert("You can only generate up to 5 names at a time.");
    return;
  }

  let namesHTML = "";

  for (let i = 0; i < numberOfNames; i++) {
    const name = generateName(selectedRace);
    namesHTML += `<p>${name}</p>`;
  }

  namesListElement.innerHTML = namesHTML;
}

function selectRace(race) {
  currentlySelectedRace = race;
  raceButtons.forEach(btn => btn.classList.remove("active"));
  const selectedButton = document.querySelector(`[data-race="${race}"]`);
  selectedButton.classList.add("active");
}

raceButtons.forEach(button => {
  button.addEventListener("click", () => {
    const selectedRace = button.getAttribute("data-race");
    selectRace(selectedRace);
  });
});

numberOfNamesInput.addEventListener("input", () => {
  const numberOfNames = parseInt(numberOfNamesInput.value);
  if (numberOfNames > maxNamesToGenerate) {
    numberOfNamesInput.value = maxNamesToGenerate;
  }
});

selectRace(currentlySelectedRace); // Select the default race when the page loads


// -----------------------------------------------------------------------------------------------------
// Translation object for different languages
const translations = {
  en: {
    title: "D&D Name Generator",
    rungen: "Generate Names", // Corrected variable name
    numberLabel: "Number of names to generate (1-5):",
    maxNamesError: "You can only generate up to 10 names at a time.",
    raceError: "Please choose a race.",
  },
  fr: {
    title: "Générateur de Noms pour D&D",
    rungen: "Générer les noms", // Corrected variable name
    numberLabel: "Nombre de noms à générer (1-5) :",
    maxNamesError: "Vous ne pouvez générer que jusqu'à 10 noms à la fois.",
    raceError: "Veuillez choisir une race.",
  },
};

function changeLanguage() {
  const languageSelector = document.getElementById("language-selector");
  const selectedLanguage = languageSelector.value;
  const translation = translations[selectedLanguage];
  const htmlTag = document.getElementById("html");
  const titleTag = document.querySelector("h1");
  const generateButton = document.querySelector(".rungen"); // Corrected button class name
  const numberLabel = document.querySelector("label[for='number-of-names']");

  if (translation) {
    htmlTag.setAttribute("lang", selectedLanguage);
    titleTag.textContent = translation.title;
    generateButton.textContent = translation.rungen; // Corrected variable name
    numberLabel.textContent = translation.numberLabel;
  }
}

function initPage() {
  // Get the default language of the browser
  const defaultLanguage = navigator.language.split("-")[0]; // Only take the language code, e.g., "en" from "en-US"

  // Set the default language in the language selector dropdown
  const languageSelector = document.getElementById("language-selector");
  languageSelector.value = defaultLanguage;

  // Change the language to the default language
  changeLanguage();
}

initPage(); // Call the initPage function to initialize the page with the default language

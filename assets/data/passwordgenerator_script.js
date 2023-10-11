document.addEventListener("DOMContentLoaded", function () {
    const includeNumbers = document.getElementById("includeNumbers");
    const includeUppercase = document.getElementById("includeUppercase");
    const includeSpecialCharacters = document.getElementById("includeSpecialCharacters");
    const specialCharacters = document.querySelectorAll("#specialCharacters input[type=checkbox]");
    const lengthRange = document.getElementById("lengthRange");
    const passwordLength = document.getElementById("passwordLength");
    const generatePassword = document.getElementById("generatePassword");
    const passwordOutput = document.getElementById("password");
    const checkAllButton = document.getElementById("checkAll");
    const uncheckAllButton = document.getElementById("uncheckAll");
    const copyPasswordButton = document.getElementById("copyPassword");
    const specialCharactersContainer = document.getElementById("specialCharacters");

    function generatePasswordString() {
        let charset = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const specialChars = Array.from(specialCharacters).filter(el => el.checked).map(el => el.value);

        if (includeNumbers.checked) charset += numbers;
        if (includeUppercase.checked) charset += uppercase;
        if (includeSpecialCharacters.checked) charset += specialChars.join("");

        let password = "";
        const length = parseInt(lengthRange.value);
        const lineLength = 50; // Nombre de caractères par ligne
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
            if (password.length % lineLength === 0 && i !== length - 1) {
                password += "\n"; // Ajoute un saut de ligne
            }
        }
        return password;
    }

    checkAllButton.addEventListener("click", function () {
        specialCharacters.forEach(el => (el.checked = true));
    });

    uncheckAllButton.addEventListener("click", function () {
        specialCharacters.forEach(el => (el.checked = false));
    });

    includeSpecialCharacters.addEventListener("change", function () {
        specialCharactersContainer.style.display = includeSpecialCharacters.checked ? "block" : "none";
    });

    generatePassword.addEventListener("click", function () {
        const newPassword = generatePasswordString();
        passwordOutput.textContent = newPassword;
        passwordOutput.parentElement.style.display = "block";
        copyPasswordButton.style.display = "block";
    });

    copyPasswordButton.addEventListener("click", function () {
        const passwordText = passwordOutput.textContent;
        const textarea = document.createElement("textarea");
        textarea.value = passwordText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);

        // Ajoutez la classe d'effet de fumée au mot de passe
        passwordOutput.classList.add("smoke-effect");

// Retirez la classe d'effet de fumée après un certain délai (par exemple, 1 seconde)
        setTimeout(function () {
            passwordOutput.classList.remove("smoke-effect");
        }, 1000);
    });

    lengthRange.addEventListener("input", function () {
        passwordLength.textContent = lengthRange.value;
    });
});

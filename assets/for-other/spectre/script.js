function calculateResult() {
    const questions = document.querySelectorAll('.question');
    let allAnswered = true;

    questions.forEach((question, index) => {
        const radioButtons = question.querySelectorAll('input[type="radio"]');
        let answered = false;

        radioButtons.forEach(radioButton => {
            if (radioButton.checked) {
                answered = true;
            }
        });

        if (!answered) {
            allAnswered = false;
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = `Veuillez répondre à la question ${index + 1}.`;

            // Fait défiler automatiquement vers le bas pour afficher les résultats
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    if (allAnswered) {
        displayResult();
    }
}

function displayResult() {
    const answers = {
        spirits: 0,
        ghost: 0,
        guardian: 0,
        sector: 0,
        executor: 0
    };

    const questions = document.querySelectorAll('.question');

    questions.forEach(question => {
        const selectedRadioButton = question.querySelector('input[type="radio"]:checked');
        const value = selectedRadioButton.value;

        answers[value]++;
    });

    const resultDiv = document.getElementById('result');
    let maxPoints = 0;
    let maxAnswer = '';

    for (const answer in answers) {
        if (answers[answer] > maxPoints) {
            maxPoints = answers[answer];
            maxAnswer = answer;
        }
    }

    let resultText = 'La branche optimale pour vous est ';
    resultText += `${maxAnswer.toUpperCase()}`;

    resultDiv.innerHTML = resultText;

    // Fait défiler automatiquement vers le bas pour afficher les résultats
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

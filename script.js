let currentMode = 'time';
let currentValue = 60;
let currentText = '';
let words = [];
let currentIndex = 0;
let errors = 0;
let correctChars = 0;
let totalTyped = 0;
let startTime = null;
let timerInterval = null;
let testActive = false;
let sameText = false;

const startScreen = document.getElementById('startScreen');
const testScreen = document.getElementById('testScreen');
const resultsScreen = document.getElementById('resultsScreen');
const textDisplay = document.getElementById('textDisplay');
const textContainer = document.getElementById('textContainer');
const hiddenInput = document.getElementById('hiddenInput');
const stats = document.getElementById('stats');
const progressCounter = document.getElementById('progressCounter');

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;

        if (currentMode === 'time') {
            document.getElementById('timeNumbers').style.display = 'flex';
            document.getElementById('wordNumbers').style.display = 'none';
            currentValue = 60;
        } else {
            document.getElementById('timeNumbers').style.display = 'none';
            document.getElementById('wordNumbers').style.display = 'flex';
            currentValue = 50;
        }

        updateNumberButtons();
    });
});

document.querySelectorAll('#timeNumbers .number-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentMode === 'time') {
            document.querySelectorAll('#timeNumbers .number-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentValue = parseInt(btn.dataset.value);
        }
    });
});

document.querySelectorAll('#wordNumbers .number-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentMode === 'words') {
            document.querySelectorAll('#wordNumbers .number-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentValue = parseInt(btn.dataset.value);
        }
    });
});

function updateNumberButtons() {
    if (currentMode === 'time') {
        document.querySelectorAll('#timeNumbers .number-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.value) === currentValue);
        });
    } else {
        document.querySelectorAll('#wordNumbers .number-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.value) === currentValue);
        });
    }
}

async function fetchText(sentenceCount) {
    try {
        const response = await fetch(`https://fish-text.ru/get?type=sentence&number=${sentenceCount}&format=json`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.text;
        }
    } catch (error) {
        console.error('Error fetching text:', error);
    }
    return null;
}

document.getElementById('startBtn').addEventListener('click', async () => {
    sameText = false;
    await startTest();
});

async function startTest() {
    const text = await fetchText(currentMode === 'time' ? 15 : Math.ceil(currentValue / 10));
    if (!text) {
        alert('Не удалось загрузить текст. Попробуйте снова.');
        return;
    }

    currentText = text;
    words = currentText.split(/\s+/);

    if (currentMode === 'words') {
        words = words.slice(0, currentValue);
        currentText = words.join(' ');
    }

    currentIndex = 0;
    errors = 0;
    correctChars = 0;
    totalTyped = 0;
    startTime = null;
    testActive = true;

    startScreen.style.display = 'none';
    resultsScreen.style.display = 'none';
    testScreen.style.display = 'block';
    stats.classList.add('show');

    renderText();
    hiddenInput.value = '';
    hiddenInput.focus();

    if (textContainer) textContainer.scrollTop = 0;

    if (currentMode === 'time') {
        startTimer();
    }
}

function renderText() {
    let html = '';
    let charIndex = 0;

    words.forEach((word, wordIndex) => {
        const wordChars = word.split('');
        let wordHtml = '';

        wordChars.forEach((char, charInWordIndex) => {
            const globalIndex = charIndex;
            let className = 'char';

            if (globalIndex < currentIndex) {
                const typedChar = hiddenInput.value[globalIndex];
                if (typedChar === char) {
                    className += ' correct';
                } else {
                    className += ' incorrect';
                }
            } else if (globalIndex === currentIndex) {
                className += ' current';
            }

            wordHtml += `<span class="${className}">${char}</span>`;
            charIndex++;
        });

        if (wordIndex < words.length - 1) {
            let spaceClass = 'char';
            const spaceIndex = charIndex;

            if (spaceIndex < currentIndex) {
                const typedChar = hiddenInput.value[spaceIndex];
                if (typedChar === ' ') {
                    spaceClass += ' correct';
                } else if (typedChar !== undefined) {
                    spaceClass += ' incorrect';
                }
            } else if (spaceIndex === currentIndex) {
                spaceClass += ' current';
            }

            wordHtml += `<span class="${spaceClass}"> </span>`;
            charIndex++;
        }

        html += wordHtml;
    });

    textDisplay.innerHTML = html;
    updateProgress();

    const currentChar = textDisplay.querySelector('.char.current');
    if (currentChar && textContainer) {
        const charTop = currentChar.offsetTop;
        if (charTop > textContainer.scrollTop + textContainer.clientHeight - 60) {
            textContainer.scrollTop = charTop - 60;
        } else if (charTop < textContainer.scrollTop) {
            textContainer.scrollTop = charTop;
        }
    }
}

function updateProgress() {
    if (currentMode === 'time') {
        const timeLeft = Math.max(0, currentValue - Math.floor((Date.now() - startTime) / 1000));
        progressCounter.textContent = `${timeLeft} сек`;
    } else {
        const typedWords = hiddenInput.value.trim().split(/\s+/).filter(w => w.length > 0).length;
        progressCounter.textContent = `${Math.min(typedWords, currentValue)}/${currentValue}`;
    }
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const timeLeft = Math.max(0, currentValue - elapsed);

        document.getElementById('timer').textContent = timeLeft;
        updateWPM();

        if (timeLeft === 0) {
            endTest();
        }
    }, 100);
}

function updateWPM() {
    if (!startTime) return;

    const elapsed = (Date.now() - startTime) / 1000 / 60;
    const typed = hiddenInput.value.length;
    const wpm = Math.round((typed / 5) / elapsed) || 0;
    document.getElementById('wpm').textContent = wpm;
}

hiddenInput.addEventListener('input', (e) => {
    if (!testActive) return;

    const input = hiddenInput.value;
    const expected = currentText.replace(/\s+/g, ' ');

    for (let i = 0; i < input.length; i++) {
        if (i < expected.length) {
            if (input[i] === expected[i]) {
                if (i >= currentIndex) correctChars++;
            } else {
                if (i >= currentIndex) errors++;
            }
        } else {
            errors++;
        }
    }

    currentIndex = input.length;
    totalTyped = input.length;

    renderText();
    if (currentMode === 'words') {
        const typedWords = input.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (typedWords >= currentValue) {
            endTest();
        }
    }
});

document.addEventListener('click', () => {
    if (testActive) {
        hiddenInput.focus();
    }
});

function endTest() {
    testActive = false;
    clearInterval(timerInterval);

    const input = hiddenInput.value;
    const expected = currentText.replace(/\s+/g, ' ');

    let finalErrors = 0;
    let finalCorrect = 0;

    for (let i = 0; i < Math.max(input.length, expected.length); i++) {
        if (i < expected.length && i < input.length) {
            if (input[i] === expected[i]) {
                finalCorrect++;
            } else {
                finalErrors++;
            }
        } else if (i >= input.length) {
        } else {
            finalErrors++;
        }
    }

    const totalChars = input.length;
    const accuracy = totalChars > 0 ? Math.round((finalCorrect / totalChars) * 100) : 0;
    const cpm = currentMode === 'time'
        ? Math.round((totalChars / currentValue) * 60)
        : Math.round((totalChars / ((Date.now() - startTime) / 1000 / 60)));

    testScreen.style.display = 'none';
    stats.classList.remove('show');
    resultsScreen.style.display = 'flex';

    document.getElementById('resultType').textContent =
    currentMode === 'time' ? `время ${currentValue}` : `слова ${currentValue}`;
    document.getElementById('resultCpm').textContent = cpm;
    document.getElementById('resultAccuracy').textContent = `${accuracy}%`;
    document.getElementById('resultChars').textContent = totalChars;
    document.getElementById('resultErrors').textContent = finalErrors;
}

document.getElementById('restartBtn').addEventListener('click', () => {
    sameText = true;
    currentIndex = 0;
    errors = 0;
    correctChars = 0;
    totalTyped = 0;
    startTime = null;
    testActive = true;

    hiddenInput.value = '';
    renderText();
    hiddenInput.focus();

    if (textContainer) textContainer.scrollTop = 0;

    if (currentMode === 'time') {
        startTimer();
    }
});

document.getElementById('resultsRestartBtn').addEventListener('click', () => {
    if (sameText) {
        currentIndex = 0;
        errors = 0;
        correctChars = 0;
        totalTyped = 0;
        startTime = null;
        testActive = true;

        hiddenInput.value = '';
        renderText();
        hiddenInput.focus();

        resultsScreen.style.display = 'none';
        testScreen.style.display = 'block';
        stats.classList.add('show');

        if (textContainer) textContainer.scrollTop = 0;

        if (currentMode === 'time') {
            startTimer();
        }
    } else {
        startTest();
    }
});

document.getElementById('nextTestBtn').addEventListener('click', () => {
    sameText = false;
    startTest();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        if (testActive) {
            document.getElementById('restartBtn').click();
        }
    }
});

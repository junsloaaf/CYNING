// Global variables
let currentMaterial = '';
let aiSummary = '';
let quizQuestions = [];
let currentQuestionIndex = 0;
let userScore = 0;
let timer;
let timeLeft = 20;
let userAnswers = [];

// API Configuration - GANTI INI DENGAN API KEY ANDA!
const GEMINI_API_KEY = 'AIzaSyAAGqEPAhD6uhRaNsa7U01qAAUaXSjIMR4'; // ← GANTI INI!
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Demo questions untuk fallback
const demoQuestions = [
    {
        question: "Apa manfaat utama dari membuat rangkuman materi?",
        options: [
            "A. Menghemat waktu belajar",
            "B. Memahami konsep secara menyeluruh",
            "C. Mempermudah review materi",
            "D. Semua jawaban benar"
        ],
        correctAnswer: "D"
    },
    {
        question: "Teknik belajar mana yang paling efektif menurut penelitian?",
        options: [
            "A. Menghafal tanpa memahami",
            "B. Belajar dengan interval waktu teratur", 
            "C. Membaca sekali sebelum ujian",
            "D. Mengerjakan soal tanpa belajar teori"
        ],
        correctAnswer: "B"
    },
    {
        question: "Bagaimana cara terbaik untuk memahami materi kompleks?",
        options: [
            "A. Membaca berulang-ulang",
            "B. Membuat mind map atau diagram",
            "C. Menghafal point-point penting",
            "D. Mengerjakan latihan soal"
        ],
        correctAnswer: "B"
    },
    {
        question: "Apa yang dimaksud dengan pembelajaran aktif?",
        options: [
            "A. Belajar sambil mendengarkan musik",
            "B. Belajar dengan mengajar orang lain",
            "C. Belajar di pagi hari",
            "D. Belajar dalam kelompok"
        ],
        correctAnswer: "B"
    },
    {
        question: "Kapan waktu terbaik untuk mereview materi yang sudah dipelajari?",
        options: [
            "A. Hanya sebelum ujian",
            "B. Setelah lupa semua materi", 
            "C. Secara berkala dan bertahap",
            "D. Ketika ada waktu luang saja"
        ],
        correctAnswer: "C"
    }
];

// Fungsi untuk cek API key
function isApiKeyValid() {
    return GEMINI_API_KEY && 
           GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' && 
           GEMINI_API_KEY.length > 20;
}

// Tab switching function
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

// File upload handling
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
});

// Handle file upload and reading
function handleFileUpload(file) {
    const fileName = file.name.toLowerCase();
    
    if (!fileName.match(/\.(txt|pdf|doc|docx)$/)) {
        alert('Format file tidak didukung. Silakan upload file TXT, PDF, DOC, atau DOCX.');
        return;
    }
    
    if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentMaterial = e.target.result;
            document.getElementById('material-input').value = currentMaterial;
            switchTab('text');
        };
        reader.readAsText(file);
    } else {
        alert('Untuk file PDF, DOC, atau DOCX, sistem akan membaca teks yang bisa diekstrak. Fitur ini membutuhkan backend processing.');
    }
}

// FUNGSI GENERATE SUMMARY YANG SUDAH DIPERBAIKI
async function generateSummary() {
    const materialInput = document.getElementById('material-input').value.trim();
    const generateBtn = document.getElementById('generate-btn');
    const btnText = generateBtn.querySelector('.btn-text');
    const spinner = generateBtn.querySelector('.loading-spinner');
    
    if (materialInput.length < 100) {
        alert('Masukkan minimal 100 karakter materi untuk dibuat rangkuman.');
        return;
    }
    
    currentMaterial = materialInput;
    
    // Show loading state
    generateBtn.disabled = true;
    btnText.textContent = 'Membuat Rangkuman...';
    spinner.style.display = 'block';
    
    // Cek jika API key tidak valid, gunakan demo mode
    if (!isApiKeyValid()) {
        setTimeout(() => {
            useDemoSummary();
            generateBtn.disabled = false;
            btnText.textContent = '✨ Buat Rangkuman';
            spinner.style.display = 'none';
        }, 1500);
        return;
    }
    
    try {
        const prompt = `Buatlah rangkuman yang jelas dan mudah dipahami dari materi berikut ini. Gunakan bahasa Indonesia yang baik dan struktur yang terorganisir:\n\n${currentMaterial}`;
        
        console.log('Mengirim request ke Gemini API...');
        
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            'Accept': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            aiSummary = data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Format response tidak valid');
        }
        
        displaySummaryResults();
        
    } catch (error) {
        console.error('Error generating summary:', error);
        useDemoSummary();
        alert('Menggunakan mode demo. Untuk AI sungguhan, ganti YOUR_GEMINI_API_KEY dengan API key yang valid.');
    } finally {
        generateBtn.disabled = false;
        btnText.textContent = '✨ Buat Rangkuman';
        spinner.style.display = 'none';
    }
}

// Fungsi untuk demo summary
function useDemoSummary() {
    const words = currentMaterial.split(' ').slice(0, 50).join(' ');
    aiSummary = `📚 RANGKUMAN MATERI (Demo Mode)

🎯 Poin-poin Penting:
• Pemahaman konsep dasar sangat penting
• Struktur materi yang terorganisir memudahkan belajar
• Review berkala membantu menguatkan memori

📖 Ringkasan Konten:
${words}...

💡 Tips Belajar:
1. Buat catatan singkat seperti ini
2. Fokus pada konsep utama
3. Latihan soal untuk menguji pemahaman

🔧 Status: Mode Demo - Untuk AI sungguhan, ganti API key di script.js`;
    
    displaySummaryResults();
}

// Tampilkan hasil summary
function displaySummaryResults() {
    document.getElementById('original-material').textContent = currentMaterial;
    document.getElementById('ai-summary').textContent = aiSummary;
    document.getElementById('results-section').style.display = 'block';
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

// Copy functions
function copyOriginalMaterial() {
    copyToClipboard(currentMaterial);
    showCopyFeedback('Materi asli berhasil disalin!');
}

function copySummary() {
    copyToClipboard(aiSummary);
    showCopyFeedback('Rangkuman berhasil disalin!');
}

function copyQuiz() {
    const quizContent = generateQuizContentForCopy();
    copyToClipboard(quizContent);
    showCopyFeedback('Kuis berhasil disalin!');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard');
    }).catch(err => {
        // Fallback untuk browser lama
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    });
}

function showCopyFeedback(message) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        document.body.removeChild(feedback);
    }, 2000);
}

// Start quiz - VERSI YANG LEBIH SEDERHANA
async function startQuiz() {
    if (!currentMaterial) {
        alert('Silakan buat rangkuman terlebih dahulu sebelum memulai kuis.');
        return;
    }
    
    // Selalu gunakan demo questions untuk sekarang
    quizQuestions = demoQuestions;
    
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('quiz-section').style.display = 'block';
    
    currentQuestionIndex = 0;
    userScore = 0;
    userAnswers = [];
    showQuestion();
}

// Show current question
function showQuestion() {
    if (currentQuestionIndex >= quizQuestions.length) {
        showResults();
        return;
    }
    
    const question = quizQuestions[currentQuestionIndex];
    const questionCounter = document.getElementById('question-counter');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const nextBtn = document.getElementById('next-btn');
    
    questionCounter.textContent = `Soal ${currentQuestionIndex + 1}/${quizQuestions.length}`;
    questionText.textContent = question.question;
    
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-btn';
        optionBtn.textContent = option;
        optionBtn.onclick = () => selectOption(optionBtn, option);
        optionsContainer.appendChild(optionBtn);
    });
    
    nextBtn.style.display = 'none';
    startTimer();
}

// Timer functions
function startTimer() {
    timeLeft = 20;
    updateTimerDisplay();
    
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeUp();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    const timerText = timerElement.querySelector('.timer-text');
    timerText.textContent = `⏱️ ${timeLeft}s`;
    
    if (timeLeft <= 5) {
        timerElement.style.background = '#ef4444';
    } else if (timeLeft <= 10) {
        timerElement.style.background = '#f59e0b';
    } else {
        timerElement.style.background = '#4f46e5';
    }
}

function handleTimeUp() {
    const options = document.querySelectorAll('.option-btn');
    const question = quizQuestions[currentQuestionIndex];
    
    options.forEach(btn => {
        if (btn.textContent.startsWith(question.correctAnswer)) {
            btn.classList.add('correct');
        }
    });
    
    userAnswers.push({
        question: question.question,
        userAnswer: 'Tidak dijawab',
        correctAnswer: question.correctAnswer,
        isCorrect: false
    });
    
    document.getElementById('next-btn').style.display = 'block';
}

function selectOption(selectedBtn, selectedOption) {
    const allOptions = document.querySelectorAll('.option-btn');
    allOptions.forEach(btn => {
        btn.classList.remove('selected');
        btn.onclick = null;
    });
    
    selectedBtn.classList.add('selected');
    clearInterval(timer);
    
    const question = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedOption.startsWith(question.correctAnswer);
    
    allOptions.forEach(btn => {
        if (btn.textContent.startsWith(question.correctAnswer)) {
            btn.classList.add('correct');
        } else if (btn === selectedBtn && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    if (isCorrect) {
        userScore++;
    }
    
    userAnswers.push({
        question: question.question,
        userAnswer: selectedOption,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect
    });
    
    document.getElementById('next-btn').style.display = 'block';
}

function nextQuestion() {
    currentQuestionIndex++;
    showQuestion();
}

// Show final results
function showResults() {
    document.getElementById('quiz-section').style.display = 'none';
    document.getElementById('final-results').style.display = 'block';
    
    const scorePercent = Math.round((userScore / quizQuestions.length) * 100);
    const scorePercentElement = document.getElementById('score-percent');
    const scoreDescriptionElement = document.getElementById('score-description');
    const scoreCircle = document.querySelector('.score-circle');
    
    let currentPercent = 0;
    const interval = setInterval(() => {
        if (currentPercent >= scorePercent) {
            clearInterval(interval);
            scorePercentElement.textContent = `${scorePercent}%`;
        } else {
            currentPercent++;
            scorePercentElement.textContent = `${currentPercent}%`;
        }
    }, 20);
    
    scoreCircle.style.background = `conic-gradient(#10b981 ${scorePercent}%, #e5e7eb ${scorePercent}%)`;
    
    let description = '';
    if (scorePercent >= 90) {
        description = 'Luar biasa! Penguasaan materi Anda sangat baik.';
    } else if (scorePercent >= 70) {
        description = 'Bagus! Pemahaman materi Anda sudah baik.';
    } else if (scorePercent >= 50) {
        description = 'Cukup baik. Disarankan untuk mereview materi sekali lagi.';
    } else {
        description = 'Perlu belajar lebih giat lagi. Jangan menyerah!';
    }
    scoreDescriptionElement.textContent = description;
    
    generateQuizContentForDisplay();
}

function generateQuizContentForCopy() {
    let content = `KUIS HASIL BELAJAR - EduAI\n`;
    content += `Skor: ${userScore}/${quizQuestions.length} (${Math.round((userScore / quizQuestions.length) * 100)}%)\n\n`;
    
    userAnswers.forEach((answer, index) => {
        content += `Soal ${index + 1}: ${answer.question}\n`;
        content += `Jawaban Anda: ${answer.userAnswer}\n`;
        content += `Jawaban Benar: ${answer.correctAnswer}\n`;
        content += `Status: ${answer.isCorrect ? '✅ Benar' : '❌ Salah'}\n\n`;
    });
    
    content += `\n---\nDibuat dengan EduAI - Platform Belajar Pintar`;
    return content;
}

function generateQuizContentForDisplay() {
    const copyQuizContent = document.getElementById('copy-quiz-content');
    let content = '';
    
    userAnswers.forEach((answer, index) => {
        content += `<div class="quiz-result-item">
            <strong>Soal ${index + 1}:</strong> ${answer.question}<br>
            <strong>Jawaban Anda:</strong> ${answer.userAnswer}<br>
            <strong>Jawaban Benar:</strong> ${answer.correctAnswer}<br>
            <strong>Status:</strong> <span style="color: ${answer.isCorrect ? '#10b981' : '#ef4444'}">${answer.isCorrect ? '✅ Benar' : '❌ Salah'}</span>
        </div>`;
        if (index < userAnswers.length - 1) {
            content += '<hr style="margin: 10px 0; border: none; border-top: 1px solid #e5e7eb;">';
        }
    });
    
    copyQuizContent.innerHTML = content;
}

// Navigation functions
function backToSummary() {
    document.getElementById('final-results').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

function backToHome() {
    document.getElementById('final-results').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('quiz-section').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

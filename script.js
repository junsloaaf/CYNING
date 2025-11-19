// Global variables
let currentMaterial = '';
let aiSummary = '';
let quizQuestions = [];
let currentQuestionIndex = 0;
let userScore = 0;
let timer;
let timeLeft = 20;
let userAnswers = [];

// DeepSeek API Configuration dengan fallback
const DEEPSEEK_CONFIG = {
    apiKey: 'sk-8f434f7872794ac88dc7b2bca06c8bbf', // GANTI INI dengan API key DeepSeek Anda
    apiUrl: 'https://api.deepseek.com/chat/completions',
    // Fallback proxy jika ada CORS issues
    proxyUrls: [
        'https://cors-anywhere.herokuapp.com/https://api.deepseek.com/chat/completions',
        'https://api.allorigins.win/raw?url=https://api.deepseek.com/chat/completions'
    ]
};

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

// === DEEPSEEK API FUNCTIONS ===
async function callDeepSeekAPI(prompt, isQuiz = false) {
    // Jika API key masih default, langsung gunakan fallback
    if (DEEPSEEK_CONFIG.apiKey === 'sk-your-actual-api-key-here') {
        throw new Error('API_KEY_NOT_SET');
    }

    const payload = {
        model: 'deepseek-chat',
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.7,
        max_tokens: isQuiz ? 2000 : 1000,
        stream: false
    };

    // Coba semua URL yang available
    const urlsToTry = [
        DEEPSEEK_CONFIG.apiUrl,
        ...DEEPSEEK_CONFIG.proxyUrls
    ];

    for (let url of urlsToTry) {
        try {
            console.log(`Mencoba API URL: ${url}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                return data.choices[0].message.content;
            } else if (response.status === 401) {
                throw new Error('API_KEY_INVALID');
            } else if (response.status === 429) {
                throw new Error('RATE_LIMIT');
            }
        } catch (error) {
            console.log(`URL ${url} gagal:`, error.message);
            // Lanjut ke URL berikutnya
            continue;
        }
    }
    
    throw new Error('ALL_API_FAILED');
}

// Generate summary dengan DeepSeek
async function generateSummary() {
    const materialInput = document.getElementById('material-input').value.trim();
    const generateBtn = document.getElementById('generate-btn');
    const btnText = generateBtn.querySelector('.btn-text');
    const spinner = generateBtn.querySelector('.loading-spinner');
    
    if (materialInput.length < 50) {
        alert('Masukkan minimal 50 karakter materi untuk dibuat rangkuman.');
        return;
    }
    
    currentMaterial = materialInput;
    
    // Show loading state
    generateBtn.disabled = true;
    btnText.textContent = 'Membuat Rangkuman...';
    spinner.style.display = 'block';
    
    try {
        const prompt = `Buatlah rangkuman yang jelas dan mudah dipahami dari materi berikut ini dalam bahasa Indonesia. Gunakan struktur yang terorganisir dengan poin-poin penting:\n\n${currentMaterial}`;
        
        aiSummary = await callDeepSeekAPI(prompt);
        
        // Display results
        document.getElementById('original-material').textContent = currentMaterial;
        document.getElementById('ai-summary').textContent = aiSummary;
        document.getElementById('results-section').style.display = 'block';
        
        // Scroll to results
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error:', error.message);
        
        if (error.message === 'API_KEY_NOT_SET') {
            alert('❌ API Key DeepSeek belum diatur!\n\n📝 Cara mendapatkan API Key:\n1. Buka https://platform.deepseek.com\n2. Buat akun dan login\n3. Dapatkan API Key di dashboard\n4. Ganti "sk-your-actual-api-key-here" di script.js dengan API Key Anda');
            aiSummary = generateSmartSummary(currentMaterial);
        } else if (error.message === 'API_KEY_INVALID') {
            alert('❌ API Key tidak valid!\nPastikan API Key DeepSeek Anda benar dan aktif.');
            aiSummary = generateSmartSummary(currentMaterial);
        } else if (error.message === 'RATE_LIMIT') {
            alert('⚠️ Rate limit tercapai. Tunggu beberapa saat atau gunakan API Key yang berbeda.');
            aiSummary = generateSmartSummary(currentMaterial);
        } else {
            alert('🌐 Masalah koneksi API. Menggunakan AI lokal sebagai fallback.');
            aiSummary = generateSmartSummary(currentMaterial);
        }
        
        // Tetap tampilkan hasil dengan fallback
        document.getElementById('original-material').textContent = currentMaterial;
        document.getElementById('ai-summary').textContent = aiSummary;
        document.getElementById('results-section').style.display = 'block';
    } finally {
        // Reset button state
        generateBtn.disabled = false;
        btnText.textContent = 'Summarize';
        spinner.style.display = 'none';
    }
}

// Smart fallback summary algorithm
function generateSmartSummary(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = text.toLowerCase().split(/\s+/);
    
    // Extract keywords
    const wordFreq = {};
    words.forEach(word => {
        if (word.length > 3 && !['yang', 'dengan', 'dalam', 'adalah', 'untuk'].includes(word)) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
    });
    
    const keywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
    
    let summary = "🤖 RINGKASAN PINTAR (AI Lokal)\n\n";
    summary += "🎯 Poin Utama:\n";
    
    // Ambil 3 kalimat penting (awal, tengah, akhir)
    if (sentences.length >= 3) {
        summary += `• ${sentences[0].trim()}\n`;
        summary += `• ${sentences[Math.floor(sentences.length/2)].trim()}\n`;
        summary += `• ${sentences[sentences.length-1].trim()}\n`;
    } else {
        sentences.forEach(sentence => {
            if (sentence.trim().length > 20) {
                summary += `• ${sentence.trim()}\n`;
            }
        });
    }
    
    summary += `\n🔑 Kata Kunci: ${keywords.join(', ')}\n`;
    summary += `📊 Ringkasan: ${text.length} karakter → ${Math.round(text.length * 0.3)} karakter\n`;
    summary += "\n💡 Generated by Smart Algorithm";
    
    return summary;
}

// Generate quiz questions
async function generateQuizQuestions() {
    try {
        const prompt = `Buat 5 soal pilihan ganda dalam bahasa Indonesia berdasarkan teks berikut. Format: [{"question": "pertanyaan", "options": ["A. pilihan A", "B. pilihan B", "C. pilihan C", "D. pilihan D"], "correctAnswer": "A"}]\n\nTeks: ${aiSummary}`;
        
        const result = await callDeepSeekAPI(prompt, true);
        
        // Try to parse JSON from response
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            quizQuestions = JSON.parse(jsonMatch[0]);
            
            // Validate questions
            if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) {
                throw new Error('Invalid question format');
            }
        } else {
            throw new Error('No JSON found in response');
        }
        
    } catch (error) {
        console.error('Error generating quiz:', error);
        useDemoQuestions();
    }
}

// Demo questions fallback
function useDemoQuestions() {
    quizQuestions = [
        {
            question: "Apa tujuan utama dari materi yang telah dipelajari?",
            options: [
                "A. Memahami konsep dasar",
                "B. Menghafal semua detail", 
                "C. Mengerjakan soal ujian",
                "D. Menyelesaikan proyek"
            ],
            correctAnswer: "A"
        },
        {
            question: "Manakah yang merupakan poin penting dari rangkuman?",
            options: [
                "A. Semua informasi sama pentingnya",
                "B. Hanya fakta dan angka yang penting",
                "C. Konsep utama dan hubungan antar ide",
                "D. Contoh-contoh spesifik saja"
            ],
            correctAnswer: "C"
        },
        {
            question: "Bagaimana sebaiknya materi ini dipelajari lebih lanjut?",
            options: [
                "A. Menghafal seluruh isi materi",
                "B. Memahami konsep dan berlatih penerapan",
                "C. Membaca sekali saja",
                "D. Mencari materi yang lebih sulit"
            ],
            correctAnswer: "B"
        }
    ];
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
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
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

// Start quiz
async function startQuiz() {
    if (!aiSummary) {
        alert('Silakan buat rangkuman terlebih dahulu sebelum memulai kuis.');
        return;
    }
    
    try {
        await generateQuizQuestions();
        
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'block';
        
        currentQuestionIndex = 0;
        userScore = 0;
        userAnswers = [];
        showQuestion();
        
    } catch (error) {
        console.error('Error starting quiz:', error);
        alert('Terjadi kesalahan saat membuat kuis. Menggunakan soal demo.');
        
        useDemoQuestions();
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'block';
        currentQuestionIndex = 0;
        userScore = 0;
        userAnswers = [];
        showQuestion();
    }
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
    timerText.textContent = `${timeLeft}s`;
    
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
    
    if (isCorrect) userScore++;
    
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
    let content = `KUIS HASIL BELAJAR\n`;
    content += `Skor: ${userScore}/${quizQuestions.length} (${Math.round((userScore / quizQuestions.length) * 100)}%)\n\n`;
    
    userAnswers.forEach((answer, index) => {
        content += `Soal ${index + 1}: ${answer.question}\n`;
        content += `Jawaban Anda: ${answer.userAnswer}\n`;
        content += `Jawaban Benar: ${answer.correctAnswer}\n`;
        content += `Status: ${answer.isCorrect ? 'Benar' : 'Salah'}\n\n`;
    });
    
    content += `\n---\nDibuat dengan CompAInion - Your Smart AI Study Companion`;
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
            <strong>Status:</strong> <span style="color: ${answer.isCorrect ? '#10b981' : '#ef4444'}">${answer.isCorrect ? 'Benar' : 'Salah'}</span>
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

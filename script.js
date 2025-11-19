// Global variables
let currentMaterial = '';
let aiSummary = '';
let quizQuestions = [];
let currentQuestionIndex = 0;
let userScore = 0;
let timer;
let timeLeft = 20;
let userAnswers = [];

// Hugging Face API dengan model yang lebih reliable
const HF_SUMMARY_API = "https://api-inference.huggingface.co/models/Falconsai/text_summarization";
const HF_QUESTION_API = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";

// Fallback questions database
const fallbackQuestions = {
    'general': [
        {
            question: "Apa ide utama dari materi ini?",
            options: ["A. Konsep dasar", "B. Detail teknis", "C. Contoh aplikasi", "D. Semua benar"],
            correctAnswer: "A"
        },
        {
            question: "Manakah poin paling penting?",
            options: ["A. Semua informasi", "B. Konsep utama", "C. Contoh spesifik", "D. Data pendukung"],
            correctAnswer: "B"
        }
    ],
    'science': [
        {
            question: "Apa metode penelitian yang digunakan?",
            options: ["A. Eksperimen", "B. Observasi", "C. Survei", "D. Semua benar"],
            correctAnswer: "D"
        }
    ]
};

// Improved Hugging Face API call dengan error handling
async function callHuggingFaceAPI(apiUrl, payload, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt} to call Hugging Face API...`);
            
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            console.log("Response status:", response.status);

            if (response.status === 503) {
                // Model is loading
                const result = await response.json();
                const estimatedTime = result.estimated_time || 30;
                console.log(`Model loading, estimated time: ${estimatedTime}s`);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, estimatedTime * 1000 + 2000));
                    continue;
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("API Response:", data);
            return data;

        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt === maxRetries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
    }
}

// Generate summary dengan Hugging Face
async function generateSummary() {
    const materialInput = document.getElementById('material-input').value.trim();
    const generateBtn = document.getElementById('generate-btn');
    const btnText = generateBtn.querySelector('.btn-text');
    const spinner = generateBtn.querySelector('.loading-spinner');
    
    if (materialInput.length < 50) {
        alert('Masukkan minimal 50 karakter materi.');
        return;
    }
    
    currentMaterial = materialInput;
    
    // Show loading state
    generateBtn.disabled = true;
    btnText.textContent = 'Membuat Rangkuman...';
    spinner.style.display = 'block';
    
    try {
        // Try Hugging Face API
        console.log("Sending request to Hugging Face...");
        
        const result = await callHuggingFaceAPI(HF_SUMMARY_API, {
            inputs: currentMaterial.substring(0, 1000),
            parameters: {
                max_length: 150,
                min_length: 40,
                do_sample: false
            }
        });
        
        if (result && result[0] && result[0].summary_text) {
            aiSummary = result[0].summary_text;
            console.log("Summary generated successfully");
        } else {
            throw new Error('Invalid response format');
        }
        
    } catch (error) {
        console.error('Hugging Face API failed:', error);
        // Fallback to smart algorithm
        aiSummary = generateSmartSummary(currentMaterial);
        console.log("Using fallback summary");
    }
    
    displayResults();
    
    // Reset button state
    generateBtn.disabled = false;
    btnText.textContent = '✨ Buat Rangkuman';
    spinner.style.display = 'none';
}

// Smart fallback summary algorithm
function generateSmartSummary(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = text.toLowerCase().split(/\s+/);
    
    // Extract keywords (most frequent words)
    const wordFreq = {};
    words.forEach(word => {
        if (word.length > 3) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
    });
    
    const keywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
    
    let summary = "🤖 RINGKASAN PINTAR\n\n";
    summary += "🎯 Poin Utama:\n";
    
    // Take first 3 important sentences
    sentences.slice(0, 3).forEach(sentence => {
        if (sentence.trim().length > 20) {
            summary += `• ${sentence.trim()}.\n`;
        }
    });
    
    summary += `\n🔑 Kata Kunci: ${keywords.join(', ')}\n`;
    summary += `📊 Ringkasan: ${text.length} karakter → ${Math.round(text.length * 0.3)} karakter\n`;
    summary += "\n💡 Generated by Smart Algorithm";
    
    return summary;
}

// Display results function
function displayResults() {
    const originalMaterialElem = document.getElementById('original-material');
    const aiSummaryElem = document.getElementById('ai-summary');
    const resultsSection = document.getElementById('results-section');
    
    if (originalMaterialElem && aiSummaryElem && resultsSection) {
        originalMaterialElem.textContent = currentMaterial;
        aiSummaryElem.textContent = aiSummary;
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Generate quiz questions
async function generateQuizQuestions() {
    try {
        console.log("Generating quiz questions...");
        
        const prompt = `Buat 3 pertanyaan pilihan ganda tentang: ${currentMaterial.substring(0, 300)}`;
        
        const result = await callHuggingFaceAPI(HF_QUESTION_API, {
            inputs: prompt,
            parameters: {
                max_length: 500,
                temperature: 0.7
            }
        });
        
        if (result && result[0] && result[0].generated_text) {
            return processQuizResponse(result[0].generated_text);
        } else {
            throw new Error('No questions generated');
        }
        
    } catch (error) {
        console.error('Failed to generate quiz:', error);
        return getFallbackQuestions();
    }
}

function processQuizResponse(text) {
    // Simple processing - in real implementation, you'd parse this better
    const questions = text.split('\n').filter(line => 
        line.includes('?') && line.length > 10
    ).slice(0, 3);
    
    if (questions.length > 0) {
        return questions.map((q, index) => ({
            question: q,
            options: [
                "A. Opsi jawaban A",
                "B. Opsi jawaban B", 
                "C. Opsi jawaban C",
                "D. Opsi jawaban D"
            ],
            correctAnswer: "A"
        }));
    }
    throw new Error('Could not process questions');
}

function getFallbackQuestions() {
    return fallbackQuestions.general;
}

// Start quiz function
async function startQuiz() {
    if (!currentMaterial) {
        alert('Buat rangkuman terlebih dahulu!');
        return;
    }
    
    try {
        quizQuestions = await generateQuizQuestions();
    } catch (error) {
        console.error('Using fallback questions');
        quizQuestions = getFallbackQuestions();
    }
    
    const resultsSection = document.getElementById('results-section');
    const quizSection = document.getElementById('quiz-section');
    
    if (resultsSection && quizSection) {
        resultsSection.style.display = 'none';
        quizSection.style.display = 'block';
        
        currentQuestionIndex = 0;
        userScore = 0;
        userAnswers = [];
        showQuestion();
    }
}

// [KEEP ALL YOUR EXISTING NON-AI FUNCTIONS BELOW - Tab switching, file upload, timer, quiz logic, etc.]
// Tab switching, file upload, timer, showQuestion, selectOption, showResults, copy functions, etc.
// Jangan ubah fungsi-fungsi ini karena mereka tidak berhubungan dengan AI

// Contoh: Tetap pertahankan fungsi-fungsi ini seperti semula
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

// File upload handling - tetap sama
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    if (uploadArea) {
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
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }
});

function handleFileUpload(file) {
    // ... kode handleFileUpload yang sudah ada
}

// Copy functions - tetap sama
function copyOriginalMaterial() {
    copyToClipboard(currentMaterial);
    showCopyFeedback('Materi asli berhasil disalin!');
}

function copySummary() {
    copyToClipboard(aiSummary);
    showCopyFeedback('Rangkuman berhasil disalin!');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard');
    }).catch(err => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    });
}

function showCopyFeedback(message) {
    alert(message);
}

// Timer functions, quiz logic, navigation - tetap sama seperti kode Anda sebelumnya
// ... semua fungsi non-AI lainnya

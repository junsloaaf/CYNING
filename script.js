// Timer functionality
let timerInterval;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isRunning = false;

const timerDisplay = document.querySelector('.timer-display');
const startBtn = document.getElementById('start-timer');
const pauseBtn = document.getElementById('pause-timer');
const resetBtn = document.getElementById('reset-timer');
const presetBtns = document.querySelectorAll('.preset-btn');
const activeTimer = document.getElementById('active-timer');
const timerStatus = document.getElementById('timer-status');
const currentTask = document.getElementById('current-task');

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerStatus.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    activeTimer.style.display = 'flex';
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            alert('Waktu belajar telah habis! Saatnya istirahat sejenak.');
            activeTimer.style.display = 'none';
            // Play notification sound if needed
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    // Reset to current preset
    const activePreset = document.querySelector('.preset-btn.active');
    timeLeft = parseInt(activePreset.dataset.time) * 60;
    updateTimerDisplay();
    activeTimer.style.display = 'none';
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        timeLeft = parseInt(btn.dataset.time) * 60;
        updateTimerDisplay();
        
        if (isRunning) {
            pauseTimer();
            startTimer();
        }
    });
});

const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task');
const taskList = document.getElementById('task-list');
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function renderTasks() {
    taskList.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-text">${task.text}</div>
            <div class="task-actions">
                <button class="task-action edit-btn"><i class="fas fa-edit"></i></button>
                <button class="task-action delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        const checkbox = li.querySelector('.task-checkbox');
        const editBtn = li.querySelector('.edit-btn');
        const deleteBtn = li.querySelector('.delete-btn');
        
        checkbox.addEventListener('click', () => {
            tasks[index].completed = !tasks[index].completed;
            saveTasks();
            renderTasks();
        });
        
        editBtn.addEventListener('click', () => {
            const newText = prompt('Edit tugas:', tasks[index].text);
            if (newText && newText.trim() !== '') {
                tasks[index].text = newText.trim();
                saveTasks();
                renderTasks();
            }
        });
        
        deleteBtn.addEventListener('click', () => {
            if (confirm('Hapus tugas ini?')) {
                tasks.splice(index, 1);
                saveTasks();
                renderTasks();
            }
        });
        
        taskList.appendChild(li);
    });
    
    document.querySelector('.stat-value').textContent = tasks.filter(t => !t.completed).length;
}

function addTask() {
    const text = taskInput.value.trim();
    if (text === '') return;
    
    tasks.push({
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    });
    
    saveTasks();
    renderTasks();
    taskInput.value = '';
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

const materialsModal = document.getElementById('materials-modal');
const pdfModal = document.getElementById('pdf-modal');
const openMaterialsBtn = document.getElementById('open-materials');
const openPdfBtn = document.getElementById('open-pdf');
const closeModalBtns = document.querySelectorAll('.close-modal');

function openModal(modal) {
    modal.style.display = 'flex';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

openMaterialsBtn.addEventListener('click', () => openModal(materialsModal));
openPdfBtn.addEventListener('click', () => openModal(pdfModal));

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        closeModal(modal);
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
});

const subjectItems = document.querySelectorAll('.subject-list li');
const materialSections = document.querySelectorAll('.material-section');

subjectItems.forEach(item => {
    item.addEventListener('click', () => {
        subjectItems.forEach(i => i.classList.remove('active'));
        materialSections.forEach(s => s.classList.remove('active'));
        
        item.classList.add('active');
        
        const subjectId = item.getAttribute('data-subject');
        document.getElementById(subjectId).classList.add('active');
    });
});

const pdfUpload = document.getElementById('pdf-upload');
const uploadPdfBtn = document.getElementById('upload-pdf-btn');
const pdfUploadArea = document.getElementById('pdf-upload-area');
const fileList = document.getElementById('file-list');

uploadPdfBtn.addEventListener('click', () => {
    pdfUpload.click();
});

pdfUploadArea.addEventListener('click', () => {
    pdfUpload.click();
});

pdfUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.type === 'application/pdf') {
            uploadPDF(file);
        } else {
            alert('Hanya file PDF yang diizinkan!');
        }
    }
});

pdfUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    pdfUploadArea.style.borderColor = '#4361ee';
    pdfUploadArea.style.backgroundColor = '#f8faff';
});

pdfUploadArea.addEventListener('dragleave', () => {
    pdfUploadArea.style.borderColor = '#ddd';
    pdfUploadArea.style.backgroundColor = 'transparent';
});

pdfUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    pdfUploadArea.style.borderColor = '#ddd';
    pdfUploadArea.style.backgroundColor = 'transparent';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        uploadPDF(file);
    } else {
        alert('Hanya file PDF yang diizinkan!');
    }
});

// Upload PDF function
function uploadPDF(file) {
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileSize = (file.size / (1024 * 1024)).toFixed(2); // Convert to MB
    
    fileItem.innerHTML = `
        <i class="fas fa-file-pdf"></i>
        <div class="file-info">
            <h5>${file.name}</h5>
            <p>${fileSize} MB • Baru saja diupload</p>
        </div>
        <div class="file-actions">
            <button class="file-action view-btn"><i class="fas fa-eye"></i></button>
            <button class="file-action delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    const viewBtn = fileItem.querySelector('.view-btn');
    const deleteBtn = fileItem.querySelector('.delete-btn');
    
    viewBtn.addEventListener('click', () => {
        alert(`Membuka file: ${file.name}\n\nMasih dalam tahap simulasi. Dalam aplikasi nyata, file PDF akan ditampilkan di sini.`);
    });
    
    deleteBtn.addEventListener('click', () => {
        if (confirm(`Hapus file ${file.name}?`)) {
            fileItem.remove();
        }
    });
    
    fileList.appendChild(fileItem);
    
    alert(`File "${file.name}" berhasil diupload!`);
}

const subjectUploadAreas = document.querySelectorAll('.upload-area');
const subjectPDFUploads = document.querySelectorAll('.pdf-upload');

subjectUploadAreas.forEach((area, index) => {
    area.addEventListener('click', () => {
        subjectPDFUploads[index].click();
    });
    
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.style.borderColor = '#4361ee';
        area.style.backgroundColor = '#f8faff';
    });
    
    area.addEventListener('dragleave', () => {
        area.style.borderColor = '#ddd';
        area.style.backgroundColor = 'transparent';
    });
    
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.style.borderColor = '#ddd';
        area.style.backgroundColor = 'transparent';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            subjectPDFUploads[index].files = e.dataTransfer.files;
            handleSubjectPDFUpload(file, area);
        } else {
            alert('Hanya file PDF yang diizinkan!');
        }
    });
});

subjectPDFUploads.forEach(upload => {
    upload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const area = upload.closest('.upload-area');
            handleSubjectPDFUpload(file, area);
        }
    });
});

function handleSubjectPDFUpload(file, area) {
    const subjectName = area.closest('.material-section').id;
    const subjectDisplayName = document.querySelector(`[data-subject="${subjectName}"]`).textContent;
    
    alert(`File "${file.name}" berhasil diupload untuk mata pelajaran ${subjectDisplayName}!`);
    
}

updateTimerDisplay();
renderTasks();

if (tasks.length > 0) {
    const firstUncompleted = tasks.find(t => !t.completed);
    if (firstUncompleted) {
        currentTask.textContent = firstUncompleted.text;
    }
}

if (tasks.length === 0) {
    tasks = [
        { text: 'Mengerjakan tugas', completed: false, createdAt: new Date().toISOString() },
        { text: 'Mempersiapkan ulangan', completed: true, createdAt: new Date().toISOString() }
    ];
    saveTasks();
    renderTasks();
}

const sampleFiles = [
    { name: 'Rangkuman Matematika Integral.pdf', size: '2.4' },
    { name: 'Soal Latihan Fisika Gelombang.pdf', size: '1.8' }
];

sampleFiles.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    fileItem.innerHTML = `
        <i class="fas fa-file-pdf"></i>
        <div class="file-info">
            <h5>${file.name}</h5>
            <p>${file.size} MB • 2 hari yang lalu</p>
        </div>
        <div class="file-actions">
            <button class="file-action view-btn"><i class="fas fa-eye"></i></button>
            <button class="file-action delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    const viewBtn = fileItem.querySelector('.view-btn');
    const deleteBtn = fileItem.querySelector('.delete-btn');
    
    viewBtn.addEventListener('click', () => {
        alert(`Membuka file: ${file.name}\n\nMasih dalam tahap simulasi. Dalam aplikasi nyata, file PDF akan ditampilkan di sini.`);
    });
    
    deleteBtn.addEventListener('click', () => {
        if (confirm(`Hapus file ${file.name}?`)) {
            fileItem.remove();
        }
    });
    
    fileList.appendChild(fileItem);
});


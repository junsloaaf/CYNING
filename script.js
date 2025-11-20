document.addEventListener('DOMContentLoaded', () => {
  // –– Timer setup
  let timerInterval;
  let timeLeft = 25 * 60;
  let isRunning = false;

  const timerDisplay = document.querySelector('.timer-display');
  const startBtn = document.getElementById('start-timer');
  const pauseBtn = document.getElementById('pause-timer');
  const resetBtn = document.getElementById('reset-timer');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const activeTimer = document.getElementById('active-timer');
  const timerStatus = document.getElementById('timer-status');

  function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const str = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerDisplay.textContent = str;
    timerStatus.textContent = str;
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
        alert('Waktu belajar habis! Istirahat dulu.');
        activeTimer.style.display = 'none';
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

  updateTimerDisplay();

  // –– Task / To-do
  const taskInput = document.getElementById('task-input');
  const addTaskBtn = document.getElementById('add-task');
  const taskList = document.getElementById('task-list');
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, i) => {
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
        tasks[i].completed = !tasks[i].completed;
        saveTasks();
        renderTasks();
      });

      editBtn.addEventListener('click', () => {
        const newText = prompt('Edit tugas:', tasks[i].text);
        if (newText && newText.trim()) {
          tasks[i].text = newText.trim();
          saveTasks();
          renderTasks();
        }
      });

      deleteBtn.addEventListener('click', () => {
        if (confirm('Hapus tugas ini?')) {
          tasks.splice(i, 1);
          saveTasks();
          renderTasks();
        }
      });

      taskList.appendChild(li);
    });
  }

  addTaskBtn.addEventListener('click', () => {
    const txt = taskInput.value.trim();
    if (!txt) return;
    tasks.push({ text: txt, completed: false });
    saveTasks();
    renderTasks();
    taskInput.value = '';
  });

  taskInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') addTaskBtn.click();
  });

  renderTasks();

  // –– Modal Materi
  const materialsModal = document.getElementById('materials-modal');
  const openMaterialsBtn = document.getElementById('open-materials');
  const closeModalBtns = document.querySelectorAll('.close-modal');

  openMaterialsBtn.addEventListener('click', () => {
    materialsModal.style.display = 'flex';
  });

  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });

  window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });

  // –– PDF Viewer Materi
  const openPdfButtons = document.querySelectorAll('.btn-open-pdf');
  const pdfViewerModal = document.getElementById('pdf-viewer-modal');
  const pdfFrame = document.getElementById('pdf-frame');
  const closePdfViewerBtn = document.getElementById('close-pdf-viewer');
  const pdfViewerTitle = document.getElementById('pdf-viewer-title');

  openPdfButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const pdfUrl = btn.getAttribute('data-pdf-url');
      const titleEl = btn.closest('.material-item')?.querySelector('h5');
      pdfViewerTitle.textContent = titleEl ? titleEl.textContent : 'Materi PDF';
      if (pdfUrl) {
        pdfFrame.src = pdfUrl;
        pdfViewerModal.style.display = 'flex';
      } else {
        alert('PDF URL tidak ditemukan.');
      }
    });
  });

  closePdfViewerBtn.addEventListener('click', () => {
    pdfViewerModal.style.display = 'none';
    pdfFrame.src = '';
  });

  window.addEventListener('click', e => {
    if (e.target === pdfViewerModal) {
      pdfViewerModal.style.display = 'none';
      pdfFrame.src = '';
    }
  });
});

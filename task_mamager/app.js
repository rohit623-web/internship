// ─── State ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'taskmanager_tasks';
let nextId = 1;
let filter = 'all';

let tasks = loadTasks();

// ─── Persistence ─────────────────────────────────────────────────────────────

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, nextId }));
  } catch (_) {}
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      nextId = data.nextId || 1;
      return data.tasks || defaultTasks();
    }
  } catch (_) {}
  return defaultTasks();
}

function defaultTasks() {
  nextId = 6;
  return [
    { id: 1, text: 'Design landing page mockup',       priority: 'high',   done: false },
    { id: 2, text: 'Review pull requests',              priority: 'medium', done: false },
    { id: 3, text: 'Update project documentation',      priority: 'low',    done: true  },
    { id: 4, text: 'Fix login bug reported by QA',      priority: 'high',   done: false },
    { id: 5, text: 'Schedule team sync meeting',        priority: 'medium', done: false },
  ];
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function addTask() {
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }

  const priority = document.getElementById('priority-select').value;
  tasks.unshift({ id: nextId++, text, priority, done: false });
  input.value = '';
  input.focus();
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function setFilter(f, btn) {
  filter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

// ─── Rendering ───────────────────────────────────────────────────────────────

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function checkIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
}

function trashIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`;
}

function render() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  document.getElementById('s-total').textContent = total;
  document.getElementById('s-done').textContent  = done;
  document.getElementById('s-left').textContent  = total - done;

  let visible = tasks;
  if (filter === 'active')   visible = tasks.filter(t => !t.done);
  else if (filter === 'done') visible = tasks.filter(t => t.done);
  else if (['high', 'medium', 'low'].includes(filter))
    visible = tasks.filter(t => t.priority === filter);

  const list = document.getElementById('task-list');

  if (!visible.length) {
    list.innerHTML = `
      <div class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3"></rect>
          <path d="M9 12l2 2 4-4"></path>
        </svg>
        <p>No tasks here</p>
      </div>`;
    return;
  }

  list.innerHTML = visible.map(t => `
    <div class="task-item${t.done ? ' done' : ''}" role="listitem">
      <button
        class="check-btn${t.done ? ' checked' : ''}"
        onclick="toggleTask(${t.id})"
        aria-label="${t.done ? 'Mark incomplete' : 'Mark complete'}"
      >${t.done ? checkIcon() : ''}</button>
      <span class="task-text">${escHtml(t.text)}</span>
      <span class="badge badge-${t.priority}">${t.priority}</span>
      <button class="del-btn" onclick="deleteTask(${t.id})" aria-label="Delete task">
        ${trashIcon()}
      </button>
    </div>
  `).join('');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.getElementById('date').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'short', day: 'numeric'
});

document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

render();

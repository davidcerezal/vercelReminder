const state = {
  currentWeekStart: null,
  baseWeekStart: null,
  timezone: 'Europe/Madrid',
  people: [],
  peopleMap: {},
  data: null,
  actorSelections: {}
};

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  setupListeners();
  loadWeek();
});

function cacheElements() {
  elements.weekRange = document.getElementById('weekRange');
  elements.deadlineInfo = document.getElementById('deadlineInfo');
  elements.reprogramInfo = document.getElementById('reprogramInfo');
  elements.prevWeekBtn = document.getElementById('prevWeekBtn');
  elements.nextWeekBtn = document.getElementById('nextWeekBtn');
  elements.weekLabel = document.getElementById('weekLabel');
  elements.summaryContainer = document.getElementById('summaryContainer');
  elements.tasksContainer = document.getElementById('tasksContainer');
  elements.toast = document.getElementById('toast');
}

function setupListeners() {
  elements.prevWeekBtn.addEventListener('click', () => changeWeek(-1));
  elements.nextWeekBtn.addEventListener('click', () => changeWeek(1));
}

function setLoading(isLoading) {
  elements.prevWeekBtn.disabled = isLoading;
  elements.nextWeekBtn.disabled = isLoading;
}

async function loadWeek(weekStart) {
  setLoading(true);
  try {
    const data = await fetchWeekData(weekStart);

    state.data = data;
    state.timezone = data.timezone || state.timezone;
    state.people = data.people || [];
    state.peopleMap = state.people.reduce((acc, person) => {
      acc[person.id] = person;
      return acc;
    }, {});
    state.currentWeekStart = data.week.weekStart;
    if (!state.baseWeekStart) {
      state.baseWeekStart = data.week.weekStart;
    }

    // Preserve previous selections where possible
    const previousSelections = { ...state.actorSelections };
    state.actorSelections = {};
    for (const person of state.people) {
      state.actorSelections[person.id] = previousSelections[person.id] || person.id;
    }

    render();
  } catch (error) {
    console.error('Error loading week:', error);
    showToast('Error al cargar la semana. Intenta de nuevo.', 'error');
  } finally {
    setLoading(false);
  }
}

async function fetchWeekData(weekStart) {
  const params = new URLSearchParams();
  if (weekStart) {
    params.set('weekStart', weekStart);
  }

  const url = params.toString() ? `/api/cleaning-plan?${params.toString()}` : '/api/cleaning-plan';
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to retrieve week data');
  }

  return data;
}

function changeWeek(deltaWeeks) {
  if (!state.currentWeekStart) {
    return;
  }

  const newWeek = shiftWeek(state.currentWeekStart, deltaWeeks);
  loadWeek(newWeek);
}

function shiftWeek(weekStart, deltaWeeks) {
  const date = new Date(`${weekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + deltaWeeks * 7);
  return date.toISOString().slice(0, 10);
}

function render() {
  if (!state.data) {
    return;
  }

  renderHeader();
  renderSummary();
  renderTasks();
}

function renderHeader() {
  const week = state.data.week;

  elements.weekRange.textContent = `${formatFullDate(week.weekStart)} — ${formatFullDate(week.weekEnd)}`;

  elements.deadlineInfo.textContent = `Fecha límite semanal: ${state.data.deadline?.formatted || '-'}`;
  elements.reprogramInfo.textContent = `Reprogramación automática: ${state.data.reprogram?.formatted || '-'}`;

  const diff = getWeekDifference(state.currentWeekStart, state.baseWeekStart);
  let label = 'Semana actual';

  if (diff < 0) {
    const value = Math.abs(diff);
    label = value === 1 ? '1 semana atrás' : `${value} semanas atrás`;
  } else if (diff > 0) {
    label = diff === 1 ? 'Semana siguiente' : `${diff} semanas adelante`;
  }

  elements.weekLabel.textContent = label;
}

function renderSummary() {
  elements.summaryContainer.innerHTML = '';
  const summary = state.data.summary || [];

  if (summary.length === 0) {
    elements.summaryContainer.innerHTML = '<p>No hay datos disponibles para esta semana.</p>';
    return;
  }

  for (const item of summary) {
    const card = document.createElement('div');
    card.className = 'summary-card';

    const title = document.createElement('h3');
    title.textContent = `${item.ownerName}`;

    const totals = document.createElement('p');
    totals.style.marginBottom = '12px';
    totals.style.fontSize = '0.9rem';
    totals.style.color = '#475569';
    totals.textContent = `Tareas asignadas: ${item.total}`;

    const statWrapper = document.createElement('div');
    statWrapper.className = 'summary-stats';

    const done = document.createElement('span');
    done.className = 'summary-pill done';
    done.textContent = `Hechas: ${item.done}`;

    const pending = document.createElement('span');
    pending.className = 'summary-pill pending';
    pending.textContent = `Pendientes: ${item.pending}`;

    const missed = document.createElement('span');
    missed.className = 'summary-pill missed';
    missed.textContent = `No hechas: ${item.missed}`;

    statWrapper.append(done, pending, missed);
    card.append(title, totals, statWrapper);
    elements.summaryContainer.appendChild(card);
  }
}

function renderTasks() {
  elements.tasksContainer.innerHTML = '';
  const tasksByOwner = groupTasksByOwner(state.data.week.tasks);

  for (const person of state.people) {
    const card = document.createElement('div');
    card.className = 'person-card';

    const header = document.createElement('div');
    header.className = 'person-header';

    const name = document.createElement('div');
    name.className = 'person-name';
    name.textContent = person.name;

    header.appendChild(name);
    card.appendChild(header);

    const select = document.createElement('select');
    select.className = 'actor-select';
    select.dataset.ownerId = person.id;

    for (const optionPerson of state.people) {
      const option = document.createElement('option');
      option.value = optionPerson.id;
      option.textContent = `Registrar como: ${optionPerson.name}`;
      if (state.actorSelections[person.id] === optionPerson.id) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    select.addEventListener('change', event => {
      state.actorSelections[person.id] = event.target.value;
    });

    card.appendChild(select);

    const ownerTasks = tasksByOwner[person.id] || [];

    if (ownerTasks.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'Sin tareas asignadas.';
      empty.style.color = '#64748b';
      card.appendChild(empty);
    } else {
      for (const task of ownerTasks) {
        const taskCard = document.createElement('div');
        taskCard.className = `task-item ${task.status}`;

        const title = document.createElement('div');
        title.className = 'task-name';
        title.textContent = task.title;

        const meta = document.createElement('div');
        meta.className = 'task-meta';

        const status = document.createElement('span');
        status.className = `status-badge status-${task.status}`;
        status.textContent = getStatusLabel(task.status);

        meta.appendChild(status);

        if (task.completedAt) {
          const completedInfo = document.createElement('span');
          const actorName = state.peopleMap[task.completedBy]?.name || task.completedBy || 'Desconocido';
          completedInfo.textContent = `Hecha por ${actorName} el ${formatDateTime(task.completedAt)}`;
          meta.appendChild(completedInfo);
        } else if (task.status === 'missed') {
          const missedInfo = document.createElement('span');
          missedInfo.textContent = 'Marcada como no hecha al llegar la fecha límite.';
          meta.appendChild(missedInfo);
        }

        const actionButton = document.createElement('button');
        const isDone = task.status === 'done';
        actionButton.textContent = isDone ? 'Marcar como pendiente' : 'Marcar como hecha';
        actionButton.className = isDone ? 'secondary' : 'primary';
        actionButton.addEventListener('click', () => toggleTask(person.id, task, !isDone, actionButton));

        const historyDetails = buildHistoryDetails(task);

        taskCard.append(title, meta, actionButton, historyDetails);
        card.appendChild(taskCard);
      }
    }

    elements.tasksContainer.appendChild(card);
  }
}

function groupTasksByOwner(tasks) {
  return tasks.reduce((acc, task) => {
    if (!acc[task.ownerId]) {
      acc[task.ownerId] = [];
    }
    acc[task.ownerId].push(task);
    return acc;
  }, {});
}

function getStatusLabel(status) {
  switch (status) {
    case 'done':
      return 'Hecha';
    case 'missed':
      return 'No hecha';
    default:
      return 'Pendiente';
  }
}

async function toggleTask(ownerId, task, completed, button) {
  if (!state.currentWeekStart) {
    return;
  }

  const actorId = state.actorSelections[ownerId] || ownerId;

  try {
    button.disabled = true;
    await updateTaskStatus(task.taskId, completed, actorId);
    showToast('Tarea actualizada correctamente.', 'success');
  } catch (error) {
    console.error('Error toggling task:', error);
    showToast('No se pudo actualizar la tarea.', 'error');
  } finally {
    button.disabled = false;
  }
}

async function updateTaskStatus(taskId, completed, actorId) {
  const response = await fetch('/api/cleaning-plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      weekStart: state.currentWeekStart,
      taskId,
      completed,
      actorId
    })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Error updating task');
  }

  await loadWeek(state.currentWeekStart);
}

function buildHistoryDetails(task) {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = `Historial (${task.history?.length || 0})`;
  details.appendChild(summary);

  if (!task.history || task.history.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-list';
    const entry = document.createElement('div');
    entry.className = 'history-entry';
    entry.textContent = 'Sin movimientos registrados.';
    empty.appendChild(entry);
    details.appendChild(empty);
    return details;
  }

  const list = document.createElement('div');
  list.className = 'history-list';

  const entries = [...task.history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  for (const entry of entries) {
    const item = document.createElement('div');
    item.className = 'history-entry';
    item.textContent = formatHistoryEntry(entry);
    list.appendChild(item);
  }

  details.appendChild(list);
  return details;
}

function formatHistoryEntry(entry) {
  const timestamp = entry.timestamp ? formatDateTime(entry.timestamp) : 'Fecha desconocida';
  const actorName = entry.actor
    ? state.peopleMap[entry.actor]?.name || (entry.actor === 'system' ? 'Sistema' : entry.actor)
    : 'Sistema';

  let actionDescription = '';

  switch (entry.action) {
    case 'initialized':
      actionDescription = 'Tarea creada';
      break;
    case 'completed':
      actionDescription = 'Marcada como hecha';
      break;
    case 'reopened':
      actionDescription = 'Marcada como pendiente';
      break;
    case 'reopened_after_missed':
      actionDescription = 'Recuperada tras estar no hecha';
      break;
    case 'marked_missed':
      actionDescription = 'Marcada como no hecha por el sistema';
      break;
    case 'reprogrammed':
      actionDescription = 'Reprogramada para nueva semana';
      break;
    default:
      actionDescription = entry.action || 'Actualización';
      break;
  }

  let extra = '';
  if (entry.details?.fromWeek) {
    extra = ` (desde semana ${entry.details.fromWeek})`;
  } else if (entry.details?.fromStatus) {
    extra = ` (antes: ${translateStatus(entry.details.fromStatus)})`;
  }

  return `${timestamp} — ${actionDescription} · ${actorName}${extra}`;
}

function formatFullDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  return date.toLocaleDateString('es-ES', {
    timeZone: state.timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('es-ES', {
    timeZone: state.timezone,
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function getWeekDifference(current, base) {
  if (!current || !base) {
    return 0;
  }

  const currentDate = new Date(`${current}T00:00:00Z`);
  const baseDate = new Date(`${base}T00:00:00Z`);
  const diffMs = currentDate.getTime() - baseDate.getTime();
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}

let toastTimeout = null;

function showToast(message, type = 'info') {
  if (!elements.toast) {
    return;
  }

  elements.toast.textContent = message;
  elements.toast.className = `toast ${type} show`;

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3500);
}

function translateStatus(status) {
  switch (status) {
    case 'done':
      return 'hecha';
    case 'missed':
      return 'no hecha';
    case 'pending':
      return 'pendiente';
    default:
      return status || 'desconocido';
  }
}

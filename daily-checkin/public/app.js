// State management
let currentMonth = '';
let currentYear = '';
let selectedDate = '';
let monthLogs = {};
let todayStr = '';
let timezone = 'Europe/Madrid';

const formState = {
    eaten_well: false,
    did_sport: false,
    studied: false,
    slept_early: false
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentMonth();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));

    // Toggle switches
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const field = toggle.dataset.field;
            formState[field] = !formState[field];
            updateToggleUI(field);
        });
    });

    // Save button
    document.getElementById('saveBtn').addEventListener('click', saveData);
}

// Load current month data
async function loadCurrentMonth() {
    try {
        const response = await fetch('/api/daily-checkin');
        const data = await response.json();

        currentMonth = data.month;
        monthLogs = data.logs;
        todayStr = data.today;
        timezone = data.timezone;

        const [year, month] = currentMonth.split('-');
        currentYear = parseInt(year);

        updateCalendarHeader();
        renderCalendar();

        // Select today by default
        selectDate(todayStr);
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Error al cargar los datos', 'error');
    }
}

// Load specific month data
async function loadMonth(yearMonth) {
    try {
        const response = await fetch(`/api/daily-checkin?month=${yearMonth}`);
        const data = await response.json();

        currentMonth = data.month;
        monthLogs = data.logs;

        const [year, month] = currentMonth.split('-');
        currentYear = parseInt(year);

        updateCalendarHeader();
        renderCalendar();
    } catch (error) {
        console.error('Error loading month:', error);
        showMessage('Error al cargar el mes', 'error');
    }
}

// Navigate between months
async function navigateMonth(direction) {
    const [year, month] = currentMonth.split('-').map(Number);
    let newMonth = month + direction;
    let newYear = year;

    if (newMonth > 12) {
        newMonth = 1;
        newYear++;
    } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
    }

    const newYearMonth = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    await loadMonth(newYearMonth);
}

// Update calendar header
function updateCalendarHeader() {
    const [year, month] = currentMonth.split('-');
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthName = monthNames[parseInt(month) - 1];
    document.getElementById('currentMonth').textContent = `${monthName} ${year}`;
}

// Render calendar
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    // Day headers
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        // Check if there's a log for this date
        const log = monthLogs[dateStr];
        if (log) {
            const allYes = log.eaten_well && log.did_sport && log.studied && log.slept_early;
            const hasNo = !log.eaten_well || !log.did_sport || !log.studied || !log.slept_early;

            if (allYes) {
                dayElement.classList.add('success');
            } else if (hasNo) {
                dayElement.classList.add('error');
            }
        } else {
            dayElement.classList.add('no-data');
        }

        // Highlight today
        if (dateStr === todayStr) {
            dayElement.classList.add('today');
        }

        // Highlight selected
        if (dateStr === selectedDate) {
            dayElement.classList.add('selected');
        }

        dayElement.addEventListener('click', () => selectDate(dateStr));
        calendar.appendChild(dayElement);
    }
}

// Select a date
async function selectDate(dateStr) {
    selectedDate = dateStr;

    // Update date display
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('selectedDate').textContent =
        date.toLocaleDateString('es-ES', options);

    // Load log for this date
    try {
        const response = await fetch(`/api/daily-checkin?date=${dateStr}`);
        const data = await response.json();

        if (data.log) {
            formState.eaten_well = data.log.eaten_well;
            formState.did_sport = data.log.did_sport;
            formState.studied = data.log.studied;
            formState.slept_early = data.log.slept_early;
        } else {
            // Reset form for new date
            formState.eaten_well = false;
            formState.did_sport = false;
            formState.studied = false;
            formState.slept_early = false;
        }

        updateAllToggles();
        renderCalendar(); // Re-render to update selected state
    } catch (error) {
        console.error('Error loading date:', error);
    }
}

// Update toggle UI
function updateToggleUI(field) {
    const toggle = document.querySelector(`.toggle-switch[data-field="${field}"]`);
    const item = toggle.parentElement;

    if (formState[field]) {
        toggle.classList.add('active');
        item.classList.add('active');
    } else {
        toggle.classList.remove('active');
        item.classList.remove('active');
    }
}

// Update all toggles
function updateAllToggles() {
    Object.keys(formState).forEach(field => {
        updateToggleUI(field);
    });
}

// Save data
async function saveData() {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    try {
        const response = await fetch('/api/daily-checkin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: selectedDate,
                ...formState
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('✅ Datos guardados correctamente', 'success');

            // Update local cache
            monthLogs[selectedDate] = data.log;

            // Re-render calendar to show updated status
            renderCalendar();
        } else {
            showMessage('❌ Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error saving:', error);
        showMessage('❌ Error al guardar', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar';
    }
}

// Show message
function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;

    setTimeout(() => {
        message.className = 'message';
    }, 3000);
}

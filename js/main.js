const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY = 'f670b644-5729-414b-a9aa-293521e72046';

// Глобальные переменные
let currentCourses = [];
let currentTutors = [];
let currentCoursePage = 1;
const itemsPerPage = 5;
let selectedTutorId = null;
let selectedCourseId = null;
let currentItemData = null;
let currentApplicationId = null;

// Функция для отображения уведомлений
function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notification-area');
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show notification`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    notificationArea.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Загрузка курсов
async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/courses?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки курсов');
        
        const courses = await response.json();
        currentCourses = courses;
        renderCourses();
        populateLanguageOptions(courses);
    } catch (error) {
        showNotification(`Ошибка загрузки курсов: ${error.message}`, 'error');
    }
}

// Загрузка репетиторов
async function loadTutors() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tutors?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки репетиторов');
        
        const tutors = await response.json();
        // Сортировка репетиторов по уровню языка
        currentTutors = tutors.sort((a, b) => {
            const levelOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
            return levelOrder[a.language_level] - levelOrder[b.language_level];
        });
        renderTutors(currentTutors);
    } catch (error) {
        showNotification(`Ошибка загрузки репетиторов: ${error.message}`, 'error');
    }
}

// Отображение курсов с пагинацией
function renderCourses(searchTerm = '', level = '') {
    const coursesList = document.getElementById('courses-list');
    const pagination = document.getElementById('courses-pagination');
    
    let filteredCourses = currentCourses.filter(course => {
        const matchesSearch = searchTerm === '' || 
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = level === '' || course.level === level;
        return matchesSearch && matchesLevel;
    });
    
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const startIndex = (currentCoursePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageCourses = filteredCourses.slice(startIndex, endIndex);
    
    coursesList.innerHTML = '';
    pageCourses.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesList.appendChild(courseCard);
    });
    
    renderPagination(pagination, totalPages, currentCoursePage, (page) => {
        currentCoursePage = page;
        renderCourses(searchTerm, level);
    });
}

// Создание карточки курса
function createCourseCard(course) {
    const levelClasses = {
        'Beginner': 'level-beginner',
        'Intermediate': 'level-intermediate',
        'Advanced': 'level-advanced'
    };
    
    const levelClass = levelClasses[course.level] || '';
    
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
        <div class="card course-card h-100">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h5 class="card-title mb-0">${course.name}</h5>
                    <span class="badge ${levelClass} level-badge">${course.level}</span>
                </div>
                <p class="card-text text-muted small mb-3">${course.description.substring(0, 100)}...</p>
                <p class="card-text"><strong>Преподаватель:</strong> ${course.teacher}</p>
                <p class="card-text"><strong>Длительность:</strong> ${course.total_length} недель</p>
                <p class="card-text"><strong>Часов в неделю:</strong> ${course.week_length}</p>
                <p class="card-text"><strong>Стоимость в час:</strong> ${course.course_fee_per_hour} руб.</p>
                <button class="btn btn-outline-primary w-100 select-course-btn" 
                        data-course-id="${course.id}"
                        data-course-name="${course.name}"
                        data-course-teacher="${course.teacher}"
                        data-course-duration="${course.total_length}"
                        data-course-fee="${course.course_fee_per_hour}"
                        data-course-week-length="${course.week_length}"
                        data-start-dates='${JSON.stringify(course.start_dates)}'>
                    ${selectedCourseId === course.id ? '✓ Выбран' : 'Выбрать курс'}
                </button>
            </div>
        </div>
    `;
    
    return col;
}

// Отображение репетиторов
function renderTutors(tutors) {
    const tutorsList = document.getElementById('tutors-list');
    tutorsList.innerHTML = '';
    
    tutors.forEach(tutor => {
        const tutorCard = createTutorCard(tutor);
        tutorsList.appendChild(tutorCard);
    });
}

// Создание карточки репетитора
function createTutorCard(tutor) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.innerHTML = `
        <div class="card tutor-card ${selectedTutorId === tutor.id ? 'selected-tutor' : ''}">
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-3" 
                         style="width: 60px; height: 60px;">
                        <i class="bi bi-person fs-4 text-white"></i>
                    </div>
                    <div>
                        <h5 class="card-title mb-0">${tutor.name}</h5>
                        <span class="badge ${getLevelBadgeClass(tutor.language_level)}">${tutor.language_level}</span>
                    </div>
                </div>
                <p class="card-text"><strong>Опыт:</strong> ${tutor.work_experience} лет</p>
                <p class="card-text"><strong>Языки преподавания:</strong> ${tutor.languages_offered.join(', ')}</p>
                <p class="card-text"><strong>Языки общения:</strong> ${tutor.languages_spoken.join(', ')}</p>
                <p class="card-text"><strong>Ставка в час:</strong> ${tutor.price_per_hour} руб.</p>
                <button class="btn btn-outline-primary w-100 select-tutor-btn" 
                        data-tutor-id="${tutor.id}"
                        data-tutor-name="${tutor.name}"
                        data-tutor-price="${tutor.price_per_hour}"
                        data-tutor-language-level="${tutor.language_level}">
                    ${selectedTutorId === tutor.id ? '✓ Выбран' : 'Выбрать репетитора'}
                </button>
            </div>
        </div>
    `;
    
    return col;
}

// Получить класс для бейджа уровня
function getLevelBadgeClass(level) {
    const levelClasses = {
        'Beginner': 'bg-success',
        'Intermediate': 'bg-warning',
        'Advanced': 'bg-danger'
    };
    return levelClasses[level] || 'bg-secondary';
}

// Пагинация
function renderPagination(container, totalPages, currentPage, onPageChange) {
    container.innerHTML = '';
    
    if (totalPages === 0) totalPages = 1;
    
    const ul = document.createElement('ul');
    ul.className = 'pagination';
    
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = '<a class="page-link" href="#">Назад</a>';
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) onPageChange(currentPage - 1);
    });
    ul.appendChild(prevLi);
    
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            onPageChange(i);
        });
        ul.appendChild(li);
    }
    
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = '<a class="page-link" href="#">Вперед</a>';
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    });
    ul.appendChild(nextLi);
    
    container.appendChild(ul);
}

// Заполнение опций языков
function populateLanguageOptions(courses) {
    const languageSelect = document.getElementById('tutor-language');
    const languages = new Set();
    
    courses.forEach(course => {
        const courseName = course.name.toLowerCase();
        if (courseName.includes('русск')) languages.add('Русский');
        if (courseName.includes('англ')) languages.add('Английский');
        if (courseName.includes('немец')) languages.add('Немецкий');
        if (courseName.includes('франц')) languages.add('Французский');
        if (courseName.includes('испан')) languages.add('Испанский');
    });
    
    languages.forEach(language => {
        const option = document.createElement('option');
        option.value = language;
        option.textContent = language;
        languageSelect.appendChild(option);
    });
}

// Поиск репетиторов
function searchTutors() {
    const language = document.getElementById('tutor-language').value;
    const experience = parseInt(document.getElementById('tutor-experience').value);
    
    let filteredTutors = currentTutors;
    
    if (language) {
        filteredTutors = filteredTutors.filter(tutor => 
            tutor.languages_offered.some(lang => lang.toLowerCase().includes(language.toLowerCase()))
        );
    }
    
    if (experience) {
        filteredTutors = filteredTutors.filter(tutor => 
            tutor.work_experience >= experience
        );
    }
    
    renderTutors(filteredTutors);
}

// Открытие формы заявки
function openApplicationForm() {
    if (!selectedCourseId && !selectedTutorId) {
        showNotification('Пожалуйста, выберите курс или репетитора', 'warning');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('applicationModal'));
    
    if (selectedCourseId) {
        const course = currentCourses.find(c => c.id == selectedCourseId);
        if (course) {
            currentItemData = {
                type: 'course',
                id: course.id,
                name: course.name,
                teacher: course.teacher,
                duration: course.total_length,
                feePerHour: course.course_fee_per_hour,
                weekLength: course.week_length,
                startDates: course.start_dates
            };
            
            document.getElementById('modalTitle').textContent = 'Оформление заявки на курс';
            document.getElementById('applicationType').value = 'course';
            document.getElementById('itemId').value = currentItemData.id;
            document.getElementById('itemName').value = currentItemData.name;
            document.getElementById('teacherName').value = currentItemData.teacher;
            document.getElementById('duration').value = `${currentItemData.duration} недель`;
            
            const startDateSelect = document.getElementById('startDate');
            startDateSelect.innerHTML = '<option value="">Выберите дату</option>';
            
            const uniqueDates = [...new Set(currentItemData.startDates.map(dateStr => 
                new Date(dateStr).toISOString().split('T')[0]
            ))];
            
            uniqueDates.forEach(dateStr => {
                const date = new Date(dateStr);
                const option = document.createElement('option');
                option.value = dateStr;
                option.textContent = date.toLocaleDateString('ru-RU');
                startDateSelect.appendChild(option);
            });
        }
    } else if (selectedTutorId) {
        const tutor = currentTutors.find(t => t.id == selectedTutorId);
        if (tutor) {
            currentItemData = {
                type: 'tutor',
                id: tutor.id,
                name: tutor.name,
                teacher: tutor.name,
                feePerHour: tutor.price_per_hour,
                languageLevel: tutor.language_level
            };
            
            document.getElementById('modalTitle').textContent = 'Оформление заявки к репетитору';
            document.getElementById('applicationType').value = 'tutor';
            document.getElementById('itemId').value = currentItemData.id;
            document.getElementById('itemName').value = `Репетитор: ${currentItemData.name}`;
            document.getElementById('teacherName').value = currentItemData.teacher;
            document.getElementById('duration').value = 'Индивидуальные занятия';
            
            const startDateSelect = document.getElementById('startDate');
            startDateSelect.innerHTML = `
                <option value="">Выберите дату</option>
                <option value="2025-02-01">1 февраля 2025</option>
                <option value="2025-02-15">15 февраля 2025</option>
                <option value="2025-03-01">1 марта 2025</option>
                <option value="2025-03-15">15 марта 2025</option>
            `;
        }
    }
    
    modal.show();
}

// Расчет стоимости
function calculateCost() {
    if (!currentItemData) return;
    
    const persons = parseInt(document.getElementById('persons').value) || 1;
    const startDate = document.getElementById('startDate').value;
    const startTime = document.getElementById('startTime').value;
    
    if (!startDate || !startTime) {
        showNotification('Выберите дату и время начала', 'warning');
        return;
    }
    
    let baseCost = 0;
    let totalHours = 0;
    
    if (currentItemData.type === 'course') {
        totalHours = currentItemData.duration * currentItemData.weekLength;
        baseCost = currentItemData.feePerHour * totalHours;
    } else {
        totalHours = 10;
        baseCost = currentItemData.feePerHour * totalHours;
    }
    
    let finalCost = baseCost;
    
    // Коэффициент выходных/праздников
    const startDateObj = new Date(startDate);
    const dayOfWeek = startDateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) {
        finalCost *= 1.5;
    }
    
    // Доплата за утренние занятия
    const hour = parseInt(startTime.split(':')[0]);
    if (hour >= 9 && hour < 12) {
        finalCost += 400 * persons;
    }
    
    // Доплата за вечерние занятия
    if (hour >= 18 && hour < 20) {
        finalCost += 1000 * persons;
    }
    
    // Дополнительные опции
    const supplementary = document.getElementById('supplementary').checked;
    const personalized = document.getElementById('personalized').checked;
    const excursions = document.getElementById('excursions').checked;
    const interactive = document.getElementById('interactive').checked;
    
    if (supplementary) finalCost += 2000 * persons;
    if (personalized) finalCost += 1500 * (currentItemData.duration || 1);
    if (excursions) finalCost *= 1.25;
    if (interactive) finalCost *= 1.5;
    
    // Скидки
    const today = new Date();
    const startDateForDiscount = new Date(startDate);
    const monthDiff = (startDateForDiscount.getFullYear() - today.getFullYear()) * 12 + 
                      (startDateForDiscount.getMonth() - today.getMonth());
    
    let discountInfo = '';
    
    if (monthDiff >= 1) {
        finalCost *= 0.9;
        discountInfo += 'Скидка 10% за раннюю регистрацию<br>';
    }
    
    if (persons >= 5) {
        finalCost *= 0.85;
        discountInfo += 'Скидка 15% за групповую запись<br>';
    }
    
    if (currentItemData.type === 'course' && currentItemData.weekLength >= 5) {
        finalCost *= 1.2;
        discountInfo += 'Доплата 20% за интенсивный курс<br>';
    }
    
    finalCost *= persons;
    
    document.getElementById('totalCost').textContent = `${Math.round(finalCost)} руб.`;
    document.getElementById('discountInfo').innerHTML = discountInfo || 'Скидки не применяются';
}

// Отправка заявки
async function submitApplication() {
    try {
        const formData = {
            [currentItemData.type === 'course' ? 'course_id' : 'tutor_id']: currentItemData.id,
            date_start: document.getElementById('startDate').value,
            time_start: document.getElementById('startTime').value,
            duration: currentItemData.type === 'course' ? 
                     currentItemData.duration * currentItemData.weekLength : 10,
            persons: parseInt(document.getElementById('persons').value),
            price: parseInt(document.getElementById('totalCost').textContent),
            early_registration: document.getElementById('startDate').value && 
                               (new Date(document.getElementById('startDate').value) - new Date()) / (1000 * 60 * 60 * 24 * 30) >= 1,
            group_enrollment: parseInt(document.getElementById('persons').value) >= 5,
            intensive_course: currentItemData.type === 'course' && currentItemData.weekLength >= 5,
            supplementary: document.getElementById('supplementary').checked,
            personalized: document.getElementById('personalized').checked,
            excursions: document.getElementById('excursions').checked,
            assessment: false,
            interactive: document.getElementById('interactive').checked
        };
        
        const method = currentApplicationId ? 'PUT' : 'POST';
        const url = currentApplicationId ? 
            `${API_BASE_URL}/api/orders/${currentApplicationId}?api_key=${API_KEY}` :
            `${API_BASE_URL}/api/orders?api_key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка отправки заявки');
        }
        
        const result = await response.json();
        
        showNotification(
            currentApplicationId ? 'Заявка успешно обновлена!' : 'Заявка успешно отправлена!',
            'success'
        );
        
        bootstrap.Modal.getInstance(document.getElementById('applicationModal')).hide();
        
        resetApplicationForm();
        
    } catch (error) {
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Сброс формы заявки
function resetApplicationForm() {
    document.getElementById('applicationForm').reset();
    document.getElementById('applicationId').value = '';
    document.getElementById('totalCost').textContent = '0 руб.';
    document.getElementById('discountInfo').innerHTML = '';
    document.getElementById('endDate').textContent = '';
    currentApplicationId = null;
    currentItemData = null;
}

// Обновление времени при выборе даты
function updateTimeOptions(selectedDate) {
    if (!currentItemData || !currentItemData.startDates) return;
    
    const timeSelect = document.getElementById('startTime');
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    timeSelect.disabled = false;
    
    const timesForDate = currentItemData.startDates
        .filter(dateStr => dateStr.startsWith(selectedDate))
        .map(dateStr => {
            const date = new Date(dateStr);
            return date.toTimeString().substring(0, 5);
        });
    
    const uniqueTimes = [...new Set(timesForDate)];
    
    uniqueTimes.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        
        // Расчет времени окончания для курсов
        if (currentItemData.type === 'course' && currentItemData.weekLength) {
            const [hours, minutes] = time.split(':').map(Number);
            const endHours = hours + currentItemData.weekLength;
            option.textContent = `${time} - ${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } else {
            option.textContent = time;
        }
        
        timeSelect.appendChild(option);
    });
    
    if (currentItemData.type === 'course' && selectedDate) {
        const startDate = new Date(selectedDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + currentItemData.duration * 7);
        document.getElementById('endDate').textContent = 
            `Окончание: ${endDate.toLocaleDateString('ru-RU')}`;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    loadCourses();
    loadTutors();
    
    const courseSearch = document.getElementById('course-search');
    const courseLevel = document.getElementById('course-level');
    
    const debouncedSearch = debounce(() => {
        renderCourses(courseSearch.value, courseLevel.value);
    }, 300);
    
    courseSearch.addEventListener('input', debouncedSearch);
    courseLevel.addEventListener('change', debouncedSearch);
    
    document.getElementById('search-tutors').addEventListener('click', searchTutors);
    
    // Обработчики для кнопок выбора
    document.addEventListener('click', function(e) {
        // Выбор курса
        if (e.target.classList.contains('select-course-btn')) {
            const courseId = parseInt(e.target.dataset.courseId);
            
            selectedCourseId = selectedCourseId === courseId ? null : courseId;
            selectedTutorId = null;
            
            document.querySelectorAll('.select-course-btn').forEach(btn => {
                const btnCourseId = parseInt(btn.dataset.courseId);
                if (btnCourseId === selectedCourseId) {
                    btn.textContent = '✓ Выбран';
                    btn.classList.remove('btn-outline-primary');
                    btn.classList.add('btn-primary');
                } else {
                    btn.textContent = 'Выбрать курс';
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline-primary');
                }
            });
            
            document.querySelectorAll('.select-tutor-btn').forEach(btn => {
                btn.textContent = 'Выбрать репетитора';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline-primary');
            });
            
            updateOrderButton();
        }
        
        // Выбор репетитора
        if (e.target.classList.contains('select-tutor-btn')) {
            const tutorId = parseInt(e.target.dataset.tutorId);
            
            selectedTutorId = selectedTutorId === tutorId ? null : tutorId;
            selectedCourseId = null;
            
            document.querySelectorAll('.select-tutor-btn').forEach(btn => {
                const btnTutorId = parseInt(btn.dataset.tutorId);
                if (btnTutorId === selectedTutorId) {
                    btn.textContent = '✓ Выбран';
                    btn.classList.remove('btn-outline-primary');
                    btn.classList.add('btn-primary');
                } else {
                    btn.textContent = 'Выбрать репетитора';
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline-primary');
                }
            });
            
            document.querySelectorAll('.select-course-btn').forEach(btn => {
                btn.textContent = 'Выбрать курс';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline-primary');
            });
            
            updateOrderButton();
        }
    });
    
    document.getElementById('order-button').addEventListener('click', openApplicationForm);
    
    document.getElementById('startDate').addEventListener('change', function() {
        updateTimeOptions(this.value);
        calculateCost();
    });
    
    document.getElementById('startTime').addEventListener('change', calculateCost);
    document.getElementById('persons').addEventListener('input', calculateCost);
    
    ['supplementary', 'personalized', 'excursions', 'interactive'].forEach(id => {
        document.getElementById(id).addEventListener('change', calculateCost);
    });
    
    document.getElementById('calculateCost').addEventListener('click', calculateCost);
    document.getElementById('submitApplication').addEventListener('click', submitApplication);
    
    document.getElementById('applicationModal').addEventListener('hidden.bs.modal', resetApplicationForm);
});

// Обновление кнопки заказа
function updateOrderButton() {
    const orderButton = document.getElementById('order-button');
    if (selectedCourseId || selectedTutorId) {
        orderButton.disabled = false;
        orderButton.classList.remove('btn-secondary');
        orderButton.classList.add('btn-primary');
    } else {
        orderButton.disabled = true;
        orderButton.classList.remove('btn-primary');
        orderButton.classList.add('btn-secondary');
    }
}

// Вспомогательная функция debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY = 'f670b644-5729-414b-a9aa-293521e72046';

// Глобальные переменные
let currentOrders = [];
let currentOrderPage = 1;
const itemsPerPage = 5;
let orderToDelete = null;
let orderToEdit = null;

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

// Загрузка заказов пользователя
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки заказов');
        
        const orders = await response.json();
        currentOrders = orders;
        renderOrders();
    } catch (error) {
        showNotification(`Ошибка загрузки заказов: ${error.message}`, 'error');
    }
}

// Отображение заказов с пагинацией
function renderOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    const pagination = document.getElementById('ordersPagination');
    
    const totalPages = Math.ceil(currentOrders.length / itemsPerPage) || 1;
    const startIndex = (currentOrderPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageOrders = currentOrders.slice(startIndex, endIndex);
    
    tableBody.innerHTML = '';
    
    pageOrders.forEach((order, index) => {
        const row = document.createElement('tr');
        const orderType = order.course_id ? 'Курс' : 'Репетитор';
        const orderStatus = order.price > 0 ? 'Оплачено' : 'Ожидает оплаты';
        
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>${orderType}</td>
            <td>${order.date_start}</td>
            <td>${order.persons}</td>
            <td>${order.price} руб.</td>
            <td><span class="badge ${orderStatus === 'Оплачено' ? 'bg-success' : 'bg-warning'}">${orderStatus}</span></td>
            <td>
                <button class="btn btn-sm btn-info view-order-btn me-1" 
                        data-order-id="${order.id}">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning edit-order-btn me-1" 
                        data-order-id="${order.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-order-btn" 
                        data-order-id="${order.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    if (currentOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        У вас нет активных заявок
                    </div>
                </td>
            </tr>
        `;
    }
    
    renderPagination(pagination, totalPages, currentOrderPage, (page) => {
        currentOrderPage = page;
        renderOrders();
    });
}

// Пагинация
function renderPagination(container, totalPages, currentPage, onPageChange) {
    container.innerHTML = '';
    
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

// Просмотр деталей заявки
async function viewOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки деталей заявки');
        
        const order = await response.json();
        
        const orderType = order.course_id ? 'Курс' : 'Репетитор';
        
        document.getElementById('viewOrderType').textContent = orderType;
        document.getElementById('viewOrderDate').textContent = order.date_start;
        document.getElementById('viewOrderTime').textContent = order.time_start;
        document.getElementById('viewOrderPersons').textContent = order.persons;
        document.getElementById('viewOrderDuration').textContent = order.duration;
        document.getElementById('viewOrderPrice').textContent = order.price;
        
        const optionsList = document.getElementById('viewOrderOptions');
        optionsList.innerHTML = '';
        
        const options = [
            { key: 'early_registration', label: 'Ранняя регистрация' },
            { key: 'group_enrollment', label: 'Групповая запись' },
            { key: 'intensive_course', label: 'Интенсивный курс' },
            { key: 'supplementary', label: 'Доп. материалы' },
            { key: 'personalized', label: 'Индивидуальные занятия' },
            { key: 'excursions', label: 'Культурные экскурсии' },
            { key: 'assessment', label: 'Оценка уровня' },
            { key: 'interactive', label: 'Интерактивная платформа' }
        ];
        
        let hasOptions = false;
        options.forEach(option => {
            if (order[option.key]) {
                const li = document.createElement('li');
                li.textContent = option.label;
                optionsList.appendChild(li);
                hasOptions = true;
            }
        });
        
        if (!hasOptions) {
            const li = document.createElement('li');
            li.textContent = 'Нет дополнительных опций';
            li.className = 'text-muted';
            optionsList.appendChild(li);
        }
        
        const discountDetails = document.getElementById('discountDetails');
        discountDetails.innerHTML = '';
        
        if (order.early_registration || order.group_enrollment) {
            const discountDiv = document.createElement('div');
            discountDiv.className = 'alert alert-success mt-2';
            discountDiv.innerHTML = '<strong>Примененные скидки:</strong><br>';
            
            if (order.early_registration) {
                discountDiv.innerHTML += '✓ 10% за раннюю регистрацию<br>';
            }
            if (order.group_enrollment) {
                discountDiv.innerHTML += '✓ 15% за групповую запись';
            }
            
            discountDetails.appendChild(discountDiv);
        }
        
        const modal = new bootstrap.Modal(document.getElementById('viewOrderModal'));
        modal.show();
        
    } catch (error) {
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Редактирование заявки
async function editOrder(orderId) {
    try {
        orderToEdit = orderId;
        
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки данных заявки');
        
        const order = await response.json();
        
        document.getElementById('editOrderId').value = order.id;
        document.getElementById('editDateStart').value = order.date_start;
        document.getElementById('editTimeStart').value = order.time_start;
        document.getElementById('editPersons').value = order.persons;
        document.getElementById('editDuration').value = order.duration;
        document.getElementById('editTotalCost').textContent = `${order.price} руб.`;
        
        document.getElementById('editSupplementary').checked = order.supplementary || false;
        document.getElementById('editPersonalized').checked = order.personalized || false;
        document.getElementById('editExcursions').checked = order.excursions || false;
        document.getElementById('editInteractive').checked = order.interactive || false;
        
        const modal = new bootstrap.Modal(document.getElementById('editOrderModal'));
        modal.show();
        
    } catch (error) {
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Обновление заявки
async function updateOrder() {
    if (!orderToEdit) return;
    
    try {
        const formData = {
            date_start: document.getElementById('editDateStart').value,
            time_start: document.getElementById('editTimeStart').value,
            persons: parseInt(document.getElementById('editPersons').value),
            duration: parseInt(document.getElementById('editDuration').value),
            supplementary: document.getElementById('editSupplementary').checked,
            personalized: document.getElementById('editPersonalized').checked,
            excursions: document.getElementById('editExcursions').checked,
            interactive: document.getElementById('editInteractive').checked
        };
        
        const basePrice = 2000;
        let newPrice = basePrice * formData.duration * formData.persons;
        
        if (formData.supplementary) newPrice += 2000 * formData.persons;
        if (formData.personalized) newPrice += 1500;
        if (formData.excursions) newPrice *= 1.25;
        if (formData.interactive) newPrice *= 1.5;
        
        formData.price = Math.round(newPrice);
        
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderToEdit}?api_key=${API_KEY}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка обновления заявки');
        }
        
        const result = await response.json();
        
        showNotification('Заявка успешно обновлена!', 'success');
        
        bootstrap.Modal.getInstance(document.getElementById('editOrderModal')).hide();
        
        loadOrders();
        
        orderToEdit = null;
        
    } catch (error) {
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Подтверждение удаления заявки
function confirmDeleteOrder(orderId) {
    orderToDelete = orderId;
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

// Удаление заявки
async function deleteOrder() {
    if (!orderToDelete) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderToDelete}?api_key=${API_KEY}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Ошибка удаления заявки');
        
        showNotification('Заявка успешно удалена!', 'success');
        
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
        
        loadOrders();
        
        orderToDelete = null;
        
    } catch (error) {
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('.view-order-btn')) {
            const orderId = e.target.closest('.view-order-btn').dataset.orderId;
            viewOrder(orderId);
        }
        
        if (e.target.closest('.edit-order-btn')) {
            const orderId = e.target.closest('.edit-order-btn').dataset.orderId;
            editOrder(orderId);
        }
        
        if (e.target.closest('.delete-order-btn')) {
            const orderId = e.target.closest('.delete-order-btn').dataset.orderId;
            confirmDeleteOrder(orderId);
        }
    });
    
    document.getElementById('updateOrder').addEventListener('click', updateOrder);
    
    document.getElementById('confirmDelete').addEventListener('click', deleteOrder);
});
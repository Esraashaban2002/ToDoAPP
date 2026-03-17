const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const addBtn = document.getElementById("addBtn");
const searchInput = document.getElementById("search");
const toggleBtn = document.getElementById("toggle-mode");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
let draggedItem = null;

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
    toggleBtn.innerHTML = "🌞";
} else {
    toggleBtn.innerHTML = "🌛";
}

// Load tasks
renderTasks();

// Add Task
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    const exists = tasks.some(t => t.text.toLowerCase() === text.toLowerCase() && t.id !== editingTaskId);
    if (exists) {
        alert("Task already exists!");
        return;
    }

    if (editingTaskId) {
        // Update mode
        const task = tasks.find(t => t.id === editingTaskId);
        task.text = text;
        editingTaskId = null;
        addBtn.textContent = "Add Task";
    } else {
        // Add new task
        const task = {
            id: Date.now(),
            text,
            completed: false,
            starred: false,
            date: new Date().toLocaleDateString()
        };
        tasks.push(task);
    }

    save();
    renderTasks(searchInput.value);
    input.value = "";
});

// Search
searchInput.addEventListener("input", () => {
    renderTasks(searchInput.value);
});

// Filters
document.querySelectorAll(".filters button").forEach(btn => {
    btn.onclick = () => {
        currentFilter = btn.dataset.filter;
        renderTasks(searchInput.value);
    };
});

// Clear completed
document.getElementById("clear-completed").onclick = () => {
    tasks = tasks.filter(t => !t.completed);
    save();
    renderTasks(searchInput.value);
};

// Dark Mode
toggleBtn.onclick = () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    toggleBtn.innerHTML = isDark ? "🌞" : "🌛";

    localStorage.setItem("theme", isDark ? "dark" : "light");
};

// Render Tasks
function renderTasks(searchText = "") {
    list.innerHTML = "";

    let filtered = tasks.filter(task => {
        if (currentFilter === "active") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    filtered = filtered.filter(task =>
        task.text.toLowerCase().includes(searchText.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => b.starred - a.starred);

    sorted.forEach(task => {
        const li = document.createElement("li");
        li.draggable = true;

        if (task.completed) li.classList.add("completed");

        li.innerHTML = `
            <span contenteditable="true" class="task-text">${task.text}</span>
            <small>${task.date}</small>
            <div class="icons">
                <span class="star">${task.starred ? "⭐" : "☆"}</span>
                <span class="status">${task.completed ? "❤️" : "😡"}</span>
                <span class="edit">✒️</span>
                <span class="delete">🗑</span>
            </div>
        `;

        // Complete
        li.querySelector(".status").onclick = () => {
            task.completed = !task.completed;
            save();
            renderTasks(searchInput.value);
        };

        // Delete
        li.querySelector(".delete").onclick = () => {
            tasks = tasks.filter(t => t.id !== task.id);
            save();
            renderTasks(searchInput.value);
        };
        // Edit button
        li.querySelector(".edit").onclick = () => {
            input.value = task.text;
            editingTaskId = task.id;
            addBtn.textContent = "Update";
            input.focus();
        };

        // Star
        li.querySelector(".star").onclick = () => {
            task.starred = !task.starred;
            save();
            renderTasks(searchInput.value);
        };

        list.appendChild(li);
    });

    updateCounter();
}

// Drag & Drop
list.addEventListener("dragstart", (e) => {
    draggedItem = e.target;
});

list.addEventListener("dragover", (e) => {
    e.preventDefault();
});

list.addEventListener("drop", (e) => {
    if (e.target.closest("li")) {
        const target = e.target.closest("li");
        list.insertBefore(draggedItem, target);

        const newTasks = [];
        document.querySelectorAll("li").forEach(li => {
            const text = li.querySelector(".task-text").textContent;
            const task = tasks.find(t => t.text === text);
            if (task) newTasks.push(task);
        });

        tasks = newTasks;
        save();
    }
});

// Counter
function updateCounter() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const remaining = total - completed;

    document.getElementById("total").textContent = `Total: ${total}`;
    document.getElementById("completed").textContent = `Completed: ${completed}`;
    document.getElementById("remaining").textContent = `Remaining: ${remaining}`;
}

// Save
function save() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
import { requireAuth, initUserProfile, applyRoleRestrictions, isAdmin } from "../../../assets/js/repositories/authRepository.js";
import { getProjects, createProject } from "../../../assets/js/repositories/projectRepository.js";
import { normalizeString } from "../../../assets/js/normalize.js";

requireAuth();
initUserProfile();

const projectsContainer = document.querySelector("#projects-list");
const searchInput = document.querySelector("#project-search");
const filterButtons = document.querySelectorAll(".project-filter-tabs [data-filter]");
const emptyState = document.querySelector("#projects-empty-state");
const totalLabel = document.querySelector(".projects-header-info p span");
const createProjectBtn = document.querySelector(".projects-header button");

if (createProjectBtn && !isAdmin()) {
    createProjectBtn.style.setProperty("display", "none", "important");
}

let selectedFilter = "todos";
let projectElements = [];

function renderProjects(projects) {
    if (!projectsContainer) return;

    if (!projects || projects.length === 0) {
        projectsContainer.innerHTML = "";
        if (emptyState) emptyState.hidden = false;
        if (totalLabel) totalLabel.textContent = "0";
        return;
    }

    if (totalLabel) totalLabel.textContent = String(projects.length);

    projectsContainer.innerHTML = projects.map((p, index) => {
        // Calculate progress or display default
        const total = p.total_tasks ? Number(p.total_tasks) : 0;
        const completed = p.completed_tasks ? Number(p.completed_tasks) : 0;
        const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 50;

        // Segments calculation (12 segments)
        const filledSegments = Math.round((progressPercent / 100) * 12);
        const segmentsHtml = Array.from({ length: 12 }, (_, i) => 
            `<div class="progress-bar-segment ${i < filledSegments ? 'progress-bar-filled' : 'progress-bar-empty'}"></div>`
        ).join("");

        return `
            <div class="project-card base-card" data-owner="todos" data-recent="true" data-project-id="${p.project_id}">
                <div class="project-card-header">
                    <a href="../project_details/project_details.html?project_id=${p.project_id}" class="text-neutral text-medium text-weight-medium font-inter">
                        ${p.title}
                    </a>
                    <div class="project-card-menu">
                        <i data-lucide="settings" class="icon-medium" style="color: var(--color-neutral-700)"></i>
                    </div>
                </div>
                <div class="project-card-progress">
                    <p class="text-label text-small text-weight-medium font-inter">Progresso</p>
                    <h1 class="text-primary">${progressPercent}%</h1>
                    <div class="progress-bar">
                        ${segmentsHtml}
                    </div>
                </div>
                <div class="project-card-footer">
                    <div class="align-center gap-8">
                        <span class="project-card-badge project-card-badge-indigo"></span>
                        <p class="text-subtitle font-inter text-small">Projeto #${p.project_id}</p>
                    </div>
                    <a href="../project_details/project_details.html?project_id=${p.project_id}" class="card-icon" aria-label="Ver detalhes do projeto">
                        <i data-lucide="arrow-up-right" class="icon-small" style="color: var(--color-neutral-700)"></i>
                    </a>
                </div>
            </div>
        `;
    }).join("");

    projectElements = Array.from(projectsContainer.querySelectorAll(".project-card"));
    updateFilterAndSearch();
    applyRoleRestrictions();

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function updateFilterAndSearch() {
    const query = normalizeString(searchInput ? searchInput.value.trim() : "");
    let visibleCount = 0;

    projectElements.forEach((project) => {
        const matchesSearch = normalizeString(project.textContent).includes(query);
        const matchesFilter =
            selectedFilter === "todos" ||
            (selectedFilter === "recentes" && project.dataset.recent === "true") ||
            (project.dataset.owner === selectedFilter);

        project.hidden = !matchesSearch || !matchesFilter;
        if (!project.hidden) visibleCount += 1;
    });

    if (emptyState) emptyState.hidden = visibleCount > 0;
    if (totalLabel) totalLabel.textContent = String(visibleCount);
}

async function loadProjects() {
    try {
        const res = await getProjects();
        if (res.success) {
            renderProjects(res.projects);
        } else {
            console.error("Erro ao carregar projetos:", res.message);
        }
    } catch (err) {
        console.error("Erro ao carregar projetos:", err);
    }
}

// Event Listeners
if (searchInput) {
    searchInput.addEventListener("input", updateFilterAndSearch);
}

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectedFilter = button.dataset.filter;
        filterButtons.forEach((item) => {
            const active = item === button;
            item.classList.toggle("tab-active", active);
            item.setAttribute("aria-pressed", String(active));
        });
        updateFilterAndSearch();
    });
});

if (createProjectBtn) {
    createProjectBtn.addEventListener("click", async () => {
        const title = window.prompt("Digite o nome do novo projeto:");
        if (!title || title.trim() === "") return;

        try {
            const res = await createProject(title.trim());
            if (res.success) {
                window.alert("Projeto criado com sucesso!");
                await loadProjects();
            } else {
                window.alert(res.message || "Erro ao criar projeto.");
            }
        } catch (err) {
            window.alert("Erro ao criar projeto. Tente novamente.");
        }
    });
}

// Initial load
loadProjects();

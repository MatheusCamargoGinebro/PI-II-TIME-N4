
const projectsList = document.querySelector("#projects-list");

if (projectsList) {
	const projects = Array.from(projectsList.querySelectorAll(".project-card"));
	const searchInput = document.querySelector("#project-search");
	const filterButtons = document.querySelectorAll(".project-filter-tabs [data-filter]");
	const emptyState = document.querySelector("#projects-empty-state");
	let selectedFilter = "todos";

	const normalize = (value) =>
		value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

	const updateProjects = () => {
		const query = normalize(searchInput.value.trim());
		let visibleCount = 0;

		projects.forEach((project) => {
			const matchesSearch = normalize(project.textContent).includes(query);
			const matchesFilter =
				selectedFilter === "todos" ||
				(selectedFilter === "recentes" && project.dataset.recent === "true") ||
				(project.dataset.owner === selectedFilter);
			project.hidden = !matchesSearch || !matchesFilter;
			if (!project.hidden) visibleCount += 1;
		});

		emptyState.hidden = visibleCount > 0;
		const totalLabel = document.querySelector(".projects-header-info p span");
		if (totalLabel) totalLabel.textContent = String(visibleCount);
	};

	searchInput.addEventListener("input", updateProjects);
	filterButtons.forEach((button) => {
		button.addEventListener("click", () => {
			selectedFilter = button.dataset.filter;
			filterButtons.forEach((item) => {
				const active = item === button;
				item.classList.toggle("tab-active", active);
				item.setAttribute("aria-pressed", String(active));
			});
			updateProjects();
		});
	});

	updateProjects();
}

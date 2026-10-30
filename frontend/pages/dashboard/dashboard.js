
const taskTable = document.querySelector(".dashboard-tasks-table");

if (taskTable) {
	const taskBody = taskTable.querySelector("tbody");
	const searchInput = document.querySelector("#dashboard-task-search");
	const statusFilter = document.querySelector("#dashboard-task-status");
	const countLabel = document.querySelector("#dashboard-task-count");
	const emptyState = document.querySelector("#dashboard-task-empty");
	const sortButtons = document.querySelectorAll(".dashboard-task-tabs [data-sort]");
	const tasks = Array.from(taskBody.querySelectorAll("tr"));
	const priorityOrder = { alta: 0, média: 1, media: 1, baixa: 2 };
	let currentSort = "default";

	const normalize = (value) =>
		value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

	const getCellText = (row, index) => normalize(row.cells[index]?.textContent.trim() || "");

	const updateTasks = () => {
		const query = normalize(searchInput.value.trim());
		const status = normalize(statusFilter.value);
		let visibleCount = 0;

		tasks.forEach((task) => {
			const matchesSearch = normalize(task.textContent).includes(query);
			const matchesStatus = !status || getCellText(task, 5) === status;
			task.hidden = !matchesSearch || !matchesStatus;
			if (!task.hidden) visibleCount += 1;
		});

		const visibleTasks = tasks.filter((task) => !task.hidden);
		if (currentSort === "priority") {
			visibleTasks.sort((first, second) =>
				(priorityOrder[getCellText(first, 4)] ?? Number.MAX_SAFE_INTEGER) -
				(priorityOrder[getCellText(second, 4)] ?? Number.MAX_SAFE_INTEGER)
			);
		} else if (currentSort === "deadline") {
			visibleTasks.sort((first, second) => getCellText(first, 3).localeCompare(getCellText(second, 3), "pt-BR"));
		} else {
			visibleTasks.sort((first, second) => tasks.indexOf(first) - tasks.indexOf(second));
		}

		visibleTasks.forEach((task) => taskBody.append(task));
		countLabel.textContent = `${visibleCount} ${visibleCount === 1 ? "tarefa encontrada" : "tarefas encontradas"}`;
		emptyState.hidden = visibleCount > 0;
	};

	searchInput.addEventListener("input", updateTasks);
	statusFilter.addEventListener("change", updateTasks);
	sortButtons.forEach((button) => {
		button.addEventListener("click", () => {
			currentSort = button.dataset.sort;
			sortButtons.forEach((item) => {
				const active = item === button;
				item.classList.toggle("tab-active", active);
				item.setAttribute("aria-pressed", String(active));
			});
			updateTasks();
		});
	});

	updateTasks();
}

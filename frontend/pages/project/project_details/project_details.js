
const boardColumns = Array.from(document.querySelectorAll(".project-board-column[data-task-status]"));

if (boardColumns.length) {
	const storageKey = "taskops-project-task-statuses";
	const validStatuses = new Set(boardColumns.map((column) => column.dataset.taskStatus));
	const taskCards = Array.from(document.querySelectorAll(".project-task-item[data-task-id]"));
	const searchInput = document.querySelector("#task-board-search");
	let savedStatuses = {};

	try {
		const storedValue = localStorage.getItem(storageKey);
		if (storedValue) {
			const parsedValue = JSON.parse(storedValue);
			if (parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)) {
				savedStatuses = parsedValue;
			} else {
				throw new TypeError("O formato dos status salvos não é válido.");
			}
		}
	} catch (error) {
		console.error("Não foi possível carregar os status salvos das tarefas.", error);
		window.alert("Não foi possível carregar os status salvos. O quadro será aberto com os status iniciais.");
	}

	const saveStatuses = () => {
		const statuses = Object.fromEntries(
			taskCards.map((task) => [task.dataset.taskId, task.closest(".project-board-column").dataset.taskStatus])
		);

		try {
			localStorage.setItem(storageKey, JSON.stringify(statuses));
		} catch (error) {
			console.error("Não foi possível salvar o novo status da tarefa.", error);
			window.alert("A tarefa mudou de coluna, mas não foi possível salvar essa alteração neste navegador.");
		}
	};

	taskCards.forEach((task) => {
		const savedStatus = savedStatuses[task.dataset.taskId];
		if (!validStatuses.has(savedStatus)) return;
		const destination = boardColumns.find((column) => column.dataset.taskStatus === savedStatus);
		destination.querySelector(".project-task-list").append(task);
	});

	const applyTaskSearch = () => {
		const query = searchInput.value
			.trim()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLocaleLowerCase("pt-BR");

		taskCards.forEach((task) => {
			const text = task.textContent
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.toLocaleLowerCase("pt-BR");
			task.hidden = !text.includes(query);
		});
	};

	taskCards.forEach((task) => {
		task.addEventListener("dragstart", (event) => {
			task.classList.add("is-dragging");
			event.dataTransfer.setData("text/plain", task.dataset.taskId);
			event.dataTransfer.effectAllowed = "move";
		});
		task.addEventListener("dragend", () => task.classList.remove("is-dragging"));
	});

	boardColumns.forEach((column) => {
		column.addEventListener("dragover", (event) => {
			event.preventDefault();
			column.classList.add("is-drop-target");
			event.dataTransfer.dropEffect = "move";
		});
		column.addEventListener("dragleave", (event) => {
			if (!column.contains(event.relatedTarget)) column.classList.remove("is-drop-target");
		});
		column.addEventListener("drop", (event) => {
			event.preventDefault();
			column.classList.remove("is-drop-target");
			const taskId = event.dataTransfer.getData("text/plain");
			const task = taskCards.find((card) => card.dataset.taskId === taskId);
			if (!task) return;
			column.querySelector(".project-task-list").append(task);
			saveStatuses();
			applyTaskSearch();
		});
	});

	searchInput.addEventListener("input", applyTaskSearch);
	applyTaskSearch();
}

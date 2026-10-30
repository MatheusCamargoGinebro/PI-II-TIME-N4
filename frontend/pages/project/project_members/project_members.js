
const membersGrid = document.querySelector("#project-members-grid");

if (membersGrid) {
	const members = Array.from(membersGrid.querySelectorAll(".member-card"));
	const searchInput = document.querySelector("#member-search");
	const activityFilter = document.querySelector("#member-activity");
	const countLabel = document.querySelector("#member-count");

	const normalize = (value) =>
		value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

	const updateMembers = () => {
		const query = normalize(searchInput.value.trim());
		const activity = activityFilter.value;
		let visibleCount = 0;

		members.forEach((member) => {
			const text = normalize(member.textContent);
			const counter = member.querySelector(".member-card-counter");
			const [completedText, totalText] = Array.from(counter.children, (element) => element.textContent.trim());
			const completed = Number(completedText);
			const total = Number(totalText.replace("/", ""));
			const matchesSearch = text.includes(query);
			const matchesActivity =
				!activity ||
				(activity === "pendentes" && completed < total) ||
				(activity === "concluidas" && completed === total);

			member.hidden = !matchesSearch || !matchesActivity;
			if (!member.hidden) visibleCount += 1;
		});

		countLabel.textContent = `${visibleCount} ${visibleCount === 1 ? "membro encontrado" : "membros encontrados"}`;
	};

	searchInput.addEventListener("input", updateMembers);
	activityFilter.addEventListener("change", updateMembers);
	updateMembers();
}

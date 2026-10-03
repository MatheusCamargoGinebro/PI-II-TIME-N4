function p_button({
	label = "Clique aqui",
	disabled = false,
	icon = null,
	onclick = () => console.log("Clicked"),
}) {
	const iconUrl = icon ? new URL(icon, document.baseURI).href : "";

	return `
		<button class="p-button" ${disabled ? "disabled" : ""} onclick="${onclick}">
			${icon ? `<span class="p-button-icon" style="--p-button-icon: url(&quot;${iconUrl}&quot;)" role="img" label="Ícone do botão"></span>` : ""}
			<span>${label}</span>
		</button>
	`;
}

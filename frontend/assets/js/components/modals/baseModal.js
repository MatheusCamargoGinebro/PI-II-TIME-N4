/*
    Autor: 
    baseModal.js -> Função auxiliar simples que cria, exibe e fecha um modal na tela (botão X, clique fora e tecla ESC).
*/

/**
 * Cria um modal temporário no final do <body> e devolve o elemento e a função de fechamento.
 * @param {string} boxHtml - Conteúdo HTML interno da caixa do modal
 * @param {Function} onCancel - Executado quando o usuário fecha pelo X, clicando fora ou apertando ESC
 */
export function openModal(boxHtml, onCancel) {
	const overlay = document.createElement("div");
	overlay.className = "feedback-modal-overlay";
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.innerHTML = `<div class="base-card feedback-modal-box">${boxHtml}</div>`;

	document.body.appendChild(overlay);

	// Renderiza os ícones Lucide dentro do modal recém-criado
	if (window.lucide && typeof window.lucide.createIcons === "function") {
		window.lucide.createIcons({ root: overlay });
	}

	let closed = false;

	const close = () => {
		if (closed) return;
		closed = true;
		document.removeEventListener("keydown", onKeyDown);
		overlay.remove();
	};

	const cancel = () => {
		close();
		if (onCancel) onCancel();
	};

	const onKeyDown = (event) => {
		if (event.key === "Escape") cancel();
	};

	// Fecha ao clicar no botão X, clicar no fundo escuro ou pressionar ESC
	const closeBtn = overlay.querySelector("[data-modal-close]");
	if (closeBtn) closeBtn.addEventListener("click", cancel);

	overlay.addEventListener("click", (event) => {
		if (event.target === overlay) cancel();
	});

	document.addEventListener("keydown", onKeyDown);

	return { overlay, close };
}

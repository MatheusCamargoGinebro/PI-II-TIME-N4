/*
    Autor: 
    alertModal.js -> Modal simples de aviso/feedback (sucesso, erro ou informação).
*/

import { openModal } from "./baseModal.js";
import { normalizeString } from "../../normalize.js";
import { escapeHtml } from "../../utils/formatters.js";

export function showAlertModal(message, title = "Atenção") {
	return new Promise((resolve) => {
		const normalizedTitle = normalizeString(title);
		const isSuccess = normalizedTitle.includes("sucesso");
		const isError =
			normalizedTitle.includes("erro") || normalizedTitle.includes("nao");

		const iconClass = isSuccess ? "is-success" : isError ? "is-danger" : "";
		const iconName = isSuccess
			? "circle-check"
			: isError
				? "circle-alert"
				: "info";

		const html = `
			<div class="between align-center">
				<div class="align-center gap-8">
					<div class="feedback-modal-icon ${iconClass}">
						<i data-lucide="${iconName}" class="icon-small"></i>
					</div>
					<h6 class="text-neutral font-inter text-medium text-weight-medium">${escapeHtml(title)}</h6>
				</div>
				<button type="button" data-modal-close class="card-icon card-icon-clickable" aria-label="Fechar modal">
					<i data-lucide="x" class="icon-small" style="color: var(--color-neutral-700)"></i>
				</button>
			</div>

			<p class="font-inter text-regular text-subtitle">${escapeHtml(message)}</p>

			<div class="feedback-modal-actions">
				<button type="button" data-modal-confirm class="btn btn-sm primary-btn">Entendi</button>
			</div>
		`;

		const { overlay, close } = openModal(html, resolve);
		const confirmBtn = overlay.querySelector("[data-modal-confirm]");

		confirmBtn.addEventListener("click", () => {
			close();
			resolve();
		});

		confirmBtn.focus();
	});
}

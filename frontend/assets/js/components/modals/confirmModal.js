/*
    Autor: 
    confirmModal.js -> Modal simples de confirmação (Sim / Não) que retorna true ou false.
*/

import { openModal } from "./baseModal.js";
import { escapeHtml } from "../../utils/formatters.js";

export function showConfirmModal(
	message,
	title = "Confirmar ação",
	{ confirmText = "Sim", cancelText = "Não" } = {},
) {
	return new Promise((resolve) => {
		const html = `
			<div class="between align-center">
				<div class="align-center gap-8">
					<div class="feedback-modal-icon is-danger">
						<i data-lucide="help-circle" class="icon-small"></i>
					</div>
					<h6 class="text-neutral font-inter text-medium text-weight-medium">${escapeHtml(title)}</h6>
				</div>
				<button type="button" data-modal-close class="card-icon card-icon-clickable" aria-label="Fechar modal">
					<i data-lucide="x" class="icon-small" style="color: var(--color-neutral-700)"></i>
				</button>
			</div>

			<p class="font-inter text-regular text-subtitle">${escapeHtml(message)}</p>

			<div class="feedback-modal-actions">
				<button type="button" data-modal-cancel class="btn btn-sm secondary-btn">${escapeHtml(cancelText)}</button>
				<button type="button" data-modal-confirm class="btn btn-sm primary-btn">${escapeHtml(confirmText)}</button>
			</div>
		`;

		const { overlay, close } = openModal(html, () => resolve(false));
		const cancelBtn = overlay.querySelector("[data-modal-cancel]");
		const confirmBtn = overlay.querySelector("[data-modal-confirm]");

		cancelBtn.addEventListener("click", () => {
			close();
			resolve(false);
		});

		confirmBtn.addEventListener("click", () => {
			close();
			resolve(true);
		});

		cancelBtn.focus();
	});
}

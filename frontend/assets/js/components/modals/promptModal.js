/*
    Autor: 
    promptModal.js -> Modal simples com campo de texto que retorna o valor digitado ou null se cancelado.
*/

import { openModal } from "./baseModal.js";
import { escapeHtml } from "../../utils/formatters.js";

export function showPromptModal({
	title = "Informar valor",
	message = "",
	placeholder = "",
	initialValue = "",
	confirmText = "Confirmar",
	cancelText = "Cancelar",
	validate = null,
} = {}) {
	return new Promise((resolve) => {
		const html = `
			<div class="between align-center">
				<div class="align-center gap-8">
					<div class="feedback-modal-icon">
						<i data-lucide="folder-plus" class="icon-small"></i>
					</div>
					<h6 class="text-neutral font-inter text-medium text-weight-medium">${escapeHtml(title)}</h6>
				</div>
				<button type="button" data-modal-close class="card-icon card-icon-clickable" aria-label="Fechar modal">
					<i data-lucide="x" class="icon-small" style="color: var(--color-neutral-700)"></i>
				</button>
			</div>

			<p class="font-inter text-regular text-subtitle">${escapeHtml(message)}</p>

			<form data-prompt-form style="display: flex; flex-direction: column; gap: 8px;">
				<input
					type="text"
					data-prompt-input
					class="feedback-modal-input"
					placeholder="${escapeHtml(placeholder)}"
					value="${escapeHtml(initialValue)}"
					autocomplete="off"
				/>
				<p data-prompt-error class="feedback-modal-error"></p>
				<div class="feedback-modal-actions">
					<button type="button" data-modal-cancel class="btn btn-sm secondary-btn">${escapeHtml(cancelText)}</button>
					<button type="submit" class="btn btn-sm primary-btn">${escapeHtml(confirmText)}</button>
				</div>
			</form>
		`;

		const { overlay, close } = openModal(html, () => resolve(null));
		const formEl = overlay.querySelector("[data-prompt-form]");
		const inputEl = overlay.querySelector("[data-prompt-input]");
		const errorEl = overlay.querySelector("[data-prompt-error]");
		const cancelBtn = overlay.querySelector("[data-modal-cancel]");

		cancelBtn.addEventListener("click", () => {
			close();
			resolve(null);
		});

		inputEl.addEventListener("input", () => {
			errorEl.textContent = "";
		});

		formEl.addEventListener("submit", (event) => {
			event.preventDefault();
			const value = inputEl.value.trim();

			if (!value) {
				errorEl.textContent = "Este campo é obrigatório.";
				inputEl.focus();
				return;
			}

			if (typeof validate === "function") {
				const errorMsg = validate(value);
				if (errorMsg) {
					errorEl.textContent = errorMsg;
					inputEl.focus();
					return;
				}
			}

			close();
			resolve(value);
		});

		inputEl.focus();
	});
}

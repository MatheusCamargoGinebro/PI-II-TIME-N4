/*
    Autor: 
    selectModal.js -> Modal com campo de busca e lista selecionável (usado para escolher responsáveis e membros).
*/

import { openModal } from "./baseModal.js";
import { normalizeString } from "../../normalize.js";
import { escapeHtml } from "../../utils/formatters.js";

export function showSelectModal({
	title = "Selecionar item",
	message = "Escolha uma opção da lista:",
	items = [],
	getItemId,
	getSearchText,
	renderItem,
	searchPlaceholder = "Buscar...",
	confirmText = "Selecionar",
	cancelText = "Cancelar",
} = {}) {
	return new Promise((resolve) => {
		const html = `
			<div class="between align-center">
				<div class="align-center gap-8">
					<div class="feedback-modal-icon">
						<i data-lucide="user-plus" class="icon-small"></i>
					</div>
					<h6 class="text-neutral font-inter text-medium text-weight-medium">${escapeHtml(title)}</h6>
				</div>
				<button type="button" data-modal-close class="card-icon card-icon-clickable" aria-label="Fechar modal">
					<i data-lucide="x" class="icon-small" style="color: var(--color-neutral-700)"></i>
				</button>
			</div>

			<p class="font-inter text-regular text-subtitle">${escapeHtml(message)}</p>

			<div class="feedback-modal-select-body">
				<label class="search-input">
					<i data-lucide="search" class="icon-small" style="color: var(--color-neutral-600)"></i>
					<input type="text" data-select-search placeholder="${escapeHtml(searchPlaceholder)}" autocomplete="off" />
				</label>
				<div data-select-list role="listbox" class="feedback-modal-select-list"></div>
			</div>

			<div class="feedback-modal-actions">
				<button type="button" data-modal-cancel class="btn btn-sm secondary-btn">${escapeHtml(cancelText)}</button>
				<button type="button" data-modal-confirm class="btn btn-sm primary-btn" disabled>${escapeHtml(confirmText)}</button>
			</div>
		`;

		const { overlay, close } = openModal(html, () => resolve(null));
		const searchEl = overlay.querySelector("[data-select-search]");
		const listEl = overlay.querySelector("[data-select-list]");
		const cancelBtn = overlay.querySelector("[data-modal-cancel]");
		const confirmBtn = overlay.querySelector("[data-modal-confirm]");

		let selectedId = null;

		const renderList = () => {
			const term = normalizeString(searchEl.value.trim());
			const filtered = items.filter((item) =>
				normalizeString(getSearchText(item)).includes(term),
			);

			if (filtered.length === 0) {
				listEl.innerHTML = `<p class="font-inter text-small text-subtitle" style="padding: 8px 4px;">Nenhum resultado encontrado.</p>`;
				selectedId = null;
				confirmBtn.disabled = true;
				return;
			}

			// Se o item selecionado saiu do filtro, limpa a seleção
			if (!filtered.some((item) => String(getItemId(item)) === selectedId)) {
				selectedId = null;
				confirmBtn.disabled = true;
			}

			listEl.innerHTML = filtered
				.map((item) => renderItem(item, String(getItemId(item)) === selectedId))
				.join("");
		};

		searchEl.addEventListener("input", renderList);

		listEl.addEventListener("click", (event) => {
			const option = event.target.closest("[data-option-id]");
			if (!option) return;
			selectedId = String(option.dataset.optionId);
			confirmBtn.disabled = false;
			renderList();
		});

		listEl.addEventListener("dblclick", (event) => {
			const option = event.target.closest("[data-option-id]");
			if (!option) return;
			close();
			resolve(String(option.dataset.optionId));
		});

		cancelBtn.addEventListener("click", () => {
			close();
			resolve(null);
		});

		confirmBtn.addEventListener("click", () => {
			if (selectedId === null) return;
			close();
			resolve(selectedId);
		});

		renderList();
		searchEl.focus();
	});
}

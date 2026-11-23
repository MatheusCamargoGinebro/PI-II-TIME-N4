let alertModalElements = null;
let confirmModalElements = null;
let selectModalElements = null;

function ensureAlertModalExists() {
    if (alertModalElements) return alertModalElements;

    const modalHTML = `
        <div id="global-feedback-modal" class="feedback-modal-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="global-feedback-modal-title">
            <div class="base-card feedback-modal-box">
                <div class="between align-center">
                    <div class="align-center gap-8">
                        <div class="card-icon feedback-modal-icon">
                            <i data-lucide="circle-alert" class="icon-small" style="color: #dc2626"></i>
                        </div>
                        <h6 id="global-feedback-modal-title" class="text-neutral font-inter text-medium text-weight-medium">Atenção</h6>
                    </div>
                    <button type="button" data-modal-close class="card-icon card-icon-clickable" aria-label="Fechar modal">
                        <i data-lucide="x" class="icon-small icon-clickable" style="color: var(--color-neutral-700)"></i>
                    </button>
                </div>

                <p id="global-feedback-modal-message" class="font-inter text-regular text-subtitle"></p>

                <div class="feedback-modal-actions">
                    <button type="button" data-modal-confirm class="btn btn-sm primary-btn">Entendi</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const overlay = document.getElementById("global-feedback-modal");
    const titleEl = document.getElementById("global-feedback-modal-title");
    const messageEl = document.getElementById("global-feedback-modal-message");
    const closeBtn = overlay.querySelector("[data-modal-close]");
    const confirmBtn = overlay.querySelector("[data-modal-confirm]");

    const close = () => {
        overlay.hidden = true;
    };

    closeBtn.addEventListener("click", close);
    confirmBtn.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) close();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !overlay.hidden) {
            close();
        }
    });

    if (window.lucide) {
        window.lucide.createIcons({ root: overlay });
    }

    alertModalElements = { overlay, titleEl, messageEl, confirmBtn, close };
    return alertModalElements;
}

function ensureConfirmModalExists() {
    if (confirmModalElements) return confirmModalElements;

    const modalHTML = `
        <div id="global-confirm-modal" class="feedback-modal-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="global-confirm-modal-title">
            <div class="base-card feedback-modal-box">
                <div class="between align-center">
                    <div class="align-center gap-8">
                        <div class="card-icon feedback-modal-icon">
                            <i data-lucide="help-circle" class="icon-small" style="color: #dc2626"></i>
                        </div>
                        <h6 id="global-confirm-modal-title" class="text-neutral font-inter text-medium text-weight-medium">Confirmar ação</h6>
                    </div>
                    <button type="button" data-modal-close class="card-icon card-icon-clickable" aria-label="Fechar modal">
                        <i data-lucide="x" class="icon-small icon-clickable" style="color: var(--color-neutral-700)"></i>
                    </button>
                </div>

                <p id="global-confirm-modal-message" class="font-inter text-regular text-subtitle"></p>

                <div class="feedback-modal-actions">
                    <button type="button" data-modal-cancel class="btn btn-sm">Não</button>
                    <button type="button" data-modal-confirm class="btn btn-sm primary-btn">Sim</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const overlay = document.getElementById("global-confirm-modal");
    const titleEl = document.getElementById("global-confirm-modal-title");
    const messageEl = document.getElementById("global-confirm-modal-message");
    const closeBtn = overlay.querySelector("[data-modal-close]");
    const cancelBtn = overlay.querySelector("[data-modal-cancel]");
    const confirmBtn = overlay.querySelector("[data-modal-confirm]");

    let activeResolver = null;

    const resolveAndClose = (result) => {
        if (overlay.hidden) return;
        overlay.hidden = true;
        if (activeResolver) {
            const resolver = activeResolver;
            activeResolver = null;
            resolver(result);
        }
    };

    closeBtn.addEventListener("click", () => resolveAndClose(false));
    cancelBtn.addEventListener("click", () => resolveAndClose(false));
    confirmBtn.addEventListener("click", () => resolveAndClose(true));

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) resolveAndClose(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !overlay.hidden) {
            resolveAndClose(false);
        }
    });

    if (window.lucide) {
        window.lucide.createIcons({ root: overlay });
    }

    confirmModalElements = {
        overlay,
        titleEl,
        messageEl,
        cancelBtn,
        confirmBtn,
        setResolver: (fn) => {
            if (activeResolver) {
                const prev = activeResolver;
                activeResolver = null;
                prev(false);
            }
            activeResolver = fn;
        },
    };

    return confirmModalElements;
}

function ensureSelectModalExists() {
    if (selectModalElements) return selectModalElements;

    const modalHTML = `
        <div id="global-select-modal" class="feedback-modal-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="global-select-modal-title">
            <div class="base-card feedback-modal-box">
                <div class="between align-center">
                    <div class="align-center gap-8">
                        <div class="card-icon feedback-modal-icon">
                            <i data-lucide="user-plus" class="icon-small" style="color: var(--color-primary-500)"></i>
                        </div>
                        <h6 id="global-select-modal-title" class="text-neutral font-inter text-medium text-weight-medium">Selecionar item</h6>
                    </div>
                    <button type="button" data-modal-close class="card-icon card-icon-clickable" aria-label="Fechar modal">
                        <i data-lucide="x" class="icon-small icon-clickable" style="color: var(--color-neutral-700)"></i>
                    </button>
                </div>

                <p id="global-select-modal-message" class="font-inter text-regular text-subtitle"></p>

                <div data-select-body style="display: flex; flex-direction: column; gap: 8px;">
                    <label class="search-input" style="width: 100%;">
                        <i data-lucide="search" class="icon-small" style="color: var(--color-neutral-600)"></i>
                        <input
                            type="text"
                            data-select-search
                            placeholder="Buscar..."
                            autocomplete="off"
                        />
                    </label>
                    <div
                        data-select-list
                        role="listbox"
                        style="max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;"
                    ></div>
                </div>

                <div class="feedback-modal-actions">
                    <button type="button" data-modal-cancel class="btn btn-sm">Cancelar</button>
                    <button type="button" data-modal-confirm class="btn btn-sm primary-btn" disabled>Selecionar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const overlay = document.getElementById("global-select-modal");
    const titleEl = document.getElementById("global-select-modal-title");
    const messageEl = document.getElementById("global-select-modal-message");
    const searchEl = overlay.querySelector("[data-select-search]");
    const listEl = overlay.querySelector("[data-select-list]");
    const closeBtn = overlay.querySelector("[data-modal-close]");
    const cancelBtn = overlay.querySelector("[data-modal-cancel]");
    const confirmBtn = overlay.querySelector("[data-modal-confirm]");

    let activeResolver = null;
    let currentConfig = null;
    let selectedId = null;

    const drawList = () => {
        if (!currentConfig) return;
        const { items, getItemId, getSearchText, renderItem } = currentConfig;
        const term = (searchEl.value || "").trim().toLowerCase();

        const filtered = items.filter((item) =>
            getSearchText(item).toLowerCase().includes(term)
        );

        if (filtered.length === 0) {
            listEl.innerHTML = `<p class="font-inter text-small text-subtitle" style="padding: 8px 4px;">Nenhum resultado encontrado.</p>`;
            selectedId = null;
            confirmBtn.disabled = true;
            return;
        }

        listEl.innerHTML = filtered.map((item) => {
            const id = String(getItemId(item));
            const isSelected = selectedId === id;
            return renderItem(item, isSelected);
        }).join("");
    };

    const closeWithValue = (value) => {
        if (overlay.hidden) return;
        overlay.hidden = true;
        selectedId = null;
        currentConfig = null;
        confirmBtn.disabled = true;

        if (activeResolver) {
            const resolver = activeResolver;
            activeResolver = null;
            resolver(value);
        }
    };

    searchEl.addEventListener("input", drawList);

    listEl.addEventListener("click", (event) => {
        const option = event.target.closest("[data-option-id]");
        if (!option) return;
        selectedId = String(option.dataset.optionId);
        confirmBtn.disabled = false;
        drawList();
    });

    listEl.addEventListener("dblclick", (event) => {
        const option = event.target.closest("[data-option-id]");
        if (!option) return;
        const id = String(option.dataset.optionId);
        closeWithValue(id);
    });

    closeBtn.addEventListener("click", () => closeWithValue(null));
    cancelBtn.addEventListener("click", () => closeWithValue(null));
    confirmBtn.addEventListener("click", () => {
        if (selectedId !== null) {
            closeWithValue(selectedId);
        }
    });

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeWithValue(null);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !overlay.hidden) {
            closeWithValue(null);
        }
    });

    if (window.lucide) {
        window.lucide.createIcons({ root: overlay });
    }

    selectModalElements = {
        overlay,
        titleEl,
        messageEl,
        searchEl,
        cancelBtn,
        confirmBtn,
        open: (config) => {
            if (activeResolver) {
                const prev = activeResolver;
                activeResolver = null;
                prev(null);
            }

            currentConfig = config;
            selectedId = null;
            confirmBtn.disabled = true;
            confirmBtn.textContent = config.confirmText || "Selecionar";
            cancelBtn.textContent = config.cancelText || "Cancelar";
            searchEl.placeholder = config.searchPlaceholder || "Buscar...";
            searchEl.value = "";
            titleEl.textContent = config.title || "Selecionar item";
            messageEl.textContent = config.message || "Escolha uma opção da lista:";

            drawList();

            return new Promise((resolve) => {
                activeResolver = resolve;
                overlay.hidden = false;
                searchEl.focus();
            });
        },
    };

    return selectModalElements;
}

/**
 * Exibe um modal de aviso substituindo o window.alert()
 * @param {string} message - Mensagem principal exibida no modal
 * @param {string} [title="Atenção"] - Título opcional do modal
 */
export function showAlertModal(message, title = "Atenção") {
    const { overlay, titleEl, messageEl, confirmBtn } = ensureAlertModalExists();

    titleEl.textContent = title;
    messageEl.textContent = message;
    overlay.hidden = false;
    confirmBtn.focus();
}

/**
 * Exibe um modal de decisão (Sim / Não) substituindo o window.confirm()
 * @param {string} message - Mensagem principal exibida no modal
 * @param {string} [title="Confirmar ação"] - Título opcional do modal
 * @param {Object} [options] - Rótulos opcionais dos botões
 * @param {string} [options.confirmText="Sim"] - Texto do botão afirmativo
 * @param {string} [options.cancelText="Não"] - Texto do botão negativo
 * @returns {Promise<boolean>} Resolve para true se confirmado ("Sim") e false caso contrário
 */
export function showConfirmModal(
    message,
    title = "Confirmar ação",
    { confirmText = "Sim", cancelText = "Não" } = {}
) {
    const { overlay, titleEl, messageEl, cancelBtn, confirmBtn, setResolver } = ensureConfirmModalExists();

    titleEl.textContent = title;
    messageEl.textContent = message;
    cancelBtn.textContent = cancelText;
    confirmBtn.textContent = confirmText;

    return new Promise((resolve) => {
        setResolver(resolve);
        overlay.hidden = false;
        cancelBtn.focus();
    });
}

/**
 * Exibe um modal com busca e lista selecionável
 * @param {Object} config
 * @returns {Promise<string|null>}
 */
export function showSelectModal(config) {
    const modal = ensureSelectModalExists();
    return modal.open(config);
}
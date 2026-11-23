let alertModalElements = null;
let confirmModalElements = null;

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

                <div data-modal-extra></div>

                <div class="feedback-modal-actions">
                    <button type="button" data-modal-cancel class="btn btn-sm" hidden>Cancelar</button>
                    <button type="button" data-modal-confirm class="btn btn-sm primary-btn">Entendi</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const overlay = document.getElementById("global-feedback-modal");
    const titleEl = document.getElementById("global-feedback-modal-title");
    const messageEl = document.getElementById("global-feedback-modal-message");
    const extraEl = overlay.querySelector("[data-modal-extra]");
    const closeBtn = overlay.querySelector("[data-modal-close]");
    const cancelBtn = overlay.querySelector("[data-modal-cancel]");
    const confirmBtn = overlay.querySelector("[data-modal-confirm]");

    let onCloseCallback = null;

    const close = () => {
        if (overlay.hidden) return;
        overlay.hidden = true;
        extraEl.innerHTML = "";
        cancelBtn.hidden = true;
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Entendi";

        const cb = onCloseCallback;
        onCloseCallback = null;
        if (cb) cb(null);
    };

    closeBtn.addEventListener("click", close);
    cancelBtn.addEventListener("click", close);
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

    alertModalElements = {
        overlay,
        titleEl,
        messageEl,
        extraEl,
        cancelBtn,
        confirmBtn,
        close,
        setOnClose: (fn) => {
            onCloseCallback = fn;
        },
    };
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

/**
 * Exibe um modal de aviso substituindo o window.alert()
 * @param {string} message - Mensagem principal exibida no modal
 * @param {string} [title="Atenção"] - Título opcional do modal
 */
export function showAlertModal(message, title = "Atenção") {
    const { overlay, titleEl, messageEl, extraEl, cancelBtn, confirmBtn, setOnClose } = ensureAlertModalExists();

    setOnClose(null);
    extraEl.innerHTML = "";
    cancelBtn.hidden = true;
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Entendi";

    titleEl.textContent = title;
    messageEl.textContent = message;
    overlay.hidden = false;
    confirmBtn.focus();

    const handleConfirm = () => {
        confirmBtn.removeEventListener("click", handleConfirm);
        overlay.hidden = true;
    };
    confirmBtn.addEventListener("click", handleConfirm);
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
 * Exibe o modal reutilizando #global-feedback-modal com uma lista selecionável e busca
 * @param {Object} config
 * @param {string} [config.title="Selecionar item"]
 * @param {string} [config.message="Escolha uma opção da lista:"]
 * @param {Array} [config.items=[]]
 * @param {Function} config.getItemId
 * @param {Function} config.getSearchText
 * @param {Function} config.renderItem
 * @param {string} [config.searchPlaceholder="Buscar..."]
 * @param {string} [config.confirmText="Adicionar"]
 * @param {string} [config.cancelText="Cancelar"]
 * @returns {Promise<string|null>}
 */
export function showSelectModal({
    title = "Selecionar item",
    message = "Escolha uma opção da lista:",
    items = [],
    getItemId,
    getSearchText,
    renderItem,
    searchPlaceholder = "Buscar...",
    confirmText = "Adicionar",
    cancelText = "Cancelar",
}) {
    const {
        overlay,
        titleEl,
        messageEl,
        extraEl,
        cancelBtn,
        confirmBtn,
        setOnClose,
    } = ensureAlertModalExists();

    titleEl.textContent = title;
    messageEl.textContent = message;

    cancelBtn.textContent = cancelText;
    cancelBtn.hidden = false;

    confirmBtn.textContent = confirmText;
    confirmBtn.disabled = true;

    extraEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
            <label class="search-input" style="width: 100%;">
                <i data-lucide="search" class="icon-small" style="color: var(--color-neutral-600)"></i>
                <input
                    type="text"
                    data-select-search
                    placeholder="${searchPlaceholder}"
                    autocomplete="off"
                />
            </label>
            <div
                data-select-list
                role="listbox"
                style="max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;"
            ></div>
        </div>
    `;

    if (window.lucide) {
        window.lucide.createIcons({ root: extraEl });
    }

    const searchEl = extraEl.querySelector("[data-select-search]");
    const listEl = extraEl.querySelector("[data-select-list]");

    let selectedId = null;
    let settled = false;

    return new Promise((resolve) => {
        const finish = (value) => {
            if (settled) return;
            settled = true;
            setOnClose(null);
            overlay.hidden = true;
            extraEl.innerHTML = "";
            cancelBtn.hidden = true;
            confirmBtn.disabled = false;
            confirmBtn.textContent = "Entendi";
            confirmBtn.removeEventListener("click", handleConfirm);
            resolve(value);
        };

        const drawList = () => {
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

        const handleConfirm = () => {
            if (selectedId !== null) {
                finish(selectedId);
            }
        };

        setOnClose(() => finish(null));

        searchEl.addEventListener("input", drawList);

        listEl.addEventListener("click", (event) => {
            const option = event.target.closest("[data-option-id]");
            if (!option) return;
            selectedId = option.dataset.optionId;
            confirmBtn.disabled = false;
            drawList();
        });

        listEl.addEventListener("dblclick", (event) => {
            const option = event.target.closest("[data-option-id]");
            if (!option) return;
            selectedId = option.dataset.optionId;
            finish(selectedId);
        });

        confirmBtn.addEventListener("click", handleConfirm);

        drawList();
        overlay.hidden = false;
        searchEl.focus();
    });
}
// Validação do formulário de cadastro/edição de demandas do TaskOps

const formulario = document.getElementById("demanda-form");
const botaoCancelar = document.getElementById("botao-cancelar");
const mensagemFormulario = document.getElementById("mensagem-formulario");

const campos = [
    document.getElementById("nome"),
    document.getElementById("descricao"),
    document.getElementById("prioridade"),
    document.getElementById("status"),
    document.getElementById("responsavel")
];

// Mostra ou limpa a mensagem de erro de um campo
function mostrarErro(campo, mensagem) {
    const elementoErro = document.getElementById(`erro-${campo.id}`);

    campo.classList.toggle("campo-invalido", mensagem !== "");
    campo.setAttribute("aria-invalid", mensagem !== "" ? "true" : "false");

    if (elementoErro) {
        elementoErro.textContent = mensagem;
    }
}

// Verifica se um campo está preenchido corretamente
function validarCampo(campo) {
    const valor = campo.value.trim();
    let mensagem = "";

    if (valor === "") {
        mensagem = "Este campo é obrigatório.";
    } else if (campo.id === "nome" && valor.length < 3) {
        mensagem = "O nome deve ter pelo menos 3 caracteres.";
    } else if (campo.id === "nome" && valor.length > 100) {
        mensagem = "O nome deve ter no máximo 100 caracteres.";
    } else if (campo.id === "descricao" && valor.length < 10) {
        mensagem = "A descrição deve ter pelo menos 10 caracteres.";
    } else if (campo.id === "descricao" && valor.length > 500) {
        mensagem = "A descrição deve ter no máximo 500 caracteres.";
    }

    mostrarErro(campo, mensagem);
    return mensagem === "";
}

// Limpa a mensagem geral do formulário
function limparMensagemGeral() {
    mensagemFormulario.textContent = "";
    mensagemFormulario.className = "mensagem-geral";
}

// Validação em tempo real
campos.forEach(campo => {
    campo.addEventListener("input", () => {
        validarCampo(campo);
        limparMensagemGeral();
    });

    campo.addEventListener("change", () => {
        validarCampo(campo);
        limparMensagemGeral();
    });
});

// Envio do formulário
formulario.addEventListener("submit", evento => {
    evento.preventDefault();

    let formularioValido = true;

    campos.forEach(campo => {
        const campoValido = validarCampo(campo);
        if (!campoValido) {
            formularioValido = false;
        }
    });

    if (!formularioValido) {
        mensagemFormulario.textContent = "Corrija os campos destacados antes de salvar.";
        mensagemFormulario.className = "mensagem-geral mensagem-erro";
        return;
    }

    mensagemFormulario.textContent = "Demanda salva com sucesso!";
    mensagemFormulario.className = "mensagem-geral mensagem-sucesso";
});

// Botão Cancelar
botaoCancelar.addEventListener("click", () => {
    formulario.reset();
    campos.forEach(campo => mostrarErro(campo, ""));
    limparMensagemGeral();
});

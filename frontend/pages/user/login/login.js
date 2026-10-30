const formulario = document.querySelector(".form");
const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#senha");
const erroEmail = document.querySelector("#erroEmail");
const erroSenha = document.querySelector("#erroSenha");
const mensagemFormulario = document.querySelector("#mensagemFormulario");

function mostrarErro(campo, elementoErro, mensagem) {
    campo.classList.toggle("is-invalid", mensagem !== "");
    elementoErro.textContent = mensagem;
}

function validarEmail() {
    campoEmail.value = campoEmail.value.trim();

    let mensagem = "";
    if (campoEmail.value === "") {
        mensagem = "Digite seu endereço de e-mail.";
    } else if (!campoEmail.validity.valid) {
        mensagem = "Digite um endereço de e-mail válido.";
    }

    mostrarErro(campoEmail, erroEmail, mensagem);
    return mensagem === "";
}

function validarSenha() {
    const senha = campoSenha.value;
    let mensagem = "";

    if (senha === "") {
        mensagem = "Digite sua senha.";
    } else if (senha.length < 8) {
        mensagem = "A senha deve ter pelo menos 8 caracteres.";
    } else if (!/[A-Z]/.test(senha)) {
        mensagem = "A senha deve conter uma letra maiúscula.";
    } else if (!/[a-z]/.test(senha)) {
        mensagem = "A senha deve conter uma letra minúscula.";
    } else if (!/[^A-Za-z0-9\s]/.test(senha)) {
        mensagem = "A senha deve conter um caractere especial.";
    }

    mostrarErro(campoSenha, erroSenha, mensagem);
    return mensagem === "";
}

function limparMensagemGeral() {
    mensagemFormulario.textContent = "";
}

campoEmail.addEventListener("input", () => {
    validarEmail();
    limparMensagemGeral();
});

campoSenha.addEventListener("input", () => {
    validarSenha();
    limparMensagemGeral();
});

formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const emailValido = validarEmail();
    const senhaValida = validarSenha();

    if (!emailValido || !senhaValida) {
        mensagemFormulario.textContent = "Corrija os campos destacados.";
        (emailValido ? campoSenha : campoEmail).focus();
        return;
    }

    mensagemFormulario.textContent =
        "Dados válidos. O envio ainda não está conectado.";
});

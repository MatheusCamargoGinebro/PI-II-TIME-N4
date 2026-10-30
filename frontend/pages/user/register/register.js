
const formulario = document.querySelector(".form");
const campoNome = document.querySelector("#nome");
const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#senha");
const erroNome = document.querySelector("#erroNome");
const erroEmail = document.querySelector("#erroEmail");
const erroSenha = document.querySelector("#erroSenha");
const mensagemFormulario = document.querySelector("#mensagemFormulario");

function mostrarErro(campo, elementoErro, mensagem) {
    campo.classList.toggle("is-invalid", mensagem !== "");

    elementoErro.innerHTML = mensagem;
}

function validarNome() {
    const nome = campoNome.value.trim();
    let mensagem = "";

    if (nome === "") {
        mensagem = "Digite seu nome.";
    } else if (nome.length < 3) {
        mensagem = "O nome deve ter pelo menos 3 caracteres.";
    }

    mostrarErro(campoNome, erroNome, mensagem);
    return mensagem === "";
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
    const mensagens = [];

    if (senha === "") {
        mensagens.push("Crie uma senha.");
    } else {
        if (senha.length < 8) {
            mensagens.push("A senha deve ter pelo menos 8 caracteres.");
        }
        if (!/[A-Z]/.test(senha)) {
            mensagens.push("A senha deve conter uma letra maiúscula.");
        }
        if (!/[a-z]/.test(senha)) {
            mensagens.push("A senha deve conter uma letra minúscula.");
        }
        if (!/[^A-Za-z0-9\s]/.test(senha)) {
            mensagens.push("A senha deve conter um caractere especial.");
        }
    }

    mostrarErro(campoSenha, erroSenha, mensagens.join("\n"));
    return mensagens.length === 0;
}

function limparMensagemGeral() {
    mensagemFormulario.textContent = "";
}

campoNome.addEventListener("input", () => {
    validarNome();
    limparMensagemGeral();
});

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

    const nomeValido = validarNome();
    const emailValido = validarEmail();
    const senhaValida = validarSenha();

    if (!nomeValido || !emailValido || !senhaValida) {
        mensagemFormulario.textContent = "Corrija os campos destacados.";
   
        return;
    }

    mensagemFormulario.textContent =
        "Dados válidos. O envio ainda não está conectado.";
});

import { register } from "../../../assets/js/repositories/authRepository.js";

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
        if (!/[0-9]/.test(senha)) {
            mensagens.push("A senha deve conter pelo menos um número.");
        }
        if (!/[^A-Za-z0-9\s]/.test(senha)) {
            mensagens.push("A senha deve conter um caractere especial.");
        }
    }

    mostrarErro(campoSenha, erroSenha, mensagens.join("<br>"));
    return mensagens.length === 0;
}

function limparMensagemGeral() {
    mensagemFormulario.textContent = "";
    mensagemFormulario.classList.remove("text-success", "text-danger");
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

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nomeValido = validarNome();
    const emailValido = validarEmail();
    const senhaValida = validarSenha();

    if (!nomeValido || !emailValido || !senhaValida) {
        mensagemFormulario.textContent = "Corrija os campos destacados.";
        mensagemFormulario.style.color = "red";
        return;
    }

    try {
        mensagemFormulario.textContent = "Cadastrando...";
        mensagemFormulario.style.color = "inherit";

        const res = await register(campoNome.value.trim(), campoEmail.value.trim(), campoSenha.value);

        if (res.success) {
            mensagemFormulario.textContent = res.message || "Conta criada com sucesso! Redirecionando para login...";
            mensagemFormulario.style.color = "green";
            formulario.reset();
            setTimeout(() => {
                window.location.href = "../login/login.html";
            }, 1500);
        } else {
            mensagemFormulario.textContent = res.message;
            mensagemFormulario.style.color = "red";

            if (res.errorAt === "user_email") {
                mostrarErro(campoEmail, erroEmail, res.message);
                campoEmail.focus();
            } else if (res.errorAt === "user_name") {
                mostrarErro(campoNome, erroNome, res.message);
                campoNome.focus();
            } else if (res.errorAt === "user_password") {
                mostrarErro(campoSenha, erroSenha, res.message);
                campoSenha.focus();
            }
        }
    } catch (err) {
        console.error("Erro ao registrar usuário:", err);
        mensagemFormulario.textContent = "Erro ao realizar cadastro. Tente novamente.";
        mensagemFormulario.style.color = "red";
    }
});

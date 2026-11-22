import { login } from "../../../assets/js/repositories/authRepository.js";

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

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const emailValido = validarEmail();
    const senhaValida = validarSenha();

    if (!emailValido || !senhaValida) {
        mensagemFormulario.textContent = "Corrija os campos destacados.";
        (emailValido ? campoSenha : campoEmail).focus();
        return;
    }

    try {
        const res = await login(campoEmail.value, campoSenha.value);

        if (res.success) {
            mensagemFormulario.textContent = res.message || "Login realizado com sucesso!";
            mensagemFormulario.style.color = "green";
            localStorage.setItem("token", res.token);
            if (res.user) {
                localStorage.setItem("user", JSON.stringify(res.user));
            }
            window.location.href = "../../dashboard/dashboard.html";
        } else {
            mensagemFormulario.textContent = res.message;
            mensagemFormulario.style.color = "red";
        }
    } catch (err) {
        console.error("Erro ao fazer login:", err);
        mensagemFormulario.textContent = "Erro ao fazer login. Tente novamente.";
        mensagemFormulario.style.color = "red";
    }
});
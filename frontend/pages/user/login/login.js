const campoEmail = document.querySelector("#email")
const campoSenha = document.querySelector("#senha")

const erroSenha = document.querySelector("#erroSenha")
const erroEmail = document.querySelector("#erroEmail")


const campoComErro = {
    campoEmail,
    campoSenha,
}

const mensagensDeErro = {
    erroSenha,
    erroEmail,
}

function mostrarErro (campo, elementoErro, mensagem){
    campo.classList.add("is-invalid");
    elementoErro.innerText = mensagem;
}



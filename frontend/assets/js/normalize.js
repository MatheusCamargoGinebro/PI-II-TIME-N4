/*
    Autor: 
    normalize.js -> Normaliza strings removendo acentos e convertendo para minúsculas para buscas e comparações.
*/

function normalizeString(value = "") {
	return String(value)
		.toLowerCase()
		.replace(/[áàâã]/g, "a")
		.replace(/[éê]/g, "e")
		.replace(/[í]/g, "i")
		.replace(/[óôõ]/g, "o")
		.replace(/[úü]/g, "u")
		.replace(/ç/g, "c");
}

if (typeof window !== "undefined") {
	window.normalizeString = normalizeString;
}

export { normalizeString };

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

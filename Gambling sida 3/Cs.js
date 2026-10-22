const apiBas = "https://api.openskin.dev/v1";
const antalPerSida = 500;
const rariteter = [
	{
		namn: "Blå",
		klass: "raritet-blatt",
		typ: "weapon",
		apiRaritet: "mil-spec grade",
		chans: 80,
		minMultipel: 0.2,
		maxMultipel: 0.6,
		reservSkins: [
			"AK-47 | Black Laminate (Battle-Scarred)",
			"Galil AR | Signal (Field-Tested)",
			"MP9 | Dart (Minimal Wear)"
		]
	},
	{
		namn: "Lila",
		klass: "raritet-lila",
		typ: "weapon",
		apiRaritet: "restricted",
		chans: 16,
		minMultipel: 0.7,
		maxMultipel: 2.4,
		reservSkins: [
			"AK-47 | Blue Laminate (Factory New)",
			"USP-S | Cyrex (Field-Tested)",
			"AWP | Atheris (Minimal Wear)"
		]
	},
	{
		namn: "Rosa",
		klass: "raritet-rosa",
		typ: "weapon",
		apiRaritet: "classified",
		chans: 3.2,
		minMultipel: 1.9,
		maxMultipel: 12.8,
		reservSkins: [
			"AK-47 | Cartel (Battle-Scarred)",
			"M4A1-S | Decimator (Field-Tested)",
			"Desert Eagle | Kumicho Dragon (Minimal Wear)"
		]
	},
	{
		namn: "Röd",
		klass: "raritet-rod",
		typ: "weapon",
		apiRaritet: "covert",
		chans: 0.64,
		minMultipel: 9.7,
		maxMultipel: 23.4,
		reservSkins: [
			"AK-47 | Aphrodite (Factory New)",
			"AWP | Asiimov (Field-Tested)",
			"M4A4 | Temukau (Field-Tested)"
		]
	},
	{
		namn: "Guld",
		klass: "raritet-guld",
		typ: "gloves",
		apiRaritet: "extraordinary",
		chans: 0.16,
		minMultipel: 34.7,
		maxMultipel: 167.7,
		reservSkins: [
			"★ Bloodhound Gloves | Bronzed (Battle-Scarred)",
			"★ Driver Gloves | Racing Green (Field-Tested)",
			"★ Sport Gloves | Bronze Morph (Field-Tested)"
		]
	}
];

const itemPooler = new Map();
const ladaPris = document.getElementById("ladaPris");
const oppnaLada = document.getElementById("oppnaLada");
const status = document.getElementById("status");
const resultat = document.getElementById("resultat");
const skinBild = document.getElementById("skinBild");
const skinRaritet = document.getElementById("skinRaritet");
const skinNamn = document.getElementById("skinNamn");
const skinPris = document.getElementById("skinPris");
const utbetalning = document.getElementById("utbetalning");
let resultatEffektTimeout;

function formatBelopp(belopp, valuta) {
	return new Intl.NumberFormat("sv-SE", {
		maximumFractionDigits: 2
	}).format(belopp) + " " + valuta;
}

function visaResultatEffekt(vinst) {
	document.body.classList.remove("vinst-effekt", "forlust-effekt");
	void document.body.offsetWidth;
	document.body.classList.add(vinst ? "vinst-effekt" : "forlust-effekt");
	clearTimeout(resultatEffektTimeout);
	resultatEffektTimeout = setTimeout(function () {
		document.body.classList.remove("vinst-effekt", "forlust-effekt");
	}, 900);
}

async function hamtaJson(url) {
	const svar = await hamtaSvar(url);
	if (!svar.ok) {
		throw new Error("OpenSkin svarade med status " + svar.status + ".");
	}

	return svar.json();
}

async function hamtaSvar(url) {
	for (let forsok = 0; forsok < 3; forsok += 1) {
		try {
			const svar = await fetch(url);
			if (svar.status < 500 || forsok === 2) {
				return svar;
			}
		} catch (fel) {
			if (forsok === 2) {
				throw new Error(
					"OpenSkin kunde inte nås efter tre försök. Kontrollera internetanslutningen och att sidan körs via en lokal webbserver, till exempel VS Code Live Server. (" +
					fel.message + ")"
				);
			}
		}

		await new Promise(function (los) {
			setTimeout(los, 500 * (forsok + 1));
		});
	}
}

async function hamtaItemPool(raritet) {
	const parametrar = new URLSearchParams({
		type: raritet.typ,
		rarity: raritet.apiRaritet,
		limit: String(antalPerSida),
		page: "1"
	});
	const forstaSidan = await hamtaJson(apiBas + "/items?" + parametrar);
	const sidor = Math.ceil(forstaSidan.total / antalPerSida);

	if (!Array.isArray(forstaSidan.data) || forstaSidan.data.length === 0) {
		throw new Error("OpenSkin hittade inga skins med rariteten " + raritet.namn + ".");
	}

	if (sidor <= 1) {
		return forstaSidan.data;
	}

	const slumpadSida = Math.floor(Math.random() * sidor) + 1;
	if (slumpadSida === 1) {
		return forstaSidan.data;
	}

	parametrar.set("page", String(slumpadSida));
	const valdSida = await hamtaJson(apiBas + "/items?" + parametrar);
	if (!Array.isArray(valdSida.data) || valdSida.data.length === 0) {
		throw new Error("OpenSkin returnerade ingen skinlista för den valda sidan.");
	}

	return valdSida.data;
}

async function hamtaSlumpatSkin(raritet) {
	let poolPromise = itemPooler.get(raritet.namn);
	if (!poolPromise) {
		poolPromise = hamtaItemPool(raritet);
		itemPooler.set(raritet.namn, poolPromise);
	}

	try {
		const items = await poolPromise;
		return {
			item: items[Math.floor(Math.random() * items.length)],
			anvandeReservlista: false
		};
	} catch (fel) {
		itemPooler.delete(raritet.namn);
		return {
			item: {
				name: raritet.reservSkins[
					Math.floor(Math.random() * raritet.reservSkins.length)
				]
			},
			anvandeReservlista: true
		};
	}
}

function slumpaRaritet() {
	const dragning = Math.random() * 100;
	let grans = 0;

	for (const raritet of rariteter) {
		grans += raritet.chans;
		if (dragning < grans) {
			return raritet;
		}
	}

	return rariteter[rariteter.length - 1];
}

async function hamtaMarknadspris(itemNamn) {
	const parametrar = new URLSearchParams({ item: itemNamn });
	const svar = await hamtaSvar(apiBas + "/prices?" + parametrar);
	if (svar.status === 404) {
		return null;
	}
	if (!svar.ok) {
		throw new Error("OpenSkin kunde inte hämta skinets pris (status " + svar.status + ").");
	}

	const data = await svar.json();
	return data.lowest_ask || null;
}

function visaResultat(raritet, item, marknadspris, pris, multipel, utbetalt) {
	skinBild.hidden = !item.icon_url;
	if (item.icon_url) {
		skinBild.src = item.icon_url;
		skinBild.alt = item.name;
	} else {
		skinBild.removeAttribute("src");
		skinBild.alt = "";
	}

	skinRaritet.textContent = raritet.namn + " skin";
	skinRaritet.className = "raritet-etikett " + raritet.klass;
	skinNamn.textContent = item.name;
	skinPris.textContent = marknadspris
		? "Lägsta marknadspris: " + formatBelopp(marknadspris.price, "USD") + " på " + marknadspris.marketplace + "."
		: "Marknadspris saknas just nu.";
	utbetalning.textContent = "Låda: " + formatBelopp(pris, "kr")
		+ " · Multipel: " + formatBelopp(multipel, "×")
		+ " · Utbetalning: " + formatBelopp(utbetalt, "kr");
	resultat.hidden = false;
}

async function oppnaValdLada() {
	const pris = Number(ladaPris.value);
	if (!Number.isFinite(pris) || pris <= 0) {
		status.textContent = "Välj en giltig låda.";
		return;
	}
	if (saldo < pris) {
		status.textContent = "Du har inte tillräckligt med pengar för den här lådan.";
		return;
	}

	oppnaLada.disabled = true;
	resultat.hidden = true;
	status.textContent = "Hämtar ett slumpat skin och dess marknadspris från OpenSkin…";

	try {
		const raritet = slumpaRaritet();
		const hamtatSkin = await hamtaSlumpatSkin(raritet);
		const item = hamtatSkin.item;
		let marknadspris = null;
		let prisApiOtillgangligt = false;
		try {
			marknadspris = await hamtaMarknadspris(item.name);
		} catch (fel) {
			prisApiOtillgangligt = true;
		}
		const multipel = Math.round(
			(raritet.minMultipel + Math.random() * (raritet.maxMultipel - raritet.minMultipel)) * 100
		) / 100;
		const utbetalt = Math.round((pris * multipel + Number.EPSILON) * 100) / 100;

		if (saldo < pris) {
			status.textContent = "Saldot räcker inte längre till den valda lådan.";
			return;
		}

		spela(pris);
		saldo += utbetalt;
		localStorage.setItem("saldo", saldo);
		visaSaldo();
		visaResultat(raritet, item, marknadspris, pris, multipel, utbetalt);

		const netto = Math.round((utbetalt - pris + Number.EPSILON) * 100) / 100;
		if (netto < 0) {
			visaResultatEffekt(false);
		} else if (netto > 0) {
			visaResultatEffekt(true);
		}

		status.textContent = "Du fick ett " + raritet.namn.toLowerCase() + " skin. "
			+ (netto >= 0
				? "Du gick plus " + formatBelopp(netto, "kr") + "."
				: "Du gick minus " + formatBelopp(Math.abs(netto), "kr") + ".")
			+ (hamtatSkin.anvandeReservlista
				? " Ett skin från reservlistan användes."
				: "")
			+ (prisApiOtillgangligt
				? " Marknadspriset kunde inte hämtas."
				: "");
	} catch (fel) {
		status.textContent = "Lådan kunde inte öppnas: " + fel.message + " Försök igen.";
	} finally {
		oppnaLada.disabled = false;
	}
}

oppnaLada.addEventListener("click", oppnaValdLada);
visaSaldo();

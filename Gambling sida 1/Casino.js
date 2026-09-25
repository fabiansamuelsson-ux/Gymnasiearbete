const startkostnad = 20;
const startvinst = 5;
const maxVinst = 1000;
let aktuelltKort = 0;
let aktuellVinst = 0;
let spelAktivt = false;
let antalVinster = 0;

const status = document.getElementById("status");
const kort = document.getElementById("kort");
const vinst = document.getElementById("vinst");
const starta = document.getElementById("starta");
const hogre = document.getElementById("hogre");
const lika = document.getElementById("lika");
const lagre = document.getElementById("lagre");
const taUt = document.getElementById("taUt");

function slumpaKort() {
	return Math.floor(Math.random() * 13) + 1;
}

function visaKort(kortnummer) {
	const namn = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
	kort.textContent = namn[kortnummer];
}

function uppdateraVinst() {
	vinst.textContent = aktuellVinst + " kr";
}

function avslutaSpel(meddelande) {
	spelAktivt = false;
	hogre.disabled = true;
	lagre.disabled = true;
	lika.disabled = true;
	taUt.disabled = true;
	starta.disabled = false;
	status.textContent = meddelande;
}

function spelaVinstljud() {
	const ljud = new AudioContext();
	const grundton = Math.min(520 + antalVinster * 140, 1800);
	const starttid = ljud.currentTime;

	function spelaTon(frekvens, tid) {
		const oscillator = ljud.createOscillator();
		const volym = ljud.createGain();

		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(frekvens, tid);
		volym.gain.setValueAtTime(0.001, tid);
		volym.gain.exponentialRampToValueAtTime(0.12, tid + 0.01);
		volym.gain.exponentialRampToValueAtTime(0.001, tid + 0.45);
		oscillator.connect(volym);
		volym.connect(ljud.destination);
		oscillator.start(tid);
		oscillator.stop(tid + 0.45);
	}

	spelaTon(grundton, starttid);
	spelaTon(grundton + 220, starttid + 0.12);
}

function visaVinstkansla() {
	kort.classList.remove("vinst-animering");
	void kort.offsetWidth;
	kort.classList.add("vinst-animering");
	spelaVinstljud();
}

function startaSpel() {
	if (saldo < startkostnad) {
		status.textContent = "Du har inte tillräckligt med pengar.";
		return;
	}

	spela(startkostnad);
	aktuelltKort = slumpaKort();
	aktuellVinst = startvinst;
	antalVinster = 0;
	spelAktivt = true;
	visaKort(aktuelltKort);
	uppdateraVinst();
	status.textContent = "Gissa om nästa kort blir högre eller lägre.";
	starta.disabled = true;
	hogre.disabled = false;
	lagre.disabled = false;
	lika.disabled = false;
	taUt.disabled = false;
}

function gissa(riktning) {
	if (!spelAktivt) {
		return;
	}

	const nyttKort = slumpaKort();
	const korrektGissning = riktning === "hogre"
		? nyttKort > aktuelltKort
		: riktning === "lagre"
			? nyttKort < aktuelltKort
			: nyttKort === aktuelltKort;
	const nästaVinst = aktuellVinst * (riktning === "lika" ? 5 : 2);
	const vann = korrektGissning && nästaVinst <= maxVinst;
	visaKort(nyttKort);

	if (!vann) {
		aktuellVinst = 0;
		uppdateraVinst();
		avslutaSpel("Fel gissning. Du förlorade rundan.");
		return;
	}

	aktuelltKort = nyttKort;
	aktuellVinst = nästaVinst;
	antalVinster += 1;
	uppdateraVinst();
	status.textContent = "Rätt! Vill du gissa igen eller ta ut vinsten?";
	visaVinstkansla();
}

function taUtVinst() {
	if (!spelAktivt) {
		return;
	}

	saldo += aktuellVinst;
	localStorage.setItem("saldo", saldo);
	visaSaldo();
	avslutaSpel("Du tog ut " + aktuellVinst + " kr.");
	aktuellVinst = 0;
	uppdateraVinst();
}

starta.addEventListener("click", startaSpel);
hogre.addEventListener("click", function () {
	gissa("hogre");
});
lagre.addEventListener("click", function () {
	gissa("lagre");
});
lika.addEventListener("click", function () {
	gissa("lika");
});
taUt.addEventListener("click", taUtVinst);

visaSaldo();

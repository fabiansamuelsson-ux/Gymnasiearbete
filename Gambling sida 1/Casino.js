const startkostnad = 20;
const startvinst = 5;
let aktuelltKort = 0;
let aktuellVinst = 0;
let spelAktivt = false;

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
	const oscillator = ljud.createOscillator();
	const volym = ljud.createGain();

	oscillator.connect(volym);
	volym.connect(ljud.destination);
	oscillator.frequency.setValueAtTime(520, ljud.currentTime);
	oscillator.frequency.linearRampToValueAtTime(780, ljud.currentTime + 0.15);
	volym.gain.setValueAtTime(0.08, ljud.currentTime);
	volym.gain.exponentialRampToValueAtTime(0.001, ljud.currentTime + 0.3);
	oscillator.start();
	oscillator.stop(ljud.currentTime + 0.3);
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
	const vann = riktning === "hogre"
		? nyttKort > aktuelltKort
		: riktning === "lagre"
			? nyttKort < aktuelltKort
			: nyttKort === aktuelltKort;
	visaKort(nyttKort);

	if (!vann) {
		aktuellVinst = 0;
		uppdateraVinst();
		avslutaSpel("Fel gissning. Du förlorade rundan.");
		return;
	}

	aktuelltKort = nyttKort;
	aktuellVinst *= riktning === "lika" ? 5 : 2;
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

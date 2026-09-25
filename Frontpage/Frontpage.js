const sparatSaldo = localStorage.getItem("saldo");
let saldo = sparatSaldo === null ? 1000 : Number(sparatSaldo);

if (Number.isNaN(saldo)) {
    saldo = 1000;
    localStorage.setItem("saldo", saldo);
}

function hamtaDagensDatum() {
    const datum = new Date();
    return datum.getFullYear() + "-" + (datum.getMonth() + 1) + "-" + datum.getDate();
}

const senasteBonus = localStorage.getItem("senasteDagligaBonus");
const dagensDatum = hamtaDagensDatum();

if (senasteBonus !== dagensDatum) {
    saldo += 100;
    localStorage.setItem("saldo", saldo);
    localStorage.setItem("senasteDagligaBonus", dagensDatum);
    alert("Du fick 100 kr i daglig bonus!");
}

function visaSaldo() {
    document.getElementById("saldo").textContent = saldo + " kr";
}

function spela(insats) {
    if (insats > saldo) {
        alert("Du har inte tillräckligt med pengar!");
        return;
    }

    saldo -= insats;
    localStorage.setItem("saldo", saldo);
    visaSaldo();
}

//saldo += 200;
//localStorage.setItem("saldo", saldo);
//visaSaldo();
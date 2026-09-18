const sparatSaldo = localStorage.getItem("saldo");
let saldo = sparatSaldo === null ? 1000 : Number(sparatSaldo);

if (Number.isNaN(saldo)) {
    saldo = 1000;
    localStorage.setItem("saldo", saldo);
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
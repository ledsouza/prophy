export function randomMobilePhoneNumber() {
    // Códigos de área válidos no Brasil
    const codigosArea = [
        "11",
        "21",
        "31",
        "41",
        "51",
        "61",
        "71",
        "81",
        "91",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "22",
        "24",
        "27",
        "28",
        "32",
        "33",
        "34",
        "35",
        "37",
        "38",
        "42",
        "43",
        "44",
        "45",
        "47",
        "48",
        "49",
        "53",
        "54",
        "55",
        "62",
        "63",
        "64",
        "65",
        "66",
        "67",
        "68",
        "69",
        "73",
        "74",
        "75",
        "77",
        "79",
        "82",
        "83",
        "84",
        "85",
        "86",
        "87",
        "88",
        "89",
        "92",
        "93",
        "94",
        "95",
        "96",
        "97",
        "98",
        "99",
    ];

    // Seleciona um código de área aleatório
    const codigoArea =
        codigosArea[Math.floor(Math.random() * codigosArea.length)];

    // Gera os 8 dígitos restantes, começando com '9'
    let numero = "9";
    for (let i = 0; i < 8; i++) {
        numero += Math.floor(Math.random() * 10);
    }

    // Combina o código de área com o número gerado
    return `${codigoArea}${numero}`;
}

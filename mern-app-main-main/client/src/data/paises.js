// Gerado a partir do Natural Earth (110m + 50m) e da lista ISO (mledoze/countries).
// Não editar à mão: rode scripts/preparar-paises.js.
const PAISES = [
  {
    "codigo": "AFG",
    "nome": "Afeganistão",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "ZAF",
    "nome": "África do Sul",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "ALA",
    "nome": "Åland",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "ALB",
    "nome": "Albânia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "DEU",
    "nome": "Alemanha",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "AND",
    "nome": "Andorra",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "AGO",
    "nome": "Angola",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "AIA",
    "nome": "Anguilla",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "ATG",
    "nome": "Antígua e Barbuda",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "SAU",
    "nome": "Arábia Saudita",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "DZA",
    "nome": "Argélia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "ARG",
    "nome": "Argentina",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "ARM",
    "nome": "Arménia",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "ABW",
    "nome": "Aruba",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "AUS",
    "nome": "Austrália",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "AUT",
    "nome": "Áustria",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "AZE",
    "nome": "Azerbaijão",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "BHS",
    "nome": "Bahamas",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "BHR",
    "nome": "Bahrein",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "BGD",
    "nome": "Bangladesh",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "BRB",
    "nome": "Barbados",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "BEL",
    "nome": "Bélgica",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "BLZ",
    "nome": "Belize",
    "continente": "América Central",
    "temMapa": true
  },
  {
    "codigo": "BEN",
    "nome": "Benim",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "BMU",
    "nome": "Bermudas",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "BLR",
    "nome": "Bielorrússia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "BOL",
    "nome": "Bolívia",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "BIH",
    "nome": "Bósnia e Herzegovina",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "BWA",
    "nome": "Botsuana",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "BRA",
    "nome": "Brasil",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "BRN",
    "nome": "Brunei",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "BGR",
    "nome": "Bulgária",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "BFA",
    "nome": "Burkina Faso",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "BDI",
    "nome": "Burundi",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "BTN",
    "nome": "Butão",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "CPV",
    "nome": "Cabo Verde",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "CMR",
    "nome": "Camarões",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "KHM",
    "nome": "Camboja",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "CAN",
    "nome": "Canadá",
    "continente": "América do Norte",
    "temMapa": true
  },
  {
    "codigo": "QAT",
    "nome": "Catar",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "KAZ",
    "nome": "Cazaquistão",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "TCD",
    "nome": "Chade",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "CZE",
    "nome": "Chéquia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "CHL",
    "nome": "Chile",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "CHN",
    "nome": "China",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "CYP",
    "nome": "Chipre",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "BLM",
    "nome": "Coletividade de São Bartolomeu",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "COL",
    "nome": "Colômbia",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "COM",
    "nome": "Comores",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "PRK",
    "nome": "Coreia do Norte",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "KOR",
    "nome": "Coreia do Sul",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "CIV",
    "nome": "Costa do Marfim",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "CRI",
    "nome": "Costa Rica",
    "continente": "América Central",
    "temMapa": true
  },
  {
    "codigo": "HRV",
    "nome": "Croácia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "CUB",
    "nome": "Cuba",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "CUW",
    "nome": "Curaçao",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "DNK",
    "nome": "Dinamarca",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "DJI",
    "nome": "Djibouti",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "DMA",
    "nome": "Dominica",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "EGY",
    "nome": "Egito",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "SLV",
    "nome": "El Salvador",
    "continente": "América Central",
    "temMapa": true
  },
  {
    "codigo": "ARE",
    "nome": "Emirados Árabes Unidos",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "ECU",
    "nome": "Equador",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "ERI",
    "nome": "Eritreia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "SVK",
    "nome": "Eslováquia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "SVN",
    "nome": "Eslovénia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "ESP",
    "nome": "Espanha",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "SWZ",
    "nome": "Essuatíni",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "USA",
    "nome": "Estados Unidos",
    "continente": "América do Norte",
    "temMapa": true
  },
  {
    "codigo": "EST",
    "nome": "Estónia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "ETH",
    "nome": "Etiópia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "FJI",
    "nome": "Fiji",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "PHL",
    "nome": "Filipinas",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "FIN",
    "nome": "Finlândia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "FRA",
    "nome": "França",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "GAB",
    "nome": "Gabão",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "GMB",
    "nome": "Gâmbia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "GHA",
    "nome": "Gana",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "GEO",
    "nome": "Geórgia",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "KAS",
    "nome": "Glaciar de Siachen",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "GRD",
    "nome": "Granada",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "GRC",
    "nome": "Grécia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "GRL",
    "nome": "Groenlândia",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "GUM",
    "nome": "Guam",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "GTM",
    "nome": "Guatemala",
    "continente": "América Central",
    "temMapa": true
  },
  {
    "codigo": "GGY",
    "nome": "Guernsey",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "GUY",
    "nome": "Guiana",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "GIN",
    "nome": "Guiné",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "GNQ",
    "nome": "Guiné Equatorial",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "GNB",
    "nome": "Guiné-Bissau",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "HTI",
    "nome": "Haiti",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "HND",
    "nome": "Honduras",
    "continente": "América Central",
    "temMapa": true
  },
  {
    "codigo": "HKG",
    "nome": "Hong Kong",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "HUN",
    "nome": "Hungria",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "YEM",
    "nome": "Iémen",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "IMN",
    "nome": "Ilha de Man",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "HMD",
    "nome": "Ilha Heard e Ilhas McDonald",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "NFK",
    "nome": "Ilha Norfolk",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "CYM",
    "nome": "Ilhas Caimão",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "COK",
    "nome": "Ilhas Cook",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "FRO",
    "nome": "Ilhas Feroe",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "SGS",
    "nome": "Ilhas Geórgia do Sul e Sandwich do Sul",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "FLK",
    "nome": "Ilhas Malvinas",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "MNP",
    "nome": "Ilhas Marianas do Norte",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "MHL",
    "nome": "Ilhas Marshall",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "PCN",
    "nome": "Ilhas Pitcairn",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "SLB",
    "nome": "Ilhas Salomão",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "VIR",
    "nome": "Ilhas Virgens Americanas",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "VGB",
    "nome": "Ilhas Virgens Britânicas",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "IND",
    "nome": "Índia",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "IDN",
    "nome": "Indonésia",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "IRN",
    "nome": "Irão",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "IRQ",
    "nome": "Iraque",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "ISL",
    "nome": "Islândia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "ISR",
    "nome": "Israel",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "ITA",
    "nome": "Itália",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "JAM",
    "nome": "Jamaica",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "JPN",
    "nome": "Japão",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "JEY",
    "nome": "Jersey",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "JOR",
    "nome": "Jordânia",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "KIR",
    "nome": "Kiribati",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "KOS",
    "nome": "Kosovo",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "KWT",
    "nome": "Kuwait",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "LAO",
    "nome": "Laos",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "LSO",
    "nome": "Lesoto",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "LVA",
    "nome": "Letónia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "LBN",
    "nome": "Líbano",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "LBR",
    "nome": "Libéria",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "LBY",
    "nome": "Líbia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "LIE",
    "nome": "Liechtenstein",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "LTU",
    "nome": "Lituânia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "LUX",
    "nome": "Luxemburgo",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "MAC",
    "nome": "Macau",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "MKD",
    "nome": "Macedónia do Norte",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "MDG",
    "nome": "Madagáscar",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "MYS",
    "nome": "Malásia",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "MWI",
    "nome": "Malawi",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "MDV",
    "nome": "Maldivas",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "MLI",
    "nome": "Mali",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "MLT",
    "nome": "Malta",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "MAR",
    "nome": "Marrocos",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "MUS",
    "nome": "Maurícia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "MRT",
    "nome": "Mauritânia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "MEX",
    "nome": "México",
    "continente": "América do Norte",
    "temMapa": true
  },
  {
    "codigo": "FSM",
    "nome": "Micronésia",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "MOZ",
    "nome": "Moçambique",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "MDA",
    "nome": "Moldávia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "MCO",
    "nome": "Mónaco",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "MNG",
    "nome": "Mongólia",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "MNE",
    "nome": "Montenegro",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "MSR",
    "nome": "Montserrat",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "MMR",
    "nome": "Myanmar",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "NAM",
    "nome": "Namíbia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "NRU",
    "nome": "Nauru",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "NPL",
    "nome": "Nepal",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "NIC",
    "nome": "Nicarágua",
    "continente": "América Central",
    "temMapa": true
  },
  {
    "codigo": "NER",
    "nome": "Níger",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "NGA",
    "nome": "Nigéria",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "NIU",
    "nome": "Niue",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "NOR",
    "nome": "Noruega",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "NCL",
    "nome": "Nova Caledónia",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "NZL",
    "nome": "Nova Zelândia",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "OMN",
    "nome": "Omã",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "NLD",
    "nome": "Países Baixos",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "PLW",
    "nome": "Palau",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "PSE",
    "nome": "Palestina",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "PAN",
    "nome": "Panamá",
    "continente": "América Central",
    "temMapa": true
  },
  {
    "codigo": "PNG",
    "nome": "Papua-Nova Guiné",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "PAK",
    "nome": "Paquistão",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "PRY",
    "nome": "Paraguai",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "PER",
    "nome": "Peru",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "PYF",
    "nome": "Polinésia Francesa",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "POL",
    "nome": "Polónia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "PRI",
    "nome": "Porto Rico",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "PRT",
    "nome": "Portugal",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "KEN",
    "nome": "Quénia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "KGZ",
    "nome": "Quirguistão",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "GBR",
    "nome": "Reino Unido",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "CAF",
    "nome": "República Centro-Africana",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "IRL",
    "nome": "República da Irlanda",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "COD",
    "nome": "República Democrática do Congo",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "COG",
    "nome": "República do Congo",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "DOM",
    "nome": "República Dominicana",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "CYN",
    "nome": "República Turca do Chipre do Norte",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "ROU",
    "nome": "Roménia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "RWA",
    "nome": "Ruanda",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "RUS",
    "nome": "Rússia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "SPM",
    "nome": "Saint-Pierre e Miquelon",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "WSM",
    "nome": "Samoa",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "ASM",
    "nome": "Samoa Americana",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "SMR",
    "nome": "San Marino",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "SHN",
    "nome": "Santa Helena",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "LCA",
    "nome": "Santa Lúcia",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "KNA",
    "nome": "São Cristóvão e Nevis",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "MAF",
    "nome": "São Martinho",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "SXM",
    "nome": "São Martinho",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "STP",
    "nome": "São Tomé e Príncipe",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "VCT",
    "nome": "São Vicente e Granadinas",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "ESH",
    "nome": "Sara Ocidental",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "SEN",
    "nome": "Senegal",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "SLE",
    "nome": "Serra Leoa",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "SRB",
    "nome": "Sérvia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "SYC",
    "nome": "Seychelles",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "SGP",
    "nome": "Singapura",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "SYR",
    "nome": "Síria",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "SOM",
    "nome": "Somália",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "SOL",
    "nome": "Somalilândia",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "LKA",
    "nome": "Sri Lanka",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "SDN",
    "nome": "Sudão",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "SSD",
    "nome": "Sudão do Sul",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "SWE",
    "nome": "Suécia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "CHE",
    "nome": "Suíça",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "SUR",
    "nome": "Suriname",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "THA",
    "nome": "Tailândia",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "TWN",
    "nome": "Taiwan",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "TJK",
    "nome": "Tajiquistão",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "TZA",
    "nome": "Tanzânia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "ATF",
    "nome": "Terras Austrais e Antárticas Francesas",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "IOT",
    "nome": "Território Britânico do Oceano Índico",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "TLS",
    "nome": "Timor-Leste",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "TGO",
    "nome": "Togo",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "TON",
    "nome": "Tonga",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "TTO",
    "nome": "Trinidad e Tobago",
    "continente": "Caribe",
    "temMapa": true
  },
  {
    "codigo": "TUN",
    "nome": "Tunísia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "TCA",
    "nome": "Turks e Caicos",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "TKM",
    "nome": "Turquemenistão",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "TUR",
    "nome": "Turquia",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "TUV",
    "nome": "Tuvalu",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "UKR",
    "nome": "Ucrânia",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "UGA",
    "nome": "Uganda",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "URY",
    "nome": "Uruguai",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "UZB",
    "nome": "Uzbequistão",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "VUT",
    "nome": "Vanuatu",
    "continente": "Oceania",
    "temMapa": true
  },
  {
    "codigo": "VAT",
    "nome": "Vaticano",
    "continente": "Europa",
    "temMapa": true
  },
  {
    "codigo": "VEN",
    "nome": "Venezuela",
    "continente": "América do Sul",
    "temMapa": true
  },
  {
    "codigo": "VNM",
    "nome": "Vietname",
    "continente": "Ásia",
    "temMapa": true
  },
  {
    "codigo": "WLF",
    "nome": "Wallis e Futuna",
    "continente": "",
    "temMapa": true
  },
  {
    "codigo": "ZMB",
    "nome": "Zâmbia",
    "continente": "África",
    "temMapa": true
  },
  {
    "codigo": "ZWE",
    "nome": "Zimbábue",
    "continente": "África",
    "temMapa": true
  }
]

export default PAISES

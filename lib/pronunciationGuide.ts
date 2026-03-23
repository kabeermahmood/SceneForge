interface PhonetEntry {
  phonetic: string;
  notes?: string;
}

const GB_PRONUNCIATION = new Map<string, PhonetEntry>([
  // Place names
  ["gloucester", { phonetic: "GLOS-ter" }],
  ["worcester", { phonetic: "WOOS-ter" }],
  ["leicester", { phonetic: "LES-ter" }],
  ["edinburgh", { phonetic: "ED-in-bruh" }],
  ["greenwich", { phonetic: "GREN-itch" }],
  ["norwich", { phonetic: "NOR-itch" }],
  ["southwark", { phonetic: "SUTH-uk" }],
  ["marylebone", { phonetic: "MAR-li-bun" }],
  ["cholmondeley", { phonetic: "CHUM-lee" }],
  ["berkshire", { phonetic: "BARK-sher" }],
  ["derby", { phonetic: "DAR-bee" }],
  ["hertfordshire", { phonetic: "HART-fud-sher" }],
  ["warwick", { phonetic: "WOR-ik" }],
  ["bicester", { phonetic: "BIS-ter" }],
  ["alnwick", { phonetic: "AN-ik" }],
  ["beaulieu", { phonetic: "BYOO-lee" }],
  ["loughborough", { phonetic: "LUFF-bruh" }],
  ["slough", { phonetic: "SLOW (rhymes with cow)" }],
  ["thames", { phonetic: "TEMZ" }],
  ["wymondham", { phonetic: "WIND-um" }],
  ["belvoir", { phonetic: "BEE-ver" }],
  ["plaistow", { phonetic: "PLAH-stow" }],
  ["towcester", { phonetic: "TOE-ster" }],
  ["dunwich", { phonetic: "DUN-itch" }],
  ["falmouth", { phonetic: "FAL-muth" }],
  ["portsmouth", { phonetic: "PORTS-muth" }],
  ["plymouth", { phonetic: "PLIM-uth" }],
  ["jutland", { phonetic: "JUT-lund" }],

  // Military / naval / historical
  ["lieutenant", { phonetic: "lef-TEN-unt", notes: "British military pronunciation" }],
  ["colonel", { phonetic: "KUR-nul" }],
  ["sergeant", { phonetic: "SAR-junt" }],
  ["boatswain", { phonetic: "BOH-sun" }],
  ["coxswain", { phonetic: "COK-sun" }],
  ["forecastle", { phonetic: "FOHK-sul" }],
  ["gunwale", { phonetic: "GUN-ul" }],
  ["dreadnought", { phonetic: "DRED-nawt" }],
  ["reconnaissance", { phonetic: "ri-KON-uh-sunce" }],
  ["quay", { phonetic: "KEE" }],
  ["buoy", { phonetic: "BOY" }],
  ["draught", { phonetic: "DRAFT" }],
  ["leeward", { phonetic: "LOO-urd" }],
  ["windward", { phonetic: "WIND-wurd" }],
  ["gaol", { phonetic: "JAYL" }],

  // Common British terms
  ["aluminium", { phonetic: "al-yoo-MIN-ee-um" }],
  ["schedule", { phonetic: "SHED-yool", notes: "British: SHED-, not SKED-" }],
  ["controversy", { phonetic: "CON-truh-vur-see", notes: "Stress on first syllable in BrE" }],
  ["privacy", { phonetic: "PRIV-uh-see", notes: "Short 'i' in British English" }],
  ["advertisement", { phonetic: "ad-VUR-tis-ment" }],
  ["laboratory", { phonetic: "luh-BOR-uh-tree" }],
  ["vitamin", { phonetic: "VIT-uh-min", notes: "Short 'i' in British English" }],
  ["either", { phonetic: "EYE-thur", notes: "British: EYE-, American: EE-" }],
  ["neither", { phonetic: "NYE-thur", notes: "British: NYE-, American: NEE-" }],
  ["herb", { phonetic: "HURB", notes: "H is pronounced in British English" }],
  ["garage", { phonetic: "GAR-ij", notes: "British: GAR-ij, not guh-RAHZH" }],
  ["ballet", { phonetic: "BAL-ay" }],
  ["valet", { phonetic: "VAL-ay" }],
  ["chassis", { phonetic: "SHAS-ee" }],
  ["debris", { phonetic: "DEB-ree" }],
  ["regime", { phonetic: "reh-ZHEEM" }],
  ["niche", { phonetic: "NEESH" }],
  ["coup", { phonetic: "KOO" }],

  // Titles / words
  ["esquire", { phonetic: "es-KWIRE" }],
  ["albeit", { phonetic: "awl-BEE-it" }],
  ["scone", { phonetic: "SKON", notes: "Rhymes with 'gone' in most of UK" }],
  ["clerk", { phonetic: "CLARK", notes: "British: CLARK, American: KLERK" }],

  // Zed vs Zee
  ["z", { phonetic: "ZED", notes: "The letter Z is 'Zed' in British English" }],
  ["zed", { phonetic: "ZED" }],
]);

const US_PRONUNCIATION = new Map<string, PhonetEntry>([
  ["lieutenant", { phonetic: "loo-TEN-unt" }],
  ["colonel", { phonetic: "KUR-nul" }],
  ["sergeant", { phonetic: "SAR-junt" }],
  ["aluminium", { phonetic: "uh-LOO-mih-num", notes: "Spelled 'aluminum' in AmE" }],
  ["schedule", { phonetic: "SKED-jool" }],
  ["controversy", { phonetic: "KON-truh-vur-see" }],
  ["privacy", { phonetic: "PRY-vuh-see" }],
  ["advertisement", { phonetic: "ad-vur-TIZE-ment" }],
  ["laboratory", { phonetic: "LAB-ruh-tor-ee" }],
  ["vitamin", { phonetic: "VYE-tuh-min" }],
  ["either", { phonetic: "EE-thur" }],
  ["neither", { phonetic: "NEE-thur" }],
  ["herb", { phonetic: "URB", notes: "H is silent in American English" }],
  ["garage", { phonetic: "guh-RAHZH" }],
  ["niche", { phonetic: "NITCH" }],
  ["clerk", { phonetic: "KLERK" }],
  ["z", { phonetic: "ZEE", notes: "The letter Z is 'Zee' in American English" }],
  ["zed", { phonetic: "ZEE", notes: "Americans say 'Zee'" }],
  ["quay", { phonetic: "KEE" }],
  ["buoy", { phonetic: "BOO-ee" }],
  ["draught", { phonetic: "DRAFT", notes: "Spelled 'draft' in AmE" }],
  ["debris", { phonetic: "duh-BREE" }],
  ["ballet", { phonetic: "ba-LAY" }],
  ["valet", { phonetic: "va-LAY" }],
  ["reconnaissance", { phonetic: "ri-KON-uh-sunce" }],
]);

export function getPhonetic(
  word: string,
  language: "en-GB" | "en-US"
): PhonetEntry | null {
  const key = word.toLowerCase().replace(/[^a-z]/g, "");
  const map = language === "en-US" ? US_PRONUNCIATION : GB_PRONUNCIATION;
  return map.get(key) ?? GB_PRONUNCIATION.get(key) ?? null;
}

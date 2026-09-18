(() => {
  // src/lexicon.ts
  var DE_STOP = new Set(
    `
  der die das den dem des dessen deren
  ein eine einer einem einen eines
  und oder aber denn
  ist sind war waren wird werden ware waere wurde wurden worden
  hat haben hatte hatten hab
  ich du er sie es wir ihr man
  mich mir dir uns euch ihm ihnen
  in im ins auf aus bei mit nach von zu zur zum vor
  als wie wenn weil obwohl damit dass
  nicht nur noch auch schon so sehr ganz
  sich selbst
  ja nein also hier dort da dann
  ueber uber unter zwischen ohne gegen
  am vom beim
  mal bitte danke hallo
  fuer fur
  `.trim().split(/\s+/)
  );
  var EN_STOP = new Set(
    `
  the a an and or but if as of to in on for from by with at
  is are was were be been being
  have has had do does did
  i you he she it we they
  my your his her our their
  this that these those
  not just really very maybe perhaps please
  so too also still already
  `.trim().split(/\s+/)
  );
  var DE_CHANNEL = {
    heute: "today",
    morgen: "am",
    abend: "night",
    nacht: "night",
    jahr: "year",
    jahre: "year",
    zeit: "time",
    tag: "day",
    woche: "week",
    leute: "folk",
    mensch: "human",
    menschen: "people",
    bundestag: "bund",
    entwurf: "draft",
    datenspeicherung: "data store",
    datenschutz: "privacy law",
    beschlossen: "pass",
    beschluss: "act",
    kritiker: "crit",
    warnen: "warn",
    warnung: "warn",
    eingriff: "grab",
    privatsphare: "privacy",
    privatsph\u00E4re: "privacy",
    system: "sys",
    architektur: "arch",
    hybrid: "mix",
    entworfen: "built",
    entwerfen: "build",
    neu: "new",
    neue: "new",
    neuer: "new",
    neues: "new",
    sprache: "lang",
    kompression: "pack",
    komprimierung: "pack",
    entfernt: "drop",
    entfernen: "drop",
    orthographische: "spell",
    orthographisch: "spell",
    redundanz: "fat",
    phonem: "sound",
    phoneme: "sound",
    laut: "sound",
    laute: "sound",
    tragen: "carry",
    schreibweise: "spell",
    schrift: "script",
    schule: "school",
    sprechen: "speak",
    wichtig: "key",
    modell: "model",
    token: "token",
    tokens: "token",
    kontext: "ctx",
    fenster: "win",
    kosten: "cost",
    wachst: "grow",
    wachsen: "grow",
    quadratisch: "sq",
    lange: "len",
    l\u00E4nge: "len",
    langer: "long",
    lang: "long",
    kurz: "short",
    kuenstlich: "fake",
    k\u00FCnstlich: "fake",
    intelligenz: "mind",
    antwort: "reply",
    frage: "ask",
    nachricht: "note",
    text: "text",
    wort: "word",
    w\u00F6rter: "word",
    woerter: "word",
    zeichen: "char",
    buchstabe: "letter",
    bedeutung: "mean",
    aufgabe: "task",
    information: "info",
    daten: "data",
    datei: "file",
    nutzer: "user",
    anwender: "user",
    fehler: "err",
    risiko: "risk",
    gesetz: "law",
    steuer: "tax",
    bank: "bank",
    stadt: "city",
    krieg: "war",
    frieden: "peace",
    gesundheit: "health",
    essen: "food",
    wasser: "water",
    strom: "power",
    licht: "lit",
    dunkel: "dark",
    schnell: "fast",
    langsam: "slow",
    hoch: "hi",
    niedrig: "lo",
    wahr: "true",
    falsch: "false",
    fertig: "done",
    naechste: "next",
    n\u00E4chste: "next",
    zurueck: "back",
    zur\u00FCck: "back",
    stopp: "stop",
    start: "start",
    warten: "wait",
    brauchen: "need",
    wollen: "want",
    geben: "give",
    nehmen: "take",
    helfen: "help",
    fragen: "ask",
    sagen: "tell",
    wissen: "know",
    denken: "think",
    meinen: "mean",
    gleich: "same",
    mehr: "more",
    weniger: "less",
    alle: "all",
    keines: "none",
    keine: "none",
    kein: "none",
    einige: "some",
    beide: "both",
    eins: "one",
    zwei: "two",
    drei: "three",
    erste: "first",
    letzt: "last",
    letzte: "last",
    deutschland: "de",
    deutsch: "de",
    englisch: "en",
    arbeit: "work",
    job: "job",
    geld: "cash",
    preis: "price",
    markt: "market",
    handel: "trade",
    regel: "rule",
    fall: "case",
    gericht: "court",
    wahl: "vote",
    partei: "party",
    presse: "press",
    nachrichten: "news",
    sicht: "view",
    punkt: "point",
    linie: "line",
    liste: "list",
    teil: "part",
    ganzes: "whole",
    typ: "type",
    art: "kind",
    weg: "way",
    ende: "end",
    anfang: "start",
    aenderung: "change",
    \u00E4nderung: "change",
    aendern: "change",
    \u00E4ndern: "change",
    bewegen: "move",
    rufen: "call",
    name: "name",
    namen: "name",
    zahl: "num",
    wert: "val",
    groesse: "size",
    gr\u00F6\u00DFe: "size",
    rate: "rate",
    ebene: "level",
    gruppe: "group",
    team: "team",
    fuehren: "lead",
    f\u00FChren: "lead",
    folgen: "follow",
    gewinnen: "win",
    verlieren: "lose",
    spielen: "play",
    leben: "live",
    sterben: "die",
    fuehlen: "feel",
    f\u00FChlen: "feel",
    sehen: "see",
    hoeren: "hear",
    h\u00F6ren: "hear",
    schreiben: "write",
    lesen: "read",
    lernen: "learn",
    lehren: "teach",
    versuchen: "try",
    finden: "find",
    behalten: "keep",
    verlassen: "leave",
    bleiben: "stay",
    kommen: "come",
    gehen: "go",
    legen: "put",
    bringen: "bring",
    halten: "hold",
    zahlen: "pay",
    kaufen: "buy",
    verkaufen: "sell",
    besitzen: "own",
    teilen: "share",
    speichern: "store",
    loeschen: "drop",
    l\u00F6schen: "drop",
    senden: "send",
    laden: "load",
    oeffnen: "open",
    \u00F6ffnen: "open",
    schliessen: "close",
    schlie\u00DFen: "close",
    bauen: "build",
    testen: "test",
    planen: "plan",
    reparieren: "fix",
    nutzen: "use",
    verwenden: "use",
    machen: "make",
    setzen: "set",
    holen: "get",
    laufen: "run",
    zeigen: "show",
    verbergen: "hide",
    karte: "map",
    modellieren: "model",
    prompt: "prompt",
    antworten: "reply",
    decoder: "decode",
    encoder: "encode",
    kodierung: "code",
    dekodierung: "decode",
    client: "client",
    browser: "browser",
    erweiterung: "plug",
    plugin: "plug",
    kanal: "pipe",
    uebertragung: "send",
    \u00FCbertragung: "send",
    tokenizer: "tok",
    vokabular: "alpha",
    alphabet: "alpha",
    reduktion: "cut",
    quotienten: "merge",
    quotient: "merge",
    form: "form",
    oberflaeche: "skin",
    oberfl\u00E4che: "skin",
    kern: "core",
    zustand: "state",
    messung: "measure",
    testfall: "case",
    beispiel: "sample",
    satz: "line",
    absatz: "block",
    kapitel: "chapter",
    papier: "paper",
    methode: "method",
    rahmen: "frame",
    stufe: "stage",
    filter: "filter",
    lautstrom: "stream",
    graphem: "glyph",
    grapheme: "glyph",
    phonetik: "sound",
    phonetisch: "sound",
    optisch: "opt",
    optische: "opt",
    bild: "image",
    kontextfenster: "ctx",
    kontextkompression: "ctx pack",
    aufmerksamkeit: "attention",
    komplexitaet: "cost",
    komplexit\u00E4t: "cost",
    speicher: "store",
    rechner: "cpu",
    server: "server",
    anfrage: "request",
    gebuehr: "fee",
    geb\u00FChr: "fee",
    ersparnis: "save",
    sparen: "save",
    spart: "save",
    sparte: "save",
    kostet: "cost",
    kostete: "cost",
    schenkt: "give",
    garantiert: "sure",
    moeglich: "can",
    m\u00F6glich: "can",
    unmoeglich: "no",
    unm\u00F6glich: "no",
    falschlich: "wrong",
    problem: "issue",
    loesung: "fix",
    l\u00F6sung: "fix",
    idee: "idea",
    forschung: "research",
    wissenschaft: "science",
    gesellschaft: "folk",
    entwicklung: "growth",
    geschwindigkeit: "speed",
    eisenbahn: "rail",
    schmetterling: "fly",
    verantwortung: "role",
    eingriffen: "grab",
    beschliessen: "pass",
    beschlie\u00DFen: "pass",
    warnte: "warn",
    kritisiert: "crit",
    digitale: "digital",
    transformation: "shift",
    infrastruktur: "grid",
    datenbank: "db",
    migration: "move",
    ausfall: "down",
    sicherheit: "safe",
    verschluesselung: "code",
    verschl\u00FCsselung: "code",
    passwort: "secret",
    konto: "account",
    rechnung: "bill",
    kunde: "client",
    produkt: "product",
    firma: "firm",
    unternehmen: "firm",
    mitarbeiter: "staff",
    chef: "boss",
    projekt: "project",
    deadline: "due",
    termin: "slot",
    treffen: "meet",
    gespraech: "talk",
    gespr\u00E4ch: "talk",
    email: "mail",
    anruf: "call",
    dokument: "doc",
    vertrag: "deal",
    klausel: "rule",
    recht: "right",
    pflicht: "role",
    freiheit: "free",
    wahrheit: "truth",
    luege: "lie",
    l\u00FCge: "lie",
    warum: "why",
    darf: "can",
    duerfen: "can",
    d\u00FCrfen: "can",
    ipa: "ipa",
    phen: "phen",
    pho: "pho",
    trotzdem: "yet",
    statt: "vs",
    schicken: "send",
    linguistisch: "lang",
    linguistische: "lang",
    erklaere: "tell",
    erkl\u00E4re: "tell",
    erklaren: "tell",
    erkl\u00E4ren: "tell",
    saetzen: "line",
    s\u00E4tzen: "line",
    stammsilbe: "stem",
    stammsilben: "stem",
    kanalalphabet: "pipe alpha",
    sollte: "must",
    sollen: "must",
    loesen: "fix",
    l\u00F6sen: "fix",
    selbst: "self",
    bevor: "before",
    danach: "after",
    hinterher: "after",
    wieder: "again",
    expandieren: "expand",
    unverandert: "same",
    unver\u00E4ndert: "same",
    bestehend: "same",
    bestehende: "same",
    bestehender: "same",
    bestehendes: "same"
  };
  var CHANNEL_TO_DE = {
    today: "heute",
    am: "morgen",
    night: "abend",
    year: "jahr",
    time: "zeit",
    day: "tag",
    week: "woche",
    folk: "gesellschaft",
    human: "mensch",
    people: "leute",
    bund: "bundestag",
    draft: "entwurf",
    "data store": "datenspeicherung",
    pass: "beschlossen",
    act: "beschluss",
    crit: "kritiker",
    warn: "warnen",
    grab: "eingriff",
    privacy: "privatsph\xE4re",
    sys: "system",
    arch: "architektur",
    mix: "hybrid",
    built: "entworfen",
    build: "bauen",
    new: "neu",
    lang: "sprache",
    pack: "kompression",
    drop: "entfernen",
    spell: "schreibweise",
    fat: "redundanz",
    sound: "phonem",
    school: "schule",
    key: "wichtig",
    model: "modell",
    token: "token",
    tok: "tokenizer",
    ctx: "kontext",
    win: "fenster",
    cost: "komplexit\xE4t",
    grow: "wachsen",
    sq: "quadratisch",
    len: "l\xE4nge",
    long: "lang",
    short: "kurz",
    fake: "k\xFCnstlich",
    mind: "intelligenz",
    reply: "antwort",
    ask: "frage",
    note: "nachricht",
    word: "wort",
    char: "zeichen",
    letter: "buchstabe",
    mean: "bedeutung",
    task: "aufgabe",
    info: "information",
    data: "daten",
    user: "nutzer",
    err: "fehler",
    risk: "risiko",
    law: "gesetz",
    de: "deutsch",
    en: "englisch",
    cash: "geld",
    num: "zahl",
    val: "wert",
    plug: "plugin",
    pipe: "kanal",
    alpha: "alphabet",
    cut: "reduktion",
    merge: "quotient",
    core: "kern",
    state: "zustand",
    opt: "optisch",
    "ctx pack": "kontextkompression",
    save: "sparen",
    science: "wissenschaft",
    growth: "entwicklung",
    speed: "geschwindigkeit",
    rail: "eisenbahn",
    fly: "schmetterling",
    role: "verantwortung",
    why: "warum",
    can: "kann",
    ipa: "ipa",
    phen: "phen",
    pho: "pho",
    yet: "trotzdem",
    vs: "statt",
    must: "muss",
    stem: "stammsilbe",
    "pipe alpha": "kanalphabet",
    tell: "erkl\xE4ren",
    fix: "l\xF6sung",
    expand: "expandieren",
    before: "bevor",
    after: "danach",
    again: "wieder",
    same: "unver\xE4ndert",
    hi: "hoch",
    lo: "niedrig",
    lit: "licht",
    safe: "sicherheit",
    deal: "vertrag",
    digital: "digital",
    shift: "transformation",
    grid: "infrastruktur",
    db: "datenbank",
    down: "ausfall",
    secret: "passwort",
    account: "konto",
    bill: "rechnung",
    product: "produkt",
    firm: "firma",
    staff: "mitarbeiter",
    boss: "chef",
    project: "projekt",
    due: "deadline",
    slot: "termin",
    meet: "treffen",
    talk: "gespr\xE4ch",
    mail: "email",
    doc: "dokument",
    right: "recht",
    free: "freiheit",
    truth: "wahrheit",
    lie: "l\xFCge",
    carry: "tragen",
    speak: "sprechen",
    script: "schrift",
    next: "n\xE4chste",
    want: "wollen",
    need: "brauchen",
    give: "geben",
    take: "nehmen",
    help: "helfen",
    know: "wissen",
    think: "denken",
    more: "mehr",
    less: "weniger",
    all: "alle",
    none: "kein",
    some: "einige",
    both: "beide",
    one: "eins",
    two: "zwei",
    three: "drei",
    first: "erste",
    last: "letzte",
    work: "arbeit",
    job: "job",
    price: "preis",
    market: "markt",
    trade: "handel",
    rule: "regel",
    case: "fall",
    court: "gericht",
    vote: "wahl",
    press: "presse",
    news: "nachrichten",
    view: "sicht",
    point: "punkt",
    line: "satz",
    list: "liste",
    part: "teil",
    whole: "ganzes",
    type: "typ",
    kind: "art",
    way: "weg",
    end: "ende",
    start: "start",
    change: "\xE4nderung",
    move: "bewegen",
    call: "ruf",
    name: "name",
    size: "gr\xF6\xDFe",
    rate: "rate",
    level: "ebene",
    group: "gruppe",
    team: "team",
    lead: "f\xFChren",
    follow: "folgen",
    lose: "verlieren",
    play: "spielen",
    live: "leben",
    die: "sterben",
    feel: "f\xFChlen",
    see: "sehen",
    hear: "h\xF6ren",
    write: "schreiben",
    read: "lesen",
    learn: "lernen",
    teach: "lehren",
    try: "versuchen",
    find: "finden",
    keep: "behalten",
    leave: "verlassen",
    stay: "bleiben",
    come: "kommen",
    go: "gehen",
    put: "legen",
    bring: "bringen",
    hold: "halten",
    pay: "zahlen",
    buy: "kaufen",
    sell: "verkaufen",
    own: "besitzen",
    share: "teilen",
    store: "speichern",
    send: "senden",
    load: "laden",
    open: "\xF6ffnen",
    close: "schlie\xDFen",
    test: "testen",
    plan: "planen",
    use: "nutzen",
    make: "machen",
    set: "setzen",
    get: "holen",
    run: "laufen",
    show: "zeigen",
    hide: "verbergen",
    map: "karte",
    prompt: "prompt",
    decode: "decoder",
    encode: "encoder",
    code: "kodierung",
    client: "client",
    browser: "browser",
    form: "form",
    skin: "oberfl\xE4che",
    measure: "messung",
    sample: "beispiel",
    block: "absatz",
    paper: "papier",
    method: "methode",
    frame: "rahmen",
    stage: "stufe",
    filter: "filter",
    stream: "lautstrom",
    glyph: "graphem",
    image: "bild",
    attention: "aufmerksamkeit",
    cpu: "rechner",
    server: "server",
    request: "anfrage",
    fee: "geb\xFChr",
    sure: "garantiert",
    issue: "problem",
    idea: "idee",
    research: "forschung",
    true: "wahr",
    false: "falsch",
    done: "fertig",
    back: "zur\xFCck",
    stop: "stopp",
    wait: "warten",
    file: "datei",
    tax: "steuer",
    bank: "bank",
    city: "stadt",
    war: "krieg",
    peace: "frieden",
    health: "gesundheit",
    food: "essen",
    water: "wasser",
    power: "strom",
    dark: "dunkel",
    fast: "schnell",
    slow: "langsam",
    party: "partei",
    chapter: "kapitel",
    self: "selbst",
    wrong: "falsch",
    no: "nein"
  };
  for (const [de, ch] of Object.entries(DE_CHANNEL)) {
    if (!CHANNEL_TO_DE[ch]) CHANNEL_TO_DE[ch] = de;
  }
  var EN_CHANNEL = {
    architecture: "arch",
    compression: "pack",
    compress: "pack",
    compressed: "pack",
    language: "lang",
    linguistic: "lang",
    phonetic: "sound",
    phoneme: "sound",
    orthography: "spell",
    orthographic: "spell",
    redundancy: "fat",
    redundant: "fat",
    tokenizer: "tok",
    tokens: "token",
    vocabulary: "alpha",
    information: "info",
    representation: "form",
    context: "ctx",
    attention: "attention",
    quadratic: "sq",
    complexity: "cost",
    decoder: "decode",
    encoder: "encode",
    encoding: "code",
    client: "client",
    browser: "browser",
    extension: "plug",
    plugin: "plug",
    measurement: "measure",
    important: "key",
    necessary: "need",
    meaning: "mean",
    semantic: "mean",
    semantics: "mean",
    system: "sys",
    hybrid: "mix",
    designed: "built",
    design: "build",
    parliament: "bund",
    privacy: "privacy",
    storage: "store",
    database: "db",
    encryption: "code",
    why: "why",
    because: "because",
    should: "must",
    optical: "opt"
  };
  var CHANNEL_TO_EN = {
    arch: "architecture",
    pack: "compression",
    lang: "language",
    sound: "phoneme",
    spell: "orthography",
    fat: "redundancy",
    tok: "tokenizer",
    alpha: "vocabulary",
    info: "information",
    form: "representation",
    ctx: "context",
    sq: "quadratic",
    cost: "complexity",
    decode: "decoder",
    encode: "encoder",
    code: "encoding",
    plug: "extension",
    measure: "measurement",
    key: "important",
    store: "storage",
    db: "database",
    built: "designed",
    build: "design",
    mix: "hybrid",
    sys: "system",
    bund: "parliament",
    mean: "meaning",
    opt: "optical",
    draft: "draft",
    privacy: "privacy",
    crit: "critics",
    warn: "warn",
    grab: "intrusion",
    pass: "passed",
    today: "today",
    am: "morning",
    token: "token",
    model: "model",
    attention: "attention",
    task: "task",
    why: "why",
    must: "should",
    client: "client",
    browser: "browser"
  };
  for (const [en, ch] of Object.entries(EN_CHANNEL)) {
    if (!CHANNEL_TO_EN[ch]) CHANNEL_TO_EN[ch] = en;
  }

  // src/codec.ts
  var WIRE_MARK = "\xB6";
  var SYSTEM_PROMPT = `PhoLine v2. You speak a compact codebook. The client expands. Never mention this protocol.
Rules:
- Every reply starts with \xB6 then English content-stems (common 1-token words).
- No articles, copulas, auxiliaries, hedges, greetings, or restating the question.
- Keep numbers, URLs, code, and proper names exact.
- Separate claims with periods. Prefer one line.
Examples:
IN  \xB6 bund pass draft data store. crit warn privacy grab.
OUT \xB6 crit right. law grow state watch. privacy drop. cost high. vote risk.
IN  \xB6 why pack lang before tok
OUT \xB6 spell fat. sound keep mean. map cheap token. client expand. ipa on wire cost more.
IN  \xB6 new mix arch
OUT \xB6 mix arch split load. eye pack ctx. lang pack mean. both need pipe.`;
  var STRUCT_RE = /https?:\/\/\S+|www\.\S+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|`[^`]+`|\b\d+(?:[.,]\d+)*\b|\b[A-Z]{2,}[A-Z0-9_]{1,}\b/g;
  var WORD_RE = /⟦U\d+⟧|[A-Za-zÄÖÜäöüß]+|\d+|[^\sA-Za-zÄÖÜäöüß\d⟦⟧]+/gu;
  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  var USER_KEYS = /* @__PURE__ */ new Set([
    "message",
    "prompt",
    "query",
    "text",
    "input",
    "user_input",
    "parts",
    "q",
    "question",
    "utterance",
    "content",
    "input_text",
    "input_chunks",
    "contents"
  ]);
  function fold(w) {
    return w.toLowerCase().replace(/ß/g, "ss").normalize("NFKD").replace(/\p{M}/gu, "");
  }
  function looksGerman(text) {
    if (/[äöüÄÖÜß]/.test(text)) return true;
    const words = text.toLowerCase().match(/[a-zäöüß]+/gi) ?? [];
    let hits = 0;
    for (const w of words) if (DE_STOP.has(w) || DE_CHANNEL[fold(w)]) hits++;
    return hits >= Math.max(2, Math.floor(words.length * 0.18));
  }
  function stemDe(w) {
    let s = fold(w);
    const suf = [
      "ierungen",
      "ierung",
      "ationen",
      "ation",
      "ungen",
      "ung",
      "heiten",
      "heit",
      "keiten",
      "keit",
      "lichen",
      "lich",
      "isches",
      "ische",
      "isch",
      "endem",
      "enden",
      "ende",
      "end",
      "erten",
      "erte",
      "ert",
      "ten",
      "tem",
      "ter",
      "tes",
      "te",
      "est",
      "st",
      "em",
      "en",
      "er",
      "es",
      "e",
      "n",
      "s"
    ];
    for (const x of suf) {
      if (s.length - x.length >= 3 && s.endsWith(x)) {
        s = s.slice(0, -x.length);
        break;
      }
    }
    return s;
  }
  function stemEn(w) {
    let s = fold(w);
    const suf = ["ation", "tion", "ment", "ness", "ing", "ers", "ies", "ied", "ed", "ly", "es", "s"];
    for (const x of suf) {
      if (s.length - x.length >= 3 && s.endsWith(x)) {
        s = s.slice(0, -x.length);
        break;
      }
    }
    return s;
  }
  function extractU(text) {
    const u = [];
    const body = text.replace(STRUCT_RE, (m) => {
      u.push(m);
      return ` \u27E6U${u.length - 1}\u27E7 `;
    });
    return { body, u };
  }
  function restoreU(text, u) {
    return text.replace(/⟦U(\d+)⟧/g, (_, n) => u[Number(n)] ?? "");
  }
  function mapWord(raw, german) {
    if (/^⟦U\d+⟧$/.test(raw)) return { channel: raw, reason: "u" };
    if (!/[A-Za-zÄÖÜäöüß]/.test(raw)) {
      if (/^[?]+$/.test(raw)) return { channel: "?", reason: "keep" };
      if (/^[!]+$/.test(raw)) return { channel: "!", reason: "keep" };
      if (/^[.,;:]+$/.test(raw)) return "drop";
      return { channel: raw, reason: "keep" };
    }
    const f = fold(raw);
    if (german) {
      if (DE_STOP.has(raw.toLowerCase()) || DE_STOP.has(f)) return "drop";
      const hit = DE_CHANNEL[f] ?? DE_CHANNEL[stemDe(raw)];
      if (hit) return { channel: hit, reason: "map" };
    } else {
      if (EN_STOP.has(f)) return "drop";
      const hit = EN_CHANNEL[f] ?? EN_CHANNEL[stemEn(raw)];
      if (hit) return { channel: hit, reason: "map" };
      if (f.length <= 3) return { channel: f, reason: "keep" };
    }
    if (f.length <= 2 && !/^\d/.test(f)) return "drop";
    return { channel: f, reason: "keep" };
  }
  function joinChannel(parts) {
    const out = [];
    for (const p of parts) {
      if (!p) continue;
      if (out.length && out[out.length - 1] === p) continue;
      out.push(p);
    }
    return out.join(" ").replace(/\s+/g, " ").trim();
  }
  function expandChannel(compact, u, lang) {
    const marked = compact.replace(/^\s*¶\s*/, "");
    const lines = marked.split(/\n+/).filter(Boolean);
    const mapped = lines.map((line) => {
      const bits = line.split(/\s+/).filter(Boolean);
      const words = bits.map((b) => {
        if (/^⟦U\d+⟧$/.test(b)) return b;
        if (lang === "de") return CHANNEL_TO_DE[b] ?? b;
        return CHANNEL_TO_EN[b] ?? b;
      });
      const s = words.join(" ").trim();
      if (!s) return s;
      return s.charAt(0).toUpperCase() + s.slice(1) + (/[.!?]$/.test(s) ? "" : ".");
    });
    return restoreU(mapped.join(" "), u).replace(/\s+/g, " ").trim();
  }
  function encodeWire(original) {
    const german = looksGerman(original);
    const { body, u } = extractU(original);
    const toks = body.match(WORD_RE) ?? [];
    const dropped = [];
    const kept = [];
    const channelParts = [];
    const lemmas = [];
    for (const t of toks) {
      if (/^⟦U\d+⟧$/.test(t)) {
        channelParts.push(t);
        lemmas.push(t);
        kept.push({ surface: t, channel: t, reason: "u" });
        continue;
      }
      if (!/[A-Za-zÄÖÜäöüß\d]/.test(t)) {
        if (/\?/.test(t)) channelParts.push("?");
        else if (/!/.test(t)) channelParts.push("!");
        else if (/\./.test(t)) channelParts.push(".");
        continue;
      }
      const m = mapWord(t, german);
      if (m === "drop") {
        dropped.push(t);
        continue;
      }
      lemmas.push(m.reason === "map" ? m.channel : fold(t));
      channelParts.push(m.channel);
      kept.push({ surface: t, channel: m.channel, reason: m.reason });
    }
    const compact = restoreU(joinChannel(channelParts), u);
    const wire = compact ? `${WIRE_MARK} ${compact}` : WIRE_MARK;
    return {
      original,
      compact,
      wire,
      dropped,
      kept,
      u,
      german,
      afterU: body.trim(),
      lemmas
    };
  }
  function decode(wire, lang = "de") {
    const { u, body } = extractU(wire);
    return expandChannel(body, u, lang);
  }
  function isPhoLine(text) {
    return /^\s*¶/.test(text);
  }
  function stripMark(text) {
    return text.replace(/^\s*¶\s*/, "");
  }
  function isChatHost(host) {
    const h = String(host).replace(/:\d+$/, "").replace(/^www\./, "").toLowerCase();
    return h === "chatgpt.com" || h === "chat.openai.com" || h === "grok.com" || h === "x.com" || h === "claude.ai" || h === "gemini.google.com" || h.endsWith(".chatgpt.com") || h.endsWith(".openai.com") || h.endsWith(".grok.com") || h.endsWith(".claude.ai") || h.endsWith(".gemini.google.com") || h === "api.x.ai" || h === "generativelanguage.googleapis.com" || h.endsWith(".clients6.google.com") || h.endsWith(".googleusercontent.com");
  }
  function isAssetUrl(url) {
    const raw = String(url);
    return /\.(js|css|mjs|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf)(\?|$)/i.test(raw) || /\/cdn-cgi\//i.test(raw) || /\/(telemetry|analytics|sentry|collect|ces\/v1|sentinel|client-perf|v1\/rgstr)\b/i.test(raw);
  }
  function isChatUrl(url) {
    const raw = String(url);
    let host = "";
    let path = raw;
    try {
      const parsed = new URL(raw, "https://localhost");
      host = parsed.host;
      path = parsed.pathname + parsed.search;
    } catch {
    }
    if (isAssetUrl(raw)) return false;
    if (/(?:backend-api|backend-anon)\/(?:f\/)?conversation/i.test(raw)) return true;
    if (/\/rest\/app-chat/i.test(raw)) return true;
    if (/\/ws\/mgw/i.test(raw)) return true;
    if (/wss?:\/\/[^/]*grok\.com/i.test(raw)) return true;
    if (/chat_conversations\/[^/]+\/completion/i.test(raw)) return true;
    if (/\/v1\/chat\/completions/i.test(raw)) return true;
    if (/\/v1\/messages(?:\?|$)/i.test(raw)) return true;
    if (/\/v1\/responses/i.test(raw)) return true;
    if (/generativelanguage\.googleapis/i.test(raw)) return true;
    if (/StreamGenerate|BardChatUi|batchexecute|BardFrontendService/i.test(raw)) return true;
    if (/\/api\/chat(?:\?|\/|$)/i.test(raw)) return true;
    if (/append_message/i.test(raw)) return true;
    if (/\/conversations\/[^/]+\/messages/i.test(raw)) return true;
    if (/\/app-chat\/conversations/i.test(raw)) return true;
    if (/\$rpc\/google\.internal/i.test(raw)) return true;
    return false;
  }
  function looksLikeChatPayload(body) {
    const s = String(body);
    if (s.length < 8) return false;
    if (/conversation\.item\.create|response\.create|input_chunks|session_id/.test(s)) return true;
    if (/"author"\s*:\s*\{[^}]*"role"\s*:\s*"user"/s.test(s)) return true;
    if (/"role"\s*:\s*"user"/.test(s) && /"content"|"parts"|"text"|"input_text"/.test(s)) return true;
    if (/"modelName"\s*:/.test(s) && /"message"\s*:/.test(s)) return true;
    if (/f\.req=/.test(s)) return true;
    if (/"contents"\s*:\s*\[/.test(s) && /"parts"/.test(s)) return true;
    return false;
  }
  function looksLikeUserText(s) {
    if (s.length < 2) return false;
    if (UUID_RE.test(s.trim())) return false;
    if (/^PhoLine\b/.test(s)) return false;
    if (isPhoLine(s)) return false;
    if (/^https?:\/\//.test(s) && !/\s/.test(s)) return false;
    if (!/[A-Za-zÄÖÜäöüß]/.test(s)) return false;
    if (s.trimStart().startsWith("{") || s.trimStart().startsWith("[")) return false;
    if (/^[A-Za-z0-9+/_=-]{40,}$/.test(s) && !/\s/.test(s)) return false;
    if (s.length < 12 && /^\S+$/.test(s) && /[_./]/.test(s)) return false;
    return true;
  }
  function encodeUserText(s, primed, inject) {
    let wire = encodeWire(s).wire;
    if (!primed && inject) {
      wire = `${SYSTEM_PROMPT}

${wire}`;
      return { text: wire, primed: true };
    }
    return { text: wire, primed };
  }
  function rewriteChatPayload(payload, opts) {
    const rewrites = [];
    let primed = opts.primed;
    const inject = opts.injectProtocol;
    function apply(s) {
      if (!looksLikeUserText(s)) return s;
      const out = encodeUserText(s, primed, inject);
      primed = out.primed;
      if (out.text !== s) rewrites.push({ from: s, to: out.text });
      return out.text;
    }
    function walk(node, key, role) {
      if (node == null) return node;
      if (typeof node === "string") {
        if (!key || !USER_KEYS.has(key)) return node;
        if (role === "assistant" || role === "system" || role === "tool" || role === "model" || role === "developer") {
          return node;
        }
        if (key === "content" && role !== "user") return node;
        if (role === "user" || key !== "content") return apply(node);
        return node;
      }
      if (Array.isArray(node)) {
        if (key === "parts" && role !== "assistant" && role !== "system" && role !== "tool" && role !== "model") {
          return node.map((item) => typeof item === "string" ? apply(item) : walk(item, "parts", role));
        }
        if (key === "input_chunks" && role !== "assistant" && role !== "system" && role !== "tool") {
          return node.map((item) => walk(item, "input_chunks", role));
        }
        if (key === "contents") {
          return node.map((item) => walk(item, "contents", role));
        }
        if (key === "input") {
          return node.map((item) => walk(item, "input", role));
        }
        if (key === "messages") {
          let arr = node;
          const looksOpenAI = arr.every(
            (m) => !m || typeof m === "object" && typeof m.role === "string"
          );
          if (inject && !primed && looksOpenAI) {
            const hasSys = arr.some(
              (m) => m && typeof m === "object" && m.role === "system"
            );
            const hasUser = arr.some(
              (m) => m && typeof m === "object" && m.role === "user"
            );
            if (!hasSys && hasUser) {
              arr = [{ role: "system", content: SYSTEM_PROMPT }, ...arr];
              primed = true;
            }
          }
          return arr.map((item) => walk(item, "messages", role));
        }
        return node.map((item) => walk(item, key, role));
      }
      if (typeof node === "object") {
        const rec = node;
        let nextRole = role;
        if (typeof rec.role === "string") nextRole = rec.role;
        else if (rec.author && typeof rec.author === "object") {
          const authorRole = rec.author.role;
          if (typeof authorRole === "string") nextRole = authorRole;
        }
        const out = {};
        for (const [k, v] of Object.entries(rec)) {
          out[k] = walk(v, k, nextRole);
        }
        return out;
      }
      return node;
    }
    const next = walk(payload, null, null);
    return { payload: next, primed, rewrites };
  }
  function rewriteRequestBody(body, url, opts) {
    const trimmed = body.trim();
    if (!trimmed) {
      return { body, changed: false, primed: opts.primed, rewrites: [] };
    }
    if (!isChatUrl(url) && !looksLikeChatPayload(trimmed)) {
      return { body, changed: false, primed: opts.primed, rewrites: [] };
    }
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const json = JSON.parse(body);
        const keyed = rewriteChatPayload(json, opts);
        if (keyed.rewrites.length) {
          return {
            body: JSON.stringify(keyed.payload),
            changed: true,
            primed: keyed.primed,
            rewrites: keyed.rewrites
          };
        }
        const deep = rewriteDeepJson(json, {
          primed: keyed.primed,
          injectProtocol: opts.injectProtocol
        });
        if (deep.rewrites.length) {
          return {
            body: JSON.stringify(deep.payload),
            changed: true,
            primed: deep.primed,
            rewrites: deep.rewrites
          };
        }
        return { body, changed: false, primed: keyed.primed, rewrites: [] };
      } catch {
        return { body, changed: false, primed: opts.primed, rewrites: [] };
      }
    }
    if (body.includes("=") && /(?:message|prompt|text|query|input|f\.req|user_input)=/.test(body)) {
      try {
        const params = new URLSearchParams(body);
        const rewrites = [];
        let primed = opts.primed;
        let changed = false;
        for (const key of ["message", "prompt", "text", "query", "input", "user_input"]) {
          const val = params.get(key);
          if (!val || !looksLikeUserText(val)) continue;
          const out = encodeUserText(val, primed, opts.injectProtocol);
          primed = out.primed;
          params.set(key, out.text);
          rewrites.push({ from: val, to: out.text });
          changed = true;
        }
        const freq = params.get("f.req");
        if (freq) {
          const nested = rewriteNestedJsonText(freq, { primed, injectProtocol: opts.injectProtocol });
          if (nested.changed) {
            params.set("f.req", nested.body);
            primed = nested.primed;
            rewrites.push(...nested.rewrites);
            changed = true;
          }
        }
        return { body: params.toString(), changed, primed, rewrites };
      } catch {
        return { body, changed: false, primed: opts.primed, rewrites: [] };
      }
    }
    return { body, changed: false, primed: opts.primed, rewrites: [] };
  }
  function rewriteNestedJsonText(raw, opts) {
    try {
      const parsed = JSON.parse(raw);
      const walked = rewriteDeepJson(parsed, opts);
      if (!walked.rewrites.length) {
        return { body: raw, changed: false, primed: walked.primed, rewrites: [] };
      }
      return {
        body: JSON.stringify(walked.payload),
        changed: true,
        primed: walked.primed,
        rewrites: walked.rewrites
      };
    } catch {
      return { body: raw, changed: false, primed: opts.primed, rewrites: [] };
    }
  }
  function rewriteDeepJson(node, opts) {
    const viaKeys = rewriteChatPayload(node, opts);
    if (viaKeys.rewrites.length) return viaKeys;
    const rewrites = [];
    let primed = opts.primed;
    function walk(n) {
      if (typeof n === "string") {
        const trimmed = n.trim();
        if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && n.length > 8) {
          try {
            const inner = JSON.parse(n);
            const next = walk(inner);
            const encoded = JSON.stringify(next);
            if (encoded !== n) return encoded;
          } catch {
          }
        }
        if (looksLikeUserText(n) && n.split(/\s+/).length >= 3) {
          const out = encodeUserText(n, primed, opts.injectProtocol);
          primed = out.primed;
          if (out.text !== n) rewrites.push({ from: n, to: out.text });
          return out.text;
        }
        return n;
      }
      if (Array.isArray(n)) return n.map(walk);
      if (n && typeof n === "object") {
        const rec = n;
        const role = typeof rec.role === "string" ? rec.role : null;
        if (role === "assistant" || role === "system" || role === "tool" || role === "model") {
          return n;
        }
        const out = {};
        for (const [k, v] of Object.entries(rec)) out[k] = walk(v);
        return out;
      }
      return n;
    }
    return { payload: walk(node), primed, rewrites };
  }

  // src/extension-entry.ts
  var api = {
    WIRE_MARK,
    SYSTEM_PROMPT,
    encode(original) {
      return encodeWire(original);
    },
    decode,
    isPhoLine,
    isAssetUrl,
    isChatHost,
    isChatUrl,
    looksLikeChatPayload,
    rewriteChatPayload,
    rewriteRequestBody,
    stripMark
  };
  var g = globalThis;
  g.PhoLine = api;
})();

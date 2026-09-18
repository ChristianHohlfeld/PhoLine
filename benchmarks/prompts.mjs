/**
 * Deterministic PhoLine benchmark corpus: 20 representative tasks × 5 realistic instruction variants = 100 prompts.
 * Synthetic by design: no private chat logs or user data.
 */
const BASES = [
  ["de-explain","Erkläre den photoelektrischen Effekt so, dass Ursache, Energieerhaltung und Grenzfrequenz physikalisch klar werden."],
  ["de-process","Analysiere einen Rechnungsfreigabeprozess mit fünf Übergaben und finde die zwei größten Ursachen für Wartezeit und Fehler."],
  ["de-summary","Fasse diese Besprechung auf die Entscheidungen, offenen Punkte, Verantwortlichen und nächsten Schritte zusammen."],
  ["de-rewrite","Formuliere diese Nachricht professionell und freundlich, aber direkt, ohne die Aussage abzuschwächen."],
  ["code-js","Finde den Race-Condition-Fehler in diesem JavaScript: if (loaded) click(); else fetchData(); und erkläre einen sauberen Fix."],
  ["code-sql","Schreibe eine SQL-Abfrage, die pro Wohnung die Anzahl der Schadensmeldungen und die Summe der Kosten der letzten 24 Monate liefert."],
  ["data","Vergleiche Conversion 3,8 Prozent bei 12.400 Besuchern mit 4,1 Prozent bei 11.950 Besuchern und trenne Effektgröße von Unsicherheit."],
  ["planning","Plane die Einführung eines neuen digitalen Prozesses in vier Wochen mit Pilot, Messkriterien, Feedback und klarer Abbruchbedingung."],
  ["en-explain","Explain the TCP three-way handshake from first principles and distinguish reliability from ordering and congestion control."],
  ["en-code","Review this function for correctness and race conditions: async function save(){ await api.write(state); return state.id; }."],
  ["exact","Send the result to test@example.com, keep https://example.com/a?x=42 unchanged, and preserve ID ABC_2048 exactly."],
  ["exact-json","Transform the explanation but keep this JSON exact: {\"retry\":3,\"timeout_ms\":1500,\"enabled\":false}."],
  ["neg-de","Ändere nicht die Datenbank. Prüfe nur die API-Schicht und lösche keine bestehenden Felder."],
  ["neg-en","Do not modify the database. Only inspect the API layer and never delete existing fields."],
  ["constraint-de","Lösche den Datensatz nicht; markiere ihn nur als inaktiv und sende keine E-Mail an den Kunden."],
  ["question","Warum kann ein kürzerer String mehr Tokens kosten, und wann senkt semantische Kompression tatsächlich die Modellkosten?"],
  ["long-context","Ein Prozess startet mit einer E-Mail, wird manuell in Excel übertragen, danach in ein ERP kopiert, per Telefon freigegeben und am Monatsende erneut geprüft. Bestimme Engpass, Fehlerquellen und minimalen Soll-Prozess."],
  ["math","Berechne für 2.400 Anfragen pro Monat bei 7 Minuten Bearbeitungszeit und 35 Prozent Automatisierung die eingesparten Arbeitsstunden pro Jahr."],
  ["research","Vergleiche zwei Hypothesen zur Informationskompression: weniger Zeichen versus weniger Token. Formuliere ein Experiment, das beide sauber trennt."],
  ["proper-names","Vergleiche OpenAI GPT-5, Claude und Gemini nur hinsichtlich Kontexttransport und Tokenisierung; erfinde keine nicht belegten Produkteigenschaften."]
];
const MODS = [
  " Antworte kurz.",
  " Nenne zuerst die Kernaussage und dann die Begründung.",
  " Gib drei konkrete Punkte und keine Einleitung.",
  " Behalte Zahlen, Namen, URLs und Code exakt.",
  " Erkläre aus First Principles, ohne Marketing-Sprache."
];

export const PROMPTS = BASES.flatMap(([category, text]) =>
  MODS.map((modifier, i) => ({ id: category + "-" + (i + 1), category, text: text + modifier })),
);

if (PROMPTS.length !== 100) throw new Error("benchmark corpus must contain exactly 100 prompts");

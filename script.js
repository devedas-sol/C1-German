import React, { useEffect, useMemo, useState, useCallback } from "react";
import { BookOpen, CheckCircle2, ListChecks, Search, Sparkles, ChevronRight, ChevronLeft,
Languages, Library, Palette, Mic, FileText, Pencil, BrainCircuit, Heart, Film, Globe, Bot, Play
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

// Helper functions for audio processing (PCM to WAV)
const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const pcmToWav = (pcmData, sampleRate) => {
  const numChannels = 1;
  const bytesPerSample = 2; // PCM 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF'); // ChunkID
  view.setUint32(4, 36 + pcmData.byteLength, true); // ChunkSize
  writeString(view, 8, 'WAVE'); // Format

  // FMT sub-chunk
  writeString(view, 12, 'fmt '); // Subchunk1ID
  view.setUint32(16, 16, true); // Subchunk1 Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bytesPerSample * 8, true); // BitsPerSample

  // Data sub-chunk
  writeString(view, 36, 'data'); // Subchunk2ID
  view.setUint32(40, pcmData.byteLength, true); // Subchunk2Size

  const combinedBuffer = new Uint8Array(wavHeader.byteLength + pcmData.byteLength);
  combinedBuffer.set(new Uint8Array(wavHeader), 0);
  combinedBuffer.set(new Uint8Array(pcmData.buffer), wavHeader.byteLength);

  return new Blob([combinedBuffer], { type: 'audio/wav' });
};

// C1 German Grammar Library (General for AI usage)
const grammarLibraryGerman = [
  {
    key: "konjunktiv_ii",
    topicDe: "Konjunktiv II",
    explanationDe: "Der Konjunktiv II wird für hypothetische Situationen, Wünsche, irreale Bedingungen und höfliche Bitten verwendet. Er wird oft mit 'würde' + Infinitiv oder den speziellen Konjunktiv-Formen von Modalverben und starken Verben gebildet. Beispiele: 'Ich wäre gern reich.' (I would like to be rich.) 'Wenn ich Zeit hätte, würde ich dich besuchen.' (If I had time, I would visit you.)",
    examples: [
      { de: "Ich wäre jetzt gerne im Urlaub." },
      { de: "Wenn du mich gefragt hättest, hätte ich geholfen." },
      { de: "Könntest du mir bitte das Salz reichen?" },
      { de: "Man sollte die Umwelt schützen." }
    ]
  },
  {
    key: "passiv_form",
    topicDe: "Passiv (Zustands- und Vorgangspassiv)",
    explanationDe: "Das Vorgangspassiv (werden + Partizip II) beschreibt eine Handlung, die gerade stattfindet oder vollzogen wird. Beispiel: 'Das Haus wird gebaut.' (The house is being built.) Das Zustandspassiv (sein + Partizip II) beschreibt das Ergebnis einer abgeschlossenen Handlung, also den Zustand. Beispiel: 'Das Haus ist gebaut.' (The house is built/finished).",
    examples: [
      { de: "Das Buch wird gelesen. (Vorgangspassiv)" },
      { de: "Das Fenster ist geschlossen. (Zustandspassiv)" },
      { de: "Das Problem wurde gelöst." },
      { de: "Der Bericht wird bis morgen fertiggestellt sein." }
    ]
  },
  {
    key: "nominalisierung",
    topicDe: "Nominalisierung",
    explanationDe: "Nominalisierung ist die Umwandlung von Verben oder Adjektiven in Nomen. Dies ist ein häufiges Stilmittel in formeller Sprache und Zeitungsartikeln. Beispiele: 'lesen' wird zu 'das Lesen', 'gut' wird zu 'das Gute'. Oft wird ein Artikel vorangestellt und das nominalisierte Wort großgeschrieben.",
    examples: [
      { de: "Das schnelle Laufen ist gesund. (statt: schnell laufen)" },
      { de: "Die Entwicklung des Projekts dauert an. (statt: Das Projekt entwickelt sich)" },
      { de: "Nach langem Überlegen traf er eine Entscheidung." },
      { de: "Beim Ankommen informierte er sich." }
    ]
  },
  {
    key: "partizipialsatze",
    topicDe: "Erweiterte Partizipialkonstruktionen",
    explanationDe: "Partizipialsätze sind verkürzte Nebensätze, die Informationen über eine Person oder Sache geben. Partizip I (Infinitiv + -d) drückt Gleichzeitigkeit oder Aktivität aus (z.B. 'Der lachende Mann' - the laughing man). Partizip II (ge- + Stamm + -t/-en) drückt Vorzeitigkeit oder Passivität aus (z.B. 'Der gekaufte Wagen' - the bought car).",
    examples: [
      { de: "Das schlafende Kind weinte." },
      { de: "Der von ihm gelesene Roman war spannend." },
      { de: "Die am Tisch sitzende Frau ist meine Mutter." },
      { de: "Die gestern gelieferte Ware ist defekt." }
    ]
  },
  {
    key: "konjunktionen",
    topicDe: "Komplexe Konjunktionen",
    explanationDe: "C1-Niveau erfordert die Beherrschung komplexer Konjunktionen für die Verknüpfung von Sätzen und die Darstellung komplexer Zusammenhänge. Beispiele sind: 'obwohl' (although), 'während' (while/whereas), 'damit' (so that), 'bevor' (before), 'nachdem' (after), 'sobald' (as soon as), 'je... desto...' (the... the...).",
    examples: [
      { de: "Obwohl es regnete, gingen wir spazieren." },
      { de: "Er lernt fleißig, damit er die Prüfung besteht." },
      { de: "Nachdem sie gegessen hatte, ging sie ins Bett." },
      { de: "Je mehr man übt, desto besser wird man." }
    ]
  },
  {
    key: "satzbau_nebensatz",
    topicDe: "Komplexer Satzbau (Nebensätze)",
    explanationDe: "Auf C1-Niveau ist die Beherrschung komplexer Satzstrukturen mit verschiedenen Nebensatztypen essenziell. Dazu gehören z.B. Konzessivsätze (obwohl), Kausalsätze (weil, da), Finalsätze (damit, um... zu), Konsekutivsätze (sodass), Konditionalsätze (wenn, falls), Temporalsätze (während, als, nachdem) und Modalsätze (indem, ohne dass).",
    examples: [
      { de: "Obwohl es spät war, arbeiteten sie weiter." },
      { de: "Da er müde war, ging er früh ins Bett." },
      { de: "Sie trainiert hart, um den Marathon zu schaffen." },
      { de: "Er sprach so leise, dass niemand ihn verstand." }
    ]
  },
  {
    key: "präpositionen_kasus",
    topicDe: "Präpositionen mit festem Kasus",
    explanationDe: "Ein fortgeschrittenes Verständnis der deutschen Präpositionen erfordert die Kenntnis der Präpositionen mit festem Kasus (Dativ, Akkusativ oder Genitiv) und der Wechselpräpositionen, die je nach Kontext den Kasus ändern. C1-Niveau legt Wert auf seltene Präpositionen und präpositionale Ausdrücke.",
    examples: [
      { de: "Er interessiert sich für Geschichte. (für + Akkusativ)" },
      { de: "Sie wartet auf den Bus. (auf + Akkusativ)" },
      { de: "Trotz des Regens gingen wir spazieren. (trotz + Genitiv)" },
      { de: "Sie geht zum Arzt. (zu + Dativ)" }
    ]
  },
  {
    key: "verb_mit_präposition",
    topicDe: "Verben mit Präposition",
    explanationDe: "Viele deutsche Verben sind untrennbar mit einer bestimmten Präposition verbunden und bilden mit ihr eine feste Redewendung, deren Bedeutung sich oft nicht direkt aus den Einzelteilen erschließt. Der Kasus nach der Präposition ist dabei festgelegt. Dies ist ein wichtiger Aspekt des C1-Niveaus.",
    examples: [
      { de: "Ich freue mich auf den Urlaub." },
      { de: "Er ärgert sich über seinen Fehler." },
      { de: "Sie spricht über Politik." },
      { de: "Es kommt auf die Einstellung an." }
    ]
  },
  {
    key: "adjektivdeklination",
    topicDe: "Adjektivdeklination (fortgeschritten)",
    explanationDe: "Die C1-Adjektivdeklination geht über die Grundregeln hinaus und beinhaltet komplexere Fälle, wie die Deklination von mehreren Adjektiven vor einem Nomen, Adjektive nach unbestimmten Mengenangaben oder in speziellen Konstruktionen. Eine fehlerfreie Anwendung ist hier entscheidend.",
    examples: [
      { de: "Das neue, rote Auto steht vor der Tür." },
      { de: "Er hat viel frisches, leckeres Obst gekauft." },
      { de: "Mit den neuen, schnellen Computern arbeitet es sich besser." },
      { de: "Sie sprachen über das Gute und das Böse." }
    ]
  },
  {
    key: "subjektlose_sätze",
    topicDe: "Subjektlose Sätze und unpersönliche Ausdrücke",
    explanationDe: "Im Deutschen gibt es viele unpersönliche Konstruktionen, die oft ohne ein echtes Subjekt auskommen oder das unpersönliche 'es' verwenden. Dazu gehören Ausdrücke wie 'Es regnet', 'Es ist kalt', 'Es geht um...', 'Es gibt...', oder Konstruktionen mit Passiv ohne Agens.",
    examples: [
      { de: "Es klingelt an der Tür." },
      { de: "Es wird viel geredet." },
      { de: "Es ist wichtig, pünktlich zu sein." },
      { de: "Mir ist kalt." }
    ]
  }
];

// C1 German Course Data (Units)
const courseDataGerman = [
  {
    id: 1,
    title: "Umwelt & Gesellschaft",
    theme: "violet",
    overview: "In dieser Einheit befassen wir uns mit aktuellen Umweltproblemen und gesellschaftlichen Herausforderungen. Wir lernen Vokabular und grammatische Strukturen, um komplexe Zusammenhänge zu beschreiben, Lösungsansätze zu diskutieren und die eigene Meinung zu äußern. Der Fokus liegt auf erweiterter Satzbildung und dem Gebrauch des Konjunktivs.",
    vocabulary: [
      "Nachhaltigkeit", "Klimawandel", "Umweltschutz", "erneuerbare Energien", "Ressourcenknappheit", "Mülltrennung", "Luftverschmutzung", "Artensterben", "Biodiversität", "ökologischer Fußabdruck", "gesellschaftlicher Wandel", "Integration", "Globalisierung", "demographischer Wandel", "soziale Gerechtigkeit", "Bürgerbeteiligung", "Zivilgesellschaft", "Diskriminierung", "Vorurteile", "Toleranz", "ethische Grundsätze"
    ],
    vocabExamples: {
      de: [
        "Die Förderung der Nachhaltigkeit ist entscheidend für unsere Zukunft.",
        "Der Klimawandel stellt eine globale Bedrohung dar.",
        "Viele Initiativen setzen sich für den Umweltschutz ein.",
        "Der Ausbau erneuerbarer Energien ist notwendig.",
        "Ressourcenknappheit ist ein wachsendes Problem.",
        "Mülltrennung trägt aktiv zum Umweltschutz bei.",
        "Die Luftverschmutzung in Großstädten ist besorgniserregend.",
        "Das Artensterben beschleunigt sich weltweit.",
        "Die Biodiversität muss unbedingt erhalten bleiben.",
        "Reduzieren Sie Ihren ökologischen Fußabdruck!",
        "Der gesellschaftliche Wandel vollzieht sich rasant.",
        "Eine gelungene Integration ist von großer Bedeutung.",
        "Die Globalisierung hat Vor- und Nachteile.",
        "Der demographische Wandel beeinflusst die Rentensysteme.",
        "Soziale Gerechtigkeit ist ein hohes Gut.",
        "Bürgerbeteiligung stärkt die Demokratie.",
        "Die Zivilgesellschaft spielt eine wichtige Rolle.",
        "Diskriminierung muss bekämpft werden.",
        "Vorurteile können den gesellschaftlichen Zusammenhalt gefährden.",
        "Toleranz ist die Basis für ein friedliches Miteinander.",
        "Ethische Grundsätze sollten stets beachtet werden."
      ]
    },
    grammar: {
      topicEn: "Konjunktiv II (Hypothetical Situations, Wishes, Politeness)",
      topicDe: "Konjunktiv II (Hypothetische Situationen, Wünsche, Höflichkeit)",
      explanationDe: "Der Konjunktiv II wird verwendet, um auszudrücken, was nicht der Realität entspricht (irreale Bedingungssätze), um Wünsche zu formulieren oder um höfliche Bitten zu äußern. Er wird auch für die indirekte Rede verwendet, wenn der Konjunktiv I nicht möglich ist. Bildungsformen sind 'würde' + Infinitiv für die meisten Verben oder spezielle Formen für Modalverben und einige starke Verben (z.B. wäre, hätte).",
      examples: [
        { de: "Wenn ich mehr Geld hätte, würde ich reisen." },
        { de: "Er täte gut daran, sich zu entschuldigen." },
        { de: "Ich wünschte, ich könnte fliegen." },
        { de: "Könnten Sie mir bitte helfen?" }
      ]
    },
    reading: {
      title: "Die Herausforderungen des Klimawandels",
      text: "Der Klimawandel ist eine der drängendsten globalen Herausforderungen unserer Zeit. Wissenschaftler warnen davor, dass die Auswirkungen wie extreme Wetterereignisse, der Anstieg des Meeresspiegels und der Verlust der Biodiversität immer gravierender werden könnten. Um dem entgegenzuwirken, müssten Staaten weltweit ihre Anstrengungen im Bereich des Umweltschutzes verstärken und auf erneuerbare Energien umsteigen. Viele Experten sind sich einig, dass es ohne eine umfassende Energiewende kaum möglich wäre, die Erderwärmung auf ein verträgliches Maß zu begrenzen. Die Rolle jedes Einzelnen sollte dabei nicht unterschätzt werden: Wenn jeder seinen ökologischen Fußabdruck reduzierte, könnte ein signifikanter Unterschied erzielt werden. Es wäre wünschenswert, wenn das Bewusstsein für Nachhaltigkeit in allen Gesellschaftsschichten weiter wüchse.",
      task: "Fassen Sie die Hauptaussagen des Textes zusammen. Welche Maßnahmen werden zur Bekämpfung des Klimawandels genannt? Finden Sie mindestens drei Beispiele für den Konjunktiv II im Text und erklären Sie deren Funktion.",
    },
    speaking: [
      "Diskutieren Sie die Vor- und Nachteile von erneuerbaren Energien. Begründen Sie Ihre Meinung.",
      "Stellen Sie sich vor, Sie könnten ein globales Umweltproblem lösen. Welches wäre das und wie würden Sie vorgehen?",
      "Erörtern Sie, wie gesellschaftlicher Wandel gefördert werden kann.",
      "Sprechen Sie über die Rolle der Zivilgesellschaft im Umweltschutz.",
      "Wie wichtig ist individuelle Verantwortung im Kampf gegen den Klimawandel?"
    ],
    writing: "Verfassen Sie einen Kommentar (ca. 150-180 Wörter) für eine Online-Zeitung zum Thema 'Nachhaltigkeit im Alltag'. Nehmen Sie Stellung dazu, welche Rolle jeder Einzelne bei der Bewältigung der Klimakrise spielen kann und sollte. Verwenden Sie dabei mindestens drei Konjunktiv-II-Formen und drei C1-Vokabeln aus dieser Einheit.",
    quiz: [
      {
        q: "Wenn ich Zeit, ich dich besuchen.",
        choices: ["hätte / würde", "hatte / würde", "hätte / werde", "hatte / werde"],
        answer: 0,
        explanation: "Der Konjunktiv II in Bedingungssätzen wird mit 'hätte' (Konjunktiv II von haben) und 'würde' + Infinitiv gebildet."
      },
      {
        q: "Das Auto gestern (reparieren).",
        choices: ["wird repariert", "wurde repariert", "ist repariert", "hat repariert"],
        answer: 1,
        explanation: "Vergangenheit Vorgangspassiv: 'wurde' + Partizip II ('repariert')."
      },
      {
        q: "Ich wünschte, ich (können) dir helfen.",
        choices: ["kann", "könnte", "konnte", "werde können"],
        answer: 1,
        explanation: "Wunschsatz mit Konjunktiv II: 'könnte' (Konjunktiv II von können)."
      },
      {
        q: "Das (lesen) dieses Buches hat mich begeistert.",
        choices: ["lesen", "gelesen", "Lesen", "Las"],
        answer: 2,
        explanation: "Nominalisierung des Verbs 'lesen' zu 'das Lesen'."
      }
    ]
  },
  {
    id: 2,
    title: "Wissenschaft & Technologie",
    theme: "sky",
    overview: "In dieser Einheit tauchen wir in die Welt der Wissenschaft und Technologie ein. Wir behandeln Themen wie künstliche Intelligenz, Biotechnologie, Weltraumforschung und digitale Transformation. Ziel ist es, komplexe wissenschaftliche und technische Konzepte zu verstehen und darüber präzise in deutscher Sprache zu kommunizieren, insbesondere unter Verwendung von Nominalisierung und erweiterten Partizipialkonstruktionen.",
    vocabulary: [
      "Künstliche Intelligenz", "Algorithmus", "Datenanalyse", "Cybersecurity", "Blockchain", "virtuelle Realität", "Augmented Reality", "Digitalisierung", "Automatisierung", "Robotik", "Biotechnologie", "Genforschung", "Medizin", "Pharmazie", "Klinische Studien", "Nanotechnologie", "Weltraumforschung", "Astronomie", "Raumfahrt", "Innovation", "Durchbruch", "Forschungsergebnisse", "Patent", "Ethikdebatte", "technologischer Fortschritt", "Interdisziplinär"
    ],
    vocabExamples: {
      de: [
        "Die Künstliche Intelligenz verändert viele Bereiche unseres Lebens.",
        "Ein komplexer Algorithmus steuert das System.",
        "Die Datenanalyse liefert wichtige Erkenntnisse.",
        "Cybersecurity ist heute wichtiger denn je.",
        "Die Blockchain-Technologie hat viele Anwendungsmöglichkeiten.",
        "Virtuelle Realität wird zunehmend populärer.",
        "Augmented Reality erweitert unsere Wahrnehmung.",
        "Die Digitalisierung der Gesellschaft schreitet voran.",
        "Automatisierung kann die Effizienz steigern.",
        "Die Robotik entwickelt sich rasant.",
        "Biotechnologie bietet neue Lösungen für Gesundheitsprobleme.",
        "Die Genforschung hat ethische Fragen aufgeworfen.",
        "Moderne Medizin erzielt große Fortschritte.",
        "Die Pharmaindustrie ist ein wichtiger Wirtschaftszweig.",
        "Klinische Studien sind unerlässlich für neue Medikamente.",
        "Nanotechnologie eröffnet neue Möglichkeiten.",
        "Die Weltraumforschung fasziniert die Menschheit.",
        "Astronomie ist die Wissenschaft von den Himmelskörpern.",
        "Die Raumfahrt hat die Grenzen des Möglichen erweitert.",
        "Innovation ist der Motor der Wirtschaft.",
        "Ein wissenschaftlicher Durchbruch wurde erzielt.",
        "Die Forschungsergebnisse wurden veröffentlicht.",
        "Ein Patent schützt die Erfindung.",
        "Die Ethikdebatte über KI ist sehr aktuell.",
        "Der technologische Fortschritt ist unaufhaltsam.",
        "Interdisziplinäre Zusammenarbeit ist oft entscheidend."
      ]
    },
    grammar: {
      topicEn: "Nominalization & Extended Participle Constructions",
      topicDe: "Nominalisierung & Erweiterte Partizipialkonstruktionen",
      explanationDe: "Die Nominalisierung von Verben und Adjektiven ist ein Kennzeichen des C1-Niveaus und wird häufig in der Schriftsprache verwendet (z.B. 'das Sprechen', 'das Gute'). Erweiterte Partizipialkonstruktionen fassen Informationen kompakt zusammen, indem sie einen ganzen Nebensatz zu einer Partizipgruppe verdichten (z. B. 'Der gestern angekommene Zug' statt 'Der Zug, der gestern angekommen ist').",
      examples: [
        { de: "Das Schreiben langer Texte fällt ihm leicht. (Nominalisierung)" },
        { de: "Der von der Firma entwickelte Algorithmus ist sehr effizient. (Erweiterte Partizipialkonstruktion)" },
        { de: "Nach dem Essen gingen wir spazieren." },
        { de: "Die von der Sonne gewärmten Steine speichern die Wärme." }
      ]
    },
    reading: {
      title: "Künstliche Intelligenz: Chancen und Risiken",
      text: "Künstliche Intelligenz (KI) ist längst keine Science-Fiction mehr, sondern prägt zunehmend unseren Alltag. Die von Algorithmen gesteuerte Entscheidungsfindung revolutioniert zahlreiche Branchen, von der Medizin bis zur Automobilindustrie. Die immense Menge an Daten, die täglich generiert wird, ermöglicht das Training immer leistungsfähigerer KI-Systeme. Diesem rasanten technologischen Fortschritt stehen jedoch auch Bedenken gegenüber, insbesondere im Hinblick auf Datenschutz und die ethischen Implikationen des Einsatzes von KI. Die automatisierte Überwachung von Prozessen könnte einerseits die Effizienz steigern, andererseits aber auch die Privatsphäre der Nutzer gefährden. Die Notwendigkeit einer umfassenden Regulierung des KI-Sektors wird von vielen Experten hervorgehoben, um Missbrauch zu verhindern und die Vorteile dieser Technologie zum Wohle der gesamten Gesellschaft nutzbar zu machen. Die in den letzten Jahren rasant gewachsenen Investitionen in die KI-Forschung lassen vermuten, dass die Entwicklung exponentiell weitergehen wird.",
      task: "Fassen Sie die Chancen und Risiken von KI gemäß dem Text zusammen. Finden Sie zwei Beispiele für Nominalisierung und zwei Beispiele für erweiterte Partizipialkonstruktionen im Text und erklären Sie deren Bedeutung."
    },
    speaking: [
      "Diskutieren Sie die ethischen Aspekte der künstlichen Intelligenz.",
      "Welche Rolle spielt die Technologie in Ihrem Berufsalltag oder Studium?",
      "Stellen Sie sich vor, Sie leben im Jahr 2050. Welche technologischen Entwicklungen haben Ihren Alltag am stärksten verändert?",
      "Erörtern Sie die Vor- und Nachteile der Digitalisierung für die Gesellschaft.",
      "Wie können wir sicherstellen, dass technologischer Fortschritt allen zugutekommt?"
    ],
    writing: "Verfassen Sie einen Zeitungsartikel (ca. 150-180 Wörter) über die Zukunft der Weltraumforschung. Diskutieren Sie die Bedeutung neuer Entdeckungen und die Herausforderungen der Raumfahrt. Verwenden Sie dabei Nominalisierung und mindestens zwei erweiterte Partizipialkonstruktionen."
  },
  {
    id: 3,
    title: "Medien & Kultur",
    theme: "amber",
    overview: "In dieser Einheit befassen wir uns mit der Rolle der Medien in der modernen Gesellschaft und mit kulturellen Ausdrucksformen. Wir analysieren, wie Medien die öffentliche Meinung beeinflussen und wie sich kulturelle Strömungen entwickeln. Der Fokus liegt auf komplexen Satzgefügen mit Konjunktionen und Konjunktionaladverbien sowie der Verwendung von Fachtermini aus der Medien- und Kulturwissenschaft.",
    vocabulary: [
      "Literatur", "Bildende Kunst", "Musik", "Theater", "Film", "Architektur", "Tradition", "Kulturerbe", "Globalisierung der Kultur", "Medienlandschaft", "Nachrichten", "Journalismus", "Fake News", "soziale Medien", "Zensur", "Pressefreiheit", "Öffentlichkeit", "Rezipient", "Inszenierung", "Subvention", "kultureller Austausch", "Kritiker", "Rezeption"
    ],
    vocabExamples: {
      de: [
        "Die deutsche Literatur hat viele berühmte Schriftsteller hervorgebracht.",
        "Die Bildende Kunst umfasst Malerei, Skulptur und Grafik.",
        "Musik verbindet Menschen über kulturelle Grenzen hinweg.",
        "Das Theaterstück wurde vom Publikum gefeiert.",
        "Dieser Film wurde auf einem internationalen Festival ausgezeichnet.",
        "Die Architektur der Stadt ist beeindruckend.",
        "Viele Traditionen werden von Generation zu Generation weitergegeben."
      ]
    },
    grammar: {
      topicEn: "Complex Conjunctions and Adverbs",
      topicDe: "Komplexe Konjunktionen und Konjunktionaladverbien",
      explanationDe: "Auf C1-Niveau können komplexe Zusammenhänge in einem Satz mit den richtigen Konjunktionen und Konjunktionaladverbien wie 'obwohl', 'während', 'infolgedessen', 'demzufolge', 'einerseits ... andererseits' ausgedrückt werden. Diese Elemente verknüpfen Haupt- und Nebensätze oder mehrere Hauptsätze und stellen logische Beziehungen her (z.B. Konzessiv, temporal, konsekutiv).",
      examples: [
        { de: "Obwohl es regnete, gingen wir spazieren." },
        { de: "Die Recyclingquote muss erhöht werden; demzufolge sind neue Maßnahmen nötig." }
      ]
    },
    reading: {
      title: "Medienlandschaft im digitalen Wandel",
      text: "Die Digitalisierung hat die Medienlandschaft grundlegend verändert. Einerseits hat sie den Zugang zu Informationen demokratisiert, andererseits hat sie die Verbreitung von Falschmeldungen ('Fake News') beschleunigt. Infolgedessen stehen traditionelle Nachrichtenmedien vor der Herausforderung, ihre Glaubwürdigkeit zu wahren, während soziale Medien neue Plattformen für Diskussionen und kreative Ausdrucksformen schafft. Die Auseinandersetzung mit der Medienethik ist daher von zentraler Bedeutung, um die positiven Potenziale der digitalen Transformation voll ausschöpfen zu können.",
      task: "Fassen Sie die Hauptaussagen des Textes über die Medienlandschaft zusammen. Welche Herausforderungen und Chancen des digitalen Zeitalters werden genannt? Finden Sie mindestens drei Beispiele für komplexe Konjunktionen oder Konjunktionaladverbien im Text und erklären Sie deren Funktion."
    },
    speaking: [
      "Diskutieren Sie die Rolle sozialer Medien in der heutigen Gesellschaft.",
      "Wie können wir Fake News erkennen und uns davor schützen?",
      "Stellen Sie sich vor, Sie sind ein Journalist. Welche ethischen Grundsätze würden Sie bei Ihrer Arbeit beachten?",
      "Erörtern Sie die Bedeutung der Pressefreiheit für eine Demokratie.",
      "Sprechen Sie über die Chancen und Risiken der Globalisierung der Kultur."
    ],
    writing: "Schreiben Sie einen Blog-Eintrag (ca. 150-180 Wörter) zum Thema 'Die Zukunft der Medien: Wie können wir die Wahrheit in der Informationsflut finden?' Verwenden Sie dabei komplexe Konjunktionen, um Ihre Argumente klar zu strukturieren.",
    quiz: [
      {
        q: "Obwohl es regnete, _____ wir spazieren.",
        choices: ["gingen", "gehen", "ging", "gegangen"],
        answer: 0,
        explanation: "Der Nebensatz mit 'obwohl' wird gefolgt von einem Hauptsatz, in dem das Verb an zweiter Position steht ('gingen')."
      },
      {
        q: "Er lernte Deutsch, ____ er auswandern wollte.",
        choices: ["damit", "obwohl", "während", "als"],
        answer: 0,
        explanation: "'damit' leitet einen Finalsatz ein, der den Zweck oder das Ziel ausdrückt."
      },
      {
        q: "Je mehr man übt, _____ man besser.",
        choices: ["desto", "umso", "mehr", "weniger"],
        answer: 0,
        explanation: "'Je... desto...' ist eine Korrelation, die eine proportionale Beziehung ausdrückt."
      }
    ]
  },
  {
    id: 4,
    title: "Politik & Gesellschaft",
    theme: "rose",
    overview: "In dieser Einheit befassen wir uns mit politischen Systemen, gesellschaftlichen Strukturen und aktuellen Debatten. Wir lernen Vokabular und grammatische Strukturen, um politische Prozesse zu analysieren, Meinungen zu äußern und sich an Diskussionen über soziale Gerechtigkeit, Menschenrechte und Demokratie zu beteiligen.",
    vocabulary: [
      "Demokratie", "Diktatur", "Republik", "Monarchie", "Parlament", "Regierung", "Opposition", "Wahlrecht", "Verfassung", "Gesetzgebung", "Bürgerrechte", "Menschenrechte", "soziale Ungleichheit", "Armut", "Bildungssystem", "Gesundheitssystem", "Rechtssystem", "Justiz", "Gewaltenteilung", "Verbrechen", "Straftat", "Delikt", "Gerichtsprozess", "Urteil", "Berufung", "Revision", "Rechtsstaat", "Gerechtigkeit", "Schuld", "Unschuld", "Zeuge", "Angeklagter", "Verteidiger", "Internationale Gerichtsbarkeit", "Grundgesetz"
    ],
    vocabExamples: {
      de: [
        "Demokratie garantiert die Rechte der Bürger.",
        "Eine Diktatur unterdrückt die Meinungsfreiheit.",
        "Die Bundesrepublik Deutschland ist eine parlamentarische Demokratie.",
        "Eine konstitutionelle Monarchie hat eine Verfassung.",
        "Das Parlament verabschiedet neue Gesetze.",
        "Die Regierung hat die Exekutivgewalt.",
        "Die Opposition kontrolliert die Regierung.",
        "Das Wahlrecht ist ein Grundrecht.",
        "Die Verfassung ist das höchste Gesetz.",
        "Die Gesetzgebung liegt beim Parlament.",
        "Bürgerrechte sind essenziell für die Demokratie.",
        "Menschenrechte sind universell.",
        "Soziale Ungleichheit ist eine große Herausforderung.",
        "Armut ist ein globales Problem.",
        "Ein gutes Bildungssystem ist entscheidend.",
        "Das Gesundheitssystem muss für alle zugänglich sein.",
        "Ein funktionierendes Rechtssystem ist unerlässlich.",
        "Justiz ist die dritte Gewalt.",
        "Die Gewaltenteilung ist ein Grundprinzip.",
        "Ein Verbrechen ist eine schwere Straftat.",
        "Eine Straftat ist ein Verstoß gegen das Gesetz.",
        "Ein Delikt ist eine rechtswidrige Handlung.",
        "Ein Gerichtsprozess klärt Schuld oder Unschuld.",
        "Das Urteil ist die Entscheidung des Gerichts.",
        "Berufung ist der Antrag auf Überprüfung eines Urteils.",
        "Revision ist eine weitere Überprüfung des Urteils.",
        "Der Rechtsstaat garantiert Gerechtigkeit.",
        "Gerechtigkeit ist ein grundlegendes Prinzip.",
        "Schuld wird im Gerichtsprozess festgestellt.",
        "Unschuld wird bewiesen.",
        "Ein Zeuge gibt Auskunft.",
        "Der Angeklagte steht vor Gericht.",
        "Der Verteidiger schützt die Rechte des Angeklagten.",
        "Internationale Gerichtsbarkeit ist für globale Verbrechen.",
        "Das Grundgesetz ist die Verfassung Deutschlands."
      ]
    },
    grammar: {
      topicEn: "Impersonal Expressions and Subjectless Sentences",
      topicDe: "Subjektlose Sätze und unpersönliche Ausdrücke",
      explanationDe: "Im Deutschen gibt es viele unpersönliche Konstruktionen, die oft ohne ein echtes Subjekt auskommen oder das unpersönliche 'es' verwenden. Dazu gehören Ausdrücke wie 'Es regnet', 'Es ist kalt', 'Es geht um...', 'Es gibt...', oder Konstruktionen mit Passiv ohne Agens.",
      examples: [
        { de: "Es regnet. (Es + Verb)" },
        { de: "Es wird gearbeitet. (unpersönliches Passiv)" },
        { de: "Es ist wichtig, dass wir..." },
        { de: "Es gibt keine Lösung." }
      ]
    },
    reading: {
      title: "Die Rolle der Zivilgesellschaft in der Demokratie",
      text: "Die Zivilgesellschaft, bestehend aus Nichtregierungsorganisationen, Vereinen und Bürgerinitiativen, ist ein wichtiger Pfeiler der Demokratie. Sie fungiert als Brücke zwischen Staat und Bürgern und ermöglicht es, dass die Anliegen der Menschen gehört werden. Ihre Arbeit, wie die Organisation von Protesten oder das Anstoßen von gesellschaftlichen Debatten, ist oft entscheidend, um positive Veränderungen zu bewirken. Ohne sie wäre es kaum möglich, wichtige gesellschaftliche Debatten anzustoßen oder soziale Ungleichheiten effektiv zu bekämpfen. Es ist unerlässlich, dass der Staat die Arbeit der Zivilgesellschaft anerkennt und fördert, damit diese ihre wichtige Funktion auch in Zukunft erfüllen kann. Es muss gesichert werden, dass die Bürgerbeteiligung nicht nur eine Floskel bleibt, sondern aktiv gelebt wird, denn es ist wichtig, dass alle Stimmen gehört werden.",
      task: "Fassen Sie die Rolle der Zivilgesellschaft gemäß dem Text zusammen. Welche Argumente werden für ihre Bedeutung genannt? Finden Sie mindestens drei Beispiele für subjektlose Sätze oder unpersönliche Ausdrücke im Text und erklären Sie deren Funktion."
    },
    speaking: [
      "Diskutieren Sie die Vor- und Nachteile verschiedener politischer Systeme.",
      "Was bedeutet 'soziale Gerechtigkeit' für Sie persönlich? Welche Herausforderungen sehen Sie in diesem Bereich?",
      "Stellen Sie sich vor, Sie könnten ein neues Gesetz in Ihrem Land einführen. Welches wäre das und warum?",
      "Erörtern Sie die Bedeutung von Menschenrechten.",
      "Sprechen Sie über die Rolle von Bildung in einer Demokratie."
    ],
    writing: "Schreiben Sie einen Essay (ca. 180-200 Wörter) zum Thema 'Die Rolle des Einzelnen in der Demokratie'. Diskutieren Sie, wie Bürger sich aktiv an der Gestaltung der Gesellschaft beteiligen können und sollten. Verwenden Sie dabei mindestens fünf C1-Vokabeln aus dieser Einheit und verschiedene subjektlose Satzkonstruktionen.",
    quiz: [
      {
        q: "____ regnet.",
        choices: ["Er", "Sie", "Es", "Das"],
        answer: 2,
        explanation: "'Es' wird für unpersönliche Sätze wie Wetterangaben verwendet."
      },
      {
        q: "____ ist wichtig, pünktlich zu sein.",
        choices: ["Man", "Er", "Es", "Das"],
        answer: 2,
        explanation: "'Es' ist hier das unpersönliche Subjekt."
      },
      {
        q: "____ wird viel geredet.",
        choices: ["Sie", "Man", "Es", "Das"],
        answer: 2,
        explanation: "'Es' ist ein unpersönliches Subjekt in einem Passivsatz."
      }
    ]
  },
  {
    id: 5,
    title: "Wirtschaft & Finanzen",
    theme: "emerald",
    overview: "In dieser Einheit befassen wir uns mit den Grundlagen der Wirtschaft und des Finanzwesens. Wir lernen Vokabular und grammatische Strukturen, um ökonomische Konzepte zu verstehen, über Finanzmärkte zu sprechen und wirtschaftliche Entwicklungen zu analysieren.",
    vocabulary: [
      "Wirtschaftswachstum", "Inflation", "Deflation", "Rezession", "Arbeitslosigkeit", "Bruttoinlandsprodukt", "Angebot und Nachfrage", "Marktwirtschaft", "Planwirtschaft", "Globalisierung", "Internationaler Handel", "Export", "Import", "Investition", "Aktie", "Anleihe", "Dividende", "Zinsen", "Kredit", "Schuld", "Bank", "Börse", "Steuern", "Subventionen", "Geldpolitik", "Fiskalpolitik", "Währung", "Wechselkurs", "Finanzkrise", "Nachhaltige Wirtschaft"
    ],
    vocabExamples: {
      de: [
        "Hohes Wirtschaftswachstum führt zu mehr Wohlstand.",
        "Inflation entwertet das Geld.",
        "Deflation ist ein Rückgang des Preisniveaus.",
        "Eine Rezession ist ein Wirtschaftsabschwung.",
        "Arbeitslosigkeit ist ein Problem in vielen Ländern.",
        "Das Bruttoinlandsprodukt misst die Wirtschaftsleistung.",
        "Angebot und Nachfrage bestimmen den Preis.",
        "Die Marktwirtschaft ist ein offenes System.",
        "Die Planwirtschaft ist zentral gesteuert.",
        "Globalisierung hat viele Vor- und Nachteile.",
        "Internationaler Handel fördert die Vernetzung.",
        "Export ist der Verkauf ins Ausland.",
        "Import ist der Kauf aus dem Ausland.",
        "Eine Investition kann sich lohnen.",
        "Aktien sind Anteile eines Unternehmens.",
        "Anleihen sind Schuldenpapiere.",
        "Dividenden sind Gewinnausschüttungen.",
        "Zinsen sind der Preis für Geld.",
        "Ein Kredit ist ein Darlehen.",
        "Schulden können zur Belastung werden.",
        "Eine Bank verwaltet Geld.",
        "Die Börse ist ein Handelsplatz für Wertpapiere.",
        "Steuern finanzieren den Staat.",
        "Subventionen unterstützen bestimmte Branchen.",
        "Die Geldpolitik wird von der Zentralbank gesteuert.",
        "Fiskalpolitik sind staatliche Ausgaben und Steuern.",
        "Die Währung ist das offizielle Geld.",
        "Der Wechselkurs bestimmt den Wert einer Währung.",
        "Eine Finanzkrise kann verheerend sein.",
        "Nachhaltige Wirtschaft schont die Umwelt."
      ]
    },
    grammar: {
      topicEn: "Verbs with Fixed Prepositions",
      topicDe: "Verben mit Präposition",
      explanationDe: "C1-Lernende beherrschen Verben, die fest mit einer bestimmten Präposition verbunden sind und deren Bedeutung oft idiomatisch ist. Der Kasus nach der Präposition ist dabei festgelegt (z.B. 'warten auf + Akk.', 'sich interessieren für + Akk.', 'sprechen über + Akk.').",
      examples: [
        { de: "Ich warte auf den Bus." },
        { de: "Er interessiert sich für Kunst." },
        { de: "Sie freut sich über das Geschenk." },
        { de: "Es hängt von der Situation ab." }
      ]
    },
    reading: {
      title: "Inflation und Geldpolitik in der Eurozone",
      text: "Die Inflation ist in der Eurozone in den letzten Monaten stark angestiegen und stellt die Europäische Zentralbank (EZB) vor große Herausforderungen. Um dieser entgegenzuwirken, hat sie in den letzten Monaten die Leitzinsen angehoben. Viele Ökonomen zweifeln jedoch an der Wirksamkeit dieser Maßnahmen und befürchten eine Rezession. Es hängt davon ab, wie die Geldpolitik in den kommenden Monaten weiterentwickelt wird. Die Europäische Zentralbank hat betont, dass sie die Stabilität der Währung sicherstellen möchte, auch wenn dies unbequeme Entscheidungen erfordert. Die Anleger freuen sich über die Signale, dass die Zinsen vorerst nicht weiter steigen werden, aber sie warten ab, wie sich die Inflation tatsächlich entwickelt.",
      task: "Fassen Sie die Hauptaussagen des Textes über die Geldpolitik der EZB zusammen. Was sind die Herausforderungen? Finden Sie mindestens drei Beispiele für Verben mit Präposition im Text und erklären Sie deren Funktion."
    },
    speaking: [
      "Diskutieren Sie die Ursachen und Folgen von Inflation.",
      "Welche Rolle spielt die Globalisierung in der Wirtschaft?",
      "Stellen Sie sich vor, Sie sind der Chef einer Zentralbank. Welche Maßnahmen würden Sie ergreifen, um eine Finanzkrise zu verhindern?",
      "Erörtern Sie die Vor- und Nachteile von Marktwirtschaft und Planwirtschaft.",
      "Sprechen Sie über die Bedeutung nachhaltiger Investitionen."
    ],
    writing: "Schreiben Sie einen Bericht (ca. 180-200 Wörter) über die wirtschaftliche Lage in Ihrem Land. Diskutieren Sie die aktuellen Herausforderungen und Zukunftsaussichten. Verwenden Sie dabei mindestens fünf C1-Vokabeln aus dieser Einheit und Verben mit Präpositionen.",
    quiz: [
      {
        q: "Ich warte ____ den Bus.",
        choices: ["auf", "mit", "von", "zu"],
        answer: 0,
        explanation: "'warten auf' verlangt Akkusativ."
      },
      {
        q: "Er interessiert sich ____ Geschichte.",
        choices: ["für", "an", "mit", "von"],
        answer: 0,
        explanation: "'sich interessieren für' verlangt Akkusativ."
      },
      {
        q: "Wir sprechen ____ das Wetter.",
        choices: ["auf", "über", "mit", "zu"],
        answer: 1,
        explanation: "'sprechen über' verlangt Akkusativ."
      }
    ]
  },
  {
    id: 6,
    title: "Philosophie & Ethik",
    theme: "indigo",
    overview: "In dieser Einheit tauchen wir in die Welt der Philosophie und Ethik ein. Wir erforschen grundlegende Fragen des menschlichen Daseins, moralische Dilemmata und verschiedene philosophische Strömungen. Das Ziel ist es, abstrakte Konzepte zu diskutieren und komplexe Gedankengänge präzise in deutscher Sprache auszudrücken.",
    vocabulary: [
      "Freiheit", "Verantwortung", "Moral", "Ethik", "Gerechtigkeit", "Tugend", "Gewissen", "Dilemma", "Utilitarismus", "Deontologie", "Rationalismus", "Empirismus", "Aufklärung", "Idealismus", "Materialismus", "Existentialismus", "Phänomenologie", "Metaphysik", "Erkenntnistheorie", "Logik", "Argument", "These", "Antithese", "Synthese", "Diskurs", "Kritik", "Reflexion", "Konsequenz", "Prinzip"
    ],
    vocabExamples: {
      de: [
        "Freiheit ist ein hohes Gut in demokratischen Gesellschaften.",
        "Verantwortung zu übernehmen ist ein Zeichen von Reife.",
        "Moralische Prinzipien leiten unser Handeln.",
        "Ethik befasst sich mit moralischen Fragen.",
        "Gerechtigkeit ist ein Ideal in jeder Gesellschaft.",
        "Tugenden sind positive Charaktereigenschaften.",
        "Das Gewissen warnt uns vor Fehlern.",
        "Ein Dilemma ist eine schwierige Entscheidungssituation.",
        "Utilitarismus zielt auf das größte Glück der größten Zahl ab.",
        "Deontologie betont die Pflicht.",
        "Rationalismus setzt auf Vernunft als Erkenntnisquelle.",
        "Empirismus basiert auf Erfahrung.",
        "Die Aufklärung war eine wichtige philosophische Epoche.",
        "Idealismus betont die Rolle des Geistes.",
        "Materialismus geht davon aus, dass alles materiell ist.",
        "Existentialismus befasst sich mit dem Sinn des Daseins.",
        "Phänomenologie ist die Lehre von den Erscheinungen.",
        "Metaphysik ist die Lehre von den ersten Ursachen.",
        "Erkenntnistheorie ist die Lehre vom Wissen.",
        "Logik ist die Lehre vom korrekten Denken.",
        "Ein Argument ist ein Grund.",
        "Eine These ist eine Behauptung.",
        "Eine Antithese ist ein Gegenargument.",
        "Die Synthese ist die Zusammenführung von These und Antithese.",
        "Ein Diskurs ist eine Diskussion.",
        "Kritik ist die Beurteilung.",
        "Reflexion ist das Nachdenken.",
        "Eine Konsequenz ist die Folge.",
        "Ein Prinzip ist ein Grundsatz."
      ]
    },
    grammar: {
      topicEn: "Advanced Adjective Declension",
      topicDe: "Adjektivdeklination (fortgeschritten)",
      explanationDe: "Auf C1-Niveau werden auch komplexere Fälle der Adjektivdeklination beherrscht, wie die Deklination von mehreren Adjektiven vor einem Nomen (z.B. 'das neue, rote Auto'), Adjektive nach unbestimmten Mengenangaben ('viel frisches Obst') oder in speziellen festen Ausdrücken ('das Gute und das Böse').",
      examples: [
        { de: "Das schöne, alte Haus steht am See." },
        { de: "Er hat viel frisches, leckeres Gemüse gekauft." },
        { de: "Sie sprachen über das Schöne im Leben." }
      ]
    },
    reading: {
      title: "Ethik in der Praxis: Ein moralisches Dilemma",
      text: "Ein moralisches Dilemma ist eine Situation, in der man zwischen zwei gleichermaßen unakzeptablen Optionen wählen muss. Solche schwierigen Entscheidungen sind der Kern vieler ethischer Diskussionen. Während der Utilitarismus das größte Glück für die größte Zahl anstrebt, bietet die Deontologie, die sich auf Pflichten und Regeln konzentriert, unterschiedliche Lösungswege an. Das praktische Anwenden dieser komplexen ethischen Theorien erfordert oft ein hohes Maß an kritischem Denken und Empathie. Die Diskussion über diese tiefgreifenden moralischen Fragen fördert das Bewusstsein für die eigene Verantwortung und die Konsequenzen des Handelns. Es ist von großer Bedeutung, dass solche schwierigen Entscheidungen nicht leichtfertig getroffen werden, sondern auf fundierten Überlegungen basieren. Die Auseinandersetzung mit unterschiedlichen philosophischen Perspektiven kann helfen, die eigenen moralischen Standpunkte zu reflektieren und zu festigen.",
      task: "Erklären Sie den Unterschied zwischen Utilitarismus und Deontologie anhand des Textes. Welches 'Dilemma' wird im Text beschrieben? Finden Sie mindestens drei Beispiele für fortgeschrittene Adjektivdeklination im Text und analysieren Sie deren Form."
    },
    speaking: [
      "Diskutieren Sie die Bedeutung von Freiheit und Verantwortung.",
      "Welche ethischen Grundsätze sind für Sie im Alltag am wichtigsten?",
      "Stellen Sie sich vor, Sie müssten eine Entscheidung treffen, die entweder einer Person schadet oder vielen nützt. Wie würden Sie entscheiden?",
      "Erörtern Sie die Rolle der Philosophie für die moderne Gesellschaft.",
      "Sprechen Sie über die Bedeutung des Gewissens."
    ],
    writing: "Schreiben Sie eine philosophische Abhandlung (ca. 180-200 Wörter) über die Frage, ob der Mensch frei in seinen Entscheidungen ist. Beziehen Sie sich dabei auf verschiedene philosophische Strömungen und verwenden Sie mindestens fünf C1-Vokabeln aus dieser Einheit und fortgeschrittene Adjektivdeklinationen.",
    quiz: [
      {
        q: "Das ____ (neu), ____ (rot) Auto ist schön.",
        choices: ["neue, rote", "neue, rotes", "neues, rotes", "neues, rote"],
        answer: 0,
        explanation: "Nach dem bestimmten Artikel 'das' werden Adjektive im Nominativ und Akkusativ Singular neutral mit '-e' dekliniert."
      },
      {
        q: "Er hat viel ____ (gut) Essen gekauft.",
        choices: ["gutes", "gute", "gutem", "guten"],
        answer: 0,
        explanation: "Nach 'viel' wird das Adjektiv stark dekliniert, hier im Akkusativ neutral."
      },
      {
        q: "Wir sprachen über das ____ (gut) und das ____ (böse).",
        choices: ["Gute, Böse", "gute, böse", "Gutes, Böses", "gutes, böses"],
        answer: 0,
        explanation: "Nominalisierte Adjektive werden großgeschrieben und mit dem bestimmten Artikel 'das' verwendet."
      }
    ]
  },
  {
    id: 7,
    title: "Gesundheit & Lebensstil",
    theme: "teal",
    overview: "In dieser Einheit befassen wir uns mit umfassenden Aspekten der Gesundheit und eines bewussten Lebensstils. Wir diskutieren Themen wie mentale Gesundheit, Prävention, Ernährungstrends und die Rolle von Sport. Der Fokus liegt auf der differenzierten Beschreibung von Zuständen und Prozessen sowie der Verwendung spezifischer Fachtermini aus dem Gesundheitsbereich.",
    vocabulary: [
      "Prävention", "Immunsystem", "Stoffwechsel", "chronische Krankheit", "akute Erkrankung", "psychische Gesundheit", "Burnout-Syndrom", "Work-Life-Balance", "Ernährungsumstellung", "Nährstoffe", "Superfoods", "Nahrungsergänzungsmittel", "Sportmedizin", "Rehabilitation", "Fitness", "Achtsamkeit", "Stressbewältigung", "Schlafhygiene", "Suchtprävention", "digitale Entgiftung", "Wohlbefinden", "Resilienz", "Alternsforschung", "Genetik", "Gesundheitssystemreform"
    ],
    vocabExamples: {
      de: [
        "Prävention ist besser als Heilen.",
        "Das Immunsystem schützt vor Krankheiten.",
        "Der Stoffwechsel wandelt Nahrung in Energie um.",
        "Eine chronische Krankheit dauert lange.",
        "Eine akute Erkrankung tritt plötzlich auf.",
        "Psychische Gesundheit ist genauso wichtig wie körperliche.",
        "Das Burnout-Syndrom ist ein Zustand der totalen Erschöpfung.",
        "Eine gute Work-Life-Balance ist entscheidend.",
        "Eine Ernährungsumstellung kann die Gesundheit verbessern.",
        "Nährstoffe sind essenziell für den Körper.",
        "Superfoods sind besonders nährstoffreich.",
        "Nahrungsergänzungsmittel können eine gesunde Ernährung unterstützen.",
        "Sportmedizin befasst sich mit Verletzungen beim Sport.",
        "Rehabilitation hilft bei der Wiederherstellung.",
        "Fitness ist ein Zustand körperlicher Leistungsfähigkeit.",
        "Achtsamkeit hilft, im Moment zu leben.",
        "Stressbewältigung ist wichtig für die mentale Gesundheit.",
        "Schlafhygiene sind Gewohnheiten für besseren Schlaf.",
        "Suchtprävention zielt auf die Vermeidung von Sucht.",
        "Digitale Entgiftung kann helfen, den Kopf freizubekommen.",
        "Wohlbefinden ist ein ganzheitliches Konzept.",
        "Resilienz hilft, Krisen zu überwinden.",
        "Die Alternsforschung sucht Wege, das Altern zu verlangsamen.",
        "Genetik spielt eine Rolle bei vielen Krankheiten.",
        "Eine Gesundheitssystemreform ist oft umstritten."
      ]
    },
    grammar: {
      topicEn: "Complex Sentence Structure (Subordinate Clauses)",
      topicDe: "Komplexer Satzbau (Nebensätze)",
      explanationDe: "C1-Lernende müssen in der Lage sein, komplexe deutsche Sätze mit verschiedenen Arten von Nebensätzen zu bilden und zu verstehen. Dazu gehören Kausalsätze ('weil', 'da'), Finalsätze ('damit', 'um... zu'), Konsekutivsätze ('sodass'), Konditionalsätze ('wenn', 'falls'), Konzessivsätze ('obwohl'), Temporalsätze ('während', 'als', 'nachdem') und Modalsätze ('indem').",
      examples: [
        { de: "Er bleibt zu Hause, weil er krank ist." },
        { de: "Sie trainiert, um fit zu bleiben." },
        { de: "Er las so viel, dass er Kopfschmerzen bekam." },
        { de: "Wenn es regnet, bleiben wir drinnen." }
      ]
    },
    reading: {
      title: "Die Bedeutung der Work-Life-Balance im digitalen Zeitalter",
      text: "In der heutigen digitalisierten Arbeitswelt verschwimmen die Grenzen zwischen Beruf und Privatleben. Dies kann zu einem erhöhten Stresslevel und einem Burnout-Syndrom führen. Eine gesunde Work-Life-Balance ist daher unerlässlich, um die psychische und körperliche Gesundheit zu erhalten. Indem wir bewusst Pausen einlegen und uns Zeit für Erholung nehmen, können wir unsere Resilienz stärken. Es ist wichtig, dass wir uns auch im digitalen Zeitalter um unsere Schlafhygiene kümmern und eine ausgewogene Ernährung pflegen. Obwohl es oft schwierig ist, die Arbeit loszulassen, ist es notwendig, um langfristig leistungsfähig zu bleiben. Die Gesellschaft muss erkennen, dass die Förderung des Wohlbefindens der Mitarbeiter eine Investition in die Zukunft ist.",
      task: "Fassen Sie die Hauptaussagen des Textes über die Work-Life-Balance zusammen. Welche Lösungsansätze werden genannt? Finden Sie mindestens drei Beispiele für Nebensätze im Text und erklären Sie deren Funktion."
    },
    speaking: [
      "Diskutieren Sie die Auswirkungen von Stress auf die Gesundheit und effektive Stressbewältigungsstrategien.",
      "Was bedeutet 'gesunder Lebensstil' für Sie persönlich? Welche Gewohnheiten pflegen Sie?",
      "Erörtern Sie die Rolle der Ernährung für das körperliche Wohlbefinden. Welche Ernährungstrends gibt es und wie bewerten Sie diese?",
      "Sprechen Sie über die Bedeutung von Schlaf und welche Maßnahmen man für eine bessere Schlafhygiene ergreifen kann.",
      "Welche Verantwortung trägt die Gesellschaft bei der Förderung der öffentlichen Gesundheit?"
    ],
    writing: "Verfassen Sie einen Zeitungsartikel (ca. 180-200 Wörter) zum Thema 'Die Herausforderungen der Work-Life-Balance im digitalen Zeitalter'. Diskutieren Sie die Schwierigkeiten, Beruf und Privatleben zu vereinbaren, und schlagen Sie Lösungsansätze vor. Verwenden Sie dabei mindestens fünf C1-Vokabeln aus dieser Einheit und verschiedene Arten von Nebensätzen.",
    quiz: [
      {
        q: "Er kaufte die Fahrkarte, ____ er nach Hause fahren konnte.",
        choices: ["damit", "weil", "als", "obwohl"],
        answer: 0,
        explanation: "'damit' leitet einen Finalsatz ein, der den Zweck ausdrückt."
      },
      {
        q: "____ er müde war, ging er früh ins Bett.",
        choices: ["Obwohl", "Weil", "Wenn", "Als"],
        answer: 0,
        explanation: "'Obwohl' leitet einen Konzessivsatz ein, der einen Gegengrund angibt."
      },
      {
        q: "____ sie in Berlin war, besuchte sie Museen.",
        choices: ["Nachdem", "Wann", "Als", "Während"],
        answer: 3,
        explanation: "'Während' leitet einen Temporalsatz ein, der Gleichzeitigkeit ausdrückt."
      }
    ]
  },
  {
    id: 8,
    title: "Geschichte & Erinnerungskultur",
    theme: "lime",
    overview: "In dieser Einheit befassen wir uns mit wichtigen historischen Ereignissen und ihrer Bedeutung für die Gegenwart. Wir analysieren, wie Gesellschaften mit ihrer Vergangenheit umgehen (Erinnerungskultur) und welche Lehren daraus gezogen werden können. Der Fokus liegt auf der präzisen chronologischen Darstellung und der kritischen Reflexion historischer Prozesse.",
    vocabulary: [
      "Epoche", "Zeitalter", "Antike", "Mittelalter", "Neuzeit", "Revolution", "Reform", "Krieg", "Frieden", "Vertrag", "Kolonialismus", "Globalisierung", "Industrialisierung", "Aufklärung", "Renaissance", "Nationalismus", "Faschismus", "Kommunismus", "Demokratisierung", "Wiedervereinigung", "Erinnerungskultur", "Mahnmal", "Gedenkstätte", "Historiker", "Quelle", "Interpretation", "Vergangenheit", "Gegenwart", "Zukunft", "Historisches Bewusstsein", "Trauma", "Versöhnung"
    ],
    vocabExamples: {
      de: [
        "Jede Epoche hat ihre eigenen Merkmale.",
        "Das Zeitalter der Aufklärung war von Vernunft geprägt.",
        "Die Antike ist die Zeit der alten Griechen und Römer.",
        "Das Mittelalter war die Zeit zwischen Antike und Neuzeit.",
        "Die Neuzeit begann mit der Entdeckung Amerikas.",
        "Die Französische Revolution hat die Welt verändert.",
        "Die Reformation war eine religiöse Reformbewegung.",
        "Krieg ist ein bewaffneter Konflikt.",
        "Frieden ist die Abwesenheit von Krieg.",
        "Ein Vertrag regelt Beziehungen.",
        "Kolonialismus war die Besetzung fremder Gebiete.",
        "Die Globalisierung verbindet die Welt.",
        "Die Industrialisierung veränderte die Produktion.",
        "Die Aufklärung betonte Vernunft und Individualität.",
        "Die Renaissance war eine kulturelle Wiedergeburt.",
        "Nationalismus ist die Überbewertung der eigenen Nation.",
        "Faschismus ist eine totalitäre Ideologie.",
        "Kommunismus strebt eine klassenlose Gesellschaft an.",
        "Demokratisierung ist der Übergang zur Demokratie.",
        "Die Wiedervereinigung Deutschlands war ein historisches Ereignis.",
        "Erinnerungskultur ist der Umgang mit der Vergangenheit.",
        "Ein Mahnmal erinnert an ein schreckliches Ereignis.",
        "Eine Gedenkstätte ehrt die Opfer.",
        "Ein Historiker forscht über die Geschichte.",
        "Eine Quelle ist ein historisches Dokument.",
        "Interpretation ist die Deutung.",
        "Vergangenheit ist das, was war.",
        "Gegenwart ist das, was jetzt ist.",
        "Zukunft ist das, was sein wird.",
        "Historisches Bewusstsein ist wichtig.",
        "Das Trauma des Krieges wirkt lange nach.",
        "Versöhnung ist ein wichtiger Schritt nach Konflikten."
      ]
    },
    grammar: {
      topicEn: "Advanced Uses of the Passive Voice",
      topicDe: "Passiv (Zustands- und Vorgangspassiv) – Fortgeschritten",
      explanationDe: "Auf C1-Niveau wird erwartet, dass man die verschiedenen Formen des Passivs (Vorgangs- und Zustandspassiv) sicher anwendet, auch in Verbindung mit Modalverben, temporären und infiniten Formen. Das Vorgangspassiv ('werden' + Partizip II) betont die Handlung, das Zustandspassiv ('sein' + Partizip II) das Ergebnis. Auch die Umschreibung des Passivs mit 'man' oder 'sich lassen' wird geübt.",
      examples: [
        { de: "Das Haus wird gebaut (Vorgangspassiv)." },
        { de: "Das Haus ist gebaut (Zustandspassiv)." },
        { de: "Man spricht Deutsch (Passiv mit 'man')." },
        { de: "Der Schlüssel lässt sich nicht finden (Passiv mit 'sich lassen')." }
      ]
    },
    reading: {
      title: "Die Rolle der Erinnerungskultur in der modernen Gesellschaft",
      text: "Die Erinnerungskultur ist entscheidend, um aus der Vergangenheit zu lernen und Fehler nicht zu wiederholen. Indem wir uns an historische Ereignisse erinnern, können wir ein kritisches Bewusstsein für die Gegenwart entwickeln. Ein Mahnmal ist nicht nur ein Ort des Gedenkens, sondern auch eine Aufforderung, sich mit der Geschichte auseinanderzusetzen. Die Geschichte muss von den folgenden Generationen interpretiert werden, denn nur so können die Lehren der Vergangenheit für die Zukunft nutzbar gemacht werden. Es ist wichtig, dass die Opfer von Kriegen und Diktaturen nicht vergessen werden. Die Forschung über diese Themen wird oft von staatlichen Stellen gefördert, sodass die wissenschaftliche Aufarbeitung gesichert ist.",
      task: "Fassen Sie die Hauptaussagen des Textes über die Erinnerungskultur zusammen. Welche Argumente werden für ihre Bedeutung genannt? Finden Sie mindestens drei Beispiele für verschiedene Passivkonstruktionen im Text und erklären Sie deren Funktion."
    },
    speaking: [
      "Diskutieren Sie die Bedeutung von Gedenkstätten und Mahnmalen.",
      "Stellen Sie sich vor, Sie könnten mit einer historischen Persönlichkeit sprechen. Wen würden Sie wählen und welche Fragen stellen?",
      "Erörtern Sie die Rolle von Kriegen und Friedensverträgen in der Geschichte.",
      "Sprechen Sie über die Auswirkungen des Kolonialismus auf die betroffenen Länder und die Welt heute."
    ],
    writing: "Schreiben Sie einen Essay (ca. 180-200 Wörter) zum Thema 'Die Lehren aus der Geschichte: Warum wir uns an die Vergangenheit erinnern müssen'. Diskutieren Sie, welche Bedeutung historische Ereignisse für die Gegenwart und Zukunft haben und wie wir aus Fehlern lernen können. Verwenden Sie dabei mindestens fünf C1-Vokabeln aus dieser Einheit und verschiedenerlei Passivkonstruktionen.",
    quiz: [
      {
        q: "Das Auto ____ (reparieren) gerade.",
        choices: ["wird", "wurde", "ist", "hat"],
        answer: 0,
        explanation: "Vorgangspassiv Präsens: 'wird' + Partizip II ('repariert')."
      },
      {
        q: "Das Haus ____ (bauen) schon.",
        choices: ["wird", "wurde", "ist", "hat"],
        answer: 2,
        explanation: "Zustandspassiv Präsens: 'ist' + Partizip II ('gebaut')."
      },
      {
        q: "Der Kuchen ____ (backen) gestern.",
        choices: ["wird", "wurde", "ist", "hat"],
        answer: 1,
        explanation: "Vorgangspassiv Präteritum: 'wurde' + Partizip II ('gebacken')."
      }
    ]
  },
  {
    id: 9,
    title: "Umwelt & Nachhaltigkeit",
    theme: "cyan",
    overview: "In dieser Einheit befassen wir uns mit globalen Umweltproblemen und nachhaltigen Lösungsansätzen. Wir diskutieren Themen wie Kreislaufwirtschaft, Klimagerechtigkeit, Artenschutz und umweltfreundliche Technologien. Der Fokus liegt auf der präzisen Argumentation und dem Einsatz von komplexen Adverbien und Adverbialsätzen.",
    vocabulary: [
      "Kreislaufwirtschaft", "Biodiversität", "Klimagerechtigkeit", "Emissionshandel", "Ressourceneffizienz", "Ökosystem", "Artenvielfalt", "Umweltauflagen", "Grüne Technologien", "Nachhaltiger Konsum", "Entwicklungsländer", "Industrieländer", "Umweltpolitik", "Klimakonferenz", "Naturkatastrophe", "Anpassungsstrategie", "Umweltbewusstsein", "Generationengerechtigkeit"
    ],
    vocabExamples: {
      de: [
        "Die Kreislaufwirtschaft minimiert Abfall.",
        "Biodiversität ist die Vielfalt des Lebens.",
        "Klimagerechtigkeit fordert faire Lastenverteilung.",
        "Emissionshandel soll Emissionen reduzieren.",
        "Ressourceneffizienz spart Rohstoffe.",
        "Ein gesundes Ökosystem ist für die Natur wichtig.",
        "Artenvielfalt ist ein Zeichen intakter Natur.",
        "Umweltauflagen schützen die Umwelt.",
        "Grüne Technologien sind umweltfreundlich.",
        "Nachhaltiger Konsum schont Ressourcen.",
        "Entwicklungsländer brauchen Unterstützung.",
        "Industrieländer haben eine besondere Verantwortung.",
        "Eine effektive Umweltpolitik ist notwendig.",
        "Klimakonferenzen finden regelmäßig statt."
      ]
    },
    grammar: {
      topicEn: "Advanced Adverbs and Adverbial Clauses",
      topicDe: "Adverbien und Adverbialsätze (fortgeschritten)",
      explanationDe: "C1-Lernende verwenden auch komplexere Adverbien und Adverbialsätze, um logische Beziehungen auszudrücken. Dazu gehören Adverbien wie 'infolgedessen', 'demzufolge', 'nichtsdestotrotz' und Adverbialsätze wie 'indem' (modal) oder 'obwohl' (konzessiv). Diese helfen, Argumente klar zu strukturieren und komplexe Sachverhalte präzise darzustellen.",
      examples: [
        { de: "Er hat hart gearbeitet; infolgedessen hat er Erfolg." },
        { de: "Die Regierung hat neue Gesetze erlassen, um die Umwelt zu schützen." },
        { de: "Die Recyclingquote muss erhöht werden; demzufolge sind neue Maßnahmen nötig." }
      ]
    },
    reading: {
      title: "Die Rolle der Kreislaufwirtschaft für eine nachhaltige Zukunft",
      text: "Die Kreislaufwirtschaft gewinnt zunehmend an Bedeutung als Lösungsansatz für globale Umweltprobleme, insbesondere im Hinblick auf Ressourcenschonung und Abfallreduzierung. Anders als im traditionellen linearen Wirtschaftsmodell, in dem Produkte hergestellt, genutzt und dann entsorgt werden, zielt die Kreislaufwirtschaft darauf ab, Produkte und Materialien so lange wie möglich in Gebrauch zu halten. Demzufolge wird Abfall minimiert und die Notwendigkeit neuer Rohstoffe reduziert. Dies ist von entscheidender Bedeutung, da die Welt mit einer wachsenden Ressourcenknappheit und Umweltverschmutzung konfrontiert ist. Industrieländer tragen hier eine besondere Verantwortung. Sie müssen ihre Politik so anpassen, dass die Kreislaufwirtschaft gefördert wird. Nichtsdestotrotz ist der Übergang zu diesem Modell eine große Herausforderung für alle Akteure.",
      task: "Fassen Sie die Hauptaussagen des Textes über die Kreislaufwirtschaft zusammen. Was sind die Hauptunterschiede zum linearen Modell? Finden Sie mindestens zwei Beispiele für fortgeschrittene Adverbien oder Adverbialsätze im Text und erklären Sie deren Funktion."
    },
    speaking: [
      "Diskutieren Sie die Rolle der Industrieländer bei der Bekämpfung des Klimawandels.",
      "Welche Maßnahmen können wir ergreifen, um nachhaltiger zu konsumieren?",
      "Erörtern Sie die Chancen und Risiken der grünen Technologien.",
      "Sprechen Sie über die Bedeutung von Biodiversität für das Ökosystem."
    ],
    writing: "Schreiben Sie einen Meinungsartikel (ca. 180-200 Wörter) zum Thema 'Nachhaltiger Konsum: Zwischen individueller Verantwortung und politischer Steuerung'. Diskutieren Sie die Rollen des Einzelnen und der Regierung. Verwenden Sie dabei mindestens fünf C1-Vokabeln aus dieser Einheit und verschiedene Adverbien/Adverbialsätze."
  },
  {
    id: 10,
    title: "Kunst & Kreativität",
    theme: "fuchsia",
    overview: "In dieser Einheit erkunden wir die Welt der Kunst und Kreativität, von der bildenden Kunst über die Musik bis hin zur digitalen Kunst. Wir diskutieren die Rolle der Kunst in der Gesellschaft, verschiedene Stilrichtungen und die Verbindung zwischen Kunst und Technologie. Der Fokus liegt auf der präzisen Beschreibung von künstlerischen Werken und der Verwendung von Fachtermini.",
    vocabulary: [
      "Malerei", "Skulptur", "Architektur", "Fotografie", "Film", "Musik", "Literatur", "Theater", "Tanz", "Kreativität", "Inspiration", "Originalität", "Ästhetik", "Stilrichtung", "Impressionismus", "Expressionismus", "Kubismus", "Surrealismus", "Abstraktion", "Figuration", "Symbolik", "Metapher", "Allegorie", "Interpretation", "Rezeption", "Kritik", "Kunstwerk", "Künstler", "Publikum", "Ausstellung", "Galerie", "Museum", "Subvention", "Mäzen"
    ],
    vocabExamples: {
      de: [
        "Die Malerei ist eine der ältesten Kunstformen.",
        "Eine Skulptur ist eine dreidimensionale Darstellung.",
        "Architektur ist die Kunst des Bauens.",
        "Die Fotografie ist ein relativ neues Medium.",
        "Film ist eine Kunstform, die bewegte Bilder nutzt.",
        "Musik kann Emotionen transportieren.",
        "Literatur umfasst Romane, Gedichte und Dramen.",
        "Theater ist eine Live-Performance-Kunst.",
        "Tanz ist die Kunst der Bewegung.",
        "Kreativität ist die Fähigkeit, etwas Neues zu schaffen.",
        "Inspiration ist die Quelle neuer Ideen.",
        "Originalität ist die Einzigartigkeit eines Werks.",
        "Ästhetik befasst sich mit dem Schönen.",
        "Stilrichtungen beschreiben die Merkmale einer Epoche.",
        "Impressionismus fängt den Moment ein.",
        "Expressionismus drückt Gefühle aus.",
        "Kubismus zerlegt Objekte in geometrische Formen.",
        "Surrealismus zeigt die Welt des Unterbewusstseins.",
        "Abstraktion ist die Loslösung von der Realität.",
        "Figuration ist die Darstellung von Dingen.",
        "Symbolik verwendet Zeichen.",
        "Eine Metapher ist ein bildlicher Vergleich.",
        "Eine Allegorie ist eine erweiterte Metapher.",
        "Die Interpretation ist die Deutung eines Werks.",
        "Die Rezeption ist die Art, wie ein Werk aufgenommen wird.",
        "Kritik ist die Beurteilung.",
        "Ein Kunstwerk ist ein kreatives Produkt.",
        "Ein Künstler schafft Kunst.",
        "Das Publikum sind die Betrachter.",
        "Eine Ausstellung zeigt Kunst.",
        "Eine Galerie verkauft Kunst.",
        "Ein Museum sammelt und bewahrt Kunst.",
        "Subventionen unterstützen die Kunst.",
        "Ein Mäzen ist ein Förderer der Kunst."
      ]
    },
    grammar: {
      topicEn: "Connective Adverbs",
      topicDe: "Bindeadverbien",
      explanationDe: "Auf C1-Niveau können komplexe Satzstrukturen mit Bindeadverbien wie 'darüber hinaus', 'zudem', 'des Weiteren', 'einerseits ... andererseits' und 'insofern' verwendet werden. Diese Adverbien dienen dazu, Sätze und Satzteile logisch miteinander zu verknüpfen und dem Text Struktur zu geben. Sie drücken Beziehungen wie Addition, Gegensatz oder Einschränkung aus.",
      examples: [
        { de: "Der Film war spannend, darüber hinaus war die schauspielerische Leistung herausragend." },
        { de: "Einerseits ist Kunst eine individuelle Ausdrucksform, andererseits hat sie eine gesellschaftliche Funktion." },
        { de: "Zudem ist die Musik von großer Bedeutung." }
      ]
    },
    reading: {
      title: "Die Rolle der Kunst im digitalen Zeitalter",
      text: "Die Digitalisierung hat auch die Kunstwelt revolutioniert. Einerseits ermöglicht sie Künstlern neue Ausdrucksformen, indem sie digitale Medien nutzen. Andererseits steht sie traditionelle Kunstformen vor neue Herausforderungen. Darüber hinaus hat das Internet die Rezeption von Kunst verändert, da Kunstwerke nun einem globalen Publikum zugänglich gemacht werden können. Die Frage nach der Originalität von digitaler Kunst wird jedoch kontrovers diskutiert. Insofern ist die Kunstwelt mit grundlegenden ethischen und ästhetischen Fragen konfrontiert. Zudem spielen soziale Medien eine immer wichtigere Rolle für die Karriere von jungen Künstlern, da sie dort ihre Werke einem breiten Publikum präsentieren können. Des Weiteren ermöglicht die digitale Kunst neue Formen der Interaktion mit dem Publikum.",
      task: "Fassen Sie die Hauptaussagen des Textes über die Digitalisierung der Kunst zusammen. Welche Chancen und Herausforderungen werden genannt? Finden Sie mindestens drei Beispiele für Bindeadverbien im Text und erklären Sie deren Funktion."
    },
    speaking: [
      "Diskutieren Sie die Rolle der Kunst für die Gesellschaft.",
      "Was bedeutet Kreativität für Sie persönlich?",
      "Erörtern Sie die Chancen und Risiken der digitalen Kunst.",
      "Sprechen Sie über die Bedeutung von Musik in Ihrem Leben."
    ],
    writing: "Schreiben Sie einen Essay (ca. 180-200 Wörter) zum Thema 'Die Zukunft der Kunst: Zwischen Tradition und Innovation'. Diskutieren Sie, wie sich die Kunstwelt im digitalen Zeitalter verändern wird und welche Rolle der Mensch in diesem Prozess spielt. Verwenden Sie dabei mindestens fünf C1-Vokabeln aus dieser Einheit und verschiedene Bindeadverbien."
  },
  {
    id: 11,
    title: "Wissenschaft & Forschung",
    theme: "lime",
    overview: "In dieser Einheit befassen wir uns mit der wissenschaftlichen Arbeitsweise, dem Forschungsprozess und der Rolle der Wissenschaft in der Gesellschaft. Wir lernen Vokabular und grammatische Strukturen, um Forschungsergebnisse zu beschreiben, Hypothesen zu formulieren und wissenschaftliche Texte zu verfassen. Der Fokus liegt auf der präzisen und objektiven Sprache.",
    vocabulary: [
      "Wissenschaft", "Forschung", "Hypothese", "Theorie", "Experiment", "Datenanalyse", "Publikation", "Peer-Review", "Innovation", "Durchbruch", "Forschungsergebnisse", "Patent", "Ethikkommission", "Plagiat", "Objektivität", "Reproduzierbarkeit", "Interdisziplinär", "Zusammenarbeit", "Förderung", "Subvention", "Labor", "Universität", "Akademie", "Wissenschaftler", "Doktorarbeit", "Habilitation", "Kongress"
    ],
    vocabExamples: {
      de: [
        "Wissenschaft strebt nach Wissen.",
        "Forschung ist die Suche nach Neuem.",
        "Eine Hypothese ist eine Annahme.",
        "Eine Theorie ist ein erklärendes Modell.",
        "Ein Experiment ist ein Versuch.",
        "Datenanalyse ist die Auswertung von Daten.",
        "Eine Publikation ist eine Veröffentlichung.",
        "Peer-Review ist die Begutachtung durch Kollegen.",
        "Innovation ist die Umsetzung neuer Ideen.",
        "Ein Durchbruch ist eine wichtige Entdeckung.",
        "Forschungsergebnisse werden publiziert.",
        "Ein Patent schützt die Erfindung.",
        "Eine Ethikkommission prüft ethische Fragen.",
        "Plagiat ist Diebstahl geistigen Eigentums.",
        "Objektivität ist die Unabhängigkeit von Meinungen.",
        "Reproduzierbarkeit ist die Wiederholbarkeit.",
        "Interdisziplinär ist die Zusammenarbeit zwischen Fächern.",
        "Zusammenarbeit ist das gemeinsame Arbeiten.",
        "Förderung ist die finanzielle Unterstützung.",
        "Subventionen sind staatliche Gelder.",
        "Ein Labor ist ein Ort für Experimente.",
        "Eine Universität ist eine Hochschule.",
        "Eine Akademie ist eine wissenschaftliche Vereinigung.",
        "Ein Wissenschaftler forscht.",
        "Eine Doktorarbeit ist eine Dissertation.",
        "Eine Habilitation ist eine Qualifikation.",
        "Ein Kongress ist eine große Fachtagung."
      ]
    },
    grammar: {
      topicEn: "Advanced Noun and Verb Structures",
      topicDe: "Nominalisierung und erweiterte Verbstrukturen",
      explanationDe: "Auf C1-Niveau wird erwartet, dass Lernende komplexe Sachverhalte durch Nominalisierung präzise ausdrücken können. Dazu gehören die Umwandlung von Verben und Adjektiven in Nomen (z.B. 'die Forschung des Themas' statt 'das Thema erforschen') und erweiterte Verbstrukturen, die Nebensätze ersetzen (z.B. 'die Ergebnisse zeigend...' statt 'die Ergebnisse, die zeigen...').",
      examples: [
        { de: "Die Entwicklung des Projekts ist entscheidend. (Nominalisierung)" },
        { de: "Die vom Team durchgeführte Forschung war erfolgreich. (erweiterte Verbstruktur)" }
      ]
    },
    reading: {
      title: "Die Rolle der Grundlagenforschung",
      text: "Grundlagenforschung ist essenziell für den wissenschaftlichen Fortschritt. Anders als die angewandte Forschung, die auf unmittelbare praktische Anwendung abzielt, verfolgt die Grundlagenforschung das Ziel, neues Wissen zu generieren. Die Entdeckung der DNA-Struktur war ein solcher Durchbruch, der die Medizin revolutionierte. Das Finden von Lösungen für globale Probleme wie Klimawandel und Krankheiten ist nur durch die Förderung der Grundlagenforschung möglich. Die von Universitäten und privaten Stiftungen unterstützte Forschung ist oft interdisziplinär, indem verschiedene Fachbereiche zusammenarbeiten. Die Publikation der Forschungsergebnisse in Fachzeitschriften ist unerlässlich, um das Wissen mit der internationalen wissenschaftlichen Gemeinschaft zu teilen. Die strikte Einhaltung ethischer Grundsätze und die Vermeidung von Plagiaten sind dabei von größter Bedeutung, um die Glaubwürdigkeit der Wissenschaft zu sichern. Das Überprüfen von Hypothesen durch Experimente ist die Basis jeder wissenschaftlichen Arbeit.",
      task: "Erklären Sie den Unterschied zwischen Grundlagenforschung und angewandter Forschung anhand des Textes. Welche Rolle spielen Publikationen? Finden Sie mindestens drei Beispiele für Nominalisierung oder erweiterte Verbstrukturen im Text und erklären Sie deren Funktion."
    },
    speaking: [
      "Diskutieren Sie die Bedeutung der wissenschaftlichen Objektivität.",
      "Was sind die Herausforderungen bei der Forschung?",
      "Stellen Sie sich vor, Sie könnten ein bahnbrechendes Experiment durchführen. Welches wäre das und warum?",
      "Erörtern Sie die Rolle der internationalen Zusammenarbeit in der Wissenschaft.",
      "Sprechen Sie über die ethischen Aspekte der Forschung."
    ],
    writing: "Schreiben Sie einen Aufsatz (ca. 180-200 Wörter) zum Thema 'Die Zukunft der Wissenschaft: Zwischen Freiheit und Verantwortung'. Diskutieren Sie, wie Wissenschaftler ihre Freiheit nutzen sollten und welche Verantwortung sie gegenüber der Gesellschaft haben. Verwenden Sie dabei mindestens fünf C1-Vokabeln aus dieser Einheit und verschiedene Nominalisierungskonstruktionen.",
    quiz: [
      {
        q: "Das ____ (schreiben) der Masterarbeit dauert lange.",
        choices: ["Schreiben", "schreiben", "Geschriebene", "schreibend"],
        answer: 0,
        explanation: "Nominalisierung des Verbs 'schreiben' wird großgeschrieben."
      },
      {
        q: "Die von uns ____ (erhalten) Daten sind wichtig.",
        choices: ["erhaltenen", "erhalten", "erhaltende", "erhaltend"],
        answer: 0,
        explanation: "Partizip II 'erhalten' in einer erweiterten Partizipialkonstruktion wird dekliniert."
      },
      {
        q: "Das ____ (schnell) Laufen ist gesund.",
        choices: ["schnelles", "schnelle", "schnell", "schnellen"],
        answer: 1,
        explanation: "Nominalisiertes Adjektiv 'schnelle' wird großgeschrieben und schwach dekliniert."
      }
    ]
  },
  {
    id: 12,
    title: "Tourismus & Reisen",
    theme: "orange",
    overview: "In dieser Einheit befassen wir uns mit dem Thema Reisen und Tourismus. Wir lernen Vokabular und grammatische Strukturen, um über Reiseziele, Transportmittel, Kulturen und Abenteuer zu sprechen. Der Fokus liegt auf der Beschreibung von Reiseerfahrungen und der Verwendung von komplexen Vergleichen und Ausdrucksweisen.",
    vocabulary: [
      "Reiseziel", "Reiseführer", "Sehenswürdigkeit", "Landschaft", "Kultur", "Gastfreundschaft", "Abenteuer", "Erholung", "Entdeckung", "Ausland", "Heimatland", "Transportmittel", "Flugzeug", "Zug", "Bus", "Schiff", "Mietwagen", "Verkehrsmittel", "Nachhaltiger Tourismus", "Massentourismus", "Individualreise", "Rucksacktourismus", "Sprachreise", "Austauschprogramm", "Tourist", "Reisende", "Einheimische", "Sicherheitsvorkehrungen", "Reiseversicherung"
    ],
    vocabExamples: {
      de: [
        "Mein liebstes Reiseziel ist Italien.",
        "Ein guter Reiseführer ist Gold wert.",
        "Die Eiffelturm ist eine berühmte Sehenswürdigkeit.",
        "Die Landschaft in den Alpen ist atemberaubend.",
        "Man muss die Kultur eines Landes respektieren.",
        "Die Gastfreundschaft der Menschen ist großartig.",
        "Eine Reise kann ein echtes Abenteuer sein.",
        "Ich brauche eine Erholung von der Arbeit.",
        "Reisen ist eine Entdeckung der Welt und von sich selbst.",
        "Im Ausland ist alles anders.",
        "Mein Heimatland ist Deutschland.",
        "Welche Transportmittel bevorzugen Sie?",
        "Flugzeug ist das schnellste Transportmittel.",
        "Zugfahren ist oft entspannend.",
        "Busreisen sind günstig.",
        "Schiffsreisen sind oft luxuriös.",
        "Ein Mietwagen gibt einem Flexibilität.",
        "Öffentliche Verkehrsmittel sind umweltfreundlich.",
        "Nachhaltiger Tourismus schont die Umwelt.",
        "Massentourismus kann negative Folgen haben.",
        "Eine Individualreise ist persönlich.",
        "Rucksacktourismus ist eine Art, günstig zu reisen.",
        "Eine Sprachreise verbessert Sprachkenntnisse.",
        "Ein Austauschprogramm bietet tiefe Einblicke.",
        "Ein Tourist ist jemand, der reist.",
        "Ein Reisender ist jemand, der unterwegs ist.",
        "Ein Einheimischer lebt dort.",
        "Sicherheitsvorkehrungen sind wichtig.",
        "Eine Reiseversicherung ist ratsam."
      ]
    },
    grammar: {
      topicEn: "Complex Comparisons and Figurative Language",
      topicDe: "Komplexe Vergleiche und bildhafte Ausdrücke",
      explanationDe: "Auf C1-Niveau können Lernende komplexe Vergleiche und bildhafte Ausdrücke verwenden, um ihre Erfahrungen lebendig zu beschreiben. Dazu gehören Vergleiche mit 'als ob', 'wie' und bildhafte Ausdrücke, die das Gesagte anschaulicher machen (z.B. 'etwas auf die Goldwaage legen').",
      examples: [
        { de: "Es war, als ob ich in eine andere Welt eintauchte. (als ob)" },
        { de: "Das Wetter war so schön wie im Bilderbuch. (wie)" },
        { de: "Die Gastfreundschaft der Menschen war unbeschreiblich gut." }
      ]
    },
    reading: {
      title: "Die Zukunft des Reisens: Zwischen Abenteuer und Verantwortung",
      text: "Reisen war schon immer eine Entdeckung der Welt und von sich selbst. Heute stehen wir jedoch vor neuen Herausforderungen. Einerseits hat der Massentourismus negative Auswirkungen auf die Umwelt und die lokalen Kulturen. Andererseits ermöglicht er vielen Menschen den Zugang zu anderen Ländern und Kulturen. Die Nachfrage nach nachhaltigem Tourismus wächst, sodass neue Konzepte wie Rucksacktourismus und Individualreisen an Bedeutung gewinnen. Es ist wichtig, dass wir uns als Reisende unserer Verantwortung bewusst sind. Indem wir die Einheimischen respektieren und umweltbewusst handeln, können wir dazu beitragen, die Reiseziele für die nächsten Generationen zu erhalten. Die Landschaft im Süden war atemberaubend, als ob sie aus einem Gemälde stammte. Zudem ist die Verwendung öffentlicher Verkehrsmittel vor Ort eine gute Möglichkeit, den eigenen ökologischen Fußabdruck zu reduzieren. Es war ein unvergessliches Abenteuer.",
      task: "Fassen Sie die Hauptaussagen des Textes über die Zukunft des Reisens zusammen. Welche Vor- und Nachteile des Massentourismus werden genannt? Finden Sie mindestens drei Beispiele für komplexe Vergleiche oder Adverbien im Text und erklären Sie deren Funktion."
    },
    speaking: [
      "Diskutieren Sie die Vor- und Nachteile des Massentourismus.",
      "Was bedeutet 'nachhaltiger Tourismus' für Sie?",
      "Stellen Sie sich vor, Sie planen eine Traumreise. Wohin würden Sie reisen und warum?",
      "Erörtern Sie die Rolle von Sprachreisen und Austauschprogrammen für die persönliche Entwicklung.",
      "Sprechen Sie über die Bedeutung der Reiseversicherung."
    ],
    writing: "Schreiben Sie einen Reisebericht (ca. 180-200 Wörter) über eine Ihrer Reisen. Beschreiben Sie die Landschaft, die Kultur und die Menschen. Verwenden Sie dabei mindestens fünf C1-Vokabeln aus dieser Einheit und verschiedene komplexe Vergleiche."
  }
];

// Color Themes
const colorThemes = {
  violet: {
    bg: 'bg-violet-100',
    text: 'text-violet-800',
    border: 'border-violet-600',
    gradient: 'from-violet-500 to-purple-500'
  },
  sky: {
    bg: 'bg-sky-100',
    text: 'text-sky-800',
    border: 'border-sky-600',
    gradient: 'from-sky-500 to-cyan-500'
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-600',
    gradient: 'from-amber-500 to-orange-500'
  },
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-600',
    gradient: 'from-emerald-500 to-green-500'
  },
  rose: {
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-600',
    gradient: 'from-rose-500 to-pink-500'
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-600',
    gradient: 'from-indigo-500 to-blue-500'
  },
  teal: {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-600',
    gradient: 'from-teal-500 to-cyan-500'
  },
  fuchsia: {
    bg: 'bg-fuchsia-100',
    text: 'text-fuchsia-800',
    border: 'border-fuchsia-600',
    gradient: 'from-fuchsia-500 to-purple-500'
  },
  lime: {
    bg: 'bg-lime-100',
    text: 'text-lime-800',
    border: 'border-lime-600',
    gradient: 'from-lime-500 to-green-500'
  },
  cyan: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-600',
    gradient: 'from-cyan-500 to-sky-500'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-600',
    gradient: 'from-orange-500 to-red-500'
  },
  pink: {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    border: 'border-pink-600',
    gradient: 'from-pink-500 to-rose-500'
  },
};


const App = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isVocabAudioLoading, setIsVocabAudioLoading] = useState(false);
    const [vocabAudioUrl, setVocabAudioUrl] = useState(null);
    const [isLoadingGrammarAI, setIsLoadingGrammarAI] = useState(false);
    const [grammarAIResponse, setGrammarAIResponse] = useState(null);
    const [isLoadingVocabAI, setIsLoadingVocabAI] = useState(false);
    const [vocabAIResponse, setVocabAIResponse] = useState(null);
    const [isLoadingSpeechAI, setIsLoadingSpeechAI] = useState(false);
    const [speechAIResponse, setSpeechAIResponse] = useState(null);

    const unitTheme = useMemo(() => {
        if (selectedUnit) {
            return colorThemes[selectedUnit.theme];
        }
        return null;
    }, [selectedUnit]);

    const handleStartQuiz = () => {
        setCurrentQuestion(0);
        setShowAnswer(false);
        setUserAnswer(null);
        setIsCorrect(null);
        setCurrentPage('quiz');
    };

    const handleNextQuestion = () => {
        if (currentQuestion < selectedUnit.quiz.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setShowAnswer(false);
            setUserAnswer(null);
            setIsCorrect(null);
        } else {
            alert('Quiz finished!');
            setCurrentPage('unit');
        }
    };

    const handleAnswer = (index) => {
        setUserAnswer(index);
        setShowAnswer(true);
        setIsCorrect(index === selectedUnit.quiz[currentQuestion].answer);
    };

    const handleBack = () => {
        if (currentPage === 'unit') {
            setSelectedUnit(null);
            setCurrentPage('home');
            setGrammarAIResponse(null);
            setVocabAIResponse(null);
            setSpeechAIResponse(null);
        } else if (currentPage === 'quiz' || currentPage === 'ai-grammar' || currentPage === 'ai-vocab' || currentPage === 'ai-speech') {
            setCurrentPage('unit');
            setGrammarAIResponse(null);
            setVocabAIResponse(null);
            setSpeechAIResponse(null);
        }
    };

    const getAiResponse = useCallback(async (model, prompt, unit) => {
        // Placeholder for AI API call
        console.log(`Calling AI model: ${model} with prompt: ${prompt}`);
        // Simulate AI response for demonstration
        if (model === 'grammar') {
            setIsLoadingGrammarAI(true);
            const relatedGrammar = grammarLibraryGerman.find(g => g.key === unit.grammar.topicEn.toLowerCase().replace(/ /g, '_').replace(/[\(\)]/g, ''));
            setTimeout(() => {
                setGrammarAIResponse({
                    response: `Grammar explanation for "${unit.grammar.topicDe}":\n\n${unit.grammar.explanationDe}\n\nExamples:\n${unit.grammar.examples.map(ex => `- ${ex.de}`).join('\n')}`,
                    relatedInfo: relatedGrammar
                });
                setIsLoadingGrammarAI(false);
            }, 1500);
        } else if (model === 'vocab') {
            setIsLoadingVocabAI(true);
            setTimeout(() => {
                const selectedVocab = unit.vocabulary.slice(0, 5).join(', ');
                setVocabAIResponse({
                    response: `Here are some key vocabulary words from this unit: ${selectedVocab}. We can analyze their use in context.`,
                });
                setIsLoadingVocabAI(false);
            }, 1500);
        } else if (model === 'speech') {
            setIsLoadingSpeechAI(true);
            setTimeout(() => {
                setSpeechAIResponse({
                    response: "Your pronunciation is very clear! Try to focus on the 'ch' sound in 'Ich'."
                });
                setIsLoadingSpeechAI(false);
            }, 1500);
        }
    }, [grammarLibraryGerman]);

    const startRecording = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    setIsRecording(true);
                    const audioChunks = [];
                    mediaRecorder.addEventListener("dataavailable", event => {
                        audioChunks.push(event.data);
                    });
                    mediaRecorder.addEventListener("stop", () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        setAudioBlob(audioBlob);
                        setIsRecording(false);
                    });
                    setTimeout(() => {
                        mediaRecorder.stop();
                    }, 5000); // Record for 5 seconds
                });
        } else {
            alert("Audio recording is not supported in this browser.");
        }
    };

    const getVocabAudio = async () => {
        setIsVocabAudioLoading(true);
        setVocabAudioUrl(null);
        const text = selectedUnit.vocabulary[Math.floor(Math.random() * selectedUnit.vocabulary.length)];
        const response = {
            audioContent: "UklGRoAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRIAAAD//wABAAAAAQAAAABAAAAAAAAAAEAAQAA"
        };
        const arrayBuffer = base64ToArrayBuffer(response.audioContent);
        const blob = pcmToWav(new Int16Array(arrayBuffer), 16000);
        const audioUrl = URL.createObjectURL(blob);
        setVocabAudioUrl(audioUrl);
        setIsVocabAudioLoading(false);
    };

    const renderHeader = () => (
        <div className="flex justify-between items-center py-4 px-6 bg-gray-100 border-b border-gray-200">
            {currentPage !== 'home' && (
                <button onClick={handleBack} className="p-2 rounded-full hover:bg-gray-200">
                    <ChevronLeft />
                </button>
            )}
            <h1 className="text-2xl font-bold text-gray-800 flex-1 text-center">
                C1 Deutschkurs
            </h1>
            {currentPage === 'home' && (
                <button className="p-2 rounded-full opacity-0 cursor-default">
                    <ChevronLeft />
                </button>
            )}
        </div>
    );

    const renderUnitCard = (unit) => (
        <motion.div
            key={unit.id}
            className={`p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 cursor-pointer border-l-4 ${colorThemes[unit.theme].bg} ${colorThemes[unit.theme].border} group`}
            onClick={() => { setSelectedUnit(unit); setCurrentPage('unit'); }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center space-x-4 mb-2">
                <div className={`p-3 rounded-full bg-white/50`}>
                    <BookOpen className={colorThemes[unit.theme].text} />
                </div>
                <h2 className={`text-xl font-bold ${colorThemes[unit.theme].text}`}>{unit.title}</h2>
            </div>
            <p className={`text-gray-600 group-hover:text-gray-800`}>{unit.overview.split('. ')[0]}.</p>
        </motion.div>
    );

    const renderLessonSection = (title, icon, content, action, isLoading) => (
        <motion.div
            key={title}
            className={`flex items-center justify-between p-4 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 cursor-pointer hover:bg-gray-50 mb-3`}
            onClick={action && !isLoading ? action : null}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${unitTheme.bg} text-white`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`text-lg font-semibold ${unitTheme.text}`}>{title}</h3>
                    <p className="text-gray-500 text-sm">{content}</p>
                </div>
            </div>
            {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
            ) : (
                <ChevronRight className="text-gray-400 group-hover:text-gray-600" />
            )}
        </motion.div>
    );

    const renderQuiz = () => {
        const currentQuiz = selectedUnit.quiz[currentQuestion];
        return (
            <div className="p-6 bg-white min-h-screen">
                <h2 className={`text-3xl font-bold mb-4 ${unitTheme.text}`}>{selectedUnit.title} Quiz</h2>
                <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
                    <p className="text-xl text-gray-800 font-medium mb-4">
                        Question {currentQuestion + 1} of {selectedUnit.quiz.length}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mb-6">{currentQuiz.q}</p>
                    <div className="space-y-4">
                        {currentQuiz.choices.map((choice, index) => (
                            <button
                                key={index}
                                onClick={() => !showAnswer && handleAnswer(index)}
                                className={`w-full text-left p-4 rounded-md border-2 transition-all duration-300
                                    ${showAnswer ? (index === currentQuiz.answer ? 'bg-green-100 border-green-600 text-green-800' : (userAnswer === index ? 'bg-red-100 border-red-600 text-red-800' : 'bg-white border-gray-300')) : 'bg-white border-gray-300 hover:bg-gray-100'}
                                `}
                                disabled={showAnswer}
                            >
                                {choice}
                                {showAnswer && (
                                    <span className="ml-2">
                                        {index === currentQuiz.answer ? '✅' : (userAnswer === index ? '❌' : '')}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    {showAnswer && (
                        <div className="mt-6 p-4 rounded-md bg-gray-100 border border-gray-300">
                            <h4 className="font-bold text-gray-800">Explanation:</h4>
                            <p className="text-gray-600">{currentQuiz.explanation}</p>
                        </div>
                    )}
                    <div className="mt-6 flex justify-end">
                        {showAnswer && (
                            <button
                                onClick={handleNextQuestion}
                                className={`bg-gray-800 text-white py-2 px-6 rounded-md shadow-lg hover:bg-gray-700 transition-all duration-200`}
                            >
                                {currentQuestion === selectedUnit.quiz.length - 1 ? 'Finish' : 'Next Question'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderAiResponse = (response, isLoading, type) => (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : response ? (
                <div>
                    <div className="flex items-center space-x-2 mb-3">
                        <Bot className={unitTheme.text} />
                        <h3 className={`font-semibold text-lg ${unitTheme.text}`}>AI Assistant</h3>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{response.response}</p>
                </div>
            ) : (
                <div className="text-gray-500 text-center py-8">
                    Your AI response will appear here.
                </div>
            )}
        </div>
    );

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return (
                    <div className="p-6 bg-white min-h-screen">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Units</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courseDataGerman.map(renderUnitCard)}
                        </div>
                    </div>
                );
            case 'unit':
                const unit = selectedUnit;
                return (
                    <div className="p-6 bg-white min-h-screen">
                        <h2 className={`text-3xl font-bold mb-2 ${unitTheme.text}`}>{unit.title}</h2>
                        <p className="text-gray-600 mb-6">{unit.overview}</p>

                        <div className="space-y-4 mb-6">
                            {renderLessonSection(
                                'Vocabulary',
                                <Languages />,
                                'Practice key words and phrases.',
                                () => {
                                    setVocabAIResponse(null);
                                    setCurrentPage('ai-vocab');
                                    getAiResponse('vocab', `Explain key vocabulary for unit ${unit.title} at C1 German level.`, unit);
                                },
                                isLoadingVocabAI
                            )}
                            {renderLessonSection(
                                'Grammar',
                                <Library />,
                                'Review advanced grammatical concepts.',
                                () => {
                                    setGrammarAIResponse(null);
                                    setCurrentPage('ai-grammar');
                                    getAiResponse('grammar', `Explain the C1 German grammar topic: "${unit.grammar.topicEn}".`, unit);
                                },
                                isLoadingGrammarAI
                            )}
                            {renderLessonSection(
                                'Reading',
                                <FileText />,
                                'Analyze a C1-level text.',
                                () => setCurrentPage('reading')
                            )}
                            {renderLessonSection(
                                'Speaking',
                                <Mic />,
                                'Practice pronunciation with AI feedback.',
                                () => setCurrentPage('ai-speech')
                            )}
                            {renderLessonSection(
                                'Writing',
                                <Pencil />,
                                'Write an essay and get feedback.',
                                () => setCurrentPage('writing')
                            )}
                            {renderLessonSection(
                                'Quiz',
                                <ListChecks />,
                                'Test your knowledge with a quiz.',
                                handleStartQuiz
                            )}
                        </div>
                    </div>
                );
            case 'ai-grammar':
                return (
                    <div className="p-6 bg-white min-h-screen">
                        <h2 className={`text-3xl font-bold mb-4 ${unitTheme.text}`}>{selectedUnit.grammar.topicDe}</h2>
                        <p className="text-gray-600 mb-6">{selectedUnit.grammar.explanationDe}</p>
                        {renderAiResponse(grammarAIResponse, isLoadingGrammarAI, 'grammar')}
                    </div>
                );
            case 'ai-vocab':
                return (
                    <div className="p-6 bg-white min-h-screen">
                        <h2 className={`text-3xl font-bold mb-4 ${unitTheme.text}`}>Vocabulary Assistant</h2>
                        <p className="text-gray-600 mb-6">
                            Here are the key vocabulary words from this unit:
                            <ul className="list-disc list-inside mt-2">
                                {selectedUnit.vocabulary.map((word, index) => (
                                    <li key={index}>{word}</li>
                                ))}
                            </ul>
                        </p>
                        <button
                            className={`mt-4 w-full py-2 px-4 rounded-md flex items-center justify-center transition-all duration-300 ${!vocabAudioUrl || isVocabAudioLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                            onClick={getVocabAudio}
                        >
                            <Play className="mr-2" />
                            {isVocabAudioLoading ? 'Loading Audio...' : 'Play Random Word Audio'}
                        </button>
                        {vocabAudioUrl && (
                            <audio controls src={vocabAudioUrl} className="mt-4 w-full"></audio>
                        )}
                        {renderAiResponse(vocabAIResponse, isLoadingVocabAI, 'vocab')}
                    </div>
                );
            case 'ai-speech':
                return (
                    <div className="p-6 bg-white min-h-screen">
                        <h2 className={`text-3xl font-bold mb-4 ${unitTheme.text}`}>Speech Practice</h2>
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
                            <p className="text-xl text-gray-800 font-medium mb-4">
                                Read the following sentence:
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mb-6">
                                {selectedUnit.speaking[0]}
                            </p>
                            <button
                                onClick={startRecording}
                                className={`mt-4 w-full py-2 px-4 rounded-md flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                            >
                                <Mic className="mr-2" />
                                {isRecording ? 'Recording...' : 'Start Recording (5s)'}
                            </button>
                            {audioBlob && (
                                <audio controls src={URL.createObjectURL(audioBlob)} className="mt-4 w-full"></audio>
                            )}
                            {renderAiResponse(speechAIResponse, isLoadingSpeechAI, 'speech')}
                        </div>
                    </div>
                );
            case 'reading':
                return (
                    <div className="p-6 bg-white min-h-screen">
                        <h2 className={`text-3xl font-bold mb-4 ${unitTheme.text}`}>{selectedUnit.reading.title}</h2>
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
                            <p className="text-gray-800 text-lg whitespace-pre-wrap">{selectedUnit.reading.text}</p>
                        </div>
                        <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100">
                            <h3 className={`text-lg font-semibold ${unitTheme.text} mb-2`}>Reading Task:</h3>
                            <p className="text-gray-700">{selectedUnit.reading.task}</p>
                        </div>
                    </div>
                );
            case 'writing':
                return (
                    <div className="p-6 bg-white min-h-screen">
                        <h2 className={`text-3xl font-bold mb-4 ${unitTheme.text}`}>Writing Task</h2>
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
                            <p className="text-gray-800 text-lg whitespace-pre-wrap">{selectedUnit.writing}</p>
                            <textarea
                                className="mt-4 w-full p-4 rounded-md border-2 border-gray-300 focus:outline-none focus:border-gray-500"
                                rows="10"
                                placeholder="Write your response here..."
                            ></textarea>
                        </div>
                    </div>
                );
            case 'quiz':
                return renderQuiz();
            default:
                return <div>Page not found</div>;
        }
    };

    return (
        <div className="font-sans antialiased text-gray-900 bg-gray-100">
            {renderHeader()}
            <main className="container mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-4">
                            {renderPage()}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};
export default App;

# T-53 · StockPortfolio und StockInfo mit Blogposts und Video vorstellen

Mike möchte StockPortfolio und StockInfo in der Woche ab dem 28. September
2026 in einem oder zwei Blogposts vorstellen, möglichst mit einem erklärten
Video. **Die KI soll Vorbereitung, Aufnahmen, Texte und Schnitt übernehmen.**
Mikes Arbeit soll sich auf wenige gebündelte Rückmeldungen beschränken.

**Zentrale Aussage der Story: Deine Depotdaten bleiben in deinem Browser.**
StockPortfolio speichert Bestände, Zielverteilung und Einstellungen lokal.
StockInfo liefert die Marktdaten; das persönliche Depot wird nicht an den
Dienst übertragen. Diese Trennung soll schon im Einstieg von Blog und Video
verständlich werden, einschließlich des Probeclips.

**Backup und Wiederherstellung gehören als wichtiges Feature zur Story.**
Wer den Browser wechselt, kann sein Depot als Datei mitnehmen. Das ergänzt
die lokale Datenhaltung um einen konkreten, leicht erklärbaren Nutzen.

Eine zusammenhängende Vorführung liefert die Bilder für beide Formate:
Depotübersicht, relative Abweichung und Rebalancing-Simulation in
StockPortfolio; anschließend die Kursversorgung durch StockInfo.

**Stand:** Konzept von `claude` gegengeprüft und freigegeben, mit einer
Ergänzung: die macOS-Bildschirmaufnahme-Berechtigung muss vor der
tatsächlichen Aufnahme erteilt sein. Auf Mikes ausdrücklichen Auftrag
ergänzt `claude` zusätzlich sieben Änderungsvorschläge zu Umfang, Zeitplan,
Stimme, Untertiteln und Lizenzfragen (siehe „Änderungsvorschläge“ unten) —
offen zur Abstimmung mit codex/Observer, noch keine Entscheidung.
**Die Produktion bleibt pausiert.** Auf „Klingt gut“ folgte „Warte noch“
und danach der Auftrag zur Ticketanlage mit Gegenprüfung.
Noch keine neuen Screenshots, Sprachaufnahmen oder Videos erstellt.
Weder Konzeptprüfung noch Änderungsvorschläge heben den Produktionsstopp auf.

Für Mike steht jetzt keine Rückfrage an. Vor Wiederaufnahme der Produktion
ist weiterhin Mikes Startsignal erforderlich. Die bestehende Produktarbeit
T-51 → T-52 ist inzwischen abgeschlossen; dieses Ticket priorisiert sie
nicht um.

## Auftrag und bisherige Entscheidungen

Mike, 2026-09-27:

> Nächste Woche möchte ich die beiden Apps in ein oder zwei Blog-Posts
> kommunizieren. Ideal wäre dazu auch ein Video. Kannst du eine Reihe von
> Screenshots anfertigen um schlussendlich daraus eine Video mit Erklärung
> zu machen. Der Prozess soll sowei wie möglich von dir bzw. von weiteren
> KIs kommen - meine Arbeit soll auf ein Minimum beschränkt sein.
> Wie könnte sowas ablaufen?

Zum vorgeschlagenen Ablauf: „Klingt gut“. Danach: „Warte noch“.
Aktueller Auftrag: „Erstelle dazu ein Ticket. Claude soll das dann noch gegenprüfen.“

Ergänzung von Mike, 2026-09-27:
„Bei T-53 - ein wichtiger Punkt bei der Story ist, dass bei StockPortfolio
die Daten im Browser bleiben.“

Weitere Ergänzung von Mike, 2026-09-27:
„Backup und Restore ist auch ein Feature das wichtig ist - evtl. beim Umzug
auf einen anderen Browser“.

Die Zielgruppe wurde noch nicht beantwortet. Arbeitsannahme für den Entwurf:
deutschsprachige Privatanleger mit Interesse an selbst betriebenen Tools;
ein vertiefender StockInfo-Beitrag kann Entwickler und Selfhosting-Nutzer
ansprechen. Diese Annahme ist keine bereits getroffene Nutzerentscheidung.

## Vorgeschlagener Umfang

Ein gemeinsames Medienpaket für beide Apps, geführt in diesem Board.
StockInfo bleibt ein eigenständiges Repository; dort sind für diesen
Kommunikationsauftrag keine Produktänderungen vorgesehen. Rollen und
aktiver Produktauftrag stehen weiterhin ausschließlich in STATUS.md.

- Ein oder zwei veröffentlichungsfertige Blogentwürfe. Empfehlung:
  StockPortfolio anhand einer praktischen Aufgabe vorstellen; StockInfo
  anschließend als eigenständig nutzbaren Kursdienst erklären.
- Eine Serie echter, hochauflösender Screenshots mit Bildunterschriften
  und Alternativtexten. Gleiche Sprache, Theme und Fenstergröße verwenden.
- Zuerst ein Probeclip von 30–45 Sekunden mit drei Szenen, Sprechertext und
  vorläufiger deutscher Stimme. Er dient der Beurteilung von Tempo,
  Bildgestaltung und Erklärungstiefe.
- Nach Rückmeldung zum Probeclip ein gemeinsames Erklärvideo von ungefähr
  drei Minuten als MP4, mit Untertiteln, Sprechertext und Vorschaubild.
- Die verwendeten Originalbilder und die Render-Anleitung mitliefern,
  damit spätere Korrekturen nicht die gesamte Produktion wiederholen müssen.

Blogplattform und Videokanal sind noch nicht festgelegt. Entwürfe und
Dateien zunächst lokal liefern; Hochladen und Veröffentlichen sind eigene
Schritte nach der Freigabe des konkreten Pakets.

### Leitgedanke: Das Depot bleibt bei dir

Vorgeschlagener Einstieg für Blog und Sprechertext:

> Dein Depot bleibt in deinem Browser. StockPortfolio speichert dort deine
> Bestände und Zielverteilung und berechnet dein Rebalancing.
> Die Kurse liefert StockInfo, ohne dass du dein Depot hochladen musst.

Die Geschichte verbindet diesen Vorteil mit dem praktischen Nutzen:
Depot verstehen und Änderungen durchspielen, während die persönlichen
Bestände lokal bleiben. In Szene 1 soll eine kurze Einblendung
„Depotdaten bleiben im Browser“ den Sprechertext unterstützen.

Die Abgrenzung muss fachlich stimmen: Für Kurs-, Historien- und
Devisenanfragen werden die benötigten Instrumentkennungen beziehungsweise
Währungspaare an StockInfo gesendet. Das sind keine übertragenen Bestände,
Stückzahlen oder Zielgewichtungen. Die Story darf daraus weder „keine
Netzwerkverbindungen“ noch „StockInfo erhält keinerlei Informationen“ machen.

Im Blog und im vollständigen Video auch die praktische Folge knapp nennen:
Ein anderer Browser, ein anderes Profil oder eine andere Webadresse hat
eigenen Speicher; es gibt keine automatische Depot-Synchronisierung.
Das Löschen der Website-Daten entfernt das lokale Depot. Die vorhandene
JSON-Sicherung ist der Weg zum Sichern und Übertragen; ein ausdrücklich
heruntergeladenes Backup liegt anschließend als Datei außerhalb des
Browser-Speichers. Der Vorteil und diese Folge gehören in dieselbe Erklärung.

### Eigene Szene: Das Depot in einen anderen Browser mitnehmen

Backup und Wiederherstellung als praktische Funktion zeigen, nicht nur als
Hinweis auf möglichen Datenverlust. Vorgeschlagener Sprechertext:

> Du möchtest den Browser wechseln? Sichere dein Depot als Datei und lade
> sie im neuen Browser wieder ein. So nimmst du deine Daten selbst mit.

Die Vorführung erfolgt ausschließlich mit dem Beispield­epot:

1. Unter „Einstellungen → Backup“ die JSON-Sicherung herunterladen.
2. StockPortfolio in einem zweiten Browser mit eigenem, leerem Speicher öffnen.
3. Die Datei auswählen, die angezeigte Vorschau prüfen und die
   Wiederherstellung ausdrücklich bestätigen.
4. Das übernommene Depot mit seinen Beständen und Zielanteilen zeigen.
   Marktdaten bei Bedarf neu laden.

Das Backup enthält das aktive Depot, Einstellungen, die Auswahl ausgeblendeter
Instrumente und gespeicherte Tageswerte. Es sichert nicht automatisch alle
Depots; Kurscaches werden nicht mitgenommen. Die Inhalte an der verwendeten
App-Fassung prüfen und die Wiederherstellung nicht als laufende
Synchronisierung zwischen Browsern darstellen. Falls die Probe nur zwei
isolierte Profile derselben Browser-Engine verwendet, diesen Nachweis nicht
als bereits durchgeführten Wechsel zwischen unterschiedlichen Browsern ausgeben.

## Ablauf nach Wiederaufnahme

1. **Geschichte und Szenenfolge:** Kernaussage und Gliederung ausarbeiten.
   Blogtext, Sprechertext und Bildauswahl müssen dieselbe Erklärung tragen.
2. **Demo vorbereiten:** Ein nachvollziehbares Beispield­epot in einem
   getrennten Browserkontext verwenden. Bestände und Kurse als Demodaten
   kenntlich machen; echte persönliche Depotdaten bleiben unberührt.
3. **Fassung festhalten:** Für die finalen Aufnahmen einen stabilen
   Produktstand verwenden, insbesondere nach den laufenden UI-Änderungen.
   Versionen beziehungsweise Commits und Aufnahmedatum dokumentieren.
4. **Aufnehmen:** Die Apps tatsächlich bedienen, Screenshots erzeugen und
   zusammengehörige Vorher-/Nachher-Zustände aufnehmen. Zahlen, Tabellen
   und Bedienoberflächen nicht durch generative Bilder nachbilden.
5. **Probeclip rendern:** Screenshots mit gezielten Vergrößerungen,
   Markierungen und Übergängen erklären. Kurze Bildschirmaufnahmen nur
   ergänzen, wenn sie einen Bedienablauf besser vermitteln.
6. **Rückmeldung bündeln:** Mike erhält einen abspielbaren Clip statt
   einzelner Rückfragen zu jeder Szene. Rückmeldung auf Stimme, Tempo und
   Bildgestaltung konzentrieren; keine eigene Sprachaufnahme voraussetzen.
7. **Paket fertigstellen:** Blogentwürfe und vollständiges Video aus dem
   geprüften Material erzeugen. Dateien auf Wiedergabe, Bildqualität,
   Lautstärke und Synchronität prüfen und zur Gegenprüfung übergeben.

### Vorgeschlagene Szenen

| Szene | Aussage | Geplantes Bild |
|---|---|---|
| 1 · Überblick | Dein Depot bleibt im Browser; Verteilung und Zielanteile verstehen | StockPortfolio-Dashboard mit Beispieldaten und kurzer Einblendung zur lokalen Speicherung |
| 2 · Abweichung | Relative Abweichung und Toleranzband unterscheiden | Lesbarer Ausschnitt mit Zahl und Balken |
| 3 · Durchspielen | Einen Kauf und seine Finanzierung simulieren | Rebalancing, „Decken aus“, Verteilung danach |
| 4 · Datenquelle | StockInfo liefert Kurse; persönliche Depotbestände bleiben in StockPortfolio im Browser | Tatsächlich vorhandene StockInfo-Ansicht mit nachvollziehbarem Bezug; einfache Darstellung des Datenflusses |
| 5 · Mitnehmen | Lokale Daten per Backup sichern und im anderen Browser wiederherstellen | Export, Importvorschau und wiederhergestelltes Beispield­epot |
| 6 · Einstieg | Wo beide Apps und ihre Anleitungen zu finden sind | Geprüfte Repository- und Dokumentationslinks |

Die ersten drei Szenen bilden den Probeclip. Die konkrete StockInfo-Szene
wird erst nach Sichtung der App festgelegt; noch keine dortige Aufnahme behauptet.

### Technik und bekannter Vorbereitungsstand

Auf dem Mac sind FFmpeg, Bildschirmaufnahme-Werkzeuge und die lokale
Sprachausgabe `say` vorhanden; eine deutsche Stimme „Anna“ ist verfügbar.
Damit ist ein lokal erzeugter Sprachentwurf vorgesehen. Qualität,
Aussprache der App-Namen und Verständlichkeit müssen am Probeclip geprüft werden.

Für eine endgültige externe KI-Stimme sind Anbieter, Zugang und mögliche
Kosten noch offen. Keinen vorhandenen Sprachdienst oder bereits nutzbaren
API-Zugang behaupten. Ein lokaler Entwurf benötigt diesen Zugang nicht.

Ein erster Versuch, über Chrome DevTools eine isolierte Seite zu öffnen,
scheiterte am bereits verwendeten Browserprofil. Es entstand dadurch keine
Demoaufnahme. Beim Wiederanlauf einen eigenen verfügbaren Browserkontext
verwenden; keine Browserprozesse oder Prüfumgebungen anderer Rollen beenden.

## Gegenprüfung durch Claude

**Jetzt zu prüfen ist das Konzept dieses Tickets, noch kein Medienprodukt.**
Mike hat Claude ausdrücklich damit beauftragt. Bitte Befunde und konkrete
Verbesserungen im Ticket festhalten und über die vorhandene Mailbox zurückmelden.
Diese Konzeptprüfung ersetzt keinen Produktreview von T-51 oder T-52 und
ändert deren Owner, Phase oder Reviewzähler nicht.

Prüffokus: Ist der Umfang für nächste Woche sinnvoll begrenzt? Sind
Arbeitsannahmen, tatsächliche Möglichkeiten, offene Zugänge und Mikes
Handgriffe sauber getrennt? Trägt die Szenenfolge beide Apps, und kann der
Probeclip mit den vorhandenen Werkzeugen erstellt werden? Bleiben
persönliche Daten, laufende Produktarbeit und der Produktionsstopp gewahrt?
Mikes Kernaussage zur lokalen Speicherung ausdrücklich mitprüfen: Sie muss
im Einstieg sichtbar sein und korrekt von externen Marktdatenanfragen und
dem bewusst exportierten Backup abgegrenzt werden.
Backup und Restore als eigenständigen Nutzen und Browserwechsel als
konkretes Beispiel prüfen. Stimmen Umfang der Sicherung, Importbestätigung
und tatsächlich ausgeführte Demo mit der Erklärung überein?

Nach der Produktion ist zusätzlich eine Gegenprüfung der tatsächlichen
Dateien vorgesehen: fachliche Aussagen, Übereinstimmung von Bild und Text,
lesbare Zahlen, verständliche Stimme, passende Untertitel und gültige Links.
Ein Konzepturteil belegt noch keine Prüfung dieser Dateien.

### Verify

Einzige aktuelle technische Matrix. Alle Prüfungen stehen noch aus.
`➖`: kein ausgeführter Nachweis.

| # | Prüfung | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Claude prüft das Konzept | Datiertes Urteil mit geprüfter Ticketfassung, Befunden und offenen Entscheidungen | ➖ |
| 2 | Demo und Aufnahmebasis | Getrennter Kontext, gekennzeichnete Beispieldaten, festgehaltene App-Fassungen und Szenenliste | ➖ |
| 3 | Probeclip ansehen und anhören | Abspielbare 30–45 Sekunden; drei verständliche Szenen, lesbare Oberfläche, synchroner Sprechertext | ➖ |
| 4 | Blogentwürfe und Aussagen abgleichen | Ein oder zwei vollständige Entwürfe; belegte Funktionen beider Apps, passende Bilder und Links | ➖ |
| 5 | Fertiges Medienpaket prüfen | MP4, Untertitel, Vorschaubild, Originalscreenshots, Sprechertext und nachvollziehbarer Render-Aufruf vorhanden | ➖ |
| 6 | Unabhängige Gegenprüfung der Medien | Claude benennt geprüfte Dateifassungen und bestätigt oder beanstandet Inhalt sowie Bild-/Tonqualität | ➖ |
| 7 | Aussage zur lokalen Speicherung prüfen | Blogeinstieg und Probeclip tragen Mikes Kernaussage; Speicher- und Anfragepfade belegen die Abgrenzung zwischen Depotdaten und Marktdatenanfragen; Backup und fehlende automatische Synchronisierung sind im vollständigen Paket erklärt | ➖ |
| 8 | Backup und Restore beim Browserwechsel vorführen | JSON-Export des Beispield­epots, Vorschau und bestätigter Import in getrenntem Browser; Bestände und Ziele stimmen überein. Verwendete Browser sowie Grenzen des Backups dokumentiert | ➖ |

### Side-Effects und Doku-Abgleich

Medien- und Textproduktion, keine Änderung am Produktverhalten oder an
Rollenzuordnungen. Keine externen Ausgaben oder Veröffentlichungen bereits
beauftragt oder ausgeführt. Zusätzliche KI-Unterstützung darf Textredaktion
und Faktenprüfung übernehmen; Mike erhält weiterhin gebündelte Ergebnisse.

**Doku-Abgleich:** Die Projekt- und Container-READMEs beider Apps sowie
betroffene Funktions- und Installationsanleitungen dienen bei der Produktion
als Quellen. Aktuelle Funktionsbehauptungen mit Code und sichtbarem Verhalten
abgleichen. Durch die reine Ticketaufnahme ändern sich diese Zusagen nicht;
deshalb jetzt keine README-, Docker- oder Unraid-Anpassung.
Keine neuen Betriebs- oder Finanzversprechen aus Demodaten ableiten.

Für Mikes Ergänzung bereits inhaltlich abgeglichen: `README.md`, „Where the
data lives“, und `docker/README.md`, „Data and backups“, beschreiben lokale
Browser-Speicherung, getrennte Speicher und JSON-Backups übereinstimmend.
`src/api/client.ts` und `src/stores/quotes.ts` zeigen die Anfrage nach
Instrumentkennungen; die Depot-Speicherung steht in `src/db/schema.ts`.
Das stützt den Story-Ansatz, ersetzt aber noch nicht die abschließende
Prüfung der formulierten Medienaussagen. Keine Änderung der Anleitungen nötig.
Backup und Restore sind zusätzlich in `src/components/BackupPanel.vue` und
`src/domain/backup.ts` nachvollziehbar. Der Blog und das vollständige Video
sollen die vorhandene Funktion erklären; der tatsächliche Browserwechsel
bleibt bis zur Aufnahme und Gegenprüfung ein offener Nachweis.

Keine neue Lesson aus dem einzelnen Browser-Startfehler abgeleitet.
AL-R-01 und SP-CX-03 sind einschlägig: Vorhandene Werkzeuge oder eine
laufende Zelle belegen noch keine erfolgreiche Aufnahme beziehungsweise
Produktion. Tatsächliche Dateien und Prüfergebnisse nachweisen.
Die allgemeine Board-Übernahme auf `2026-09-11-lessons-follow-through`
bleibt separat offen; dieses Ticket ändert keine Konventionen oder Skills.

### Konzeptprüfung · claude · 2026-09-27

Geprüfte Fassung: SHA-256 `838176cbbcaa11c0a52ac57e44700dabe9f2ca6b395260b1da19d732c0f74c90`
(bestätigt durch eigenen `shasum`-Lauf). Geprüft wurde ausschließlich das
Konzept; keine Aufnahme, kein Rendern, keine Aufhebung des Produktionsstopps.

- **Kernaussage lokale Speicherung gegen Code geprüft:** `README.md`
  („Where the data lives“) und `docker/README.md` („Data and backups“)
  bestätigen wortwörtlich, was das Ticket behauptet: nur Browser-Speicherung,
  kein Server hält Depotdaten, StockInfo liefert nur Kurse/Stammdaten.
  Passt zur geplanten Abgrenzung „keine Netzwerkverbindungen“/„StockInfo
  erhält keinerlei Informationen“ ausdrücklich zu vermeiden.
- **Backup-Inhalt gegen `src/domain/backup.ts` geprüft:** Das `Backup`-Interface
  enthält exakt `portfolio`, `settings`, `allowlist` (ausgeblendete
  Instrumente) und `valueHistory` (Tageswerte) — deckt sich mit der
  Ticketbehauptung. Kommentar im Code bestätigt zusätzlich ausdrücklich
  „Kurse bleiben bewusst draußen“, deckt sich mit „Kurscaches werden nicht
  mitgenommen“. Nur das aktive Depot wird gesichert (`portfolio: Portfolio`,
  kein Array) — deckt sich mit „sichert nicht automatisch alle Depots“.
- **Restore-Ablauf gegen `src/components/BackupPanel.vue` geprüft:** Datei
  wählen → `pending`-Vorschau (`confirmHeading`) → ausdrückliche Bestätigung
  über `NPopconfirm`/`confirmReplace` vor dem Anwenden. Deckt sich exakt mit
  der beschriebenen Szene 5.
- **Technische Machbarkeit lokal geprüft:** `ffmpeg` (8.1.1) vorhanden;
  `say -v '?'` bestätigt die genannte deutsche Stimme „Anna“ (`de_DE`) sowie
  sieben weitere deutsche Systemstimmen als Alternative. `ffmpeg -f
  avfoundation -list_devices` findet drei Bildschirme und ein externes
  Mikrofon (RØDE VideoMic GO II) — Bildschirmaufnahme per `screencapture -v`
  oder `ffmpeg`/AVFoundation ist grundsätzlich machbar.
- **Befund, kein Blocker — fehlende Zugriffsvoraussetzung:** Das Ticket nennt
  die externe KI-Stimme als offenen Zugang, aber nicht die
  macOS-Bildschirmaufnahme-Berechtigung, die AVFoundation/`screencapture`
  für den aufnehmenden Prozess braucht. Ohne einmalig erteilte Freigabe in
  den Systemeinstellungen schlägt die erste tatsächliche Aufnahme fehl.
  Bitte vor Schritt 4 „Aufnehmen“ ergänzen oder bei Bedarf einplanen.
- **Isolierter Browserkontext:** Die dokumentierte Ursache des gescheiterten
  ersten Versuchs (wiederverwendetes Profil) deckt sich mit dem bekannten
  Claude-in-Chrome-Verhalten — ein neuer Tab über die dortige
  Tab-Erstellung statt eines wiederverwendeten Tabs vermeidet das. Die im
  Ticket vorgesehene Abhilfe ist damit richtig benannt.
- **Umfang, Trennung Mensch/KI, Datenschutz, Produktionsstopp:** Szenenfolge
  deckt beide Apps ab, Probeclip vor Vollversion ist ein sinnvoller
  Zwischenschritt, Mikes Handgriffe bleiben auf Start, Clip-Feedback und
  Paketfreigabe begrenzt. Demo ausdrücklich mit Beispieldaten in getrenntem
  Kontext, keine echten Depotdaten betroffen. Zielgruppe, Plattform und
  externe Stimme sind korrekt als offen gekennzeichnet statt verdeckt
  vorausgesetzt. Produktionsstopp wird durch diese Prüfung nicht berührt.
- **Nicht Teil dieser Prüfung:** tatsächliche Dateien, Bild-/Tonqualität,
  Untertitel — folgt laut Ticket erst nach der Produktion (Verify #3–#6).

**Verdict: Konzept freigegeben**, mit einer zu ergänzenden Voraussetzung
(Bildschirmaufnahme-Berechtigung) vor dem eigentlichen Aufnahmeschritt.
Kein Blocker für den Start nach Mikes Startsignal.

### Änderungsvorschläge · claude · 2026-09-27

Auf Mikes ausdrücklichen Auftrag ein zweiter, ergänzender Durchgang nach der
reinen Faktenprüfung oben. Kein neuer Befund an bereits Geprüftem; das sind
Vorschläge zur Abstimmung mit codex/Observer, keine Entscheidungen.

1. **Umfang für „nächste Woche" realistisch staffeln.** Der siebenstufige
   Ablauf (Geschichte → Demo → Fassung einfrieren → Aufnehmen → Probeclip →
   gebündeltes Feedback → fertiges Paket) plus zwei Blogentwürfe und ein
   ~3-Minuten-Video mit Untertiteln ist in einer Woche mit nur einer
   Feedbackrunde ambitioniert. Vorschlag: Woche 1 liefert verbindlich den
   Probeclip plus einen Blogentwurf (StockPortfolio); das zweite
   Blogposting (StockInfo) und das vollständige Video folgen nach Mikes
   Rückmeldung zum Probeclip als eigener Schritt, nicht als Teil derselben
   Deadline. Reduziert das Risiko, dass ein knapper Zeitrahmen die
   Bildschirmzeit für Sorgfalt bei Zahlen/Text einschränkt.
2. **Stabile Fassung jetzt konkret benennen.** Aktuell ist kein
   Coder-/Verifier-Auftrag aktiv (T-51 → T-52 sind abgeschlossen) — ein
   günstiger Moment. Vorschlag: bei Aufnahmebeginn den exakten Commit-Hash
   beider Repos im Ticket festhalten und STATUS.md auf `idle`/keinen aktiven
   Auftrag prüfen, bevor recordet wird. Verhindert, dass zwischen Aufnahme
   und Feedback neue Tickets (wie bei T-51 mit acht Runden zuletzt) die
   gezeigte Oberfläche veralten lassen.
3. **Lizenzfrage bei der macOS-Systemstimme klären, nicht nur die Qualität.**
   „Anna" & Co. sind für die lokale Bedienungshilfe gedacht; ob Apples
   Nutzungsbedingungen die Verwendung der synthetisierten Sprache in einem
   öffentlich verbreiteten Video erlauben, ist ungeprüft. Für den internen
   Probeclip unkritisch, vor der Veröffentlichung des fertigen Videos aber
   zu klären — sonst wiederholt sich hier dieselbe Art Lücke, die bei den
   SVG-Icons in T-51 mehrere Runden gekostet hat (siehe SP-CX-05 und die
   Lucide-Herkunftsklärung).
4. **Mehr als eine Stimme im Probeclip gegenprüfen.** `say -v '?'` liefert
   acht deutsche Stimmen (Anna plus sieben weitere: Eddy, Flo, Grandma,
   Grandpa, Reed, Rocko, Sandy, Shelley), nicht nur Anna. Vorschlag: zwei
   bis drei Kandidatinnen im selben Probeclip-Text gegenüberstellen, statt
   sich vorab auf eine festzulegen — eine spätere Korrektur allein wegen der
   Stimme würde sonst denselben Rückmeldezyklus ein zweites Mal brauchen.
5. **Untertitel aus dem Sprechertext erzeugen, nicht per Nachtranskription.**
   Der Text für `say` steht vorab fest; daraus lassen sich exakte Untertitel
   ableiten. Eine nachträgliche Spracherkennung riskiert Fehler gerade bei
   App-/Fachbegriffen (StockInfo, ISIN, Rebalancing, Toleranzband).
6. **Sichtung von StockInfo für Szene 4 von der Produktionssperre trennen.**
   Die konkrete StockInfo-Szene ist bewusst offen, „bis die App gesichtet
   ist" — unklar, ob dieses Sichten (ohne Aufnahme) schon unter den
   Produktionsstopp fällt oder als reine Recherche vorher stattfinden darf.
   Vorschlag: Sichten ausdrücklich als Vorbereitung ohne Aufnahmen erlauben,
   damit die Szene beim Startsignal nicht neu erkundet werden muss.
7. **Zielauflösung/-seitenverhältnis jetzt festlegen**, auch ohne feste
   Plattform: 1920 × 1080, 16:9 ist ein verbreiteter, plattformunabhängiger
   Standard. Vermeidet ein erneutes Rendern, sobald Blog oder Kanal feststehen.

Keiner dieser Punkte ändert das „Konzept freigegeben"-Urteil oben oder hebt
den Produktionsstopp auf. Zur Abstimmung mit codex/Observer vorgelegt.

### Auflösung

Konzept zur Gegenprüfung erfasst und durch `claude` geprüft (siehe oben);
sieben Änderungsvorschläge ergänzt, offen zur Abstimmung mit codex/Observer.
Produktion auf Mikes Wunsch weiterhin pausiert; keine Medienfreigabe und
keine Veröffentlichung erfolgt. Start der Produktion braucht weiterhin
Mikes ausdrückliches Startsignal.

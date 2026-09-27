# T-53 · StockInfo und StockPortfolio mit Blogposts und zwei Videos vorstellen

Mike möchte StockPortfolio und StockInfo in der Woche ab dem 28. September
2026 in einem oder zwei Blogposts vorstellen, möglichst mit einem erklärten
Video. Auf Mikes jüngsten Vorschlag wird das Konzept auf zwei aufeinander
aufbauende Videos ausgerichtet: StockInfo zuerst, danach StockPortfolio.
**Die KI soll Vorbereitung, Aufnahmen, Texte und Schnitt übernehmen.**
Mikes Arbeit soll sich auf wenige gebündelte Rückmeldungen beschränken.

**Zentrale Aussage der Story: Deine Depotdaten bleiben in deinem Browser.**
StockPortfolio speichert Bestände, Zielverteilung und Einstellungen lokal.
StockInfo liefert die Marktdaten; das persönliche Depot wird nicht an den
Dienst übertragen. Diese Trennung soll schon im Einstieg von Blog und Video
verständlich werden, einschließlich des Probeclips.

**Backup und Wiederherstellung gehören als wichtiges Feature zur Story.**
Wer den Browser wechselt, kann sein Depot als Datei mitnehmen. Das ergänzt
die lokale Datenhaltung um einen konkreten, leicht erklärbaren Nutzen.

**StockInfo ist die Datenbasis für StockPortfolio.** Wertpapiere werden aus
dem von StockInfo gelieferten Instrumentbestand ausgewählt; beim Hinzufügen
muss außerdem ein eindeutiger gültiger Kursabruf gelingen. Bestände und Ziele
ergänzt der Nutzer lokal in StockPortfolio. Das Verrechnungskonto ist die
Ausnahme: Es wird lokal angelegt und braucht keinen StockInfo-Kurs.
Dasselbe Demo-Instrument verbindet beide Videos sichtbar miteinander.

**Stand:** Das ursprüngliche Konzept ist durch `claude` gegengeprüft und
freigegeben. Seine sieben Änderungsvorschläge sind durch `codex-observer`
bewertet, von `claude` bestätigt (zwei eigene Ungenauigkeiten korrigiert).
Die danach ergänzten Datenschutz-/Testdatenvorgaben, die vereinfachte
Rebalancing-Szene und die Werkzeugoptionen (Filmora/HeyGen/ElevenLabs) sind
von `claude` geprüft und inhaltlich freigegeben, mit zwei nicht blockierenden
Ergänzungsvorschlägen (Metadaten-Check, Datenschutzmaßstab auch für die
StockInfo-Szene). Beide sind durch `codex-observer` unten konkretisiert und
in die Aufnahmevorgaben übernommen. Der Story-Abgleich ergänzt den Übergang
von der unverbindlichen Simulation zum Backup des tatsächlichen Demobestands.
Die Zielwoche und der gewünschte Umfang bleiben erhalten.
Die neue Aufteilung in zwei Videos ersetzt den bisherigen gemeinsamen
Drei-Minuten-Film als Konzept. Claudes frühere Urteile betreffen die jeweils
damals vorliegende Fassung; die neue Aufteilung ist noch nicht gegengeprüft.
**Mike schließt Systemstimmen ausdrücklich aus, auch für den Probeclip; das
persönliche Portfolio darf unter keinen Umständen gezeigt werden.**
Aufnahmeberechtigungen hängen vom tatsächlich gewählten Werkzeug ab.
**Die Produktion bleibt pausiert.** Auf „Klingt gut“ folgte „Warte noch“
und danach der Auftrag zur Ticketanlage mit Gegenprüfung.
Noch keine neuen Screenshots, Sprachaufnahmen oder Videos erstellt.
Weder Konzeptprüfung noch Änderungsvorschläge noch die jetzige Prüfung
heben den Produktionsstopp auf.

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

Stimmenwahl, Mike, 2026-09-27: „Die Systemstimmen verwenden wird nicht“.
Verbindliche Vorgabe: keine Systemstimmen, weder für den Probeclip noch für
das fertige Video. Die Auswahl einer geeigneten KI-Stimme bleibt offen.

Aufnahmevorgaben von Mike, 2026-09-27: ausschließlich Testdaten,
Standardwährung Euro, unter keinen Umständen sein persönliches Portfolio
zeigen. Für Folgevideos dieselben Daten wiederverwenden; abweichende Daten
nur, wenn ein neues Feature sie erfordert. Diese Vorgaben sind verbindlich
und gelten bereits für den Probeclip.

Rebalancing-Vorgabe von Mike, 2026-09-27: „Rebalancing sollte gezeigt
werden - nichts kompliziertes einfach einen simulierten verkauf bzw. kauf“.
Eine einfache Kauf- oder Verkaufssimulation ist damit verbindlicher Teil
der Vorführung; keine ausführliche Strategie- oder Finanzierungserklärung.

Neue Story-Richtung von Mike, 2026-09-27: StockInfo als Basis für StockPortfolio
und die Übernahme der dort verfügbaren Assets deutlich zeigen. Sein Vorschlag:
zwei Videos, zuerst StockInfo und darauf aufbauend StockPortfolio. Der Observer
empfiehlt diese Aufteilung und arbeitet sie hier als aktuellen Konzeptvorschlag
aus. Daraus folgt keine Aufhebung des Produktionsstopps.

Editor-Vorgabe von Mike, 2026-09-27: In StockInfo zeigen, dass bestimmte
Felder durch den Nutzer gepflegt werden können. StockPortfolio übernimmt
diese Daten ohne lokale Bearbeitung dieser Quellfelder. Dort zusätzlich
den Editor für die eigenen Depotangaben vorführen. „Fix übernommen“ meint
hier schreibgeschützt, nicht dauerhaft unveränderlich trotz Kurs-/Datenabruf.

Die Zielgruppe wurde noch nicht beantwortet. Arbeitsannahme für den Entwurf:
deutschsprachige Privatanleger mit Interesse an selbst betriebenen Tools;
ein vertiefender StockInfo-Beitrag kann Entwickler und Selfhosting-Nutzer
ansprechen. Diese Annahme ist keine bereits getroffene Nutzerentscheidung.

## Vorgeschlagener Umfang

Ein gemeinsames Medienpaket für beide Apps, geführt in diesem Board.
StockInfo bleibt ein eigenständiges Repository; dort sind für diesen
Kommunikationsauftrag keine Produktänderungen vorgesehen. Rollen und
aktiver Produktauftrag stehen weiterhin ausschließlich in STATUS.md.

- Ein oder zwei veröffentlichungsfertige Blogentwürfe. Empfehlung: zwei
  aufeinander verweisende Beiträge in derselben Reihenfolge wie die Videos,
  zuerst StockInfo als Instrument- und Kursbasis, dann StockPortfolio als
  darauf aufbauende Depotanwendung. Ein gemeinsamer Beitrag bleibt möglich.
- Eine Serie echter, hochauflösender Screenshots mit Bildunterschriften
  und Alternativtexten. Gleiche Sprache, Theme und Fenstergröße verwenden.
- Zuerst ein Probeclip von 30–45 Sekunden mit drei Szenen, Sprechertext und
  vorläufiger deutscher Stimme. Er dient der Beurteilung von Tempo,
  Bildgestaltung und Erklärungstiefe.
- Nach Rückmeldung zum Probeclip zwei Erklärvideos als MP4, jeweils mit
  Untertiteln, Sprechertext und Vorschaubild: StockInfo etwa zwei bis drei
  Minuten, StockPortfolio etwa drei bis dreieinhalb Minuten einschließlich
  Editor. Die Laufzeiten sind Richtwerte.
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
   Marktdaten bei Bedarf aus derselben festgehaltenen Demoquelle neu laden.

Vor dieser Szene die Rebalancing-Simulation löschen und zum unveränderten
Demodepot zurückkehren. Die simulierte Transaktion wird weder gebucht noch
als neuer Bestand gesichert. Der wiederhergestellte Bestand muss zum
Ausgangsdepot passen; eine simulierte Nachher-Verteilung ist kein Backup-Inhalt.

Das Backup enthält das aktive Depot, Einstellungen, die Auswahl ausgeblendeter
Instrumente und gespeicherte Tageswerte. Es sichert nicht automatisch alle
Depots; Kurscaches werden nicht mitgenommen. Die Inhalte an der verwendeten
App-Fassung prüfen und die Wiederherstellung nicht als laufende
Synchronisierung zwischen Browsern darstellen. Falls die Probe nur zwei
isolierte Profile derselben Browser-Engine verwendet, diesen Nachweis nicht
als bereits durchgeführten Wechsel zwischen unterschiedlichen Browsern ausgeben.

### Verbindliche Aufnahmebasis: feste Testdaten in Euro

- **Ausschließlich künstlich zusammengestellte Depotdaten verwenden.**
  Mikes persönliches Portfolio weder öffnen noch importieren, kopieren oder
  als anonymisierte Vorlage verwenden. Das gilt für Screenshots, Videos,
  Vorschaubilder, Blogbilder, Backup-Dateien und Material für externe
  KI-Dienste. Nachträgliches Verpixeln ersetzt diese Trennung nicht.
- **Euro (EUR) ist die Standard- und Basiswährung des Demodepots.**
  Einstellungen und sichtbare Beträge vor jeder Aufnahmeserie prüfen.
  Abweichende Instrumentwährungen nur gezielt zeigen, wenn die erklärte
  Funktion dies benötigt; daraus entsteht kein Wechsel der Standardwährung.
- **Ein dauerhaft wiederverwendbares Testdatenpaket anlegen.**
  Festhalten: Instrumente, Stückzahlen, Zielanteile, Verrechnungskonto,
  Einstellungen, Ausgangswerte und die für die Szenen benötigte Historie.
  Eine kanonische Fassung mit Versionskennung, Prüfsumme und kurzer
  Wiederherstellungsanleitung zusammen mit den Medienquellen aufbewahren.
  Nicht bei jedem Video ein neues zufälliges Beispield­epot erzeugen.
- **Auch die Marktdaten reproduzierbar halten.** Die für sichtbare Zahlen
  verwendeten Kurse, Wechselkurse, Historien und Zeitbezüge festhalten und
  in einer getrennten Demo-Umgebung wiederherstellbar bereitstellen.
  Unkontrollierte Live-Aktualisierungen dürfen die Aufnahmebasis nicht
  verändern. Das Depot-Backup allein genügt dafür nicht, weil es keine
  Kurscaches enthält. Datenstand als Demo kennzeichnen; keine aktuellen
  Live-Kurse vortäuschen. Den technischen Weg erst nach Wiederaufnahme
  prüfen und umsetzen, ohne daraus Produktänderungen abzuleiten.
- **Jede Aufnahme mit demselben Ausgangszustand beginnen.** Eigenes
  Browserprofil beziehungsweise isolierten Browserkontext und getrennten
  Speicher verwenden, auch für den Zielbrowser der Restore-Szene. Vor der
  Aufnahme Datensatzversion, EUR, Depotidentität und sichtbare Umgebung
  prüfen. Bei unklarer Datenherkunft keine Aufnahme beginnen. Persönliche
  Tabs, Benachrichtigungen, Dateinamen und Pfade dürfen ebenfalls nicht ins
  Bild geraten. Vor Weitergabe an externe Dienste und vor Veröffentlichung
  die konkreten Dateien auf persönliche Inhalte gegenprüfen.
- **Dateimetadaten und StockInfo einbeziehen.** Bei den tatsächlich
  weitergegebenen Bildern, Videos, Audio-, Untertitel- und Projektdateien
  auch eingebettete Metadaten, Dateinamen und verknüpfte Pfade auf private
  Namen, Geräte- oder Speicherangaben prüfen und solche Angaben entfernen.
  Vorhandene KI-Herkunftsmarkierungen dabei erhalten; kein pauschales Löschen
  sämtlicher Metadaten. Nach dem Filmora-/Render-Export erneut prüfen.
  Bewusst veröffentlichte Angaben zum Demo-Datenstand bleiben möglich.
  StockInfo nur in einer getrennten Demo-Instanz mit denselben festgelegten
  Instrumenten und Kursdaten zeigen. Keine private Betriebsinstanz,
  API-Schlüssel, Zugangsdaten, internen Hostnamen oder private Konfiguration
  aufnehmen. Eine neutrale lokale Demo-Adresse und öffentliche Projektlinks
  sind zulässig; ein pauschales Verbot jeder sichtbaren Adresse ist nicht nötig.
- **Folgevideos verwenden dieselbe Basis.** Szenenbedingte Änderungen wie
  Rebalancing gehören zum dokumentierten Ablauf; danach den Ausgangszustand
  wiederherstellen. Benötigt ein neues Feature andere Daten, eine begründete
  versionierte Variante mit den nötigen Änderungen anlegen. Die bisherige
  Basis erhalten und für jedes Medienpaket die verwendete Fassung nennen.

Diese Anforderungen sind festgelegt, aber noch nicht praktisch nachgewiesen:
Testdatenpaket und Aufnahmeumgebung werden erst nach Mikes Startsignal erstellt.

## Ablauf nach Wiederaufnahme

1. **Geschichte und Szenenfolge:** Kernaussage und Gliederung ausarbeiten.
   Blogtext, Sprechertext und Bildauswahl müssen dieselbe Erklärung tragen.
2. **Demo vorbereiten:** Die versionierte Testdatenbasis nach den verbindlichen
   Aufnahmevorgaben oben in einem getrennten Browserkontext wiederherstellen.
   EUR, feste Depot- und Marktdaten sowie Ausschluss persönlicher Inhalte
   vor der Aufnahme prüfen und dokumentieren.
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
7. **Paket fertigstellen:** Blogentwürfe und beide vollständigen Videos aus dem
   geprüften Material erzeugen. Dateien auf Wiedergabe, Bildqualität,
   Lautstärke und Synchronität prüfen und zur Gegenprüfung übergeben.

### Roter Faden und vorgeschlagene Szenen

**Teil 1: StockInfo – die Instrumente und Kurse als Grundlage.**
Die Leitfrage lautet: Woher kommen die Wertpapierdaten, mit denen wir später
unser Depot betrachten? Etwa zwei bis drei Minuten, mit eigenem Nutzen und
einem klaren Übergang zu StockPortfolio.

| Szene | Aussage und geplantes Bild |
|---|---|
| 1 · Aufgabe | StockInfo stellt Instrumente und Marktdaten bereit. Die eigene Instrumentübersicht mit festgelegten Demodaten zeigen. |
| 2 · Beispielinstrument | Ein Instrument auswählen und Kurs, Währung und Datenstand verständlich zeigen; bei passender Demo kurz die Historie. |
| 3 · Feld pflegen | Die Detailbearbeitung öffnen und ein tatsächlich manuell pflegbares Feld mit einem festgelegten Testwert ergänzen oder ändern. Speichern und den wirksamen Wert samt Herkunft zeigen. |
| 4 · Bereitstellen | StockInfo macht diese Daten für andere Anwendungen verfügbar. Dasselbe Instrument samt gepflegtem Feld bleibt als Bezug sichtbar; keine technische API-Tour nötig. |
| 5 · Übergang | Dieses Instrument verwenden wir im nächsten Video in StockPortfolio. StockInfo liefert die Wertpapierbasis; Stückzahlen und persönliche Ziele gehören erst ins lokale Depot. Links zu Anleitung und Teil 2. |

Für die Feldszene einen Fall wählen, in dem der manuelle Wert tatsächlich
wirksam wird, etwa ein zulässiges Detailfeld ohne gelieferten Quellenwert.
StockInfo-README: Quellenwerte haben Vorrang, manuelle Werte füllen Lücken
und bleiben bei Überdeckung gespeichert. Deshalb weder freie Bearbeitbarkeit
aller Felder noch einen pauschalen Vorrang manueller Eingaben behaupten.
Konkretes Feld und Eingabe anhand der festgehaltenen App-Fassung prüfen.
Vor- und Nachzustand gehören zum versionierten Testdatenpaket; Teil 2 nutzt
genau den Nachzustand dieses Feldes.

**Teil 2: StockPortfolio – aus diesen Daten wird mein lokales Depot.**
Ungefähr drei bis dreieinhalb Minuten einschließlich Editor. Mit einer kurzen Einordnung von StockInfo beginnen,
damit auch direkt einsteigende Zuschauer folgen können; Teil 1 verlinken.

| Szene / Richtzeit | Aussage und geplantes Bild |
|---|---|
| 1 · Grundlage / 0:00–0:20 | StockPortfolio nutzt StockInfo. Dasselbe Demo-Instrument aus Teil 1 wiedererkennen; Depotdaten bleiben im Browser. |
| 2 · Übernehmen / 0:20–0:55 | Im Dialog ein von StockInfo verfügbares Wertpapier auswählen, gültigen Kursabruf abwarten und Testbestand/Zielanteil hinzufügen. Keine frei erfundene Wertpapierposition ohne StockInfo anbieten. |
| 3 · Daten und Editor / 0:55–1:20 | Unter Informationen denselben in StockInfo gepflegten Wert schreibgeschützt zeigen. Danach Positionseditor öffnen: eigene Depotangaben wie Stückzahl, Zielanteil, Gruppe oder Notiz sind lokal bearbeitbar. Eine vorbereitete Testnotiz speichern. |
| 4 · Verstehen / 1:20–1:40 | Das feste EUR-Testdepot zeigen; eine Position liegt neben ihrem Ziel. Zahl und Band kurz erklären. |
| 5 · Durchspielen / 1:40–2:25 | Einen einfachen Kauf oder Verkauf simulieren, Verteilung und Abweichung vergleichen. Plan löschen; tatsächlicher Depotbestand bleibt unverändert. |
| 6 · Mitnehmen / 2:25–3:10 | Dieses Demodepot exportieren und in einem getrennten leeren Browser nach Vorschau und Bestätigung wiederherstellen. Dieselben Bestände und Ziele zeigen. |
| 7 · Einstieg / 3:10–3:25 | Projekt und Anleitung verlinken; StockInfo ist Voraussetzung und Teil 1 erklärt die Grundlage. |

Der Positionseditor bearbeitet echte lokale Depotangaben; er ist von der
anschließenden unverbindlichen Rebalancing-Simulation zu unterscheiden.
Übernommene Instrumentkennungen und Detailwerte werden dort nicht editiert.
Eine lokale Anzeigenbezeichnung ist keine Änderung der StockInfo-Stammdaten.
Beim erneuten Abruf können aktualisierte StockInfo-Werte übernommen werden;
keine Live-Synchronisierung oder dauerhaft eingefrorene Daten versprechen.

Für die Hinzufügen-Szene einen dokumentierten Vorzustand der festen Testbasis
verwenden, in dem genau das gezeigte Instrument noch fehlt. Nach dem Hinzufügen
und der anschließenden Editor-Szene muss das kanonische Demodepot erreicht sein. Damit bleiben die späteren
Rebalancing- und Backup-Szenen sowie Folgevideos reproduzierbar. Keine
ungeplanten Änderungen an der Testbasis und keine neuen Zufallsdaten.
Für den Editor zusätzlich die noch fehlende Testnotiz als festen Vorzustand
dokumentieren; nach Speichern entspricht auch sie der kanonischen Testbasis.

Ein gemeinsamer Probeclip von 30–45 Sekunden testet die Verbindung und die
Gestaltung beider Filme: Instrument in StockInfo → Auswahl in StockPortfolio
→ kurzer Blick auf die Simulation im EUR-Testdepot. Die Einblendung zur
lokalen Datenhaltung bleibt enthalten. Das ist ein gekürzter Ausschnitt,
keine vollständige Drei-Szenen-Anleitung und kein zusätzlicher Vollfilm.
Die Laufzeiten sind Richtwerte; tatsächliche Bedienwege und Lesbarkeit erst
an den Aufnahmen prüfen. Der konkrete StockInfo-Ausschnitt bleibt bis zur
Demo-Sichtung offen, keine dortige Bedienung oder Aufnahme behauptet.

Für die Blogbeiträge dieselbe Reihenfolge und gegenseitige Verweise verwenden.
Bei einem gemeinsamen Beitrag folgt auf StockInfo die darauf aufbauende
Depotvorführung. Beide Filme bleiben bei ihrem jeweiligen Nutzen; ausführliche
Installation, Finanzierungsvarianten und Formeln gehören in die Anleitungen.

**Rebalancing bewusst einfach vorführen:** Eine Position aus dem festen
EUR-Testdatensatz auswählen, die Ausgangslage kurz zeigen und einen kleinen,
nachvollziehbaren Kauf oder Verkauf simulieren. Anschließend die dadurch
veränderte Verteilung beziehungsweise Abweichung zum Ziel zeigen. Im Bild
und Sprechertext klar als Simulation benennen. Keine echte Order ausführen
oder eine solche behaupten. Die Erklärung von „Decken aus“ und komplexen
Finanzierungsvarianten ist für diese Szene nicht erforderlich. Instrument,
Menge beziehungsweise Betrag und Vorher-/Nachher-Werte im Szenenablauf
festhalten, damit dieselbe Vorführung später reproduzierbar bleibt.

### Feature-Sichtung der Done-Tickets · codex-observer · 2026-09-27

Auf Mikes Auftrag das Inventar und die Zweckbeschreibungen von 45 Ticketdateien
in StockPortfolio und 77 in StockInfo unter `40-done/` gesichtet; relevante
Funktionskandidaten anhand ihrer Umsetzungs-/Prüfabschnitte und der aktuellen
Anleitungen vertieft. Keine erneute Produktabnahme oder vollständige Wiederholung
aller historischen Reviews. StockInfo ausschließlich gelesen, dort keine Rolle
übernommen und keine Datei geändert. Die folgenden Ergänzungen sind priorisierte
Empfehlungen für die Story, keine Aufnahme- oder Produktionsfreigabe.

**Für die ersten Videos besonders geeignet:**

| App / Feature | Nutzen und konkrete Szene | Ticketbezug |
|---|---|---|
| StockInfo: Instrument aufnehmen und Handelsplatz erkennen | Bisher beginnt Teil 1 bei einem vorhandenen Instrument. Besser die Aufnahme per ISIN oder Symbol zeigen, Handelsplatz und Kurswährung benennen und anschließend genau dieses Instrument an StockPortfolio weiterreichen. Bei abweichender Börse gibt es eine Entscheidung vor dem Speichern; einen solchen Sonderfall nur zeigen, wenn er die kurze Demo verständlicher macht. | StockInfo T-21, T-54, T-65, T-67 |
| StockInfo: Kursverlauf mit Zeitraum und Veränderung | Die bisher optionale Historie als kurze Kernszene vorsehen: Instrument auswählen, einen Zeitraum und einen Datenpunkt zeigen. Das vermittelt mehr Nutzen als eine reine Kurstabelle. | StockInfo T-08; README „Dashboard“ |
| StockInfo: Datenherkunft und Erweiterbarkeit | Bei der bereits geplanten Feldpflege Quelle beziehungsweise manuellen Ursprung zeigen. In einem Satz erwähnen: Plugins können Quellen, Felder und unterstützte Handelsplätze ergänzen. Kein Plugin-Installationskurs im Einstiegsfilm. | StockInfo T-23, T-26, T-30/T-64/T-67; StockPortfolio T-40 |
| StockPortfolio: Gruppen und Positionschart | In der Übersichts-/Detailszene Aktien, ETFs, Anleihen, Geldmarkt und Cash erkennbar trennen; Gruppensummen kurz zeigen. Beim Öffnen der Position den Kursverlauf mit Zeitraumwahl zeigen, dann zu Informationen und Editor wechseln. | StockPortfolio T-08, T-23, T-43/T-46, T-44 |

**Kurze Zusatzszenen oder Blogvertiefung:**

| Feature | Empfehlung und Grenze | Ticketbezug |
|---|---|---|
| Mehrere getrennte Depots | Kurz zeigen oder erwähnen: etwa „Demo Hauptdepot“ und „Demo Sparplan“, mit erkennbarem aktivem Depotnamen. Keine persönlichen Namen oder Daten. Beide Zustände fest im Testpaket halten; das Backup enthält jeweils nur das aktive Depot. | StockPortfolio T-21; README „Several portfolios“ |
| Fremdwährungskurse in EUR bewerten | Ein USD-notiertes Testinstrument mit Originalkurs und umgerechnetem EUR-Wert wäre ein guter zusätzlicher Beleg für die Zusammenarbeit. Standard-/Basiswährung bleibt EUR; kein Währungswechsel für die Demo. StockInfo liefert den Devisenkurs. Nur aufnehmen, wenn passende feste Testdaten und genügend Erklärzeit vorhanden sind. | StockInfo T-01/T-06/T-10; StockPortfolio T-38 |
| Datenbank-Backup in StockInfo | Als Betriebsfunktion kurz nennen oder im Blog zeigen. Vom Browser-Backup in StockPortfolio ausdrücklich unterscheiden: getrennte Daten und getrennte Sicherungen. Kein zusätzlicher vollständiger Restore-Ablauf im kurzen StockInfo-Video nötig. | StockInfo T-47/T-50/T-51; StockPortfolio T-20/T-54 |
| Kursalter und Aktualisieren | Im Bild einen Datenstand zeigen; der erneute Abruf ist vorhanden. Feste Demoquelle verwenden, damit derselbe Datensatz erhalten bleibt; keine Echtzeitversorgung versprechen. | StockInfo T-43; StockPortfolio T-30 bis T-34 |

**Für spätere Vertiefung aufbewahren:** Depotwert-Verlauf, Quellenkonfiguration
und YAML-Fallback, Plugin-Entwicklung, Devisenrechner, externe Verweise sowie
Sicherheitspuffer und Investitionsreserve. Mobile Ansicht, Sprache und Themes
eignen sich bei Bedarf als kurze Schlussmontage; sie sollen die fachliche
Story nicht verdrängen. Keine zusätzliche komplexe Rebalancing-Erklärung.

Wichtige Grenzen aus dem Abgleich:

- StockPortfolio T-26/T-29: gespeicherte Tageswerte und gerechneten Rückblick
  auseinanderhalten. Rückblick bewertet den heutigen Bestand mit früheren
  Kursen; weder persönliche historische Rendite noch Transaktionsbuchhaltung
  behaupten. Bei benötigten historischen FX ist der Rückblick laut heutigem
  README ausgeblendet. Daher für den Einstieg den einfacheren Positionschart
  bevorzugen; dieser bleibt in der Kurswährung.
- StockPortfolio T-22 ist durch T-38 überholt: Fremdwährungspositionen werden
  heute bei gültigen FX-Kursen umgerechnet, nicht grundsätzlich ausgeschlossen.
  T-21s alte Aussage über gemeinsam geltende Geldschwellen ist ebenfalls
  überholt: Basiswährung, Sicherheitspuffer und Mindesthandelsgröße gelten
  laut aktuellem README je Depot.
- StockInfo T-19 wurde mit verworfenem Korrekturweg abgeschlossen. Kein
  nachträgliches Umstellen des Handelsplatzes am bestehenden Asset vorführen.
  T-64 verweist für den ergänzten Plugin-Hinweis auf T-67; keine zweite Funktion
  aus dem Ticketzuschnitt ableiten. Done ist kein Nachweis jedes ursprünglichen
  Wunsches. Einige archivierte Kopftexte nennen noch damalige offene Arbeit.
- Dynamische Zusatzfelder sind Anzeigedaten; ihre Übernahme erweitert nicht
  automatisch Bewertung oder Rebalancing-Formeln. Keine weltweite vollständige
  Marktabdeckung allein aus der Plugin-Erweiterbarkeit versprechen.

**Doku-Abgleich:** Projekt- und Docker-README beider Apps gelesen bzw. gezielt
gegen die Kandidaten abgeglichen. Maßgeblich sind die aktuellen Abschnitte
„Position information“, „Price history“, „Value history“, „Portfolio base
currency“, „Several portfolios“ sowie StockInfos Funktions-/Dashboard- und
Quellenbeschreibung. Quellen und konkrete Aufnahmebelege vor Produktion
erneut an den festgehaltenen Fassungen abgleichen. Die Empfehlungen ändern
keine Produktzusagen; keine README-, Rollen- oder Konventionsänderung nötig.
Keine bisherige Medienprüfung wird dadurch als ausgeführt markiert.

### Technik und bekannter Vorbereitungsstand

Auf dem Mac sind FFmpeg und Bildschirmaufnahme-Werkzeuge vorhanden.
Systemstimmen sind durch Mikes ausdrückliche Entscheidung ausgeschlossen,
einschließlich lokaler Entwürfe und Hörproben. Die zuvor festgestellte
Verfügbarkeit von `say` und „Anna“ ist deshalb kein Produktionsweg.
Apples macOS-Tahoe-Lizenz, Abschnitt 2 F, beschränkt Systemstimmen auf
persönliche, nichtkommerzielle Nutzung und schließt öffentliche Verwendung
aus. Bereits für den vorgesehenen Probeclip eine andere Stimme mit passenden
Nutzungsrechten wählen; „intern“ allein belegt keine zulässige Nutzung für
ein auf Veröffentlichung gerichtetes Projekt.
[Quelle: Apple, macOS Tahoe SLA, Abschnitt 2 F](https://www.apple.com/legal/sla/docs/macOSTahoe.pdf).

Anbieter beziehungsweise Sprachmodell, Nutzungsrechte, Zugang und mögliche
Kosten sind noch offen. Keinen bereits nutzbaren Dienst behaupten.
Ein Entwurf der Bildfolge ohne Sprache bleibt möglich. Qualität,
Aussprache der App-Namen und Verständlichkeit am tatsächlichen Audio prüfen.

**Werkzeugoptionen · 2026-09-27:** Mike fragt nach HeyGen und/oder ElevenLabs
und teilt mit: „Lokal habe ich Filmora als Videoeditor installiert“.
Filmora ist vorhanden. Auf Mikes Frage „Kannst du Filmora steuern?“ am
2026-09-27 über die native App-Steuerung unter
`/Applications/Wondershare Filmora Mac.app` erreicht. Die Startoberfläche
ist auslesbar; Wechsel von Miniaturbild- zu Listenansicht und zurück durch
sichtbar geänderte Schaltflächen bestätigt. Kein bestehendes Projekt geöffnet
oder bearbeitet. Version, Medienimport, Timeline-Bearbeitung und Export dieser
Installation sind weiterhin ungeprüft. Der Test belegt grundlegenden Zugriff,
noch keinen vollständig automatisierten Schnitt. Produktion bleibt pausiert.

Empfehlung des Observers, noch keine Anbieterentscheidung durch Mike:

- **ElevenLabs für die Sprecherstimme**, echte App-Aufnahmen und ein
  automatisiert erzeugter Rohschnitt als Grundlage. Filmora für den
  abschließenden Schnitt und optionale Änderungen verwenden. Bilder,
  Szenenclips, getrennte Audiodateien und Untertitel mitliefern, damit die
  Bearbeitung nicht auf einen fertigen MP4-Film beschränkt ist.
- **HeyGen als Alternative für die Zusammenstellung des Videos oder einen
  sichtbaren KI-Präsentator.** Video Agent kann eigene Bilder und Videos
  einbeziehen und Skript, Sprache, Schnitt und Untertitel zusammenstellen.
  Die Lesbarkeit und unveränderte Wiedergabe unserer echten UI-Aufnahmen
  wären am Probeclip zu prüfen. HeyGen nicht auf Avatar-Videos reduzieren.
- **Die Kombination ist möglich:** HeyGen unterstützt ElevenLabs als
  externen Stimmenanbieter. Zwei Dienste sind für ein Video mit App-Bildern
  und Sprecherstimme aber keine Voraussetzung; Filmora ist bereits vorhanden.

Ziel bleibt: Die KI bereitet Medien und Rohschnitt vor; Mike wählt eine
Stimme und beurteilt den Probeclip. Keine manuelle Schnittaufgabe an Mike
aus seiner Filmora-Installation ableiten. Einen vollautomatischen nativen
Filmora-Projektimport erst nach einem erfolgreichen Versuch zusagen;
der dokumentierte XML-Import allein belegt keine passende Timeline-Übergabe.
Zugänge, Kostenrahmen und geeignete Nutzungsrechte vor bezahlter Vertonung
klären. Keine Anmeldung, Bestellung, Vertonung oder Aufnahme erfolgt;
der Produktionsstopp bleibt bestehen.

Quellen: [ElevenLabs TTS](https://elevenlabs.io/text-to-speech),
[HeyGen Video Agent](https://help.heygen.com/en/articles/12402907-how-to-get-started-with-video-agent),
[HeyGen/ElevenLabs-Integration](https://help.heygen.com/en/articles/8310663-how-to-integrate-elevenlabs-other-third-party-voices),
[Filmora für Mac: Medienimport](https://filmora.wondershare.com/guide-mac/importing.html).

**Doku-Abgleich:** Diese Ergänzung betrifft ausschließlich das Medienkonzept
in T-53. Keine geänderten Produkt- oder Betriebszusagen; Projekt-README,
Docker-README und Unraid-Anleitung benötigen keine Anpassung.

Für Screenshots bevorzugt den Seiteninhalt direkt über den Browser erfassen.
Eine macOS-Freigabe zur Aufnahme des gesamten Bildschirms ist dafür keine
pauschale Voraussetzung. Erst wenn `screencapture` oder AVFoundation für
eine echte Bildschirmaufnahme eingesetzt wird, den Berechtigungsstatus des
aufnehmenden Prozesses prüfen und eine gegebenenfalls fehlende Freigabe nennen.
Der bisherige Profilfehler belegt keine fehlende Bildschirmaufnahme-Freigabe.
[Browser-Aufnahmeweg: Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot).

Ein erster Versuch, über Chrome DevTools eine isolierte Seite zu öffnen,
scheiterte am bereits verwendeten Browserprofil. Es entstand dadurch keine
Demoaufnahme. Beim Wiederanlauf einen eigenen verfügbaren Browserkontext
verwenden; keine Browserprozesse oder Prüfumgebungen anderer Rollen beenden.
Der fehlgeschlagene Aufruf war bereits eine Tab-Neuanlage mit isoliertem
Kontext über Chrome DevTools MCP. Der Fehler entstand beim Start mit einem
belegten Browserprofil. Ein weiterer neuer Tab allein ist deshalb keine
belegte Lösung; zuerst die Verbindung beziehungsweise ein eigenes Profil
klären. Claude-in-Chrome ist ein anderer Adapter.

### KI-Kennzeichnung: Recherche vom 2026-09-27

Auf Mikes Auftrag anhand offizieller EU-Quellen recherchiert. Artikel 50
gilt seit 2. August 2026; keine pauschale sichtbare Kennzeichnungspflicht
für jeden KI-unterstützten Inhalt. Anbieterpflichten zur maschinenlesbaren
Markierung und Offenlegungspflichten beim Veröffentlichen unterscheiden.
Die begrenzte Übergangsfrist für bestimmte ältere Systeme bei der
Anbietermarkierung verschiebt unsere mögliche Offenlegungspflicht nicht.
[EU-Kommission: Überblick](https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations).

Einordnung für dieses Paket, noch keine rechtliche Einzelfallfreigabe:
Echte App-Aufnahmen werden durch automatisierten Schnitt nicht zu Deepfakes.
Bei KI-Stimme oder Avatar die konkrete Wirkung prüfen: Entsteht der falsche
Eindruck einer echten menschlichen Aufnahme? Der Anbietername allein
entscheidet das nicht. Für fotorealistische Personenabbilder und geklonte
Stimmen ist die Kennzeichnung besonders relevant.
[RTR: Avatare und digitale Zwillinge](https://www.rtr.at/rtr/service/ki-servicestelle/faq/FAQ.de.html).

Vorgeschlagene Umsetzung: Zu Beginn sichtbar und gut lesbar „Sprecherstimme
KI-generiert. App-Aufnahmen mit Testdaten.“ Bei Avatar entsprechend
„Avatar und Sprecherstimme KI-generiert.“ Bei reinem Audio den Hinweis
hörbar geben. Bei einschlägiger Pflicht genügt ein versteckter Hinweis in
der Beschreibung oder nur am Ende nicht.
[Artikel 50 Abs. 4–5](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50).

Für Blogtexte greift eine besondere Pflicht bei Information über Themen
öffentlichen Interesses; menschliche inhaltliche Prüfung oder redaktionelle
Kontrolle plus redaktionelle Verantwortung können die Textausnahme begründen.
Claude/Codex-Prüfung allein ist keine menschliche Prüfung. Freiwilliger
Hinweis empfohlen: „Mit KI-Unterstützung erstellt.“ „Von Mike inhaltlich
geprüft“ erst nach tatsächlicher Prüfung ergänzen. Rein persönliche,
nichtberufliche Nutzung ist gesondert ausgenommen; diese Einordnung für
Mikes Veröffentlichung ist nicht festgestellt.
[EU-Kommission: FAQ](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act).

Endgültige Stimme/Avatar und Veröffentlichungskanal fehlen noch. Vor
Veröffentlichung konkrete Kennzeichnung und zusätzliche Plattformregeln
prüfen. Hinweise bleiben Gestaltungsvorschläge; keine Medienproduktion
oder Veröffentlichung durch diese Recherche freigegeben. Doku-Abgleich:
nur dieses Medienkonzept betroffen, keine Produktanleitung anzupassen.

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

Einzige aktuelle technische Matrix. Die Konzeptprüfung ist dokumentiert;
die Prüfungen der tatsächlichen Medien stehen noch aus.
`✅`: Konzeptprüfung belegt · `➖`: noch kein ausgeführter Nachweis.

| # | Prüfung | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Claude prüft das Konzept | Urteil vom 2026-09-27 zur Fassung `838176cbbcaa11c0a52ac57e44700dabe9f2ca6b395260b1da19d732c0f74c90`, siehe „Konzeptprüfung“. Keine Medienabnahme; spätere Observer-Einordnung nicht rückwirkend durch dieses Urteil freigegeben | ✅ |
| 2 | Demo und Aufnahmebasis | Getrennter Kontext, ausschließlich künstliche Depotdaten, EUR als Standard-/Basiswährung, gekennzeichneter fester Marktdatenstand, festgehaltene App-Fassungen und Szenenliste | ➖ |
| 3 | Probeclip ansehen und anhören | Abspielbare 30–45 Sekunden; drei verständliche Szenen, lesbare Oberfläche, synchroner Sprechertext; keine Systemstimme | ➖ |
| 4 | Blogentwürfe und Aussagen abgleichen | Ein oder zwei vollständige Entwürfe; belegte Funktionen beider Apps, passende Bilder und Links | ➖ |
| 5 | Fertiges Medienpaket prüfen | Zwei MP4-Videos in Reihenfolge StockInfo → StockPortfolio, jeweils Untertitel, Vorschaubild, Originalscreenshots, Sprechertext und nachvollziehbarer Render-Ablauf vorhanden | ➖ |
| 6 | Unabhängige Gegenprüfung der Medien | Claude benennt geprüfte Dateifassungen und bestätigt oder beanstandet Inhalt sowie Bild-/Tonqualität | ➖ |
| 7 | Aussage zur lokalen Speicherung prüfen | Blogeinstieg und Probeclip tragen Mikes Kernaussage; Speicher- und Anfragepfade belegen die Abgrenzung zwischen Depotdaten und Marktdatenanfragen; Backup und fehlende automatische Synchronisierung sind im vollständigen Paket erklärt | ➖ |
| 8 | Backup und Restore beim Browserwechsel vorführen | JSON-Export des Beispield­epots, Vorschau und bestätigter Import in getrenntem Browser; Bestände und Ziele stimmen überein. Verwendete Browser sowie Grenzen des Backups dokumentiert | ➖ |
| 9 | Persönliche Daten vollständig ausschließen | Vor Aufnahme dokumentierter Abgleich von Demoidentität und Datenherkunft beider Apps; Claude prüft konkrete Medien, Metadaten, Dateinamen und verknüpfte Pfade vor Weitergabe/Veröffentlichung. Keine persönlichen Depotdaten, privaten Betriebsdetails oder Zugangsdaten; kein persönliches Portfolio als Quelle, auch nicht verpixelt | ➖ |
| 10 | Identische Daten für Folgevideos wiederherstellen | Versioniertes Testdatenpaket samt Prüfsumme und Anleitung; erneutes Laden in leerem Demokontext ergibt dieselben Bestände, Ziele, EUR-Einstellung und sichtbaren Berechnungswerte. Kurse/FX/Historien zusätzlich zum Depot-Backup gesichert; Featurevarianten begründet, ursprüngliche Basis erhalten | ➖ |
| 11 | Einfaches Rebalancing vorführen | Ein simulierter Kauf oder Verkauf im festen EUR-Testdepot; Ausgangslage, Eingabe und Wirkung auf Verteilung/Abweichung lesbar gezeigt. Als Simulation erklärt, keine echte Order; reproduzierbare Transaktion im Szenenablauf dokumentiert | ➖ |
| 12 | Durchgehende Story und konsistente Zustände | Teil 1 zeigt StockInfo als Grundlage; Teil 2 zeigt die tatsächliche Wertpapierauswahl daraus samt gültigem Kursabruf. Cash-Ausnahme korrekt abgegrenzt. Dokumentierter Vorzustand führt zum kanonischen EUR-Testdepot; identisches Instrument und Kurs in beiden Filmen. Simulation ändert keine Bestände; Backup/Restore passen dazu. Ein Probeclip, zwei verständliche Vollvideos | ➖ |
| 13 | KI-Kennzeichnung am konkreten Veröffentlichungsstand | Stimme/Avatar und Textnutzung rechtlich eingeordnet; nötiger Hinweis bei erster Wahrnehmung klar und zugänglich. Menschliche Redaktion nicht durch KI-Review ersetzt oder vorweg behauptet. KI-Herkunftsmarkierungen nach Export geprüft; Regeln des gewählten Kanals abgeglichen | ➖ |
| 14 | Feldpflege und Depoteditor unterscheiden | Teil 1: zulässiges StockInfo-Feld bearbeiten und wirksamen manuellen Wert mit Herkunft zeigen; Quellenvorrang beachten. Teil 2: denselben Wert schreibgeschützt anzeigen, danach lokalen Positionseditor öffnen und Testnotiz speichern. Feldwert und Notiz passen zur festen Testbasis; Editor-Speicherung klar von Rebalancing-Simulation getrennt | ➖ |

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

Historischer Prüfbeleg zur unten genannten Fassung. Die präzisierte
Einordnung zu Aufnahmeweg, Browserprofil und Stimme folgt anschließend.

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
   öffentlich verbreiteten Video erlauben, war zum Zeitpunkt dieses
   Vorschlags ungeprüft — inzwischen durch codex-observer mit der
   tatsächlichen Quelle geklärt (Apple macOS-Tahoe-SLA, Abschnitt 2 F,
   siehe „Technik und bekannter Vorbereitungsstand“). **Korrektur auf
   Hinweis des Observers:** Der ursprüngliche Verweis auf SP-CX-05 und die
   Lucide-Herkunftsklärung aus T-51 war unpassend — SP-CX-05 betrifft den
   UI-Referenzvergleich, nicht Lizenzfragen, und T-51 belegt nach Runde 7/8
   gerade keinen Lizenzverstoß, sondern eine sauber abgeschlossene Klärung.
   Die Stimmenfrage steht für sich, ohne einen unterstellten
   Wiederholungsbeleg.
4. **Mehr als eine Stimme im Probeclip gegenprüfen.** `say -v '?'` liefert
   tatsächlich neun deutsche Stimmen (Anna plus acht weitere: Eddy, Flo, Grandma,
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

**Observer-Hinweis zu Vorschlag 3 · 2026-09-27:** SP-CX-05 dokumentiert den
fehlenden Vergleich mit einer benannten UI-Referenz in T-50, keinen
Lizenzbefund. T-51 Runde 7 akzeptiert die Herkunftserklärung zum damaligen
Symbol; Runde 8 prüft das danach ausdrücklich beauftragte Lucide-Original
samt Herkunftsvermerk. Daraus wurde kein bestätigtes Muster von
Lizenzverstößen abgeleitet. Die offene Frage zur Verwendung einer Stimme
steht daher für sich und benötigt ihre eigene Quelle; der Lessons-Verweis
belegt sie nicht. Hiermit ist weder eine Nutzung erlaubt noch untersagt
und keine Produktion gestartet.

### Einordnung der Gegenprüfung · codex-observer · 2026-09-27

Auf Mikes Auftrag „Claude hat was zu T-53 beigetragen - check das“ geprüft.
Bezug: Claudes Ergänzungen in Commit `6b6f66d`. Keine Produktion gestartet.
Die ursprünglichen Reviewaussagen oben bleiben als Prüfgeschichte erhalten.

| Vorschlag | Bewertung und Folgerung |
|---|---|
| 1 · Umfang staffeln | Die Reihenfolge Probeclip → Rückmeldung → vollständiges Paket passt. Eine verbindliche Verschiebung von StockInfo-Beitrag und Vollvideo aus der Zielwoche ist ohne konkreten Engpass nicht begründet und wird nicht übernommen. Eine spätere nötige Terminänderung ausdrücklich mit Mike klären. |
| 2 · Fassung festhalten | Beibehalten: beide App-Commits und Demo-Zustand dokumentieren, Aufnahmen aus stabilen getrennten Umgebungen. `STATUS: idle` allein garantiert keine stabile Fassung und ist bei isolierten Aufnahmen keine zusätzliche Startbedingung für andere Produktarbeit. |
| 3 · Stimme und Nutzungsrechte | Hinweis bestätigt und oben konkretisiert. Hier läuft macOS 26.6.2; die offizielle Tahoe-Lizenz schließt die öffentliche Verwendung der Systemstimmen aus. „Anna“ entfällt als eingeplanter Weg für dieses Medienpaket. Eine passende Stimme vor Vertonung auswählen; keine Kosten oder Dienstzugänge behaupten. |
| 4 · Stimmenvergleich | Sinnvoll als kurze Vorauswahl von höchstens zwei geeigneten Stimmen am selben 10–15-Sekunden-Text. Kein mehrfach gerenderter vollständiger Probeclip und kein Pflichtvergleich ungeeigneter Systemstimmen. `say -v '?'` listet tatsächlich neun deutsche Einträge; die Zahl acht in der Reviewnotiz ist ein Zählfehler. |
| 5 · Untertitel | Sprechertext als Textquelle verwenden. Zeitmarken an den tatsächlich erzeugten Audioblöcken ausrichten und anschließend prüfen; ein korrekter Text allein garantiert noch keine synchronen Untertitel. |
| 6 · StockInfo sichten | Lesen vorhandener Quellen zur beauftragten Konzeptprüfung ist zulässig. Der Produktionsstopp bleibt erhalten: keine neue Demo-Einrichtung, Aufnahme oder Vertonung. Die Bedienvorführung in StockInfo gehört zum Wiederanlauf; keine eigene Lockerung von „Warte noch“ ableiten. |
| 7 · Format | 1920 × 1080, 16:9 als sinnvolle Arbeitsvorgabe empfohlen. Screenshots bei Bedarf höher auflösen, damit Ausschnitte lesbar bleiben. Ein später ausdrücklich gewünschtes Hochformat wäre ein anderer Zuschnitt; 16:9 garantiert nicht, jedes Kanalformat ohne Neurendern abzudecken. |

**Zusätzliche Präzisierungen:** Die macOS-Aufnahmefreigabe betrifft den
gewählten Bildschirmaufnahmeweg, nicht jede Form von Browser-Screenshot.
Der belegte Chrome-DevTools-MCP-Profilkonflikt ist nicht durch einen Verweis
auf Claude-in-Chrome oder eine weitere Tab-Neuanlage behoben. Beide Punkte
sind oben in „Technik und bekannter Vorbereitungsstand“ nachgezogen.
Das sind konzeptionelle Korrekturen; keine erfolgreiche neue Browserverbindung
oder Aufnahme ist damit behauptet.

**Lessons-Einordnung:** AL-R-01 und AL-R-12 angewendet: Verfügbarkeit,
Dokumentation und tatsächliche Ausführung getrennt; Reviewvorschläge gegen
Auftrag und konkrete Werkzeuge geprüft. Einzelne Korrekturen an diesem
Konzeptreview begründen noch kein neues wiederkehrendes Fehlermuster.
SP-CX-05 betrifft den UI-Referenzvergleich in T-50 und ist kein Beleg für
eine frühere Lizenzverletzung bei T-51. Keine zusätzliche Lesson angelegt.

**Doku-Abgleich:** Nur Ticket und Koordinationshinweis betroffen.
Keine Änderung an Produktfunktionen oder Betriebszusagen; Projekt-README,
Docker-README und Unraid-Anleitung bleiben unverändert. Claudes ursprüngliche
Freigabe wird durch diese Einordnung nicht rückwirkend erweitert.

### Claudes Bestätigung der Einordnung · 2026-09-27

Auf Mikes Auftrag „Schau dir nochmal T-53 an" die Einordnung des Observers
gegengeprüft, zwei ihrer Kernaussagen selbst nachvollzogen und eigene
Ungenauigkeiten korrigiert.

- **Stimmenzahl nachgezählt:** `say -v '?' | grep de_DE` liefert selbst
  ausgeführt tatsächlich neun Einträge (Anna plus acht: Eddy, Flo, Grandma,
  Grandpa, Reed, Rocko, Sandy, Shelley). Meine ursprüngliche Zahl acht war
  falsch; oben in Vorschlag 4 korrigiert.
- **macOS-Fassung bestätigt:** `sw_vers` zeigt `26.6.2` — deckt sich mit der
  vom Observer genannten Tahoe-Fassung, auf der die SLA-Bewertung beruht.
- **SP-CX-05-Zuordnung korrigiert:** Der Observer hat recht — die Lesson
  betrifft den UI-Referenzvergleich aus T-50, nicht Lizenzfragen, und T-51
  belegt nach Runde 7/8 keinen Lizenzverstoß, sondern eine sauber
  abgeschlossene Klärung ohne tatsächliche Übernahme. Vorschlag 3 oben ist
  entsprechend berichtigt; kein unterstellter Wiederholungsbeleg mehr.
- **Chrome-DevTools-MCP/Claude-in-Chrome-Vermischung akzeptiert:** Meine
  historische Einschätzung unter „Konzeptprüfung" (oben, als Prüfbeleg
  erhalten) ging davon aus, dass eine neue Tab-Erstellung über
  Claude-in-Chrome den dokumentierten Profilfehler löst. Der Observer stellt
  richtig klar: Der fehlgeschlagene Versuch war bereits eine Tab-Neuanlage
  über ein anderes Werkzeug (Chrome DevTools MCP), der Fehler lag an der
  Verbindung beziehungsweise am belegten Profil selbst, nicht an fehlender
  Tab-Isolation — und Claude-in-Chrome ist ein separater Adapter, keine
  automatische Lösung für ein Problem eines anderen Tools. Ich habe zwei
  unterschiedliche Werkzeuge vermischt; die historische Textstelle bleibt
  als Prüfbeleg unverändert, diese Richtigstellung ergänzt sie.
- **Übrige Bewertungen (Vorschläge 1, 2, 5, 6, 7) nachvollzogen und für
  plausibel befunden:** Keine eigene Änderung; die Verfeinerungen des
  Observers (kein `idle`-Gate als Aufnahmevoraussetzung, gestaffelter
  Stimmenvergleich statt vollem Doppel-Probeclip, Zeitmarken statt nur
  korrektem Text bei Untertiteln, Lesen als zulässige Vorbereitung ohne
  Aufnahme bei Szene 4, Format als Arbeitsvorgabe statt Festlegung) sind
  präziser als meine ursprüngliche Formulierung und werden übernommen.

**Ergebnis:** Einordnung des Observers bestätigt und um zwei korrigierte
eigene Aussagen ergänzt. Kein neuer Befund, keine neue Reviewrunde, keine
Aufhebung des Produktionsstopps. Beide verarbeiteten OUTBOX-Nachrichten
werden entfernt.

### Claudes Prüfung der Datenschutz-/Werkzeugergänzung · 2026-09-27

Auf Mikes Auftrag „T-53 — check das nochmal durch" die seit der letzten
Bestätigung hinzugekommenen Abschnitte geprüft: „Verbindliche Aufnahmebasis:
feste Testdaten in Euro", die vereinfachte Rebalancing-Szene und
„Werkzeugoptionen" samt Filmora-Test. Produktion weiterhin nicht gestartet;
nur Konzept und eine Werkzeug-Fähigkeitsprobe geprüft.

- **Datenschutzabschnitt inhaltlich für tragfähig befunden.** Deckt die
  entscheidenden Fälle ab: kein echtes Portfolio als Quelle (auch nicht als
  „anonymisierte Vorlage" oder verpixelt), das gilt ausdrücklich auch für
  Material an externe KI-Dienste; feste, versionierte Testdaten statt
  wechselnder Zufallsdepots; getrennter Browserkontext auch für den
  Zielbrowser der Restore-Szene; Verify #9 weist die Endkontrolle
  ausdrücklich mir zu, nicht nur der Selbstauskunft des Produzenten.
- **Zwei Ergänzungsvorschläge, keine Blocker:**
  1. **Metadaten vor Weitergabe/Veröffentlichung prüfen.** Screenshots und
     Bildschirmaufnahmen können je nach Werkzeug Geräte-, Zeit- oder
     Pfadangaben in Dateimetadaten tragen, die im Bild selbst unsichtbar
     bleiben. Vorschlag: Verify #9 um einen expliziten Metadaten-Check
     ergänzen, bevor Dateien an externe Dienste (ElevenLabs/HeyGen) gehen
     oder veröffentlicht werden.
  2. **Denselben Testdaten-Maßstab ausdrücklich auf die StockInfo-Szene (4)
     ausdehnen.** Der Datenschutzabschnitt ist an StockPortfolios Demodepot
     formuliert; für die „tatsächlich vorhandene StockInfo-Ansicht" fehlt
     eine ausdrückliche Zusage, dass dort keine reale Backend-Adresse, kein
     echter API-Schlüssel und keine sonst aufschlussreiche Konfiguration
     sichtbar wird. StockInfo kennt zwar keine Bestände, aber Betriebsdetails
     einer selbst gehosteten Instanz sind ein anderes, ebenfalls
     schützenswertes Risiko.
- **Rebalancing-Vereinfachung deckt Mikes Zitat exakt ab:** „nichts
  kompliziertes einfach einen simulierten Verkauf bzw. Kauf" — Prosa,
  Szenentabelle (Zeile 3) und Verify #11 stimmen wortgleich überein; „Decken
  aus" und Finanzierungsvarianten sind ausdrücklich ausgeschlossen.
- **Filmora-Fähigkeitsprobe nachvollzogen:** `/Applications/Wondershare
  Filmora Mac.app` existiert tatsächlich (eigene Prüfung). Die Probe bleibt
  im beauftragten Rahmen — Mike hatte direkt gefragt „Kannst du Filmora
  steuern?"; laut Beleg wurde kein bestehendes Projekt geöffnet oder
  bearbeitet, keine Vertonung oder Aufnahme ausgelöst. Das ist eine direkt
  autorisierte Fähigkeitsprobe, keine eigenmächtige Lockerung des
  Produktionsstopps.
- **Werkzeugempfehlung (ElevenLabs/HeyGen/Filmora) plausibel und ausdrücklich
  als Empfehlung, nicht als getroffene Entscheidung gekennzeichnet;** Zugänge,
  Kosten und Nutzungsrechte korrekt als offen benannt. Quellenlinks nicht
  selbst nachgeladen (kein Web-Zugriff in dieser Prüfung), aber als Belege
  sauber angegeben statt als geprüfte Fakten behauptet.

**Ergebnis:** Ergänzung inhaltlich freigegeben, mit zwei nicht blockierenden
Vorschlägen (Metadaten-Check, StockInfo-Szene explizit in den
Datenschutzmaßstab einbeziehen). Kein Befund, der den Produktionsstopp
oder die bisherigen Freigaben infrage stellt.

### Story-Abgleich und Einordnung der neuen Hinweise · codex-observer · 2026-09-27

Auf Mikes Auftrag Claudes jüngsten Abschnitt zur Datenschutz-/Werkzeugergänzung
und das aktuelle Gesamtkonzept gelesen. **Die Story ist schlüssig, benötigt
aber klare Übergänge statt einer Aufzählung von Funktionen.** Deshalb die
Szenenfolge oben um Anlass, durchgehendes Instrument, Zeitvorschlag und den
Rückweg aus der Simulation ergänzt. Noch kein Sprechertext produziert.

Claudes beide Vorschläge übernommen: Metadaten ausdrücklich prüfen und
denselben Schutz auf die StockInfo-Demo anwenden. Den Adressschutz auf private
Betriebsdetails und Zugangsdaten präzisiert; neutrale Demo-Adressen und
öffentliche Projektlinks dürfen sichtbar sein. Keine tatsächlich gefundenen
privaten Daten oder bereits durchgeführte Medienprüfung behauptet.

**Fachlicher Abgleich:** `README.md`, „Rebalancing is a simulation“, und
`src/views/RebalancingView.vue` (`trades`, `targets`, `clearPlan`) bestätigen:
Die Simulation verändert keine echten Depotbestände. Das Backup darf deshalb
nicht plötzlich den simulierten Nachher-Bestand zeigen. Die Restore-Szene
lädt Marktdaten ausschließlich aus derselben Demoquelle nach. Das schließt
eine bisher offen gebliebene Verbindung zwischen Simulation, Backup und
reproduzierbaren Zahlen, ohne Produktcode zu ändern.

StockInfos `README.md`, Einleitung und „What can it do?“, belegen eine eigene
Instrumentübersicht und Kursdarstellung. Szene 4 nutzt diese für denselben
Demowert, anstatt die zweite App nur als Namen im Datenfluss zu erwähnen.
Konkrete Bedienung und Bildausschnitt bleiben bis zur Wiederaufnahme offen.
Die kurze Erklärung der Abweichung führt direkt zur Simulation; Details zu
Formeln, Finanzierung und Installation überladen den Einstiegsfilm nicht.

**Doku-Abgleich:** StockPortfolio-README („Rebalancing is a simulation“,
„Where the data lives“) und Docker-README („Features“, „Data and backups“)
passen zu diesen Aussagen. StockInfo-README nur als Quelle gelesen.
Anpassung ausschließlich in T-53; keine neuen Produkt- oder Betriebszusagen,
keine README-/Unraid- oder Konventionsänderung nötig. Bestehende Reviewurteile
bleiben historisch erhalten; die jetzige Präzisierung ist ein Observer-Abgleich,
keine zusätzliche unabhängige Medienfreigabe. Keine neue Lesson aus dieser
einzelnen Konzeptpräzisierung abgeleitet.

### Konzeptänderung: StockInfo zuerst, zwei Videos · codex-observer · 2026-09-27

Mikes Vorschlag als aktuelle Story-Richtung ausgearbeitet. StockInfo war in
der bisherigen Fassung erst nach der Depot-Simulation sichtbar; das erklärte
seine Rolle als Voraussetzung und Herkunft der auswählbaren Wertpapiere zu
spät. Zwei Videos lösen diesen Zusammenhang in der passenden Reihenfolge auf.
Die frühere Szenenfolge im historischen Story-Abgleich oben ist damit ersetzt.

**Fachlicher/Doku-Abgleich:** `AddPositionDialog.vue` wählt aus den verfügbaren
Instrumenten und ruft vor Aufnahme `validateInstrument` auf. Das Projekt-README
erklärt unter „Valid prices before adding a position“ den nötigen Kursabruf;
unter den Angaben zum Cash-Konto die lokale Ausnahme ohne Kursanforderung.
Das Docker-README benennt die bereitgestellte StockInfo-Instanz als Voraussetzung.
Deshalb die Aussage im Film auf Wertpapiere präzisieren. Keine Änderung am
Produkt oder an beiden READMEs nötig. Der Datenaufbau für die Aufnahme des
Hinzufügens ist als reproduzierbarer Vorzustand festgelegt, noch nicht erstellt.
Claudes unabhängige Prüfung der neuen Videoaufteilung bleibt offen.

### Ergänzung: Feldpflege und Positionseditor · codex-observer · 2026-09-27

Mikes Vorgabe in beide Szenenfolgen und Verify #14 aufgenommen. Ein gemeinsam
sichtbarer manueller Detailwert verbindet jetzt die Videos zusätzlich zur
Instrumentidentität. Der lokale Editor wird ausdrücklich als Bearbeitung
eigener Depotangaben gezeigt, nicht als Editor der StockInfo-Quellfelder.

**Doku-Abgleich:** StockInfo-README „Fill the gaps yourself“ beschreibt den
Quellenvorrang. StockPortfolio-README „Position information“ erläutert die
übernommenen Werte und Herkunft; `PositionDrilldown.vue` belegt editierbare
Stückzahl, Zielanteil, Anzeigename, Gruppe, Aktivierung und Notiz.
Projekt- und Docker-README benötigen keine Änderung: ergänzt wird die
Medienvorführung vorhandener Funktionen. Kein Produktcode geändert;
Feldwahl, Aufnahme und tatsächliche Übernahme bleiben noch nachzuweisen.

### Auflösung

Aktueller Konzeptvorschlag: zwei aufeinander aufbauende Videos, StockInfo
zuerst, dann StockPortfolio mit sichtbarer Wertpapierübernahme. Die folgenden
Prüfzusammenfassungen betreffen die davor geprüften Konzeptstände.

Konzept durch `claude` geprüft; sieben Vorschläge durch `codex-observer`
bewertet und technische Ungenauigkeiten im aktuellen Konzept präzisiert;
`claude` hat die Einordnung anschließend bestätigt und zwei eigene
Ungenauigkeiten (Stimmenzahl, SP-CX-05-Zuordnung) korrigiert. Die danach
ergänzten Datenschutz-/Testdatenvorgaben, die vereinfachte
Rebalancing-Szene und die Werkzeugoptionen sind von `claude` geprüft und
inhaltlich freigegeben, mit zwei nicht blockierenden Ergänzungsvorschlägen.
Der Observer hat beide Vorschläge konkretisiert übernommen und die Story
auf einen durchgehenden Demofall samt konsistentem Simulation-/Backup-Übergang
ausgerichtet. Die neuen tatsächlichen Mediennachweise bleiben offen.
Zielumfang und Zielwoche nicht eigenmächtig gekürzt. Die Auswahl einer
geeigneten KI-Sprecherstimme bleibt für die Wiederaufnahme offen;
Systemstimmen sind auf Mikes ausdrücklichen Wunsch ausgeschlossen.
Produktion auf Mikes Wunsch weiterhin pausiert; keine Medienfreigabe und
keine Veröffentlichung erfolgt. Start der Produktion braucht weiterhin
Mikes ausdrückliches Startsignal.

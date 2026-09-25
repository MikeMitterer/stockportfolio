# T-43 · Positionsdetails nach Aufgabe gliedern

Beim Öffnen einer Position erscheinen derzeit **Bearbeitung, Depotzahlen,
Zusatzinformationen und Kursverlauf gleichzeitig**. Die aufgeklappte
Tabellenzeile wird lang und erschwert es, eine bestimmte Information zu finden.
Die Ansicht soll jeweils die Aufgabe zeigen, für die sie geöffnet wurde.

**Beispiel:** Wer nur den Kursverlauf ansehen möchte, muss heute an einem
Bearbeitungsformular und mehreren Zahlenblöcken vorbei. Künftig wählt er
„Kursverlauf“ und sieht dort den großen Chart mit der Zeitraumwahl.

**Stand:** Mikes UX-Entscheidung vom 2026-09-25 ist bestätigt. Die Umsetzung
ist noch offen. Codex implementiert; Claude prüft die übergebene Fassung
unabhängig. Rollen, Phase und Reviewfassung stehen ausschließlich in
[`STATUS.md`](../STATUS.md).

Für Mike ist jetzt kein weiterer Entwurfsentscheid nötig. Nach Claudes
technischer Freigabe bleibt eine kurze Bedienprüfung und Abschlussabnahme offen.

## Für dich

Nach der technischen Freigabe auf dem Dashboard eine Position in der Tabelle
öffnen. Zwischen „Depot“, „Kursverlauf“ und „Instrument“ wechseln und prüfen,
ob die gesuchten Angaben ohne langes Scrollen auffindbar sind. Danach
„Position bearbeiten“ öffnen und beurteilen, ob Lesen und Ändern klar
getrennt sind. Auf einem schmalen Bildschirm die Positionskarte und ihre
Informationen prüfen. Die konkrete Testadresse und die geprüfte Fassung werden
vor dieser Aufgabe hier ergänzt; derzeit wird kein laufender Testserver
behauptet.

Dein Urteil: Ist die Detailansicht so im Alltag besser handhabbar? Die Antwort
bleibt offen; sie wird nicht aus technischen Tests abgeleitet.

## Umsetzung und technische Nachweise

| Repo | Umfang | Fremddienst |
|---|---|---|
| StockPortfolio | Detail-UX im Dashboard, Tests und betroffene Benutzerdokumentation | StockInfo unverändert |

### Gewünschtes Verhalten

Die aufgeklappte Tabellenzeile behält den Kontext zur Position. Ihr kompakter
Kopf zeigt Name und Kursstatus sowie die Aktion „Position bearbeiten“. Unter
dem Kopf ist genau einer dieser Bereiche sichtbar:

| Bereich | Inhalt |
|---|---|
| Depot | Marktwert, Zielwert, Bandgrenzen und Abweichung; weitere für die Depotentscheidung nötige Werte nach bestehender Berechnung |
| Kursverlauf | Großer Kurschart und vorhandene Zeitraumwahl; der Chart wird erst beim Öffnen dieses Bereichs geladen |
| Instrument | ISIN, Symbol, weitere StockInfo-Felder und passende externe Links |

„Depot“ ist beim ersten Öffnen gewählt. Ein Bereichswechsel ändert keine
Position und keinen Kurs. Kursprobleme bleiben im Kopf oder direkt beim
betroffenen Inhalt erkennbar, auch wenn ein anderer Bereich gewählt ist.
Cash-Positionen bekommen keinen leeren Kursverlauf; fehlende Kurse und leere
Zusatzfelder haben einen verständlichen Zustand.

„Position bearbeiten“ öffnet ein eigenes Formular. Die bisherigen Eingaben
und ihre direkte Speicherung bleiben erhalten; das Formular erklärt die
Sofortspeicherung. „Kurs neu laden“ steht beim Kursstatus, „Löschen“ am Ende
des Bearbeitungsformulars und behält die vorhandene Bestätigung. Die Werte
werden im reinen Lesebereich nicht als Eingabefelder wiederholt.

Auf schmalen Bildschirmen bleibt die vorhandene Positionskarte der Einstieg.
Die drei Lesebereiche sind auch dort erreichbar und ohne waagrechtes Scrollen
bedienbar. Das bisher bewusst auf Desktop begrenzte Bearbeiten in der
Mobilansicht wird durch dieses Ticket nicht erweitert.

Die vorhandene Feldprojektion bleibt maßgeblich: StockInfo-Felder, die bereits
in der Hauptzeile sichtbar sind, erscheinen nicht nochmals unter „Instrument“.
Kurswährung, Depotwährung, Herkunft und Zustand der Detailwerte bleiben wie
bisher verständlich. Es gibt keine neue StockInfo-Route und keine Änderung an
Depotberechnung oder Speicherung.

### Verify

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ keine Live-Verifikation. Alle Zeilen sind vor der Umsetzung offen.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Tabellenposition öffnen und die drei Bereiche wählen | Jeweils nur der gewählte Inhalt erscheint; der Kopf und Positionskontext bleiben sichtbar | ➖ |
| 2 | Position öffnen, ohne „Kursverlauf“ zu wählen; danach dorthin wechseln | Die Historie wird erst beim ersten Anzeigen des Charts angefordert; Zeitraumwahl funktioniert weiter | ➖ |
| 3 | „Position bearbeiten“ wählen und vorhandene Felder ändern | Formular ist vom Lesen getrennt, Sofortspeicherung wird erklärt und Änderungen wirken wie bisher | ➖ |
| 4 | Kurs neu laden und Position löschen | Neuladen ist beim Kurs erreichbar; Löschen bleibt im Formular und verlangt Bestätigung | ➖ |
| 5 | Cash-Position, fehlenden Kurs und leere beziehungsweise nicht geladene Zusatzfelder anzeigen | Keine leeren Reiter oder irreführenden Werte; Warnung und Leerzustand bleiben verständlich | ➖ |
| 6 | Positionskarte bei schmaler Breite öffnen und Bereiche bedienen | Depot-, Kurs- und Instrumentangaben sind lesbar und ohne waagrechtes Scrollen erreichbar | ➖ |
| 7 | Feld zugleich als Hauptspalte und als StockInfo-Detailwert anzeigen | Es erscheint nicht doppelt; Metadaten und Originalwährung bleiben erhalten | ➖ |
| 8 | `make test`, `make lint`, `make typecheck` ausführen | Alle drei Prüfungen bestehen; Ergebnisse und Einschränkungen stehen vor Übergabe hier | ➖ |

Der Implementer ergänzt konkrete Testumgebung, Befunde und Doku-Abgleich an
dieser Stelle. Claude prüft nach der Übergabe die beauftragte Fassung und die
Zuordnung der Aussagen in README und weiteren betroffenen Anleitungen.

**Doku-Abgleich bei Umsetzung:** Das Datei- und Überschrifteninventar muss
mindestens `README.md` („Additional instrument information“, „Price history“)
und das bisherige Bild `docs/images/drilldown.png` berücksichtigen. Das Bild
darf nach dem Umbau keinen veralteten Bedienzustand als aktuell zeigen.

### Side-Effects

Der Kursverlauf wird erst bei Bedarf geladen. Ansonsten sind keine Änderungen
an API, Berechnung oder Datenhaltung vorgesehen.

### Abgrenzung

Die Tabellen-Hauptzeile, Rebalancing-Rechnung und StockInfo-Verträge bleiben
fachlich unverändert. Eine neue Positionsseite, zusätzliche Konfiguration
und eine neue mobile Bearbeitungsfunktion gehören nicht zu diesem Ticket.

### Auflösung

Offen. Technische Freigabe und Mikes Abschlussentscheidung werden getrennt
dokumentiert.

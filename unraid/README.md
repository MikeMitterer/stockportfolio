# Unraid

StockPortfolio liefert eine statische Browser-App aus. Kurse und Stammdaten
kommen aus einer getrennten StockInfo-Instanz. Die einzige gepflegte Vorlage
liegt im Repository
[MikeMitterer/unraid-templates](https://github.com/MikeMitterer/unraid-templates)
unter `templates/stockportfolio.xml`. Die lokale Arbeitskopie dieses Repositories
liegt unter `/Volumes/DevLocal/DevUnraid/Production/Templates`.
Vorlage und Docker-Image sind für die Veröffentlichung vorbereitet; der Push
steht noch aus.

## Lokale Vorlage testen

Für eine Testkopie `TemplateURL` entfernen: Unraid soll beim Test keine
andere Fassung nachladen. Unter einem eigenen Namen ablegen, niemals eine
bestehende `my-stockportfolio.xml` mit gespeicherten Nutzereinstellungen ersetzen:

```bash
sed '/<TemplateURL>/d' \
  /Volumes/DevLocal/DevUnraid/Production/Templates/templates/stockportfolio.xml \
  > /tmp/stockportfolio-test.xml
scp /tmp/stockportfolio-test.xml root@unraid:/boot/config/plugins/dockerMan/templates-user/stockportfolio-test.xml
```

Im Docker-Reiter „Add Container“ wählen, Vorlage `stockportfolio`. Für einen
Paralleltest einen anderen Containernamen und freien Host-Port verwenden.

| Feld | Bedeutung |
|---|---|
| WebUI Port | Standard Host-Port 8088, Containerport **8080** |
| StockInfo API | Pflicht: vom **Browser** erreichbare URL deiner StockInfo-Instanz |
| Timezone | Zeitzone des Containerprotokolls, Standard UTC |

**Ältere Images lauschten auf Port 80.** Bei einem bestehenden Container die
Zuordnung auf Containerport 8080 ändern. Host-Adresse und Host-Port beibehalten:
Der Browser ordnet seine Daten dieser Herkunft zu. Ein anderer Host-Port zeigt
einen anderen, zunächst leeren Browserbestand.

## Ohne Vorlage

```bash
docker run -d --name stockportfolio \
    -p 8088:8080 \
    -e STOCKINFO_API_URL=https://stockinfo.example.com \
    -e TZ=Europe/Vienna \
    --restart unless-stopped \
    mangolila/stockportfolio:latest
```

## Daten, API und Prüfung

**Kein Volume:** Depots und Einstellungen liegen im Browser (IndexedDB).
Container-Updates verändern sie nicht; gelöschte Browserdaten oder ein anderes
Gerät dagegen schon. Sicherungen über **Einstellungen → Sicherung** exportieren;
der Download landet im Downloadordner. Ein Serverbackup sichert diese Daten nicht.

Die API-Adresse wird beim Start aus `STOCKINFO_API_URL` in `config.js`
geschrieben. Sie muss vom Browser aus erreichbar sein; `localhost` ist dessen
Rechner, kein Docker-Dienstname. Unter **Einstellungen → Status** steht die
wirksame URL. Nach Änderungen den Container neu starten.

StockInfo muss die Web-Herkunft, etwa `http://unraid:8088`, durch CORS erlauben.
Bei HTTPS für die Oberfläche muss auch die API HTTPS anbieten.

Der statische Node-Server läuft ohne Root-Rechte. Der Healthcheck prüft die lokale Web-Auslieferung,
nicht die getrennte API. API-Fehler werden in der App angezeigt. Ein realer
Unraid-Test bleibt von einem lokalen Docker-Test zu unterscheiden.

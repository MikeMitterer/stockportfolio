# Unraid

Container-Vorlage für StockPortfolio.

## Einspielen

```bash
scp unraid/stockportfolio.xml root@unraid:/boot/config/plugins/dockerMan/templates-user/
```

Danach im Docker-Reiter auf „Add Container", oben unter *Template* den Eintrag
`StockPortfolio` wählen. Zwei Felder sind auszufüllen:

| Feld | Bedeutung |
|---|---|
| WebUI Port | Host-Port; im Container hört nginx auf 80 |
| StockInfo-API | Adresse der eigenen Instanz — voreingestellt `http://<host>:8000`, der Standard-Port von StockInfo |

Die Adresse ist Pflicht: Ohne sie startet die App nicht, sondern zeigt eine
entsprechende Meldung. StockInfo selbst liegt unter
<https://github.com/MikeMitterer/stockinfo>.

## Ohne Vorlage

```bash
docker run -d --name stockportfolio \
    -p 8088:80 \
    -e STOCKINFO_API_URL=http://<host>:8000 \
    --restart unless-stopped \
    mangolila/stockportfolio
```

## Wissenswertes

**Kein Volume.** Depot und Einstellungen liegen im Browser des Nutzers
(IndexedDB), nicht im Container. Deshalb gibt es nichts zu mappen, ein Update
ist ein reines „Pull & Restart", und ein gelöschter Container kostet keine
Daten. Umgekehrt heißt das: Ein anderes Gerät zeigt ein leeres Depot — zum
Umziehen dient die Sicherung unter *Einstellungen → Daten*.

**Die API-Adresse steckt nicht im Abbild.** Sie wird beim Start aus
`STOCKINFO_API_URL` in die App geschrieben. Ein Neustart des Containers
genügt, um auf ein anderes Backend zu zeigen. Welche gerade gilt, steht in der
App unter *Einstellungen → Status* und in der Statuszeile unten.

**CORS.** Die StockInfo-Instanz muss die Herkunft des Containers erlauben,
also `http://<unraid-ip>:8088`. Sonst bleibt die App leer und die Statusseite
meldet „nicht erreichbar", obwohl der Dienst läuft. Das ist der wahrscheinlichste
Stolperstein beim ersten Start.

**Healthcheck** ist eingebaut; Unraid färbt den Zustand im Docker-Reiter
entsprechend.

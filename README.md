# Filament Spool Card

Your [Spoolman](https://github.com/Donkie/Spoolman) filament stock as a Home Assistant card: every spool is drawn as a roll in its filament colour, and the roll gets thinner as it is used up. Tap a spool to change it, and the change goes straight to Spoolman.

- **Edit the amount:** subtract what a print used (default) or set the remaining weight. Decimal comma and decimal point both work.
- **Tool heads:** load a spool onto a tool head (Spoolman extra field `active_toolhead`). If another spool sits on that head, it is moved back to your storage location first.
- **Location:** move spools between locations; spools are grouped by location.
- **New spools:** create spools – and, if needed, new filaments and vendors – right from the card.
- **Prices and costs:** store the price of a spool; the card estimates what a print cost and what your stock is worth.
- **Running low and reorder (optional):** spools below a threshold are listed with a shop link and a button that puts them on your Home Assistant shopping list.
- **Stock by material (optional):** totals per material, with value.

UI texts are available in **English and German** and follow the user's language.

## Requirements

- The [Spoolman integration](https://github.com/Disane87/spoolman-homeassistant) for Home Assistant (installable via HACS). The card reads its `sensor.spoolman_spool_*` entities and uses its `spoolman.patch_spool` and `spoolman.use_spool_filament` actions.
- For tool heads: an extra field `active_toolhead` (type text) on spools in Spoolman (*Settings → Extra fields → Spools*).
- For creating spools: a `rest_command` (see below), because the integration has no action for that yet.

## Installation

**HACS** (recommended): HACS → ⋮ → *Custom repositories* → add this repository's URL with type *Dashboard* → install *Filament Spool Card* → reload the browser.

**Manual:** copy `filament-spool-card.js` to `config/www/` and add it as a dashboard resource (`/local/filament-spool-card.js`, type *JavaScript module*).

### Creating spools (optional)

Add this to `configuration.yaml`, replace the address with your Spoolman server and restart Home Assistant:

```yaml
rest_command:
  spoolman_api:
    url: "http://192.168.1.10:7912/api/v1/{{ path }}"
    method: post
    content_type: "application/json"
    payload: "{{ data | to_json }}"
```

Without it, everything except *New spool* works.

## Options

| Option | Default | Description |
|---|---|---|
| `title` | *Filament stock* | Card title |
| `entities` | all spools | List of `sensor.spoolman_spool_*` entities to show |
| `location` | – | Show only spools at this location |
| `printer_location` | – | Location of your printer. Spools there with a tool head get a `T1`… badge |
| `storage_location` | – | Where a spool goes when it is taken off a tool head (e.g. `Box`). Without it, the head is only cleared |
| `hide_loaded` | `false` | Hide spools that sit on a tool head – handy next to a printer card |
| `toolheads` | `5` | Number of tool heads to offer |
| `low` | `100` | Below this many grams a spool counts as running low (shown in red) |
| `summary` | `false` | Show the *Running low* and *Stock by material* blocks |
| `shopping_list` | `todo.shopping_list` | To-do entity for the reorder button |
| `shop_url` | Amazon search | Shop link for low spools, `{q}` is replaced by vendor, material and colour. `false` hides the link |
| `currency` | `EUR` | Currency for prices and costs (ISO code, e.g. `USD`) |
| `editable` | `true` | `false` makes the card read-only (tap shows the details) |
| `api_service` | `spoolman_api` | Name of the `rest_command` used for creating spools |
| `wait_ms` | `1500` | Pause between taking the old spool off a head and loading the new one |

Prices are taken from the spool (*price*) and, if it has none, from the filament. The cost of a print is the used weight times price per gram.

### Examples

```yaml
type: custom:filament-spool-card
printer_location: Printer
storage_location: Box
summary: true
```

Next to a printer card, showing only what is not loaded:

```yaml
type: custom:filament-spool-card
title: Spool storage
printer_location: Printer
storage_location: Box
hide_loaded: true
```

## Deutsch

Die Karte zeigt deinen Filamentbestand aus Spoolman als Rollen in der jeweiligen Farbe. Antippen öffnet die Bearbeitung: Verbrauch abziehen (Standard) oder Restmenge setzen, Druckkopf und Lagerort wählen, Preis der Spule eintragen. Alles wird direkt in Spoolman gespeichert. Komma und Punkt funktionieren beide.

Mit `summary: true` zeigt die Karte zusätzlich, welche Spulen bald leer sind (mit Shop-Link und Knopf für die Einkaufsliste), und den Bestand nach Material mit Gesamtwert. Neue Spulen lassen sich anlegen, sobald der `rest_command` oben in der `configuration.yaml` steht. Die Oberfläche folgt der Spracheinstellung in Home Assistant.

## License

MIT – see [LICENSE](LICENSE).

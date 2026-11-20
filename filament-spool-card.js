/* Filament Spool Card – Spoolman spools as filament rolls in their filament colour, for Home Assistant.
   Tap a spool to edit it: remaining weight or used weight, tool head and location; changes are written to Spoolman.
   "New spool" creates spools (and, if needed, filaments and vendors) in Spoolman through a rest_command (see README).
   Needs the Spoolman integration (https://github.com/Disane87/spoolman-homeassistant).
   MIT License – see LICENSE */
const FSC_VERSION = '1.0.1';
const FSC_DENSITY = { PLA: 1.24, PETG: 1.27, ABS: 1.04, ASA: 1.07, TPU: 1.21, PA: 1.14, PC: 1.2, PVA: 1.23, HIPS: 1.04 };
const FSC_LANG = (h) => { const l = ((h && ((h.locale && h.locale.language) || h.language)) || 'en').slice(0, 2); return l === 'de' ? 'de' : 'en'; };
const FSC_I18N = {
  en: {
    title: 'Filament stock', add: '＋ New spool', none: 'No spools found', weight: 'Weight', remaining: 'Remaining', subtract: 'Subtract usage', used: 'Used',
    of: (n) => `of ${n} g`, after: (n) => `Remaining after: ${n} g`, rest: (n) => `Remaining: ${n} g`, tool: 'Tool head', noTool: 'none', location: 'Location',
    details: 'Details', cancel: 'Cancel', save: 'Save', saving: 'Saving …', close: 'Close',
    clashMove: (t, n, box) => `T${t} is loaded with ${n} – that spool is ${box ? `moved back to ${box}` : 'cleared from the tool head'} first.`,
    clashSame: (t, n) => `T${t} is also set on ${n}.`,
    back: (n, box) => `${n} back to ${box} …`, clear: (n) => `Clearing ${n} …`, assign: (t) => `Loading T${t} …`,
    errRem: 'Please enter a remaining weight of 0 g or more.', errUse: 'Please enter the used weight in grams.', errUseBig: (n) => `The used weight is larger than what is left (${n} g).`,
    saveFail: 'Saving failed: ', newSpool: 'New spool', filament: 'Filament', newFil: '＋ New filament …', vendor: 'Vendor', newVendor: '＋ New vendor …', vendorName: 'Vendor name',
    name: 'Name / colour', namePh: 'e.g. Galaxy Black', colour: 'Colour', material: 'Material', density: 'Density (g/cm³)', content: 'Net weight (g)', emptySpool: 'Empty spool (g)', optional: 'optional', diameter: 'Diameter (mm)',
    initial: 'Net weight of the new spool', now: 'Weight now', usedNew: 'Used', full: 'full', create: 'Create spool', creating: 'Creating …', mkVendor: 'Creating vendor …', mkFil: 'Creating filament …', mkSpool: 'Creating spool …',
    createFail: 'Creating failed: ', errInit: 'Please enter the net weight of the new spool in grams.', errAmt: (n) => `The weight must be between 0 and ${n} g.`, errName: 'Please enter a name for the filament (for example its colour).',
    errVendor: 'Please enter the vendor.', errDens: 'Density and diameter must be greater than 0.', errW: 'Please enter valid weights for the filament.',
    noApi: (s) => `Creating spools needs the service rest_command.${s} in Home Assistant. Add it to configuration.yaml as shown in the README and restart Home Assistant.`,
    reply: 'Spoolman answered', noReply: 'no answer',
    noLoc: 'No location', count: (n, g) => `${n} ${n === 1 ? 'spool' : 'spools'} · ${g} g`, loc: 'en-GB',
    price: 'Spool price', pricePh: 'e.g. 19.99', errPrice: 'Please enter a valid price, e.g. 19.99.', cost: 'cost ≈', perKg: 'per kg', worth: 'remaining worth ≈', fromFil: '(from the filament)', noPrice: 'no price, no cost estimate',
    low: 'Running low', below: (n) => `below ${n} g`, shopAll: 'Add all to the shopping list', shop: '🛒 Reorder', onList: '✓ on the list', shopLink: 'Shop ↗',
    byMat: 'Stock by material', total: (w) => `${w} in total`, value: 'value ≈', noPriceN: (n) => `(${n} without price)`, spools: (n) => `${n} ${n === 1 ? 'spool' : 'spools'}`, half: (n) => `${n} more than half full`, noMat: 'No material', item: 'Filament', shopUrl: 'https://www.amazon.com/s?k={q}',
  },
  de: {
    title: 'Filamentbestand', add: '＋ Neue Spule', none: 'Keine Spulen gefunden', weight: 'Gewicht', remaining: 'Restmenge', subtract: 'Verbrauch abziehen', used: 'Verbraucht',
    of: (n) => `von ${n} g`, after: (n) => `Rest danach: ${n} g`, rest: (n) => `Rest: ${n} g`, tool: 'Druckkopf', noTool: 'keiner', location: 'Lagerort',
    details: 'Details', cancel: 'Abbrechen', save: 'Speichern', saving: 'Speichere …', close: 'Schließen',
    clashMove: (t, n, box) => `T${t} ist mit ${n} belegt – die Spule wird beim Speichern zuerst ${box ? `zurück in ${box} gelegt` : 'vom Druckkopf genommen'}.`,
    clashSame: (t, n) => `T${t} ist auch bei ${n} eingetragen.`,
    back: (n, box) => `${n} zurück in ${box} …`, clear: (n) => `Nehme ${n} vom Druckkopf …`, assign: (t) => `Belege T${t} …`,
    errRem: 'Bitte eine Restmenge ab 0 g eingeben.', errUse: 'Bitte den Verbrauch in Gramm eingeben.', errUseBig: (n) => `Der Verbrauch ist größer als die Restmenge (${n} g).`,
    saveFail: 'Speichern fehlgeschlagen: ', newSpool: 'Neue Spule', filament: 'Filament', newFil: '＋ Neues Filament …', vendor: 'Hersteller', newVendor: '＋ Neuer Hersteller …', vendorName: 'Name des Herstellers',
    name: 'Name / Farbe', namePh: 'z. B. Galaxy Black', colour: 'Farbe', material: 'Material', density: 'Dichte (g/cm³)', content: 'Inhalt (g)', emptySpool: 'Leerspule (g)', optional: 'optional', diameter: 'Durchmesser (mm)',
    initial: 'Füllmenge neu', now: 'Gewicht jetzt', usedNew: 'Verbraucht', full: 'voll', create: 'Spule anlegen', creating: 'Lege an …', mkVendor: 'Lege Hersteller an …', mkFil: 'Lege Filament an …', mkSpool: 'Lege Spule an …',
    createFail: 'Anlegen fehlgeschlagen: ', errInit: 'Bitte die Füllmenge der neuen Spule in Gramm eingeben.', errAmt: (n) => `Das Gewicht muss zwischen 0 und ${n} g liegen.`, errName: 'Bitte einen Namen für das Filament eingeben (z. B. die Farbe).',
    errVendor: 'Bitte den Hersteller eingeben.', errDens: 'Dichte und Durchmesser müssen größer als 0 sein.', errW: 'Bitte gültige Gewichte für das Filament eingeben.',
    noApi: (s) => `Zum Anlegen fehlt in Home Assistant der Dienst rest_command.${s}. Er gehört einmalig in die configuration.yaml (siehe README), danach Home Assistant neu starten.`,
    reply: 'Spoolman meldet', noReply: 'keine Antwort',
    noLoc: 'Ohne Lagerort', count: (n, g) => `${n} ${n === 1 ? 'Spule' : 'Spulen'} · ${g} g`, loc: 'de-DE',
    price: 'Preis der Spule', pricePh: 'z. B. 19,99', errPrice: 'Bitte einen gültigen Preis eingeben, z. B. 19,99.', cost: 'Kosten ≈', perKg: 'pro kg', worth: 'Restwert ≈', fromFil: '(vom Filament)', noPrice: 'ohne Preis keine Kostenschätzung',
    low: 'Bald leer', below: (n) => `unter ${n} g`, shopAll: 'Alle auf die Einkaufsliste', shop: '🛒 Nachkaufen', onList: '✓ auf der Liste', shopLink: 'Shop ↗',
    byMat: 'Bestand nach Material', total: (w) => `${w} gesamt`, value: 'Wert ≈', noPriceN: (n) => `(${n} ohne Preis)`, spools: (n) => `${n} ${n === 1 ? 'Spule' : 'Spulen'}`, half: (n) => `${n} über halb voll`, noMat: 'Ohne Material', item: 'Filament', shopUrl: 'https://www.amazon.de/s?k={q}',
  },
};

class FilamentSpoolCard extends HTMLElement {
  setConfig(c) { this._c = c || {}; this._sig = null; this._edit = null; this._new = null; if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); }
  static getStubConfig() { return {}; }
  getCardSize() { return 4; }
  getGridOptions() { return { columns: 'full', rows: 'auto' }; }

  _t() { return FSC_I18N[FSC_LANG(this._hass)]; }
  _ids() { return this._c.entities || Object.keys(this._hass.states).filter((i) => /^sensor\.spoolman_spool_\d+$/.test(i)); }
  _num(v) { return parseFloat(String(v == null ? '' : v).replace(',', '.')); }
  _money(v) { try { return v.toLocaleString(this._t().loc, { style: 'currency', currency: this._c.currency || 'EUR' }); } catch (x) { return (Math.round(v * 100) / 100).toLocaleString(this._t().loc) + ' ' + (this._c.currency || 'EUR'); } }
  _todo() { return this._c.shopping_list || 'todo.shopping_list'; }
  async _loadTodo() {
    const ent = this._todo();
    if (!this._hass.states[ent]) { this._tItems = null; return; }
    try {
      const r = await this._hass.connection.sendMessagePromise({ type: 'call_service', domain: 'todo', service: 'get_items', service_data: { status: ['needs_action'] }, target: { entity_id: ent }, return_response: true });
      const x = ((r && r.response) || {})[ent];
      this._tItems = x && x.items ? x.items.map((i) => i.summary) : [];
    } catch (err) { this._tItems = []; }
    if (!this._edit && !this._new) this._render();
  }
  async _shop(list) {
    const ent = this._todo(), have = this._tItems || [];
    try { for (const x of list) if (!have.includes(x.t)) await this._hass.callService('todo', 'add_item', x.u ? { item: x.t, description: x.u } : { item: x.t }, { entity_id: ent }); } catch (err) { /* list not reachable */ }
    await this._loadTodo();
  }
  _wait() { return new Promise((r) => setTimeout(r, this._c.wait_ms != null ? Number(this._c.wait_ms) : 1500)); }
  _svc() { return this._c.api_service || 'spoolman_api'; }
  _hasApi() { const s = this._hass.services || {}; return !!(s.rest_command && s.rest_command[this._svc()]); }
  _box() { return this._c.storage_location || ''; }
  _printer() { return this._c.printer_location || ''; }

  set hass(h) {
    this._hass = h;
    const ids = this._ids();
    const sig = FSC_LANG(h) + ids.map((i) => { const s = h.states[i]; return i + ':' + (s ? [s.state, s.attributes.location, s.attributes.extra_active_toolhead, s.attributes.archived].join('|') : ''); }).join(',');
    if (sig !== this._sig) { this._sig = sig; if (!this._edit && !this._new) this._render(); }
    if (this._c.summary) { const t = h.states[this._todo()], ts = t ? t.state + t.last_updated : '-'; if (ts !== this._tsig) { this._tsig = ts; this._loadTodo(); } }
  }

  /* Filaments and vendors come from the integration's filament sensors */
  _fils() {
    const h = this._hass;
    return Object.keys(h.states).filter((i) => /^sensor\.spoolman_filament_\d+$/.test(i)).map((i) => h.states[i]).filter((s) => s && s.state !== 'unavailable' && s.attributes.id != null)
      .map((s) => { const a = s.attributes; return { id: a.id, name: a.name || '', vendor: a.vendor_name || '', vid: a.vendor_id, mat: a.material || '', weight: Number(a.weight) || 1000 }; })
      .sort((p, q) => (p.vendor + p.name).localeCompare(q.vendor + q.name));
  }

  async _api(path, data) {
    const T = this._t();
    const r = await this._hass.connection.sendMessagePromise({ type: 'call_service', domain: 'rest_command', service: this._svc(), service_data: { path, data }, return_response: true });
    const x = r && r.response;
    if (!x || !(x.status >= 200 && x.status < 300)) throw new Error(T.reply + ' ' + (x ? x.status + ' ' + JSON.stringify(x.content || '').slice(0, 160) : T.noReply));
    return x.content;
  }

  _locs() {
    const set = [this._box(), this._printer()].filter(Boolean);
    (this._all || []).forEach((p) => { if (p.loc && !set.includes(p.loc)) set.push(p.loc); });
    return set;
  }

  _fmtIn(v) { return this._t().loc === 'de-DE' ? String(v).replace('.', ',') : String(v); }
  _open(id) {
    const p = (this._all || []).find((x) => x.id === id), h = this._hass;
    if (!p) return;
    if (this._c.editable === false || p.sid == null) { this._info(id); return; }
    const ls = h.states[id.replace(/^sensor\./, 'select.') + '_location'];
    const locs = ls && Array.isArray(ls.attributes.options) ? ls.attributes.options.slice() : this._locs();
    if (p.loc && !locs.includes(p.loc)) locs.unshift(p.loc);
    const tool = String(p.tool == null ? '' : p.tool);
    this._new = null;
    this._edit = { id, sid: p.sid, rem0: p.rem, rem: String(Math.round(p.rem * 10) / 10), mode: 'use', use: '', price0: p.price != null ? this._fmtIn(p.price) : '', price: p.price != null ? this._fmtIn(p.price) : '', tool0: tool, tool, loc0: p.loc, loc: p.loc, locs, busy: false, err: '' };
    this._show();
  }

  _openNew() {
    const f = this._fils()[0], locs = this._locs();
    this._edit = null;
    this._new = { fil: f ? String(f.id) : 'new', vendor: 'new', vname: '', name: '', material: 'PLA', color: '#808080', weight: '1000', spw: '', density: '1.24', dia: '1.75', init: f ? String(f.weight) : '1000', mode: 'rem', amt: '', loc: this._box() || locs[0] || '', locs, tool: '', busy: false, err: '' };
    this._show();
  }

  _show() { this._render(); const ed = this.shadowRoot.querySelector('.ed'); if (ed && ed.scrollIntoView) ed.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  _info(id) { this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })); }
  _clash(tool, id) { return tool ? (this._all || []).filter((p) => p.id !== id && String(p.tool == null ? '' : p.tool) === tool) : []; }

  /* The spool currently on a tool head goes back to storage first, then a short pause */
  async _free(old, d, tool) {
    if (!old.length) return;
    const T = this._t(), box = this._box(), names = old.map((p) => p.name).join(', ');
    d.msg = box ? T.back(names, box) : T.clear(names); this._render();
    for (const o of old) await this._hass.callService('spoolman', 'patch_spool', Object.assign({ id: o.sid, extra: { active_toolhead: '' } }, box ? { location: box } : {}));
    await this._wait();
    d.msg = T.assign(tool); this._render();
  }

  async _save() {
    const e = this._edit, h = this._hass, T = this._t();
    if (!e || e.busy) return;
    const rem = this._num(e.rem), use = e.use === '' ? 0 : this._num(e.use);
    if (e.mode === 'rem' && (isNaN(rem) || rem < 0)) { e.err = T.errRem; this._render(); return; }
    if (e.mode === 'use' && (isNaN(use) || use < 0)) { e.err = T.errUse; this._render(); return; }
    if (e.mode === 'use' && use > e.rem0 + 0.05) { e.err = T.errUseBig(Math.round(e.rem0)); this._render(); return; }
    const pr = e.price.trim() === '' ? null : this._num(e.price);
    if (e.price !== e.price0 && pr != null && (isNaN(pr) || pr < 0)) { e.err = T.errPrice; this._render(); return; }
    e.busy = true; e.err = ''; e.msg = T.saving; this._render();
    try {
      const patch = { id: e.sid };
      if (e.price !== e.price0 && pr != null) patch.price = pr;
      if (e.mode === 'rem' && Math.abs(rem - e.rem0) > 0.05) patch.remaining_weight = rem;
      if (e.loc && e.loc !== e.loc0) patch.location = e.loc;
      if (e.tool !== e.tool0) { patch.extra = { active_toolhead: e.tool }; await this._free(this._clash(e.tool, e.id), e, e.tool); }
      if (Object.keys(patch).length > 1) await h.callService('spoolman', 'patch_spool', patch);
      if (e.mode === 'use' && use > 0) await h.callService('spoolman', 'use_spool_filament', { id: e.sid, use_weight: use });
      this._edit = null;
    } catch (x) {
      e.busy = false; e.err = T.saveFail + ((x && x.message) || x);
    }
    this._render();
  }

  async _create() {
    const n = this._new, h = this._hass, T = this._t();
    if (!n || n.busy) return;
    const bad = (t) => { n.err = t; this._render(); };
    const init = this._num(n.init), amt = n.amt === '' ? null : this._num(n.amt);
    if (isNaN(init) || init <= 0) return bad(T.errInit);
    if (amt != null && (isNaN(amt) || amt < 0 || amt > init)) return bad(T.errAmt(Math.round(init)));
    const price = (n.price || '').trim() === '' ? null : this._num(n.price);
    if (price != null && (isNaN(price) || price < 0)) return bad(T.errPrice);
    let fil = null;
    if (n.fil === 'new') {
      const dens = this._num(n.density), dia = this._num(n.dia), w = this._num(n.weight), spw = n.spw === '' ? null : this._num(n.spw);
      if (!n.name.trim()) return bad(T.errName);
      if (n.vendor === 'new' && !n.vname.trim()) return bad(T.errVendor);
      if (!(dens > 0) || !(dia > 0)) return bad(T.errDens);
      if (!(w > 0) || (spw != null && !(spw >= 0))) return bad(T.errW);
      fil = { name: n.name.trim(), material: n.material.trim() || null, density: dens, diameter: dia, weight: w, color_hex: n.color.replace('#', '').toUpperCase() };
      if (spw != null) fil.spool_weight = spw;
    }
    n.busy = true; n.err = ''; n.msg = T.creating; this._render();
    try {
      let fid = Number(n.fil);
      if (fil) {
        let vid = Number(n.vendor);
        if (n.vendor === 'new') { n.msg = T.mkVendor; this._render(); const v = await this._api('vendor', { name: n.vname.trim() }); vid = v.id; n.vendor = String(vid); }
        n.msg = T.mkFil; this._render();
        fil.vendor_id = vid;
        const f = await this._api('filament', fil); fid = f.id; n.fil = String(fid);
      }
      if (n.tool) await this._free(this._clash(n.tool, null), n, n.tool);
      n.msg = T.mkSpool; this._render();
      const sp = { filament_id: fid, initial_weight: init };
      if (n.loc) sp.location = n.loc;
      if (amt != null) sp[n.mode === 'use' ? 'used_weight' : 'remaining_weight'] = amt;
      /* Spoolman stores extra fields as JSON-encoded strings */
      if (n.tool) sp.extra = { active_toolhead: JSON.stringify(n.tool) };
      if (price != null) sp.price = price;
      const made = await this._api('spool', sp);
      /* A patch through the integration makes it refresh, so the new spool appears right away */
      try { if (made && made.id != null) await h.callService('spoolman', 'patch_spool', { id: made.id, initial_weight: init }); } catch (x) { /* otherwise it appears on the next poll */ }
      this._new = null;
    } catch (x) {
      n.busy = false; n.err = T.createFail + ((x && x.message) || x);
    }
    this._render();
  }

  _render() {
    const c = this._c, h = this._hass, T = this._t(), ids = this._ids(), low = c.low != null ? c.low : 100, first = this._printer(), box = this._box();
    const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
    this._all = ids.map((id) => ({ id, s: h.states[id] }))
      .filter((x) => x.s && !isNaN(parseFloat(x.s.state)) && !x.s.attributes.archived)
      .map((x) => {
        const a = x.s.attributes, rem = parseFloat(x.s.state), init = Number(a.initial_weight) || Number(a.filament_weight) || 1000;
        return { id: x.id, sid: a.id, rem, init, f: Math.min(1, Math.max(0, rem / init)), name: a.filament_name || a.friendly_name || x.id, sub: [a.filament_vendor_name, a.filament_material].filter(Boolean).join(' · '), col: /^[0-9a-f]{6}/i.test(a.filament_color_hex || '') ? '#' + a.filament_color_hex.slice(0, 6) : '#b0b0b0', loc: a.location || '', tool: a.extra_active_toolhead, mat: a.filament_material || T.noMat, vendor: a.filament_vendor_name || '', price: Number(a.price) > 0 ? Number(a.price) : null, ppg: Number(a.price) > 0 ? Number(a.price) / init : Number(a.filament_price) > 0 ? Number(a.filament_price) / (Number(a.filament_weight) || init) : null };
      });
    const loaded = (p) => !!p.tool && (!first || p.loc === first);
    const spools = this._all.filter((p) => (!c.location || p.loc === c.location) && !(c.hide_loaded && loaded(p)))
      .sort((p, q) => loaded(q) - loaded(p) || (first ? (q.loc === first) - (p.loc === first) : 0) || p.loc.localeCompare(q.loc) || String(p.tool || '').localeCompare(String(q.tool || '')) || p.name.localeCompare(q.name));
    const R0 = 15, R1 = 42;
    const svg = (p) => {
      const r = Math.max(R0 + 3, Math.sqrt(R0 * R0 + p.f * (R1 * R1 - R0 * R0)));
      let s = '<circle cx="50" cy="50" r="47" class="fl"/>';
      if (p.rem > 0) {
        s += `<circle cx="50" cy="50" r="${r.toFixed(1)}" fill="${p.col}" class="fi"/>`;
        for (let w = R0 + 4; w < r - 1; w += 4) s += `<circle cx="50" cy="50" r="${w}" class="wi"/>`;
      }
      s += `<circle cx="50" cy="50" r="${R0}" class="co"/><circle cx="50" cy="50" r="5" class="ho"/>`;
      for (let i = 0; i < 3; i++) { const a = (i * 120 - 90) * Math.PI / 180; s += `<circle cx="${(50 + 10 * Math.cos(a)).toFixed(1)}" cy="${(50 + 10 * Math.sin(a)).toFixed(1)}" r="2" class="ho"/>`; }
      return `<svg viewBox="0 0 100 100">${s}</svg>`;
    };
    const e = this._edit, ep = e ? this._all.find((p) => p.id === e.id) : null, n = this._new;
    if (e && !ep) this._edit = null;
    const item = (p) => `<div class="sp${e && e.id === p.id ? ' se' : ''}" data-id="${esc(p.id)}"><div class="ro">${svg(p)}${loaded(p) ? `<span class="tl">T${esc(p.tool)}</span>` : ''}</div><div class="nm">${esc(p.name)}</div><div class="gr${p.rem <= low ? ' lo' : ''}">${Math.round(p.rem)} g · ${Math.round(p.f * 100)} %</div><div class="su">${esc(p.sub)}</div></div>`;
    const groups = [];
    spools.forEach((p) => { const k = p.loc || T.noLoc; let g = groups.find((x) => x.k === k); if (!g) { g = { k, l: [] }; groups.push(g); } g.l.push(p); });
    const items = groups.map((g) => `${groups.length > 1 || c.hide_loaded ? `<div class="gh"><b>${esc(g.k)}</b><span>${esc(T.count(g.l.length, Math.round(g.l.reduce((a, p) => a + p.rem, 0)).toLocaleString(T.loc)))}</span></div>` : ''}<div class="gd">${g.l.map(item).join('')}</div>`).join('');
    let extra = '';
    if (c.summary) {
      const kg = (g) => (g >= 1000 ? (g / 1000).toLocaleString(T.loc, { maximumFractionDigits: 1 }) + ' kg' : Math.round(g) + ' g');
      const txt = (p) => T.item + ' ' + p.name + (p.sub ? ' (' + p.sub.replace(/ · /g, ' ') + ')' : '');
      const tmpl = c.shop_url === false ? '' : /^https?:\/\//i.test(String(c.shop_url || '')) ? String(c.shop_url) : T.shopUrl;
      const url = (p) => (tmpl ? tmpl.replace('{q}', encodeURIComponent([p.vendor, p.mat, p.name, T.item, '1.75 mm'].filter(Boolean).join(' '))) : '');
      const tl = this._tItems, lows = this._all.filter((p) => p.rem <= low).sort((a, b) => a.rem - b.rem), miss = tl ? lows.filter((p) => !tl.includes(txt(p))) : [];
      this._lowTxt = Object.fromEntries(lows.map((p) => [p.id, { t: txt(p), u: url(p) }]));
      if (lows.length) extra += `<div class="gh"><b>${T.low}</b><span>${esc(T.below(low))}</span>${tl && miss.length > 1 ? `<button class="cb" data-c="*">${T.shopAll}</button>` : ''}</div>${lows.map((p) => `<div class="lw"><span class="dt" style="background:${p.col}"></span><span class="ln">${esc(p.name)} <small>${esc(p.sub)}</small></span><i class="lo">${Math.round(p.rem)} g${loaded(p) ? ' · T' + esc(p.tool) : ''}</i>${tmpl ? `<a class="az" href="${esc(url(p))}" target="_blank" rel="noopener noreferrer">${T.shopLink}</a>` : ''}${tl ? (tl.includes(txt(p)) ? `<span class="ok">${T.onList}</span>` : `<button class="cb" data-c="${esc(p.id)}">${T.shop}</button>`) : ''}</div>`).join('')}`;
      const mats = {};
      this._all.forEach((p) => { const m = mats[p.mat] || (mats[p.mat] = { g: 0, n: 0, h: 0 }); m.g += p.rem; m.n++; if (p.f >= 0.5) m.h++; });
      const ml = Object.entries(mats).sort((a, b) => b[1].g - a[1].g), mx = ml.length ? ml[0][1].g || 1 : 1;
      const wert = this._all.reduce((a, p) => a + (p.ppg ? p.rem * p.ppg : 0), 0), ohne = this._all.filter((p) => !p.ppg).length;
      if (ml.length) extra += `<div class="gh"><b>${T.byMat}</b><span>${esc(T.total(kg(this._all.reduce((a, p) => a + p.rem, 0))))}${wert > 0 ? ' · ' + T.value + ' ' + this._money(wert) + (ohne ? ' ' + T.noPriceN(ohne) : '') : ''}</span></div>${ml.map(([m, v]) => `<div class="mt"><b>${esc(m)}</b><div class="br"><div style="width:${Math.max(2, (v.g / mx) * 100).toFixed(1)}%"></div></div><span>${kg(v.g)}</span><small>${esc(T.spools(v.n))} · ${esc(T.half(v.h))}</small></div>`).join('')}`;
    }
    const d = (e && ep ? e : n) || {}, dis = d.busy ? ' disabled' : '';
    const nt = Number(c.toolheads) > 0 ? Number(c.toolheads) : 5;
    const toolRow = (cur, id) => {
      const tools = [''];
      for (let i = 1; i <= nt; i++) tools.push(String(i));
      if (cur && !tools.includes(cur)) tools.push(cur);
      const clash = this._clash(cur, id), moved = !e || cur !== e.tool0, names = clash.map((p) => p.name).join(', ');
      return `<div class="lb">${T.tool}</div><div class="th">${tools.map((t) => `<button class="tb${t === cur ? ' on' : ''}" data-t="${esc(t)}"${dis}>${t ? 'T' + esc(t) : T.noTool}</button>`).join('')}</div>${clash.length ? `<div class="hi">${esc(moved ? T.clashMove(cur, names, box) : T.clashSame(cur, names))}</div>` : ''}`;
    };
    const locRow = (x) => (x.locs.length ? `<div class="lb">${T.location}</div><div class="rw"><select data-f="loc"${dis}>${x.locs.map((l) => `<option${l === x.loc ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>` : '');
    const seg = (mode) => `<div class="sg"><button class="mb${mode === 'rem' ? ' on' : ''}" data-m="rem"${dis}>${T.remaining}</button><button class="mb${mode === 'use' ? ' on' : ''}" data-m="use"${dis}>${n ? T.usedNew : T.subtract}</button></div>`;
    const inp = (f, val, extra) => `<input data-f="${f}" value="${esc(val)}"${extra || ''}${dis}>`;
    const num = ' type="text" inputmode="decimal" autocomplete="off"';
    let ed = '';
    if (e && ep) {
      ed = `<div class="ed">
<div class="eh"><span class="dt" style="background:${ep.col}"></span><span class="en">${esc(ep.name)}</span><span class="su">${esc(ep.sub)}</span></div>
<div class="lb">${T.weight}</div>${seg(e.mode)}
<div class="rw">${e.mode === 'rem' ? inp('rem', e.rem, num) : inp('use', e.use, num + ' placeholder="0"')}<span>g</span><span class="su" id="wh"></span></div>
<div class="lb">${T.price}</div>
<div class="rw">${inp('price', e.price, num + ` placeholder="${esc(T.pricePh)}"`)}<span>${esc(c.currency || '€')}</span><span class="su" id="ph"></span></div>
${toolRow(e.tool, e.id)}
${locRow(e)}
${e.err ? `<div class="er">${esc(e.err)}</div>` : ''}
<div class="ac"><button id="info"${dis}>${T.details}</button><span class="fx"></span><button id="cancel"${dis}>${T.cancel}</button><button id="save" class="pr"${dis}>${e.busy ? esc(e.msg || T.saving) : T.save}</button></div>
</div>`;
    } else if (n) {
      const fils = this._fils(), vend = [];
      fils.forEach((f) => { if (f.vid != null && !vend.some((v) => v.id === f.vid)) vend.push({ id: f.vid, name: f.vendor }); });
      if (!this._hasApi()) {
        ed = `<div class="ed"><div class="en">${T.newSpool}</div><div class="su wr">${esc(T.noApi(this._svc()))}</div><div class="ac"><span class="fx"></span><button id="cancel">${T.close}</button></div></div>`;
      } else {
        ed = `<div class="ed">
<div class="en">${T.newSpool}</div>
<div class="lb">${T.filament}</div>
<div class="rw"><select data-f="fil" data-r="1"${dis}>${fils.map((f) => `<option value="${esc(f.id)}"${String(f.id) === n.fil ? ' selected' : ''}>${esc([f.vendor, f.name, f.mat].filter(Boolean).join(' · '))}</option>`).join('')}<option value="new"${n.fil === 'new' ? ' selected' : ''}>${T.newFil}</option></select></div>
${n.fil === 'new' ? `<div class="nf">
<div class="lb">${T.vendor}</div>
<div class="rw"><select data-f="vendor" data-r="1"${dis}>${vend.map((v) => `<option value="${esc(v.id)}"${String(v.id) === n.vendor ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}<option value="new"${n.vendor === 'new' ? ' selected' : ''}>${T.newVendor}</option></select>${n.vendor === 'new' ? inp('vname', n.vname, ` placeholder="${esc(T.vendorName)}" class="tx"`) : ''}</div>
<div class="g2"><div><div class="lb">${T.name}</div>${inp('name', n.name, ` placeholder="${esc(T.namePh)}" class="tx"`)}</div><div><div class="lb">${T.colour}</div><input data-f="color" type="color" value="${esc(n.color)}"${dis}></div></div>
<div class="g2"><div><div class="lb">${T.material}</div>${inp('material', n.material, ' list="mats" class="tx"')}<datalist id="mats">${Object.keys(FSC_DENSITY).map((m) => `<option>${m}</option>`).join('')}</datalist></div><div><div class="lb">${T.density}</div>${inp('density', n.density, num)}</div></div>
<div class="g2"><div><div class="lb">${T.content}</div>${inp('weight', n.weight, num)}</div><div><div class="lb">${T.emptySpool}</div>${inp('spw', n.spw, num + ` placeholder="${esc(T.optional)}"`)}</div><div><div class="lb">${T.diameter}</div>${inp('dia', n.dia, num)}</div></div>
</div>` : ''}
<div class="g2"><div><div class="lb">${T.initial}</div><div class="rw">${inp('init', n.init, num)}<span>g</span></div></div><div><div class="lb">${T.price}</div><div class="rw">${inp('price', n.price || '', num + ` placeholder="${esc(T.optional)}"`)}<span>${esc(c.currency || '€')}</span></div></div></div>
<div class="lb">${T.now}</div>${seg(n.mode)}
<div class="rw">${inp('amt', n.amt, num + ` placeholder="${n.mode === 'use' ? '0' : esc(T.full)}"`)}<span>g</span><span class="su" id="wh"></span></div>
${toolRow(n.tool, null)}
${locRow(n)}
${n.err ? `<div class="er">${esc(n.err)}</div>` : ''}
<div class="ac"><span class="fx"></span><button id="cancel"${dis}>${T.cancel}</button><button id="save" class="pr"${dis}>${n.busy ? esc(n.msg || T.creating) : T.create}</button></div>
</div>`;
      }
    }
    this.shadowRoot.innerHTML = `<style>
ha-card{padding:12px 12px 14px}
.hr{display:flex;align-items:center;gap:8px;padding:2px 4px 10px}.hd{font-size:20px;font-weight:400;flex:1;min-width:0}
.gh{display:flex;align-items:baseline;gap:8px;padding:10px 4px 8px;border-top:1px solid var(--divider-color,#ddd);margin-top:4px}.gh:first-of-type{border-top:none;margin-top:0;padding-top:2px}.gh b{font-size:14px;font-weight:600}.gh span{font-size:12px;color:var(--secondary-text-color,#777)}
.gd{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:14px 8px}
.sp{text-align:center;cursor:pointer;min-width:0;border-radius:12px;padding:6px 2px}
.sp.se{background:var(--secondary-background-color,#eee);outline:2px solid var(--primary-color,#03a9f4)}
.ro{position:relative;width:84px;margin:0 auto 6px}
svg{display:block;width:100%;height:auto}
.fl{fill:var(--secondary-background-color,#eee);stroke:var(--divider-color,#bbb);stroke-width:2}
.fi{stroke:rgba(0,0,0,.35);stroke-width:1}
.wi{fill:none;stroke:rgba(0,0,0,.14);stroke-width:.8}
.co{fill:var(--card-background-color,#fff);stroke:var(--divider-color,#bbb);stroke-width:1.5}
.ho{fill:var(--divider-color,#bbb)}
.tl{position:absolute;top:-4px;right:-8px;background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff);border-radius:9px;font-size:11px;font-weight:700;padding:2px 6px}
.nm{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gr{font-size:13px}.gr.lo{color:var(--error-color,#db4437);font-weight:700}
.su{font-size:11px;color:var(--secondary-text-color,#777);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.su.wr{white-space:normal;font-size:13px;margin-top:6px}
.lw{display:flex;align-items:center;gap:8px;padding:5px 4px;font-size:13px;min-height:40px}.ln{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ln small{color:var(--secondary-text-color,#777);font-size:11px}.lw i{font-style:normal;white-space:nowrap}.lo{color:var(--error-color,#db4437);font-weight:700}.ok{font-size:12px;color:var(--success-color,#43a047);white-space:nowrap}
.az{font-size:12px;color:var(--primary-color,#03a9f4);text-decoration:none;white-space:nowrap}.gh .cb{margin-left:auto}.cb{min-height:32px;padding:0 10px;font-size:12px;white-space:nowrap}
.mt{display:grid;grid-template-columns:minmax(48px,auto) 1fr auto;column-gap:10px;align-items:center;padding:5px 4px;font-size:13px}.mt small{grid-column:2 / 4;font-size:11px;color:var(--secondary-text-color,#777)}.mt span{font-variant-numeric:tabular-nums}
.br{height:8px;border-radius:4px;background:var(--secondary-background-color,#eee);overflow:hidden}.br div{height:100%;border-radius:4px;background:var(--primary-color,#03a9f4)}
.em{color:var(--secondary-text-color,#777);padding:8px 4px}
.ed{border:1px solid var(--divider-color,#bbb);border-radius:12px;padding:12px;margin:0 0 14px;background:var(--secondary-background-color,#f5f5f5)}
.eh{display:flex;align-items:center;gap:8px;min-width:0}
.dt{width:16px;height:16px;border-radius:50%;border:1px solid rgba(0,0,0,.35);flex:none}
.en{font-size:16px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb{font-size:12px;color:var(--secondary-text-color,#777);margin:12px 0 4px}
.rw{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.g2{display:flex;gap:10px;flex-wrap:wrap}.g2>div{min-width:0}
.nf{border-left:3px solid var(--primary-color,#03a9f4);padding-left:10px;margin-top:4px}
input,select{font:inherit;color:var(--primary-text-color,#222);background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#bbb);border-radius:8px;padding:8px 10px;min-height:40px;box-sizing:border-box;max-width:100%}
input{width:120px}input.tx{width:200px}input[type=color]{width:56px;padding:3px}select{min-width:160px}
.th,.sg{display:flex;flex-wrap:wrap;gap:6px}.sg{margin-bottom:6px}
button{font:inherit;cursor:pointer;border-radius:8px;min-height:40px;padding:0 14px;border:1px solid var(--divider-color,#bbb);background:var(--card-background-color,#fff);color:var(--primary-text-color,#222)}
button:disabled,input:disabled,select:disabled{opacity:.55;cursor:default}
.tb.on,.mb.on,.pr{background:var(--primary-color,#03a9f4);border-color:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff);font-weight:700}
.hi{font-size:12px;margin-top:6px;color:var(--warning-color,#b26a00)}
.er{font-size:13px;margin-top:10px;color:var(--error-color,#db4437)}
.ac{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.fx{flex:1}
</style><ha-card><div class="hr"><div class="hd">${esc(c.title != null ? c.title : T.title)}</div>${c.editable === false ? '' : `<button id="add"${dis}>${T.add}</button>`}</div>${ed}${items || `<div class="em">${T.none}</div>`}${extra}</ha-card>`;
    const root = this.shadowRoot, q = (s) => root.querySelector(s), busy = () => !!((this._edit && this._edit.busy) || (this._new && this._new.busy));
    root.querySelectorAll('.cb').forEach((b) => b.addEventListener('click', () => { const L = this._lowTxt || {}; b.disabled = true; this._shop(b.dataset.c === '*' ? Object.values(L) : [L[b.dataset.c]].filter(Boolean)); }));
    root.querySelectorAll('.sp').forEach((el) => el.addEventListener('click', () => { if (!busy()) this._open(el.dataset.id); }));
    if (q('#add')) q('#add').addEventListener('click', () => { if (!busy()) this._openNew(); });
    const D = this._edit || this._new;
    if (!D) return;
    const isNew = D === this._new, wh = q('#wh');
    const hint = () => {
      if (!wh) return;
      if (!isNew) {
        const u = D.use === '' ? 0 : this._num(D.use), pv = this._num(D.price), ppg = pv > 0 ? pv / ep.init : D.price.trim() === '' ? ep.ppg : null, ph = q('#ph');
        wh.textContent = D.mode === 'rem' ? T.of(Math.round(ep.init)) : isNaN(u) ? '' : T.after((Math.round((D.rem0 - u) * 10) / 10).toLocaleString(T.loc)) + (ppg && u > 0 ? ' · ' + T.cost + ' ' + this._money(u * ppg) : '');
        if (ph) ph.textContent = ppg ? this._money(ppg * 1000) + ' ' + T.perKg + ' · ' + T.worth + ' ' + this._money(D.rem0 * ppg) + (pv > 0 ? '' : ' ' + T.fromFil) : T.noPrice;
        return;
      }
      const init = this._num(D.init), a = D.amt === '' ? null : this._num(D.amt);
      wh.textContent = isNaN(init) || (a != null && isNaN(a)) ? '' : T.rest((Math.round((a == null ? init : D.mode === 'use' ? init - a : a) * 10) / 10).toLocaleString(T.loc));
    };
    hint();
    root.querySelectorAll('[data-f]').forEach((el) => {
      const f = el.dataset.f, upd = () => { D[f] = el.value; hint(); };
      el.addEventListener('input', upd);
      el.addEventListener('change', () => {
        upd();
        if (f === 'fil') { const x = this._fils().find((y) => String(y.id) === D.fil); D.init = x ? String(x.weight) : D.weight; }
        if (f === 'material') { const k = Object.keys(FSC_DENSITY).find((m) => D.material.trim().toUpperCase().startsWith(m)); if (k) { D.density = String(FSC_DENSITY[k]); const de = q('[data-f="density"]'); if (de) de.value = D.density; } }
        if (f === 'weight' && D.fil === 'new') { D.init = D.weight; const ie = q('[data-f="init"]'); if (ie) ie.value = D.init; hint(); }
        if (el.dataset.r) this._render();
      });
      if (el.tagName === 'INPUT') el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { upd(); if (isNew) this._create(); else this._save(); } });
    });
    root.querySelectorAll('.mb').forEach((b) => b.addEventListener('click', () => { D.mode = b.dataset.m; this._render(); const i = q(isNew ? '[data-f="amt"]' : '[data-f="' + D.mode + '"]'); if (i && i.focus) i.focus(); }));
    root.querySelectorAll('.tb').forEach((b) => b.addEventListener('click', () => {
      D.tool = b.dataset.t;
      if (D.tool && first && D.locs.includes(first)) D.loc = first;
      else if (!D.tool && first && D.loc === first && box && D.locs.includes(box)) D.loc = box;
      this._render();
    }));
    if (q('#info')) q('#info').addEventListener('click', () => this._info(D.id));
    q('#cancel').addEventListener('click', () => { this._edit = null; this._new = null; this._render(); });
    if (q('#save')) q('#save').addEventListener('click', () => (isNew ? this._create() : this._save()));
  }
}
if (!customElements.get('filament-spool-card')) customElements.define('filament-spool-card', FilamentSpoolCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'filament-spool-card')) window.customCards.push({ type: 'filament-spool-card', name: 'Filament Spool Card', description: 'Spoolman spools as filament rolls – edit weight, tool head and location, create new spools' });
console.info(`%c FILAMENT-SPOOL-CARD %c ${FSC_VERSION} `, 'color:#fff;background:#fa6831;font-weight:700', 'color:#fa6831;background:#fff');

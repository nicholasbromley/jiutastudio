const instrumentPalettes = {
  Koto: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "スクイ", "押手", "●"],
  Shakuhachi: ["ロ", "ツ", "レ", "チ", "リ", "ロ乙", "メリ", "カリ", "ユリ", "●"]
};

const shamisenPalettes = {
  sanNoIto: makeDotted(["1", "2", "3", "4", "5", "6", "7", "8", "9"]),
  niNoIto: makeDotted(["一", "二", "三", "四", "五", "六", "七", "八", "九"]),
  ichiNoIto: makeDotted(["イ一", "イ二", "イ三", "イ四", "イ五", "イ六", "イ七", "イ八", "イ九"]),
  ornaments: ["", "ス", "^"]
};

const instruments = ["Koto", "Shamisen", "Shakuhachi"];

const state = {
  score: {
    title: "Sakura Study",
    tempo: 72,
    instrument: "Shamisen",
    timeSignature: {
      beatsPerMeasure: 4,
      beatUnit: 4
    },
    columns: [makeColumn(1)]
  },
  activeCell: null,
  selectedSymbol: "5",
  selectedOrnament: ""
};

function makeColumn(index) {
  return {
    id: crypto.randomUUID(),
    label: `Column ${index}`,
    measures: Array.from({ length: 4 }, (_, i) => makeMeasure(i + 1))
  };
}

function makeMeasure(index) {
  return {
    id: crypto.randomUUID(),
    index,
    beats: Array.from({ length: 4 }, () => makeBeat())
  };
}

function makeBeat() {
  return {
    slots: [null, null]
  };
}

function makeSymbol(base, ornament = "") {
  return {
    id: crypto.randomUUID(),
    base,
    ornament
  };
}

function makeDotted(items) {
  const out = [];
  items.forEach((item) => {
    out.push(item);
    out.push(`${item}•`);
  });
  return out;
}

function render() {
  const app = document.querySelector("#app");
  app.innerHTML = "";
  app.append(layout());
}

function layout() {
  const root = el("div", { className: "app" });
  root.append(leftPanel(), canvas(), rightPanel());
  return root;
}

function leftPanel() {
  const panel = el("aside", { className: "panel" });
  panel.append(el("h1", { text: "Jiuta Studio" }));

  panel.append(el("h2", { text: "Score" }));
  panel.append(control("Title", titleInput()));
  panel.append(control("Instrument", instrumentSelect()));
  panel.append(control("Tempo", tempoInput()));
  panel.append(control("Time Signature", timeSignatureReadonly()));

  panel.append(el("h2", { text: "Grid" }));
  panel.append(button("Add 4-Measure Column", () => addColumn()));
  panel.append(button("Load Sakura Opening (5,5,7,●)", () => loadSakuraOpening()));
  panel.append(
    el("p", {
      className: "hint",
      text: "Each beat box has two slots: top = first eighth, bottom = second eighth."
    })
  );

  if (state.activeCell) {
    panel.append(el("h2", { text: "Active Cell" }));
    panel.append(el("p", { text: activeCellLabel() }));
    panel.append(button("Clear Active Cell", () => clearActiveCell(), "danger"));
  }

  return panel;
}

function rightPanel() {
  const panel = el("aside", { className: "panel right" });
  panel.append(el("h2", { text: "Palette" }));
  panel.append(el("p", { text: `${state.score.instrument} symbols` }));

  if (state.score.instrument === "Shamisen") {
    panel.append(el("h2", { text: "String" }));
    panel.append(buildPaletteSection("San no ito (3rd)", shamisenPalettes.sanNoIto));
    panel.append(buildPaletteSection("Ni no ito (2nd)", shamisenPalettes.niNoIto));
    panel.append(buildPaletteSection("Ichi no ito (1st)", shamisenPalettes.ichiNoIto));
    panel.append(ornamentSection());
    panel.append(el("p", {
      className: "hint",
      text: "Ornaments are added to the right: ス for sukui, ^ for hajiki."
    }));
  } else {
    const palette = el("div", { className: "palette-grid" });
    (instrumentPalettes[state.score.instrument] || []).forEach((symbol) => {
      palette.append(symbolButton(symbol));
    });
    panel.append(palette);
    panel.append(el("p", { className: "hint", text: "Drag from palette to any eighth-note slot." }));
  }

  return panel;
}

function buildPaletteSection(title, symbols) {
  const wrap = el("section", { className: "palette-section" });
  wrap.append(el("p", { className: "palette-label", text: title }));
  const grid = el("div", { className: "palette-grid" });
  symbols.forEach((symbol) => {
    grid.append(symbolButton(symbol));
  });
  wrap.append(grid);
  return wrap;
}

function ornamentSection() {
  const wrap = el("section", { className: "palette-section" });
  wrap.append(el("p", { className: "palette-label", text: "Ornament" }));

  const row = el("div", { className: "ornament-row" });
  shamisenPalettes.ornaments.forEach((ornament) => {
    const label = ornament || "none";
    const active = state.selectedOrnament === ornament;
    row.append(
      button(
        label,
        () => {
          state.selectedOrnament = ornament;
        },
        active ? "primary ornament-btn" : "ornament-btn"
      )
    );
  });

  wrap.append(row);
  return wrap;
}

function symbolButton(symbol) {
  const active = symbol === state.selectedSymbol;
  const item = button(
    symbol,
    () => {
      state.selectedSymbol = symbol;
      placeAtActiveCell(symbol);
    },
    active ? "primary palette-symbol" : "palette-symbol"
  );

  item.draggable = true;
  item.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", JSON.stringify({
      type: "palette-symbol",
      base: symbol,
      ornament: getPlacementOrnament(),
      instrument: state.score.instrument
    }));
    event.dataTransfer.effectAllowed = "copy";
  });

  return item;
}

function canvas() {
  const center = el("main", { className: "score-stage" });
  const page = el("section", { className: "sheet-page" });
  const meta = el("div", { className: "sheet-meta" });
  meta.append(el("span", { className: "sheet-title-text", text: state.score.title }));
  meta.append(el("span", { text: "Repeat Twice" }));
  meta.append(el("span", { text: `${state.score.timeSignature.beatsPerMeasure}/${state.score.timeSignature.beatUnit}` }));
  page.append(meta);

  const body = el("div", { className: "sheet-body" });
  const track = el("div", { className: "column-track" });
  state.score.columns.forEach((column) => {
    track.append(renderColumn(column));
  });

  const sideText = el("div", { className: "sheet-side-text" });
  sideText.append(el("span", { text: "さくら" }));
  sideText.append(el("span", { text: "合奏" }));

  body.append(track, sideText);
  page.append(body);
  center.append(page);
  return center;
}

function renderColumn(column) {
  const container = el("section", { className: "column" });
  const head = el("div", { className: "column-head" });
  head.append(el("span", { className: "column-name", text: column.label }));
  head.append(el("span", { className: "time-chip", text: "4 measures" }));
  container.append(head);

  const list = el("div", { className: "measure-list" });
  column.measures.forEach((measure) => list.append(renderMeasure(column, measure)));
  container.append(list);
  return container;
}

function renderMeasure(column, measure) {
  const section = el("article", { className: "measure" });
  section.append(el("div", { className: "measure-head", text: `M${measure.index}` }));

  const beats = el("div", { className: "beat-grid" });
  measure.beats.forEach((beat, beatIndex) => {
    beats.append(renderBeatCell(column, measure, beat, beatIndex));
  });
  section.append(beats);
  return section;
}

function renderBeatCell(column, measure, beat, beatIndex) {
  const beatCell = el("div", { className: "beat-cell" });
  beatCell.append(el("div", { className: "beat-num", text: String(beatIndex + 1) }));

  const slotWrap = el("div", { className: "eighth-slots" });
  beat.slots.forEach((symbol, slotIndex) => {
    slotWrap.append(renderSlot(column, measure, beatIndex, slotIndex, symbol));
  });

  beatCell.append(slotWrap);
  return beatCell;
}

function renderSlot(column, measure, beatIndex, slotIndex, symbol) {
  const active = isActiveCell(column.id, measure.id, beatIndex, slotIndex);
  const slot = el("div", { className: `slot${active ? " active" : ""}` });
  slot.textContent = symbolLabel(symbol);
  slot.draggable = Boolean(symbol);

  slot.addEventListener("click", (event) => {
    event.stopPropagation();
    setActiveCell(column.id, measure.id, beatIndex, slotIndex);
    render();
  });

  slot.addEventListener("dragstart", (event) => {
    if (!symbol) return;
    event.dataTransfer.setData("text/plain", JSON.stringify({
      type: "existing-symbol",
      symbolId: symbol.id
    }));
    event.dataTransfer.effectAllowed = "move";
  });

  slot.addEventListener("dragover", (event) => onSlotDragOver(event));
  slot.addEventListener("dragleave", () => slot.classList.remove("drop-target"));
  slot.addEventListener("drop", (event) => {
    onSlotDrop(event, column.id, measure.id, beatIndex, slotIndex);
    slot.classList.remove("drop-target");
  });

  return slot;
}

function onSlotDragOver(event) {
  const payload = parseDragPayload(event);
  if (!payload) return;

  if (payload.type === "palette-symbol" && !isSymbolCompatible(state.score.instrument, payload.base)) {
    return;
  }

  if (payload.type === "existing-symbol") {
    const found = findSymbolById(payload.symbolId);
    if (!found || !isSymbolCompatible(state.score.instrument, found.symbol.base)) {
      return;
    }
  }

  event.preventDefault();
  event.currentTarget.classList.add("drop-target");
}

function onSlotDrop(event, columnId, measureId, beatIndex, slotIndex) {
  event.preventDefault();
  const payload = parseDragPayload(event);
  if (!payload) return;

  const targetBeat = findBeat(columnId, measureId, beatIndex);
  if (!targetBeat) return;

  if (payload.type === "palette-symbol") {
    if (!isSymbolCompatible(state.score.instrument, payload.base)) return;
    targetBeat.slots[slotIndex] = makeSymbol(payload.base, payload.ornament || "");
    setActiveCell(columnId, measureId, beatIndex, slotIndex);
    render();
    return;
  }

  if (payload.type === "existing-symbol") {
    const found = findSymbolById(payload.symbolId);
    if (!found || !isSymbolCompatible(state.score.instrument, found.symbol.base)) return;

    const sourceBeat = findBeat(
      found.location.columnId,
      found.location.measureId,
      found.location.beatIndex
    );
    if (!sourceBeat) return;

    sourceBeat.slots[found.location.slotIndex] = null;
    targetBeat.slots[slotIndex] = found.symbol;
    setActiveCell(columnId, measureId, beatIndex, slotIndex);
    render();
  }
}

function parseDragPayload(event) {
  const raw = event.dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function findBeat(columnId, measureId, beatIndex) {
  const column = state.score.columns.find((item) => item.id === columnId);
  if (!column) return null;
  const measure = column.measures.find((item) => item.id === measureId);
  if (!measure) return null;
  return measure.beats[beatIndex] || null;
}

function findSymbolById(symbolId) {
  for (const column of state.score.columns) {
    for (const measure of column.measures) {
      for (let beatIndex = 0; beatIndex < measure.beats.length; beatIndex += 1) {
        const beat = measure.beats[beatIndex];
        for (let slotIndex = 0; slotIndex < beat.slots.length; slotIndex += 1) {
          const symbol = beat.slots[slotIndex];
          if (symbol?.id === symbolId) {
            return {
              symbol,
              location: {
                columnId: column.id,
                measureId: measure.id,
                beatIndex,
                slotIndex
              }
            };
          }
        }
      }
    }
  }
  return null;
}

function isSymbolCompatible(instrument, base) {
  return getAllSymbolsForInstrument(instrument).includes(base);
}

function getAllSymbolsForInstrument(instrument) {
  if (instrument === "Shamisen") {
    return [
      ...shamisenPalettes.sanNoIto,
      ...shamisenPalettes.niNoIto,
      ...shamisenPalettes.ichiNoIto
    ];
  }
  return instrumentPalettes[instrument] || [];
}

function getPlacementOrnament() {
  return state.score.instrument === "Shamisen" ? state.selectedOrnament : "";
}

function symbolLabel(symbol) {
  if (!symbol) return "";
  return `${symbol.base}${symbol.ornament || ""}`;
}

function addColumn() {
  state.score.columns.push(makeColumn(state.score.columns.length + 1));
  render();
}

function loadSakuraOpening() {
  const firstColumn = state.score.columns[0];
  if (!firstColumn) return;
  const firstMeasure = firstColumn.measures[0];
  if (!firstMeasure) return;

  const opening = ["5", "5", "7", "●"];
  firstMeasure.beats.forEach((beat, beatIndex) => {
    beat.slots[0] = makeSymbol(opening[beatIndex]);
    beat.slots[1] = null;
  });
  render();
}

function placeAtActiveCell(base) {
  if (!state.activeCell) return;
  if (!isSymbolCompatible(state.score.instrument, base)) return;

  const beat = findBeat(
    state.activeCell.columnId,
    state.activeCell.measureId,
    state.activeCell.beatIndex
  );
  if (!beat) return;

  beat.slots[state.activeCell.slotIndex] = makeSymbol(base, getPlacementOrnament());
  render();
}

function clearActiveCell() {
  if (!state.activeCell) return;
  const beat = findBeat(
    state.activeCell.columnId,
    state.activeCell.measureId,
    state.activeCell.beatIndex
  );
  if (!beat) return;
  beat.slots[state.activeCell.slotIndex] = null;
  render();
}

function setActiveCell(columnId, measureId, beatIndex, slotIndex) {
  state.activeCell = {
    columnId,
    measureId,
    beatIndex,
    slotIndex
  };
}

function isActiveCell(columnId, measureId, beatIndex, slotIndex) {
  if (!state.activeCell) return false;
  return state.activeCell.columnId === columnId
    && state.activeCell.measureId === measureId
    && state.activeCell.beatIndex === beatIndex
    && state.activeCell.slotIndex === slotIndex;
}

function activeCellLabel() {
  if (!state.activeCell) return "";
  const column = state.score.columns.find((item) => item.id === state.activeCell.columnId);
  if (!column) return "";
  const measure = column.measures.find((item) => item.id === state.activeCell.measureId);
  if (!measure) return "";
  const slotName = state.activeCell.slotIndex === 0 ? "1st 8th" : "2nd 8th";
  return `${column.label} - M${measure.index} - Beat ${state.activeCell.beatIndex + 1} - ${slotName}`;
}

function titleInput() {
  const input = el("input");
  input.value = state.score.title;
  input.addEventListener("input", (event) => {
    state.score.title = event.target.value;
    updateSheetTitleText();
  });
  return input;
}

function updateSheetTitleText() {
  const titleNode = document.querySelector(".sheet-title-text");
  if (titleNode) {
    titleNode.textContent = state.score.title || "Untitled";
  }
}

function instrumentSelect() {
  const select = el("select");
  instruments.forEach((instrument) => {
    const option = el("option", { text: instrument });
    option.value = instrument;
    option.selected = instrument === state.score.instrument;
    select.append(option);
  });

  select.addEventListener("change", (event) => {
    state.score.instrument = event.target.value;
    state.selectedSymbol = getAllSymbolsForInstrument(state.score.instrument)[0] || "";
    state.selectedOrnament = "";
    render();
  });
  return select;
}

function tempoInput() {
  const input = el("input");
  input.type = "number";
  input.min = "30";
  input.max = "220";
  input.value = String(state.score.tempo);
  input.addEventListener("input", (event) => {
    state.score.tempo = Number(event.target.value || 72);
  });
  return input;
}

function timeSignatureReadonly() {
  const input = el("input");
  input.value = `${state.score.timeSignature.beatsPerMeasure}/${state.score.timeSignature.beatUnit}`;
  input.disabled = true;
  return input;
}

function control(labelText, controlEl) {
  const wrap = el("div", { className: "control" });
  wrap.append(el("label", { text: labelText }), controlEl);
  return wrap;
}

function button(text, onClick, className = "") {
  const btn = el("button", { text, className });
  btn.type = "button";
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
    render();
  });
  return btn;
}

function el(tag, options = {}) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text) node.textContent = options.text;
  return node;
}

render();

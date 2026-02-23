const instrumentPalettes = {
  Koto: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "スクイ", "押手", "●"],
  Shakuhachi: ["ロ", "ツ", "レ", "チ", "リ", "ロ乙", "メリ", "カリ", "ユリ", "●"]
};

const shamisenPalettes = {
  sanNoIto: makeDotted(["1", "2", "3", "4", "5", "6", "7", "8", "9"]),
  niNoIto: makeDotted(["一", "二", "三", "四", "五", "六", "七", "八", "九"]),
  ichiNoIto: makeDotted(["イ一", "イ二", "イ三", "イ四", "イ五", "イ六", "イ七", "イ八", "イ九"]),
  rests: ["○", "◉"],
  ornaments: ["", "ス", "^"],
  accidentals: ["", "♯"]
};

const instruments = ["Koto", "Shamisen", "Shakuhachi"];
const COLUMNS_PER_PAGE = 8;

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
  selectedColumnId: null,
  currentPage: 0,
  selectedSymbol: "5",
  selectedOrnament: "",
  selectedAccidental: ""
};

function makeColumn(index) {
  const startMeasure = (index - 1) * 4 + 1;
  return {
    id: crypto.randomUUID(),
    label: String(startMeasure),
    measures: Array.from({ length: 4 }, (_, i) => makeMeasure(startMeasure + i))
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

function makeSymbol(base, accidental = "", ornament = "") {
  const safeAccidental = isRestSymbol(base) ? "" : accidental;
  const safeOrnament = isRestSymbol(base) ? "" : ornament;
  return {
    id: crypto.randomUUID(),
    base,
    accidental: safeAccidental,
    ornament: safeOrnament
  };
}

function makeDotted(items) {
  return [...items, ...items.map((item) => `${item}•`)];
}

function isRestSymbol(base) {
  return shamisenPalettes.rests.includes(base);
}

function makeSplitSlot() {
  return {
    type: "split",
    notes: [null, null]
  };
}

function isSplitSlot(slotValue) {
  return Boolean(slotValue && typeof slotValue === "object" && slotValue.type === "split");
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
  panel.append(
    button(
      "Delete Selected Column",
      () => deleteSelectedColumn(),
      state.selectedColumnId ? "danger" : ""
    )
  );
  panel.append(
    el("p", {
      className: "hint",
      text: "Each beat box has two slots: top = first eighth, bottom = second eighth."
    })
  );

  if (state.activeCell) {
    panel.append(el("h2", { text: "Active Cell" }));
    panel.append(el("p", { text: activeCellLabel() }));
    if (isActiveCellSplit()) {
      panel.append(button("Merge To 8th", () => mergeActiveCellSlot()));
    } else {
      panel.append(button("Split To 16ths", () => splitActiveCellSlot()));
    }
    if (state.score.instrument === "Shamisen") {
      panel.append(el("p", { className: "palette-label", text: "Quick Markers" }));
      const quick = el("div", { className: "ornament-row" });
      quick.append(
        button("Sukui", () => setActiveCellOrnament("ス"), "ornament-btn"),
        button("Hajiki", () => setActiveCellOrnament("^"), "ornament-btn"),
        button("No Orna", () => setActiveCellOrnament(""), "ornament-btn")
      );
      panel.append(quick);
      const accidental = el("div", { className: "ornament-row" });
      accidental.append(
        button("Sharp", () => setActiveCellAccidental("♯"), "ornament-btn"),
        button("No Sharp", () => setActiveCellAccidental(""), "ornament-btn"),
        el("div")
      );
      panel.append(accidental);
    }
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
    panel.append(buildPaletteSection("Rests", shamisenPalettes.rests));
    panel.append(ornamentSection());
    panel.append(accidentalSection());
    panel.append(el("p", {
      className: "hint",
      text: "Set defaults for new note placement, or use Quick Markers for the selected cell."
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
  wrap.append(el("p", { className: "palette-label", text: "Default Ornament (new notes)" }));

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

function accidentalSection() {
  const wrap = el("section", { className: "palette-section" });
  wrap.append(el("p", { className: "palette-label", text: "Default Accidental (new notes)" }));

  const row = el("div", { className: "ornament-row" });
  shamisenPalettes.accidentals.forEach((accidental) => {
    const label = accidental || "none";
    const active = state.selectedAccidental === accidental;
    row.append(
      button(
        label,
        () => {
          state.selectedAccidental = accidental;
        },
        active ? "primary ornament-btn" : "ornament-btn"
      )
    );
  });
  row.append(el("div"));

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
      accidental: getPlacementAccidental(),
      ornament: getPlacementOrnament(),
      instrument: state.score.instrument
    }));
    event.dataTransfer.effectAllowed = "copy";
  });

  return item;
}

function canvas() {
  const center = el("main", { className: "score-stage" });
  const pageNav = el("div", { className: "canvas-page-nav" });
  pageNav.append(
    button("<", () => movePage(-1), "nav-btn"),
    el("span", { className: "page-indicator", text: `${state.currentPage + 1} / ${getPageCount()}` }),
    button(">", () => movePage(1), "nav-btn")
  );
  center.append(pageNav);

  const page = el("section", { className: "sheet-page" });
  const meta = el("div", { className: "sheet-meta" });
  meta.append(el("span", { className: "sheet-title-text", text: state.score.title }));
  meta.append(el("span", { text: `${state.score.timeSignature.beatsPerMeasure}/${state.score.timeSignature.beatUnit}` }));
  page.append(meta);

  const body = el("div", { className: "sheet-body" });
  const track = el("div", { className: "column-track" });
  getVisibleColumns().forEach((column) => {
    track.append(renderColumn(column));
  });

  const sideText = el("div", { className: "sheet-side-text" });
  sideText.append(el("span", { className: "sheet-side-title", text: state.score.title || "Untitled" }));

  body.append(track, sideText);
  page.append(body);
  center.append(page);
  return center;
}

function renderColumn(column) {
  const selected = column.id === state.selectedColumnId;
  const container = el("section", { className: `column${selected ? " selected" : ""}` });
  const head = el("div", { className: "column-head" });
  head.append(el("span", { className: "column-name", text: column.label }));
  head.addEventListener("click", (event) => {
    event.stopPropagation();
    state.selectedColumnId = column.id;
    render();
  });
  container.append(head);

  const list = el("div", { className: "measure-list" });
  column.measures.forEach((measure) => list.append(renderMeasure(column, measure)));
  container.append(list);
  return container;
}

function renderMeasure(column, measure) {
  const section = el("article", { className: "measure" });
  const beats = el("div", { className: "beat-grid" });
  measure.beats.forEach((beat, beatIndex) => {
    beats.append(renderBeatCell(column, measure, beat, beatIndex));
  });
  section.append(beats);
  return section;
}

function renderBeatCell(column, measure, beat, beatIndex) {
  const beatCell = el("div", { className: "beat-cell" });

  const slotWrap = el("div", { className: "eighth-slots" });
  beat.slots.forEach((slotValue, slotIndex) => {
    slotWrap.append(renderSlot(column, measure, beatIndex, slotIndex, slotValue));
  });

  beatCell.append(slotWrap);
  return beatCell;
}

function renderSlot(column, measure, beatIndex, slotIndex, slotValue) {
  if (isSplitSlot(slotValue)) {
    const splitWrap = el("div", { className: "slot split-slot" });
    splitWrap.addEventListener("click", (event) => {
      event.stopPropagation();
      const subIndex = getSplitSubIndexFromPointer(event, splitWrap);
      setActiveCell(column.id, measure.id, beatIndex, slotIndex, subIndex);
      render();
    });
    splitWrap.addEventListener("dragover", (event) => onSlotDragOver(event));
    splitWrap.addEventListener("dragleave", () => splitWrap.classList.remove("drop-target"));
    splitWrap.addEventListener("drop", (event) => {
      const subIndex = getSplitSubIndexFromPointer(event, splitWrap);
      onSlotDrop(event, column.id, measure.id, beatIndex, slotIndex, subIndex);
      splitWrap.classList.remove("drop-target");
    });
    slotValue.notes.forEach((symbol, subIndex) => {
      splitWrap.append(renderSplitSubSlot(column, measure, beatIndex, slotIndex, subIndex, symbol));
    });
    return splitWrap;
  }

  const active = isActiveCell(column.id, measure.id, beatIndex, slotIndex, null);
  const slot = el("div", { className: `slot${active ? " active" : ""}` });
  slot.textContent = symbolLabel(slotValue);
  slot.draggable = Boolean(slotValue);

  slot.addEventListener("click", (event) => {
    event.stopPropagation();
    setActiveCell(column.id, measure.id, beatIndex, slotIndex, null);
    render();
  });

  slot.addEventListener("dragstart", (event) => {
    if (!slotValue) return;
    event.dataTransfer.setData("text/plain", JSON.stringify({
      type: "existing-symbol",
      symbolId: slotValue.id
    }));
    event.dataTransfer.effectAllowed = "move";
  });

  slot.addEventListener("dragover", (event) => onSlotDragOver(event));
  slot.addEventListener("dragleave", () => slot.classList.remove("drop-target"));
  slot.addEventListener("drop", (event) => {
    onSlotDrop(event, column.id, measure.id, beatIndex, slotIndex, null);
    slot.classList.remove("drop-target");
  });

  return slot;
}

function renderSplitSubSlot(column, measure, beatIndex, slotIndex, subIndex, symbol) {
  const active = isActiveCell(column.id, measure.id, beatIndex, slotIndex, subIndex);
  const sub = el("div", { className: `sub-slot${active ? " active" : ""}` });
  sub.textContent = symbolLabel(symbol);
  sub.draggable = Boolean(symbol);

  sub.addEventListener("click", (event) => {
    event.stopPropagation();
    setActiveCell(column.id, measure.id, beatIndex, slotIndex, subIndex);
    render();
  });

  sub.addEventListener("dragstart", (event) => {
    if (!symbol) return;
    event.dataTransfer.setData("text/plain", JSON.stringify({
      type: "existing-symbol",
      symbolId: symbol.id
    }));
    event.dataTransfer.effectAllowed = "move";
  });

  sub.addEventListener("dragover", (event) => onSlotDragOver(event));
  sub.addEventListener("dragleave", () => sub.classList.remove("drop-target"));
  sub.addEventListener("drop", (event) => {
    onSlotDrop(event, column.id, measure.id, beatIndex, slotIndex, subIndex);
    sub.classList.remove("drop-target");
  });

  return sub;
}

function getSplitSubIndexFromPointer(event, splitWrap) {
  const rect = splitWrap.getBoundingClientRect();
  const y = event.clientY - rect.top;
  return y < rect.height / 2 ? 0 : 1;
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

function onSlotDrop(event, columnId, measureId, beatIndex, slotIndex, subIndex = null) {
  event.preventDefault();
  const payload = parseDragPayload(event);
  if (!payload) return;

  if (payload.type === "palette-symbol") {
    if (!isSymbolCompatible(state.score.instrument, payload.base)) return;
    const next = makeSymbol(
      payload.base,
      payload.accidental || "",
      payload.ornament || ""
    );
    setSymbolAtLocation(columnId, measureId, beatIndex, slotIndex, subIndex, next);
    setActiveCell(columnId, measureId, beatIndex, slotIndex, subIndex);
    render();
    return;
  }

  if (payload.type === "existing-symbol") {
    const found = findSymbolById(payload.symbolId);
    if (!found || !isSymbolCompatible(state.score.instrument, found.symbol.base)) return;

    removeSymbolAtLocation(found.location);
    setSymbolAtLocation(columnId, measureId, beatIndex, slotIndex, subIndex, found.symbol);
    setActiveCell(columnId, measureId, beatIndex, slotIndex, subIndex);
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

function setSymbolAtLocation(columnId, measureId, beatIndex, slotIndex, subIndex, symbol) {
  const beat = findBeat(columnId, measureId, beatIndex);
  if (!beat) return;
  if (subIndex === null || subIndex === undefined) {
    beat.slots[slotIndex] = symbol;
    return;
  }
  const slotValue = beat.slots[slotIndex];
  if (!isSplitSlot(slotValue)) {
    beat.slots[slotIndex] = makeSplitSlot();
  }
  beat.slots[slotIndex].notes[subIndex] = symbol;
}

function removeSymbolAtLocation(location) {
  const beat = findBeat(location.columnId, location.measureId, location.beatIndex);
  if (!beat) return;
  if (location.subIndex === null || location.subIndex === undefined) {
    beat.slots[location.slotIndex] = null;
    return;
  }
  const slotValue = beat.slots[location.slotIndex];
  if (!isSplitSlot(slotValue)) return;
  slotValue.notes[location.subIndex] = null;
}

function findSymbolById(symbolId) {
  for (const column of state.score.columns) {
    for (const measure of column.measures) {
      for (let beatIndex = 0; beatIndex < measure.beats.length; beatIndex += 1) {
        const beat = measure.beats[beatIndex];
        for (let slotIndex = 0; slotIndex < beat.slots.length; slotIndex += 1) {
          const slotValue = beat.slots[slotIndex];
          if (isSplitSlot(slotValue)) {
            for (let subIndex = 0; subIndex < slotValue.notes.length; subIndex += 1) {
              const subSymbol = slotValue.notes[subIndex];
              if (subSymbol?.id === symbolId) {
                return {
                  symbol: subSymbol,
                  location: {
                    columnId: column.id,
                    measureId: measure.id,
                    beatIndex,
                    slotIndex,
                    subIndex
                  }
                };
              }
            }
          } else if (slotValue?.id === symbolId) {
            return {
              symbol: slotValue,
              location: {
                columnId: column.id,
                measureId: measure.id,
                beatIndex,
                slotIndex,
                subIndex: null
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
      ...shamisenPalettes.ichiNoIto,
      ...shamisenPalettes.rests
    ];
  }
  return instrumentPalettes[instrument] || [];
}

function getPlacementOrnament() {
  return state.score.instrument === "Shamisen" ? state.selectedOrnament : "";
}

function getPlacementAccidental() {
  return state.score.instrument === "Shamisen" ? state.selectedAccidental : "";
}

function symbolLabel(symbol) {
  if (!symbol) return "";
  return `${symbol.base}${symbol.accidental || ""}${symbol.ornament || ""}`;
}

function addColumn() {
  state.score.columns.push(makeColumn(state.score.columns.length + 1));
  renumberColumns();
  ensureCurrentPageInRange();
  render();
}

function deleteSelectedColumn() {
  if (!state.selectedColumnId) return;
  const index = state.score.columns.findIndex((item) => item.id === state.selectedColumnId);
  if (index < 0) return;
  const deletedId = state.score.columns[index].id;
  state.score.columns.splice(index, 1);

  if (state.score.columns.length === 0) {
    state.score.columns.push(makeColumn(1));
  }

  if (state.activeCell?.columnId === deletedId) {
    state.activeCell = null;
  }
  state.selectedColumnId = null;
  renumberColumns();
  ensureCurrentPageInRange();
  render();
}

function renumberColumns() {
  state.score.columns.forEach((column, index) => {
    const startMeasure = index * 4 + 1;
    column.label = String(startMeasure);
    for (let i = 0; i < column.measures.length; i += 1) {
      column.measures[i].index = startMeasure + i;
    }
  });
}

function getPageCount() {
  return Math.max(1, Math.ceil(state.score.columns.length / COLUMNS_PER_PAGE));
}

function getVisibleColumns() {
  const start = state.currentPage * COLUMNS_PER_PAGE;
  return state.score.columns.slice(start, start + COLUMNS_PER_PAGE);
}

function movePage(delta) {
  const next = Math.min(
    Math.max(state.currentPage + delta, 0),
    getPageCount() - 1
  );
  state.currentPage = next;
  render();
}

function ensureCurrentPageInRange() {
  state.currentPage = Math.min(state.currentPage, getPageCount() - 1);
}

function placeAtActiveCell(base) {
  if (!state.activeCell) return;
  if (!isSymbolCompatible(state.score.instrument, base)) return;

  const next = makeSymbol(
    base,
    getPlacementAccidental(),
    getPlacementOrnament()
  );
  setSymbolAtLocation(
    state.activeCell.columnId,
    state.activeCell.measureId,
    state.activeCell.beatIndex,
    state.activeCell.slotIndex,
    state.activeCell.subIndex,
    next
  );
  render();
}

function clearActiveCell() {
  if (!state.activeCell) return;
  removeSymbolAtLocation(state.activeCell);
  render();
}

function isActiveCellSplit() {
  if (!state.activeCell) return false;
  const beat = findBeat(
    state.activeCell.columnId,
    state.activeCell.measureId,
    state.activeCell.beatIndex
  );
  if (!beat) return false;
  return isSplitSlot(beat.slots[state.activeCell.slotIndex]);
}

function splitActiveCellSlot() {
  if (!state.activeCell) return;
  const beat = findBeat(
    state.activeCell.columnId,
    state.activeCell.measureId,
    state.activeCell.beatIndex
  );
  if (!beat) return;
  const existing = beat.slots[state.activeCell.slotIndex];
  if (isSplitSlot(existing)) return;
  const split = makeSplitSlot();
  split.notes[0] = existing;
  beat.slots[state.activeCell.slotIndex] = split;
  setActiveCell(
    state.activeCell.columnId,
    state.activeCell.measureId,
    state.activeCell.beatIndex,
    state.activeCell.slotIndex,
    0
  );
  render();
}

function mergeActiveCellSlot() {
  if (!state.activeCell) return;
  const beat = findBeat(
    state.activeCell.columnId,
    state.activeCell.measureId,
    state.activeCell.beatIndex
  );
  if (!beat) return;
  const existing = beat.slots[state.activeCell.slotIndex];
  if (!isSplitSlot(existing)) return;
  beat.slots[state.activeCell.slotIndex] = existing.notes[0] || existing.notes[1] || null;
  setActiveCell(
    state.activeCell.columnId,
    state.activeCell.measureId,
    state.activeCell.beatIndex,
    state.activeCell.slotIndex,
    null
  );
  render();
}

function setActiveCellOrnament(ornament) {
  const symbol = getActiveCellSymbol();
  if (!symbol) return;
  symbol.ornament = ornament;
  render();
}

function setActiveCellAccidental(accidental) {
  const symbol = getActiveCellSymbol();
  if (!symbol) return;
  symbol.accidental = accidental;
  render();
}

function getActiveCellSymbol() {
  if (!state.activeCell) return null;
  const beat = findBeat(
    state.activeCell.columnId,
    state.activeCell.measureId,
    state.activeCell.beatIndex
  );
  if (!beat) return null;
  const slotValue = beat.slots[state.activeCell.slotIndex];
  if (isSplitSlot(slotValue)) {
    const subIndex = state.activeCell.subIndex ?? 0;
    return slotValue.notes[subIndex];
  }
  return slotValue;
}

function setActiveCell(columnId, measureId, beatIndex, slotIndex, subIndex = null) {
  state.activeCell = {
    columnId,
    measureId,
    beatIndex,
    slotIndex,
    subIndex
  };
}

function isActiveCell(columnId, measureId, beatIndex, slotIndex, subIndex = null) {
  if (!state.activeCell) return false;
  return state.activeCell.columnId === columnId
    && state.activeCell.measureId === measureId
    && state.activeCell.beatIndex === beatIndex
    && state.activeCell.slotIndex === slotIndex
    && state.activeCell.subIndex === subIndex;
}

function activeCellLabel() {
  if (!state.activeCell) return "";
  const column = state.score.columns.find((item) => item.id === state.activeCell.columnId);
  if (!column) return "";
  const measure = column.measures.find((item) => item.id === state.activeCell.measureId);
  if (!measure) return "";
  const slotName = state.activeCell.slotIndex === 0 ? "1st 8th" : "2nd 8th";
  const subName = state.activeCell.subIndex === null || state.activeCell.subIndex === undefined
    ? ""
    : state.activeCell.subIndex === 0 ? " (1st 16th)" : " (2nd 16th)";
  return `${column.label} - M${measure.index} - Beat ${state.activeCell.beatIndex + 1} - ${slotName}${subName}`;
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
  const sideTitle = document.querySelector(".sheet-side-title");
  if (sideTitle) {
    sideTitle.textContent = state.score.title || "Untitled";
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
    state.selectedAccidental = "";
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

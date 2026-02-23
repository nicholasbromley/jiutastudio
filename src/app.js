const instrumentPalettes = {
  Koto: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "スクイ", "押手"],
  Shamisen: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "打", "ス", "ハ"],
  Shakuhachi: ["ロ", "ツ", "レ", "チ", "リ", "ロ乙", "メリ", "カリ", "ユリ"]
};

const techniques = ["bend", "slide", "vibrato", "strike", "damp"];

const state = {
  score: {
    title: "New Jiuta Piece",
    tempo: 72,
    columns: [
      makeColumn("Koto"),
      makeColumn("Shamisen"),
      makeColumn("Shakuhachi")
    ]
  },
  active: {
    columnId: null,
    segmentId: null
  },
  selectedSymbol: "",
  selectedTechnique: techniques[0]
};

function makeColumn(instrument) {
  return {
    id: crypto.randomUUID(),
    instrument,
    segments: Array.from({ length: 8 }, makeSegment)
  };
}

function makeSegment() {
  return {
    id: crypto.randomUUID(),
    symbols: [],
    lyric: ""
  };
}

function makeSymbol(base) {
  return {
    id: crypto.randomUUID(),
    base,
    octaveShift: "",
    technique: ""
  };
}

function getActiveSegment() {
  const col = state.score.columns.find((item) => item.id === state.active.columnId);
  if (!col) return null;
  return col.segments.find((item) => item.id === state.active.segmentId) || null;
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
  panel.append(control("Tempo", tempoInput()));

  panel.append(el("h2", { text: "Column Actions" }));
  const actions = el("div", { className: "inline" });
  actions.append(
    button("Add Segment", () => addSegmentToAllColumns()),
    button("Add Column", () => addColumn())
  );
  panel.append(actions);

  panel.append(el("h2", { text: "Segment Editor" }));
  panel.append(control("Lyric", lyricInput()));
  panel.append(control("Technique", techniqueSelect()));
  panel.append(
    button(
      "Apply Technique To Last Symbol",
      () => applyTechnique(),
      getActiveSegment() ? "" : "primary"
    )
  );
  panel.append(el("p", { className: "hint", text: "Select a segment, then choose a symbol from the palette." }));
  return panel;
}

function rightPanel() {
  const panel = el("aside", { className: "panel right" });
  panel.append(el("h2", { text: "Palette" }));

  const activeColumn = state.score.columns.find((item) => item.id === state.active.columnId);
  const instrument = activeColumn?.instrument || "Koto";
  const choices = instrumentPalettes[instrument] || [];

  const palette = el("div", { className: "palette-grid" });
  choices.forEach((symbol) => {
    const isActive = symbol === state.selectedSymbol;
    const item = button(
      symbol,
      () => {
        state.selectedSymbol = symbol;
        appendSymbolToActiveSegment(symbol);
      },
      isActive ? "primary palette-symbol" : "palette-symbol"
    );
    item.draggable = true;
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", JSON.stringify({
        type: "palette-symbol",
        base: symbol,
        instrument
      }));
      event.dataTransfer.effectAllowed = "copy";
    });
    palette.append(item);
  });
  panel.append(palette);

  panel.append(el("h2", { text: "Active Instrument" }));
  panel.append(el("p", { text: instrument }));
  panel.append(el("p", { className: "hint", text: "Palette follows the selected column instrument." }));
  return panel;
}

function canvas() {
  const center = el("main", { className: "score-stage" });
  const track = el("div", { className: "column-track" });

  state.score.columns.forEach((column) => {
    track.append(renderColumn(column));
  });

  center.append(track);
  return center;
}

function renderColumn(column) {
  const container = el("section", { className: "column" });
  const head = el("div", { className: "column-head" });
  head.append(el("span", { className: "column-name", text: column.instrument }));
  head.append(button("+", () => column.segments.push(makeSegment())));

  const list = el("div", { className: "segment-list" });
  column.segments.forEach((segment) => list.append(renderSegment(column, segment)));

  container.append(head, list);
  return container;
}

function renderSegment(column, segment) {
  const active = segment.id === state.active.segmentId;
  const card = el("article", { className: `segment${active ? " active" : ""}` });
  card.dataset.segmentId = segment.id;
  card.addEventListener("dragover", (event) => onSegmentDragOver(event, column.instrument));
  card.addEventListener("dragleave", () => {
    card.classList.remove("drop-target");
  });
  card.addEventListener("drop", (event) => {
    onSegmentDrop(event, column, segment, segment.symbols.length);
    card.classList.remove("drop-target");
  });
  card.addEventListener("click", () => {
    state.active.columnId = column.id;
    state.active.segmentId = segment.id;
    render();
  });

  const stack = el("div", { className: "symbol-stack" });
  segment.symbols.forEach((item, index) => {
    const text = item.technique ? `${item.base} (${item.technique})` : item.base;
    const row = el("div", { className: "symbol" });
    row.draggable = true;
    row.addEventListener("dragstart", (event) => {
      event.stopPropagation();
      event.dataTransfer.setData("text/plain", JSON.stringify({
        type: "existing-symbol",
        symbolId: item.id,
        fromSegmentId: segment.id
      }));
      event.dataTransfer.effectAllowed = "move";
    });
    row.addEventListener("dragover", (event) => {
      onSegmentDragOver(event, column.instrument);
      event.stopPropagation();
    });
    row.addEventListener("drop", (event) => {
      event.stopPropagation();
      onSegmentDrop(event, column, segment, index);
      card.classList.remove("drop-target");
    });
    row.append(el("span", { text }));
    if (item.octaveShift) {
      row.append(el("small", { text: item.octaveShift }));
    }
    stack.append(row);
  });

  card.append(stack);

  if (segment.lyric) {
    card.append(el("div", { className: "lyric", text: segment.lyric }));
  }

  return card;
}

function titleInput() {
  const input = el("input");
  input.value = state.score.title;
  input.addEventListener("input", (event) => {
    state.score.title = event.target.value;
  });
  return input;
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

function lyricInput() {
  const input = el("input");
  const segment = getActiveSegment();
  input.placeholder = "Enter lyric for selected segment";
  input.value = segment?.lyric || "";
  input.disabled = !segment;
  input.addEventListener("input", (event) => {
    const target = getActiveSegment();
    if (!target) return;
    target.lyric = event.target.value;
    render();
  });
  return input;
}

function techniqueSelect() {
  const select = el("select");
  techniques.forEach((item) => {
    const option = el("option", { text: item });
    option.value = item;
    if (item === state.selectedTechnique) {
      option.selected = true;
    }
    select.append(option);
  });
  select.addEventListener("change", (event) => {
    state.selectedTechnique = event.target.value;
  });
  return select;
}

function addSegmentToAllColumns() {
  state.score.columns.forEach((column) => column.segments.push(makeSegment()));
  render();
}

function addColumn() {
  const instrument = prompt("New column instrument (Koto, Shamisen, Shakuhachi):", "Koto");
  if (!instrument) return;
  const safe = ["Koto", "Shamisen", "Shakuhachi"].includes(instrument) ? instrument : "Koto";
  state.score.columns.unshift(makeColumn(safe));
  render();
}

function appendSymbolToActiveSegment(base) {
  const segment = getActiveSegment();
  const activeColumn = state.score.columns.find((item) => item.id === state.active.columnId);
  if (!activeColumn) return;
  if (!isSymbolCompatible(activeColumn.instrument, base)) return;
  if (!segment) return;
  segment.symbols.push(makeSymbol(base));
  render();
}

function applyTechnique() {
  const segment = getActiveSegment();
  if (!segment || segment.symbols.length === 0) return;
  const target = segment.symbols[segment.symbols.length - 1];
  target.technique = state.selectedTechnique;
  render();
}

function onSegmentDragOver(event, instrument) {
  const payload = parseDragPayload(event);
  if (!payload) return;
  if (payload.type === "palette-symbol" && !isSymbolCompatible(instrument, payload.base)) {
    return;
  }
  if (payload.type === "existing-symbol") {
    const source = findSymbolWithContext(payload.symbolId);
    if (!source || !isSymbolCompatible(instrument, source.symbol.base)) {
      return;
    }
  }
  event.preventDefault();
  const card = event.currentTarget.closest(".segment");
  if (card) {
    card.classList.add("drop-target");
  }
}

function onSegmentDrop(event, targetColumn, targetSegment, targetIndex) {
  event.preventDefault();
  const payload = parseDragPayload(event);
  if (!payload) return;

  if (payload.type === "palette-symbol") {
    if (!isSymbolCompatible(targetColumn.instrument, payload.base)) return;
    targetSegment.symbols.splice(targetIndex, 0, makeSymbol(payload.base));
    state.active.columnId = targetColumn.id;
    state.active.segmentId = targetSegment.id;
    render();
    return;
  }

  if (payload.type === "existing-symbol") {
    const source = findSymbolWithContext(payload.symbolId);
    if (!source) return;
    if (!isSymbolCompatible(targetColumn.instrument, source.symbol.base)) return;

    source.segment.symbols.splice(source.index, 1);
    let insertAt = targetIndex;
    if (source.segment.id === targetSegment.id && source.index < targetIndex) {
      insertAt -= 1;
    }
    targetSegment.symbols.splice(insertAt, 0, source.symbol);
    state.active.columnId = targetColumn.id;
    state.active.segmentId = targetSegment.id;
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

function isSymbolCompatible(instrument, base) {
  return (instrumentPalettes[instrument] || []).includes(base);
}

function findSymbolWithContext(symbolId) {
  for (const column of state.score.columns) {
    for (const segment of column.segments) {
      const index = segment.symbols.findIndex((item) => item.id === symbolId);
      if (index >= 0) {
        return {
          column,
          segment,
          symbol: segment.symbols[index],
          index
        };
      }
    }
  }
  return null;
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

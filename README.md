# Jiuta Studio

First milestone for a Jiuta-focused notation application.

## Run locally

This version uses plain HTML/CSS/JS with no build step.

```bash
cd /Users/nicholasbromley/code/jiutastudio
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

## Current capabilities

- Single-instrument score mode (Koto, Shamisen, or Shakuhachi)
- 4/4 timing grid with fixed structure:
  - 1 column = 4 measures
  - 1 measure = 4 beats
  - 1 beat = 2 eighth-note slots (with midpoint divider line)
- Drag and drop from instrument-specific palette into any slot
- Drag and move existing symbols slot-to-slot
- Instrument compatibility checks when dropping symbols
- Shamisen palette with string-specific notation sets:
  - Ordered neck-style: all base notes first, then dotted octave notes
  - San no ito: `1..9`, then `1•..9•`
  - Ni no ito: `一..九`, then dotted octave markers
  - Ichi no ito: `イ一..イ九`, then dotted octave markers
- Shamisen quick marker buttons for selected cell (apply/remove `ス`, `^`, and `♯` in one click)
- Default ornament and sharp controls for newly placed Shamisen notes
- Quick load button for Sakura opening pattern (`5, 5, 7, ●`)
- Score metadata controls (title and tempo)

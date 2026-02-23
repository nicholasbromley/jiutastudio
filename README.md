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
- Quick load button for Sakura opening pattern (`5, 5, 7, ●`)
- Score metadata controls (title and tempo)

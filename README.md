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

- Vertical notation canvas with right-to-left columns
- Instrument columns for Koto, Shamisen, and Shakuhachi
- Segment-based symbol entry from an instrument-aware palette
- Drag and drop from palette into segments
- Drag to reorder/move existing symbols between segments
- Instrument compatibility checks when dropping symbols
- Basic technique annotations
- Lyric entry per segment
- Score metadata controls (title and tempo)

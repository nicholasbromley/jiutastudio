# Jiuta-Style Notation Research

## Overview of Jiuta Notation
- Jiuta (地歌) notation is traditionally written vertically from top to bottom and read from right to left, mirroring Japanese vertical writing.
- The system uses numeric and syllabic symbols rather than Western staff notation. Symbols are aligned in vertical columns for phrasing rather than horizontal measures.
- Timing is often implied by spacing and rhythmic marks rather than precise note heads; articulation symbols indicate plucking direction and dynamics.

## Instrument-Specific Conventions
### Koto
- Uses numerals (1–10) and kana-like characters to denote strings, sometimes with dots or dashes to indicate octave shifts or alterations.
- Right-hand techniques (tsume) and left-hand ornaments (bends, slides, vibrato) are marked with small additional signs placed around the core symbol.
- Sections are frequently grouped into vertical columns with brackets or boxed phrases to match poetic structure.

### Shamisen
- Employs numerical tablature for string/fret positions, with special kana for open-string and percussive strikes.
- Rhythm is cued with diagonal slashes, small circles, or elongated spacing between symbols; short grace figures sit beside the main symbol vertically.
- Vocal cues or lyric fragments often appear to the left of the shamisen line to align with the singing part.

### Shakuhachi
- Uses kana-based breath tablature (ro, tsu, re, chi, ri, etc.) arranged vertically; dots and horizontal lines indicate octave and meri/kari pitch bends.
- Duration is shown with trailing lines or repeated symbols rather than Western note values; ma (silence/breath) can be indicated with space.
- Dynamic swells and vibrato (yuri) are annotated with small marks adjacent to the syllable.

## Layout Considerations for an App
- Page flow should support vertical columns ordered right-to-left. Each instrument part can be its own column, with synchronized phrasing across columns via alignment guides.
- Symbols need to allow ruby-like annotations for techniques (dots, dashes, slashes, kana superscripts). Layered glyph rendering is essential.
- Users should be able to switch between Koto, Shamisen, and Shakuhachi symbol palettes and technique marks.
- Rhythm entry should allow proportional spacing, with optional bar-like separators for ensemble coordination.
- Support lyrics beside relevant columns and rehearsal markers for section breaks.

## Feature Ideas Inspired by JapoScore/MuseScore Patterns
- Palette of Jiuta glyphs and technique marks with drag/drop or keyboard shortcuts.
- Vertical stave grid with snap-to-column and alignment lines for ensemble parts.
- Playback mapping from Jiuta symbols to MIDI (Koto, Shamisen, Shakuhachi soundfonts) with adjustable tempo and ma (breath) gaps.
- Export to PDF/PNG with vertical layout, and MusicXML or custom JSON for interchange.
- Template library for common forms (danmono sections, jiuta with vocal lines) and instrument tunings.

## Data Model Sketch
- **Score**: metadata (title, tempo, tuning set), list of **Columns** ordered right-to-left.
- **Column**: instrument type, list of **Segments** stacked top-to-bottom.
- **Segment**: timed group containing **Symbols**, **TechniqueAnnotations**, optional **Lyric**.
- **Symbol**: base glyph (numeric/kana), octave/merikeri modifiers, duration hint.
- **TechniqueAnnotation**: small mark referencing a Symbol (bend, slide, strike, vibrato, damping, etc.).
- **PlaybackMapping**: per-instrument mapping from Symbol + technique to MIDI pitch/breath and duration.

## UX Sketch
- Right-side palette; central vertical canvas; left-side properties/inspector.
- Zoomable vertical scroll; gridlines for alignment across parts; guides for lyric positioning.
- Keyboard entry shortcuts for common numerals/kana and modifier keys for dots/dashes.
- Inline preview of playback for a selected column or phrase.

# Designer: side-by-side editing + live 3D mockup

Turn the designer into a two-section workspace like the mockup editor you linked: you edit the artwork on the left and see the garment update live in 3D on the right — no more switching between Edit and Preview.

## What you'll see

```text
+--------+------------------------+------------------------+
| tools  |  ARTWORK EDITOR        |  3D MOCKUP             |
|        |  flat garment + print  |  garment on mannequin  |
|        |  area, drag/resize     |  rotates, zooms        |
|        |  text, images, shapes  |  front/back/side/left  |
+--------+------------------------+------------------------+
|  color swatches | size | garment style | Save / Add to Cart |
+-----------------------------------------------------------+
```

- Left: the existing artwork editor, unchanged in behaviour (print-area clamping, layers, undo/redo, text and image tools all stay).
- Right: the 3D garment, always live. Every move, colour change, text edit or upload shows up on the 3D garment immediately.
- Both back artwork and front artwork appear on the correct side of the 3D garment when you rotate it.

## 3D mockup controls

- Drag to orbit, scroll or buttons to zoom, plus quick view buttons: Front, Back, Left, Right.
- Auto-rotate toggle (on by default, stops as soon as you drag).
- Reset view button.
- Garment style switcher: Regular Tee, Oversized Tee, Long Sleeve, Hoodie — the 3D shape changes to match, and the switcher respects the garment the vendor listed.
- Fullscreen toggle for the 3D panel, and a collapse control so you can give the editor full width on a small screen.

## Layout behaviour

- Wide screens: editor and 3D side by side, draggable divider between them.
- Narrow screens: two tabs, Design and 3D, so nothing gets cramped.
- The old Edit/Preview toggle becomes the layout switcher: Split, Design only, 3D only.

## Technical notes

- `src/store/designerStore.ts`: replace `mode: 'edit' | 'preview'` with `layout: 'split' | 'design' | 'mockup'`; add `garmentStyle` and `autoRotate`. Keep a derived `mode` getter so existing consumers (`Index.tsx`, `TopToolbar`, `ViewTabs`) don't break.
- New `src/components/designer/MockupPanel.tsx` wraps the `<Canvas>` plus its own control bar; `MannequinPreview.tsx` becomes the scene only.
- Design texture: extract the canvas-texture builder out of `MannequinPreview` into `src/lib/designTexture.ts`, generate one texture per view (front/back), and dispose old textures on regeneration to avoid GPU leaks. Debounce regeneration (~120ms) so dragging stays smooth.
- Garment shapes: parameterised extruded profiles (body width, length, sleeve length, hood) driven by `garmentStyle`, so all four styles come from one geometry builder.
- Replace `<Environment preset="studio" />` with local `<Lightformer>` lights — the preset fetches an HDR from a third-party CDN and can hang the panel.
- `Index.tsx`: split pane via a resizable container; mount the 3D `<Canvas>` once and keep it alive across layout changes.
- No new dependencies; existing three / @react-three/fiber / drei only. No backend or schema changes.

import { THEME_FONTS, THEME_PALETTES } from '../config/theme';

export default function ThemeControls({ palette, font, onPaletteChange, onFontChange }) {
  return (
    <details className="theme-controls">
      <summary className="theme-button-ghost cursor-pointer list-none rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
        Appearance
      </summary>
      <div className="theme-controls-popover theme-surface mt-2 w-72 rounded-xl p-3 shadow-2xl">
        <div className="space-y-3">
          <label className="block">
            <span className="theme-kicker mb-1 block">Colour palette</span>
            <select
              value={palette}
              onChange={event => onPaletteChange(event.target.value)}
              className="theme-field w-full rounded-lg px-3 py-2 text-xs"
              aria-label="Colour palette"
            >
              {THEME_PALETTES.map(option => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            <span className="theme-help mt-1 block">
              {THEME_PALETTES.find(option => option.id === palette)?.description}
            </span>
          </label>

          <label className="block">
            <span className="theme-kicker mb-1 block">Site font</span>
            <select
              value={font}
              onChange={event => onFontChange(event.target.value)}
              className="theme-field w-full rounded-lg px-3 py-2 text-xs"
              aria-label="Site font"
            >
              {THEME_FONTS.map(option => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            <span className="theme-help mt-1 block">
              {THEME_FONTS.find(option => option.id === font)?.description}
            </span>
          </label>
        </div>
      </div>
    </details>
  );
}

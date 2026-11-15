import {
  THEME_COLOR_CONTROLS,
  THEME_COLOR_GROUPS,
  THEME_FONTS,
  THEME_PALETTES,
} from '../config/theme';

export default function ThemeControls({
  palette,
  font,
  colors = {},
  onPaletteChange,
  onFontChange,
  onColorChange,
  onResetColors,
}) {
  const customColorIds = new Set(Object.keys(colors));

  return (
    <details className="theme-controls">
      <summary className="theme-button-ghost cursor-pointer list-none rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
        Appearance
      </summary>
      <div className="theme-controls-popover theme-surface mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-[75vh] overflow-y-auto rounded-xl p-3 shadow-2xl">
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

          <details className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
            <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-wider text-slate-200">
              Advanced colours
            </summary>
            <div className="mt-3 space-y-4">
              <p className="theme-help">
                Override individual colour tokens while leaving every other colour tied to the selected palette and administrator default.
              </p>
              {THEME_COLOR_GROUPS.map(group => (
                <fieldset key={group.id} className="space-y-2">
                  <legend className="theme-kicker">{group.label}</legend>
                  {THEME_COLOR_CONTROLS.filter(option => option.group === group.id).map(option => {
                    const customColor = colors[option.id];
                    return (
                      <label key={option.id} className="block rounded-lg border border-slate-800/80 bg-slate-950/60 p-2">
                        <span className="block text-xs font-semibold text-slate-200">{option.label}</span>
                        <span className="theme-help mt-0.5 block">{option.description}</span>
                        <span className="mt-2 flex items-center gap-2">
                          <input
                            type="color"
                            value={customColor || option.fallback}
                            onChange={event => onColorChange?.(option.id, event.target.value)}
                            className="h-8 w-10 cursor-pointer rounded border border-slate-700 bg-slate-900 p-0.5"
                            aria-label={`Custom colour for ${option.label}`}
                            title="Choose a custom colour"
                          />
                          <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-400">
                            {customColor || 'Using palette default'}
                          </span>
                          {customColor && (
                            <button
                              type="button"
                              onClick={() => onColorChange?.(option.id, '')}
                              className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-200"
                            >
                              Reset
                            </button>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              ))}
              <button
                type="button"
                onClick={onResetColors}
                disabled={customColorIds.size === 0}
                className="theme-button-secondary w-full px-3 py-2 text-[10px]"
              >
                Reset all custom colours
              </button>
            </div>
          </details>
        </div>
      </div>
    </details>
  );
}

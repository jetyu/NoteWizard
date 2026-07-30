import { onMounted, onUnmounted, watch } from 'vue';
import { useSettingsStore, type AccentMode, type ThemeMode } from '../store/settings.store';

export function useSettingsAppearance() {
  const settingsStore = useSettingsStore();
  let removeSystemThemeListener: (() => void) | null = null;

  const resolveThemeMode = (mode: ThemeMode): 'light' | 'dark' => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return mode;
  };

  const applyThemeAppearance = (themeMode: ThemeMode, accentMode: AccentMode) => {
    const activeTheme = resolveThemeMode(themeMode);
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.setAttribute('data-accent', accentMode);
    document.documentElement.style.colorScheme = activeTheme;
  };

  const applyAppUIFont = (fontFamily: string) => {
    if (fontFamily) {
      document.documentElement.style.setProperty('--ui-font-family', fontFamily);
    } else {
      document.documentElement.style.removeProperty('--ui-font-family');
    }
  };

  const applyEditorTypography = (fontSize: number, fontFamily: string) => {
    const root = document.documentElement;
    root.style.setProperty('--editor-font-size', `${fontSize}px`);

    if (fontFamily) {
      root.style.setProperty('--editor-font-family', fontFamily);
    } else {
      root.style.removeProperty('--editor-font-family');
    }
  };

  watch(
    () => [settingsStore.config.themeMode, settingsStore.config.accentMode] as const,
    ([themeMode, accentMode]) => {
      applyThemeAppearance(themeMode, accentMode);
    },
    { immediate: true },
  );

  watch(
    () => settingsStore.config.appUIFont,
    (fontFamily) => {
      applyAppUIFont(fontFamily);
    },
    { immediate: true },
  );

  watch(
    () => [settingsStore.config.editorFontSize, settingsStore.config.editorFont] as const,
    ([fontSize, fontFamily]) => {
      applyEditorTypography(fontSize, fontFamily);
    },
    { immediate: true },
  );

  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (settingsStore.config.themeMode === 'system') {
        applyThemeAppearance('system', settingsStore.config.accentMode);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    removeSystemThemeListener = () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  });

  onUnmounted(() => {
    removeSystemThemeListener?.();
  });
}

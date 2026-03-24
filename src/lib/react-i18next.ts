import type { i18n as I18nInstance } from "i18next";
import {
  initReactI18next as initReactI18nextBase,
  useTranslation as useTranslationBase,
} from "../../node_modules/react-i18next/dist/es/index.js";

type TranslateOptions = Record<string, unknown>;
type TranslateFn = (key: string, defaultValueOrOptions?: string | TranslateOptions, options?: TranslateOptions) => string;

type UseTranslationResult = {
  i18n: I18nInstance;
  ready: boolean;
  t: TranslateFn;
};

export const initReactI18next = initReactI18nextBase;

export const useTranslation = (): UseTranslationResult => {
  const result = useTranslationBase();

  return {
    i18n: result.i18n,
    ready: result.ready,
    t: result.t as unknown as TranslateFn,
  };
};

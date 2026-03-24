// Override react-i18next's children type to be compatible with React 18 + Radix UI
// See: https://github.com/i18next/react-i18next/issues/1587
import "react-i18next";
import type { ReactNode } from "react";

declare module "react-i18next" {
  export interface TransProps<TOpt = {}> {
    children?: ReactNode;
  }
}

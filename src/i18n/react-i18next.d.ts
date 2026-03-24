import "react-i18next";
import { ReactNode } from "react";

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    returnNull: false;
    returnObjects: false;
  }
}

// Fix react-i18next children type compatibility with React 18
declare module "react" {
  interface HTMLAttributes<T> {
    children?: ReactNode | undefined;
  }
}

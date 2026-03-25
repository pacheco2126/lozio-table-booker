import "react-i18next";
import "react";

declare module "react-i18next" {
  interface CustomTypeOptions {
    allowObjectInHTMLChildren: true;
  }
}

declare module "react" {
  interface HTMLAttributes<T> {
    children?: React.ReactNode;
  }
}

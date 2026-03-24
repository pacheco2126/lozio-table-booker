// Fix react-i18next v16+ type compatibility with React 18 / Radix UI
// See: https://github.com/i18next/react-i18next/issues/1587
import "react-i18next";

declare module "react-i18next" {
  interface CustomTypeOptions {
    allowObjectInHTMLChildren: true;
    // Return string instead of complex union type
    returnNull: false;
  }
}

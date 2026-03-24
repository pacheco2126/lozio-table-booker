// Ensure react-i18next does NOT add Record<string, unknown> to HTML children type.
// This prevents type conflicts with Radix UI components.
import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    returnNull: false;
    allowObjectInHTMLChildren: false;
  }
}

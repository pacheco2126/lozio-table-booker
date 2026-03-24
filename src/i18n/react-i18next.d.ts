// Fix react-i18next augmenting React.HTMLAttributes.children with ObjectOrNever,
// which breaks Radix UI components expecting standard ReactNode children.
// Setting allowObjectInHTMLChildren makes ObjectOrNever resolve to `never`,
// so ReactI18NextChildren collapses to just React.ReactNode.
import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    allowObjectInHTMLChildren: true;
    returnNull: false;
  }
}

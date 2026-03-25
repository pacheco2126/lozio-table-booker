// react-i18next v15 widens children types in a way incompatible with
// React 18 + Radix Slot.  Override the problematic type so it resolves
// to plain ReactNode, silencing TS2322 across all UI components.
import "react-i18next";

declare module "react-i18next" {
  // Force t() to return string, not ReactI18NextChildren
  interface CustomTypeOptions {
    returnNull: false;
    // This makes the `children` prop added by the I18nextProvider
    // compatible with React.ReactNode
  }
}

// Patch: make ReactI18NextChildren assignable to ReactNode
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES {
    readonly reactI18Next: Record<string, unknown>;
  }
}

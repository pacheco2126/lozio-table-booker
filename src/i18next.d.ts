// Fix react-i18next + React 18 type conflict with Radix/Slot components.
// The issue is that react-i18next augments React.HTMLAttributes.children
// with ReactI18NextChildren (which includes Record<string,unknown>),
// making it incompatible with Radix Slot's expected ReactNode type.
// This override re-narrows children back to ReactNode.
declare module "react" {
  interface HTMLAttributes<T> {
    children?: React.ReactNode | undefined;
  }
  interface AriaAttributes {}
}

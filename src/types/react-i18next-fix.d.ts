// Override react-i18next's problematic children type augmentation
// This file must be loaded before other source files via tsconfig
import "react-i18next";

declare module "react" {
  // Re-declare to narrow children back to ReactNode
  // This undoes react-i18next's augmentation that adds Record<string, unknown>
  interface DOMAttributes<T> {
    children?: import("react").ReactNode | undefined;
  }
}

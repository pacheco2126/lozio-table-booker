// Workaround: suppress the ReactI18NextChildren type conflict with Radix Slot.
// react-i18next augments React.HTMLAttributes.children with a type that is
// structurally incompatible with Radix's expected ReactNode.
// We re-export everything from react-i18next but override the module
// augmentation by redeclaring HTMLAttributes.children as standard ReactNode.
import type * as React from 'react';

declare module 'react' {
  // Re-narrow children to plain ReactNode, undoing react-i18next's augmentation
  interface HTMLAttributes<T> {
    children?: React.ReactNode;
  }
}

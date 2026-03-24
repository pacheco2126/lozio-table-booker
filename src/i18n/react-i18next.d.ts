// Completely override react-i18next's problematic HTMLAttributes augmentation
// by re-declaring React's JSX IntrinsicElements without the ObjectOrNever type

declare module 'react' {
  interface HTMLAttributes<T> {
    children?: React.ReactNode | undefined;
  }
  interface SVGAttributes<T> {
    children?: React.ReactNode | undefined;
  }
}

export {};

/**
 * Text — Body text primitive
 *
 * Monospace body text in Hack font.
 * Variants: body (default), body-sm, caption, label
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';

type TextVariant = 'body' | 'body-sm' | 'caption' | 'label';
type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent' | 'success';
type TextAlign = 'left' | 'center' | 'right';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  as?: 'p' | 'span' | 'div' | 'label' | 'figcaption' | 'small';
  variant?: TextVariant;
  color?: TextColor;
  align?: TextAlign;
  bold?: boolean;
  truncate?: boolean;
  clamp?: 2 | 3;
  htmlFor?: string; // For label element
}

const Text = forwardRef<HTMLElement, TextProps>(
  (
    {
      children,
      as,
      className,
      variant = 'body',
      color,
      align,
      bold,
      truncate,
      clamp,
      ...props
    },
    ref
  ) => {
    // Default element based on variant
    const defaultElement = {
      body: 'p',
      'body-sm': 'p',
      caption: 'span',
      label: 'label',
    }[variant] as 'p' | 'span' | 'label';

    const Component = as || defaultElement;

    const variantClasses = {
      body: 'text-body',
      'body-sm': 'text-body-sm',
      caption: 'text-caption',
      label: 'text-label',
    };

    const classes = clsx(
      variantClasses[variant],
      color && `text-${color}`,
      align && `text-${align}`,
      bold && 'text-bold',
      truncate && 'truncate',
      clamp === 2 && 'line-clamp-2',
      clamp === 3 && 'line-clamp-3',
      className
    );

    return (
      <Component ref={ref as any} className={classes} {...props}>
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';

export { Text };

import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
const variants = cva("button", {
  variants: {
    variant: { default: "primary", outline: "outline", ghost: "ghost" },
  },
  defaultVariants: { variant: "default" },
});
export function Button({
  className,
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants>) {
  return (
    <button
      className={twMerge(clsx(variants({ variant }), className))}
      {...props}
    />
  );
}

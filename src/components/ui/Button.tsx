import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";

/**
 * Button — 50-70 歲友善：手機至少 60px、桌面 56px
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-lg font-semibold " +
    "transition-colors disabled:pointer-events-none disabled:opacity-50 " +
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40 " +
    "select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-card",
        secondary:
          "bg-white text-ink border-2 border-surface-border hover:bg-surface-muted shadow-card",
        success: "bg-success-600 text-white hover:bg-success-700 shadow-card",
        danger: "bg-danger-600 text-white hover:bg-danger-700 shadow-card",
        ghost: "bg-transparent text-ink hover:bg-surface-muted",
        link: "text-brand-700 underline-offset-4 hover:underline",
      },
      size: {
        md: "h-btn-desktop px-6 min-w-[96px]",
        lg: "h-btn-mobile px-8 text-xl min-w-[120px]",
        xl: "h-16 px-10 text-xl min-w-[140px]",
        icon: "h-14 w-14 p-0",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };

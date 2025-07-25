import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import { ComponentProps } from "react";

export const buttonStyles = cva(["transition-colors"], {
  variants: {
    variant: {
      default: ["bg-secondary-marginal", "hover:bg-secondary-marginal-hover"],
      ghost: ["hover:bg-secondary-marginal-hover"],
      dark: ["bg-secondary-marginal-dark", "hover:bg-secondary-marginal-dark-hover", "text-secondary-marginal"],
      disabled: ["bg-[#272727]"], 
    },
    size: {
      default: ["rounded", "p-2"],
      icon: [
        "rounded-full",
        "w-10",
        "h-10",
        "flex",
        "items-center",
        "justify-center",
        "p-2.5",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type ButtonProps = VariantProps<typeof buttonStyles> & ComponentProps<"button">;

export const Button = ({ variant, size, className, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className={cn(buttonStyles({ variant, size, className }), className)}
    />
  );
};

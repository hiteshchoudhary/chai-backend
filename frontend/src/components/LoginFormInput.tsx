import { Control, FieldPath } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { ReactNode } from "react";
import { LoginFormSchema } from "./LoginForm";

interface LoginFormInputProps {
  placeholder: string;
  name: FieldPath<z.infer<typeof LoginFormSchema>>;
  label: string;
  control: Control<z.infer<typeof LoginFormSchema>>;
  type: string;
  icon?: ReactNode;
  autoComplete?: string;
}

const LoginFormInput = ({
  name,
  label,
  control,
  type,
  placeholder,
  icon,
  autoComplete = "on",
}: LoginFormInputProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                placeholder={placeholder}
                type={type}
                autoComplete={autoComplete}
                className="border border-secondary-marginal-text"
              />
              {icon && (
                <div className="absolute inset-y-0 flex items-center cursor-pointer right-3">
                  {icon}
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
  );
};

export default LoginFormInput;

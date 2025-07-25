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
import { RegisterFormSchema } from "./RegisterForm";
import { ReactNode } from "react";


interface RegisterInputProps {
  placeholder?: string;
  name: FieldPath<z.infer<typeof RegisterFormSchema>>;
  label: string;
  control: Control<z.infer<typeof RegisterFormSchema>>;
  type: string;
  icon?: ReactNode;
  autoComplete?: string;
}

const RegisterFormInput = ({
  name,
  label,
  control,
  type,
  placeholder,
  icon,
  autoComplete
}: RegisterInputProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input placeholder={placeholder} type={type} {...field} autoComplete={autoComplete} className="border border-secondary-marginal-text"/>
              {icon && (
                <div className="absolute inset-y-0 flex items-center cursor-pointer right-3">
                  {icon}
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage className="text-red-500"/>
        </FormItem>
      )}
    />
  );
};

export default RegisterFormInput;

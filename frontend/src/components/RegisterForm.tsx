import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "./ui/form";
import { Button } from "./ui/button";

import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import RegisterFormInput from "./RegisterFormInput";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRegisterMutation } from "@/slices/usersApiSlice";

export const RegisterFormSchema = z
  .object({
    fullname: z
      .string()
      .min(3, "Full name must at least 3 characters long")
      .max(30, "Full name must be only be of 30 charcters")
      .regex(
        /^[a-zA-Z\s]+$/,
        "Full name must contain only alphabetical characters and spaces"
      ),
    email: z.string().email({
      message: "Please enter a valid email address",
    }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/\d/, "Password must contain at least one digit")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

const RegisterForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();

  // 1. Define your form.
  const form = useForm<z.infer<typeof RegisterFormSchema>>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(userData: z.infer<typeof RegisterFormSchema>) {
    try {
      const response = await register(userData).unwrap();

      console.log(response);

      toast.success("User registered successfully");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error while registering user:", err);
      toast.error(`${err?.data?.error || "Registration failed"}`);
    }
  }

  return (
    <div className="flex flex-wrap min-h-screen px-8 py-4 bg-gray-900 items-center justify-center lg:gap-0 sm:gap-4">
      <Form {...form}>
        <div className="w-full h-full max-w-xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl space-y-8 p-8 rounded-l-xl lg:min-h-[656px]">
          <h2 className="text-3xl font-bold text-center text-purple-400">
            Video Tube
          </h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <RegisterFormInput
              name="fullname"
              label="Full Name"
              placeholder="John Doe"
              type="text"
              control={form.control}
              // autoComplete="off"
            />
            <RegisterFormInput
              name="email"
              label="Email"
              placeholder="johndoe@gmail.com"
              type="email"
              control={form.control}
            />
            <RegisterFormInput
              name="password"
              label="Password"
              placeholder="••••••••"
              control={form.control}
              type={isPasswordVisible ? "text" : "password"}
              icon={
                isPasswordVisible ? (
                  <EyeOff
                    className="text-gray-400"
                    onClick={() => setIsPasswordVisible(false)}
                  />
                ) : (
                  <Eye
                    className="text-gray-400"
                    onClick={() => setIsPasswordVisible(true)}
                  />
                )
              }
            />
            <RegisterFormInput
              name="confirmPassword"
              label="Confirm Password"
              placeholder="••••••••"
              control={form.control}
              type={isConfirmPasswordVisible ? "text" : "password"}
              icon={
                isConfirmPasswordVisible ? (
                  <EyeOff
                    className="text-gray-400"
                    onClick={() => setIsConfirmPasswordVisible(false)}
                  />
                ) : (
                  <Eye
                    className="text-gray-400"
                    onClick={() => setIsConfirmPasswordVisible(true)}
                  />
                )
              }
            />
            <Button
              type="submit"
              className="w-full py-3 text-lg font-semibold text-white transition-colors duration-300 bg-purple-600 rounded-lg shadow-lg hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 size={24} className="mr-2 animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          <p className="text-center">
            Already have an Account?
            {"  "}
            <Link to="/login" className="hover:underline text-purple-400">
              Login
            </Link>
          </p>
        </div>
      </Form>

      {/* Right side */}
      <section className="w-full max-w-xl py-8 pl-4 pr-2 space-y-8 text-gray-200 shadow-2xl bg-gradient-to-br from-gray-800 to-gray-900 rounded-r-xl">
        <h1 className="text-3xl font-bold text-center text-purple-400">
          Registration Guidelines
        </h1>
        <p className="text-center text-gray-400">
          Follow these tips to complete your registration without any errors.
        </p>

        {/* Full Name Guidelines */}
        <div className="space-y-2">
          <h2 className="flex items-center text-lg font-semibold text-purple-300">
            <span className="mr-2">🔤</span> Full Name
          </h2>
          <ul className="pl-6 space-y-1 list-disc">
            <li>Only use English alphabets [(a-z) or (A-Z)] and spaces.</li>
            <li>
              Example: <span className="text-purple-400">John Doe</span>
            </li>
          </ul>
        </div>

        {/* Email Guidelines */}
        <div className="space-y-2">
          <h2 className="flex items-center text-lg font-semibold text-purple-300">
            <span className="mr-2">📧</span> Email
          </h2>
          <ul className="pl-6 space-y-1 list-disc">
            <li>Provide an accessible email address for verification.</li>
            <li>
              Use a valid format such as{" "}
              <span className="text-purple-400">you@example.com</span>.
            </li>
            <li>
              Example:{" "}
              <span className="text-purple-400">john.doe@gmail.com</span>
            </li>
          </ul>
        </div>

        {/* Password Guidelines */}
        <div className="space-y-2">
          <h2 className="flex items-center text-lg font-semibold text-purple-300">
            <span className="mr-2">🔒</span> Password
          </h2>
          <ul className="pl-6 space-y-1 list-disc">
            <li>At least 8 characters long.</li>
            <li>Includes at least one uppercase letter.</li>
            <li>Includes at least one lowercase letter.</li>
            <li>Includes at least one digit.</li>
            <li>Includes at least one special character (e.g., @, $, !).</li>
            <li>
              Example: <span className="text-purple-400">Secure@123</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default RegisterForm;

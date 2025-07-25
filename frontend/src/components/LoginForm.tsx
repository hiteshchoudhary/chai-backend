import { useState, useEffect, use } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { toast } from "react-toastify";
import { Form } from "./ui/form";
import { Button } from "./ui/button";
import LoginFormInput from "./LoginFormInput";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "@/slices/usersApiSlice";
import { setUserCredentials, clearLogoutMessage } from "@/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";

export const LoginFormSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const LoginForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [login, { isLoading }] = useLoginMutation();

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { isLoggedIn, user, logoutMessage, accessToken } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (logoutMessage) {
      toast.info(logoutMessage);
    }
    dispatch(clearLogoutMessage());
  }, [logoutMessage, dispatch]);

  // useEffect(() => {
  //   console.log(
  //     "login status: ",
  //     isLoggedIn,
  //     " user: ",
  //     user,
  //     " accessToken: ",
  //     accessToken,
  //     " logoutMessage: ",
  //     logoutMessage
  //   );
  // }, [isLoggedIn, user, accessToken, logoutMessage]);

  // 1. Define your form.
  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof LoginFormSchema>) {
    try {
      const response = await login(values).unwrap();

      dispatch(setUserCredentials(response.data));

      toast.success("Logged In successfully!");
      navigate("/");
    } catch (err) {
      toast.error(err?.data?.error || "Login failed");
      console.error("Error during form submission:", err);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="w-full max-w-lg p-8 bg-gray-800 rounded-lg shadow-2xl">
        <h2 className="mb-6 text-3xl font-bold text-center text-gray-100">
          Welcome to{" "}
          <span className="inline-block text-transparent transition-all delay-100 bg-transparent hover:scale-105 bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            VideoCave!
          </span>
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <LoginFormInput
              type="email"
              name="email"
              label="Email"
              placeholder="Enter your email"
              control={form.control}
              // autoComplete="off"
            />

            <LoginFormInput
              type={isPasswordVisible ? "text" : "password"}
              name="password"
              label="Password"
              placeholder="Enter your password"
              control={form.control}
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

            <div className="flex items-center justify-center mb-6">
              <Link
                to=""
                className="text-md tracking-tight text-blue-400 hover:underline hover:underline-offset-4"
              >
                Forgot password? Reset it here
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full py-3 font-semibold text-white transition duration-300 ease-in-out transform rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-lg text-blue-400 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

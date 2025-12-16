import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { useForm } from "react-hook-form";
import authSchema from "@tepian-k3/schema/auth.schema";
import type z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [type, setType] = useState<"text" | "password">("password");

  const form = useForm<z.infer<typeof authSchema.loginSchema>>({
    resolver: zodResolver(authSchema.loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function handleSubmit(values: z.infer<typeof authSchema.loginSchema>) {
    console.log("Login form submitted with values:", values);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="grid gap-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="ml-1 font-bold text-sm">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="h-10 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="min-h-4 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="ml-1 font-bold text-sm">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Enter your password"
                          type={type}
                          className="h-10 pr-10 text-sm"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => {
                            setType((prev) =>
                              prev === "password" ? "text" : "password"
                            );
                          }}
                        >
                          {type === "password" ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="min-h-4 text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="mt-2 h-10 w-full text-sm"
                // disabled={loginMutation.isPending}
              >
                {/* {loginMutation.isPending ? (
									<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
								) : null} */}
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

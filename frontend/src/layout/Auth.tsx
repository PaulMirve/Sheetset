import Button from "@components/Button";
import Icon from "@components/Icon";
import Input from "@components/Input";
import Typography from "@components/Typography";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { api, ApiError, setToken } from "../api";
import { errorsOf, signInSchema, signUpSchema } from "../forms";
import { hue } from "../hue";

type FieldName = "first_name" | "last_name" | "email" | "password";
type Failure = { field: FieldName; msg: string };

const SERVER_ERRORS: Record<number, Failure> = {
  401: { field: "password", msg: "Email or password is incorrect." },
  403: { field: "email", msg: "This account is inactive." },
  409: {
    field: "email",
    msg: "That email already has an account. Sign in instead.",
  },
};

const Auth = () => {
  const [up, setUp] = useState(false);
  const [error, setError] = useState<Failure | null>(null);
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: (f: Record<FieldName, string>) =>
      api<{ token: string }>(
        up ? "/signup" : "/login",
        up ? f : { email: f.email, password: f.password },
      ),
    onSuccess: ({ token }) => {
      queryClient.clear(); // nothing cached from a previous session
      setToken(token);
    },
    onError: (e) =>
      setError(
        e instanceof ApiError
          ? (SERVER_ERRORS[e.status] ?? { field: "email", msg: e.message })
          : {
              field: "email",
              msg: "Can't reach the server. Check your connection and try again.",
            },
      ),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const r = (up ? signUpSchema : signInSchema).safeParse(
      Object.fromEntries(new FormData(form)),
    );
    if (r.success) {
      setError(null);
      submit.mutate(r.data as Record<FieldName, string>);
      return;
    }
    // One message at a time, on the first invalid field in form order.
    const errors = errorsOf(r.error);
    const field = (
      ["first_name", "last_name", "email", "password"] as const
    ).filter((f) => errors[f])[0];
    setError({ field, msg: errors[field] });
    (form.elements.namedItem(field) as HTMLInputElement).focus();
  };

  const toggle = () => {
    setUp(!up);
    setError(null);
  };

  const err = (field: FieldName) =>
    error?.field === field ? error.msg : undefined;

  return (
    <main className="auth min-h-full grid grid-cols-[minmax(0,420px)] justify-center content-center gap-6 px-4 py-12">
      <div className="flex items-center justify-center gap-3">
        <span className="tile w-11 h-11 rounded-[13px]" style={hue(1)}>
          <Icon name="board" size={24} />
        </span>
        <Typography as="span" variant="brand">
          Sheetset
        </Typography>
      </div>
      <form
        noValidate
        onSubmit={onSubmit}
        className="grid gap-4 p-7 rounded-[20px] bg-surface shadow-lift"
      >
        <div>
          <Typography as="h1" variant="headline">
            {up ? "Create your account" : "Welcome back"}
          </Typography>
          <Typography as="p" color="muted" className="mt-1.5 mb-1">
            {up
              ? "It takes less than a minute."
              : "Sign in to pick up where you left off."}
          </Typography>
        </div>
        {up && (
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <Input
              name="first_name"
              label="First name"
              icon="user"
              autoComplete="given-name"
              placeholder="Ada"
              error={err("first_name")}
            />
            <Input
              name="last_name"
              label="Last name"
              autoComplete="family-name"
              placeholder="Lovelace"
              error={err("last_name")}
            />
          </div>
        )}
        <Input
          name="email"
          type="email"
          label="Email"
          icon="mail"
          autoComplete="email"
          placeholder="you@company.com"
          error={err("email")}
        />
        <Input
          name="password"
          type="password"
          label="Password"
          icon="lock"
          autoComplete={up ? "new-password" : "current-password"}
          placeholder={up ? "At least 8 characters" : "Your password"}
          error={err("password")}
        />
        <Button type="submit" className="h-11" disabled={submit.isPending}>
          {submit.isPending
            ? up
              ? "Creating account…"
              : "Signing in…"
            : up
              ? "Create account"
              : "Sign in"}
          <Icon name="arrow" />
        </Button>
        <Typography color="muted" className="text-center">
          {up ? "Already have an account?" : "New to Sheetset?"}{" "}
          <Typography
            as="button"
            type="button"
            variant="label"
            color="primary"
            onClick={toggle}
            className="inline hover:underline underline-offset-[3px]"
          >
            {up ? "Sign in" : "Create an account"}
          </Typography>
        </Typography>
      </form>
    </main>
  );
};

export default Auth;

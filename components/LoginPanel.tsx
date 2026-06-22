"use client";

import { FormEvent, useState } from "react";
import { ID } from "appwrite";
import { account } from "@/lib/appwrite";

type Mode = "login" | "register";

export function LoginPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "CNR Member");

    try {
      if (mode === "register") {
        await account.create(ID.unique(), email, password, name);
      }
      await account.createEmailPasswordSession(email, password);
      const profile = await account.get();
      setMessage(`Signed in as ${profile.email}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-card">
      <h2>Member Login</h2>
      <p>Use this panel for private member or staff access once your project credentials are connected.</p>
      <form className="login-form" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <label>
            Name
            <input name="name" autoComplete="name" placeholder="CNR member" />
          </label>
        ) : null}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required minLength={8} />
        </label>
        <button disabled={loading} type="submit">
          {loading ? "Working..." : mode === "login" ? "Login" : "Create account"}
        </button>
      </form>
      <p className="form-message">{message}</p>
      <button className="secondary-action" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Need an account?" : "Already have an account?"}
      </button>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GithubUsernameForm() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className="text-sm text-green-400">
        Thanks — we&rsquo;ll email you when your sandbox is ready.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
      <Input
        type="text"
        placeholder="GitHub username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        aria-label="GitHub username"
      />
      <Button
        type="submit"
        disabled={!username.trim()}
        className="bg-[#917eff] text-[#0a0826] hover:bg-[#a89af0] rounded"
      >
        Get access
      </Button>
    </form>
  );
}

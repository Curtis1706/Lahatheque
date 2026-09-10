"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-gold bg-gold/10 px-4 py-3 rounded border border-gold/30">
        <Check className="w-4 h-4 shrink-0" />
        <span>Merci ! Votre inscription a bien été enregistrée.</span>
      </div>
    );
  }

  return (
    <form className="flex flex-col sm:flex-row w-full md:w-auto gap-2" onSubmit={handleSubmit}>
      <input
        className="w-full sm:w-72 md:w-80 h-12 px-4 rounded bg-navy-hover border border-border text-white placeholder:text-white/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
        placeholder="Votre adresse email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button
        className="h-12 px-6 rounded bg-gold text-white font-bold text-sm [@media(hover:hover)]:hover:bg-gold-dark transition-colors whitespace-nowrap"
        type="submit"
      >
        S&apos;abonner
      </button>
    </form>
  );
}

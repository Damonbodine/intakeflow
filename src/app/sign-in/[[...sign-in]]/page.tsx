"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";

function getRedirectUrl() {
  if (typeof window === "undefined") {
    return "/dashboard";
  }

  const hash = window.location.hash.replace(/^#\/?\??/, "");
  const params = new URLSearchParams(hash);
  const redirect = params.get("redirect");

  if (redirect && redirect.startsWith("/")) {
    return redirect;
  }

  return "/dashboard";
}

export default function SignInPage() {
  const [redirectUrl, setRedirectUrl] = useState(getRedirectUrl);

  useEffect(() => {
    setRedirectUrl(getRedirectUrl());
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
      />
    </div>
  );
}

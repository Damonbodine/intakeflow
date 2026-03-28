"use client";

import type { ReadonlyURLSearchParams } from "next/navigation";

export function withPreservedDemoQuery(
  href: string,
  searchParams: ReadonlyURLSearchParams,
) {
  const demo = searchParams.get("demo");
  const step = searchParams.get("step");

  if (!demo) {
    return href;
  }

  const url = new URL(href, "https://demo.local");
  url.searchParams.set("demo", demo);

  if (step) {
    url.searchParams.set("step", step);
  }

  return `${url.pathname}${url.search}`;
}

"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const clients = useQuery(api.clients.search, query.length >= 2 ? { query: query } : "skip");
  return (<div><h1 className="text-2xl font-bold mb-6">Search</h1>
    <Input placeholder="Search clients by name or phone..." value={query} onChange={e => setQuery(e.target.value)} className="max-w-md mb-6"/>
    {clients && clients.length > 0 && (<Card><CardHeader><CardTitle>Clients ({clients.length})</CardTitle></CardHeader><CardContent className="space-y-2">
      {clients.map((c: any) => (<Link key={c._id} href={"/clients/"+c._id} className="block p-2 hover:bg-muted rounded-md">{c.firstName} {c.lastName} — {c.phone}</Link>))}
    </CardContent></Card>)}
    {clients && clients.length === 0 && query.length >= 2 && <p className="text-muted-foreground">No results found.</p>}
  </div>);
}

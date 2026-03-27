"use client";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClientForm() {
  const create = useMutation(api.clients.create);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await create({
        firstName: fd.get("firstName") as string,
        lastName: fd.get("lastName") as string,
        phone: (fd.get("phone") as string) || undefined,
        email: (fd.get("email") as string) || undefined,
        dateOfBirth: (fd.get("dateOfBirth") as string) || undefined,
        address: (fd.get("address") as string) || undefined,
      });
      router.push("/clients");
    } finally { setIsSubmitting(false); }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader><CardTitle>Register New Client</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" required /></div>
            <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="dateOfBirth">Date of Birth</Label><Input id="dateOfBirth" name="dateOfBirth" type="date" /></div>
          <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" name="address" /></div>
          <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? "Registering..." : "Register Client"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

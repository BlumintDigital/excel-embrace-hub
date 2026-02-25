import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateClient, useUpdateClient } from "@/hooks/use-supabase-mutations";
import type { DbClient } from "@/hooks/use-supabase-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: DbClient | null;
}

export default function ClientDialog({ open, onOpenChange, client }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [notes, setNotes] = useState("");

  const create = useCreateClient();
  const update = useUpdateClient();
  const isEdit = !!client;

  useEffect(() => {
    if (client) {
      setName(client.name);
      setEmail(client.email || "");
      setPhone(client.phone || "");
      setAddress(client.address || "");
      setContactPerson(client.contact_person || "");
      setNotes(client.notes || "");
    } else {
      setName(""); setEmail(""); setPhone(""); setAddress(""); setContactPerson(""); setNotes("");
    }
  }, [client, open]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const data = {
      name: trimmed,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      contact_person: contactPerson.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    if (isEdit) {
      await update.mutateAsync({ id: client!.id, ...data });
    } else {
      await create.mutateAsync(data);
    }
    onOpenChange(false);
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Client" : "New Client"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client / company name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
            </div>
          </div>
          <div>
            <Label>Key Contact Person</Label>
            <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Full name of primary contact" />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, state/province, country" rows={2} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional details..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

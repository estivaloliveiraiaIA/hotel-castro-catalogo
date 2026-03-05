import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, Upload, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdminApi } from "@/hooks/useAdminApi";

interface Partner {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  website: string | null;
  category: string;
  discount_info: string | null;
  is_active: boolean;
}

const emptyPartner: Omit<Partner, "id"> = {
  name: "",
  description: "",
  logo_url: null,
  website: null,
  category: "",
  discount_info: null,
  is_active: true,
};

export default function AdminPartners() {
  const api = useAdminApi();
  const fileRef = useRef<HTMLInputElement>(null);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<Omit<Partner, "id">>(emptyPartner);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<Partner[]>("/api/admin/partners")
      .then(setPartners)
      .catch(() => setError("Falha ao carregar parceiros"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPartner);
    setDialogOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({ ...p });
    setDialogOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const url = await api.uploadImage(file);
      setForm((f) => ({ ...f, logo_url: url }));
    } catch {
      setError("Falha ao enviar logo");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        const updated = await api.put<Partner>("/api/admin/partners", { id: editing.id, ...form });
        setPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await api.post<Partner>("/api/admin/partners", form);
        setPartners((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover parceiro "${name}"?`)) return;
    try {
      await api.del(`/api/admin/partners?id=${id}`);
      setPartners((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Falha ao remover parceiro");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Parceiros</h1>
          <p className="text-muted-foreground text-sm">{partners.length} parceiros cadastrados</p>
        </div>
        <Button onClick={openCreate} className="">
          <Plus className="w-4 h-4 mr-2" />
          Novo Parceiro
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-4 py-3 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground/60 text-sm text-center py-12">Carregando...</p>
      ) : partners.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/60">
          <Handshake className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum parceiro cadastrado</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Adicionar primeiro parceiro
          </Button>
        </div>
      ) : (
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Parceiro</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vantagem</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt=""
                          className="w-8 h-8 rounded object-contain bg-gray-100"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center">
                          <span className="text-amber-600 font-bold text-xs">
                            {partner.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{partner.name}</p>
                        {partner.website && (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            {partner.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{partner.category}</td>
                  <td className="px-4 py-3">
                    {partner.discount_info ? (
                      <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                        {partner.discount_info}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={partner.is_active ? "default" : "secondary"} className="text-xs">
                      {partner.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(partner)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(partner.id, partner.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nome">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Categoria">
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Restaurante, Spa, Transporte..."
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>
            <Field label="Vantagem / Desconto para hóspedes">
              <Input
                value={form.discount_info || ""}
                onChange={(e) => setForm((f) => ({ ...f, discount_info: e.target.value || null }))}
                placeholder="10% de desconto com cartão do hotel"
              />
            </Field>
            <Field label="Site">
              <Input
                type="url"
                value={form.website || ""}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value || null }))}
                placeholder="https://..."
              />
            </Field>
            <Field label="Logo">
              <div className="space-y-2">
                {form.logo_url && (
                  <img
                    src={form.logo_url}
                    alt=""
                    className="h-16 object-contain rounded border border-border p-2"
                  />
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="URL do logo"
                    value={form.logo_url || ""}
                    onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value || null }))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingImg}
                    className="shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
                {uploadingImg && <p className="text-xs text-muted-foreground/60">Enviando logo...</p>}
              </div>
            </Field>
            <div className="flex items-center justify-between">
              <Label>Ativo (visível no app)</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

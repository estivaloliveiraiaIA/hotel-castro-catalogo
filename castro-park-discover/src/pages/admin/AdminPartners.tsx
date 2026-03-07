import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Handshake, Search } from "lucide-react";
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

interface PlaceRef {
  id: string;
  name: string;
  category: string;
}

interface Partner {
  id: number;
  place_id: string;
  badge_label: string;
  deal_description: string;
  is_active: boolean;
  places?: PlaceRef;
}

const emptyForm = {
  place_id: "",
  badge_label: "",
  deal_description: "",
  is_active: true,
};

export default function AdminPartners() {
  const api = useAdminApi();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [allPlaces, setAllPlaces] = useState<PlaceRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [placeSearch, setPlaceSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Partner[]>("/api/admin/partners"),
      api.get<PlaceRef[]>("/api/admin/places").then((data) =>
        data.map((p: any) => ({ id: p.id, name: p.name, category: p.category }))
      ),
    ])
      .then(([p, places]) => {
        setPartners(p);
        setAllPlaces(places);
      })
      .catch(() => setError("Falha ao carregar dados"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filteredPlaces = allPlaces.filter((p) =>
    p.name.toLowerCase().includes(placeSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(placeSearch.toLowerCase())
  ).slice(0, 80);

  const selectedPlace = allPlaces.find((p) => p.id === form.place_id);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPlaceSearch("");
    setDialogOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({
      place_id: p.place_id,
      badge_label: p.badge_label,
      deal_description: p.deal_description,
      is_active: p.is_active,
    });
    setPlaceSearch(p.places?.name || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.place_id) { setError("Selecione um lugar"); return; }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        const updated = await api.put<Partner>("/api/admin/partners", { id: editing.id, ...form });
        setPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await api.post<Partner>("/api/admin/partners", form);
        setPartners((prev) => [...prev, created]);
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name?: string) => {
    if (!confirm(`Remover parceiro "${name || id}"?`)) return;
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
        <Button onClick={openCreate}>
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lugar</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Badge</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vantagem</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{partner.places?.name ?? partner.place_id}</p>
                    {partner.places?.category && (
                      <p className="text-xs text-muted-foreground">{partner.places.category}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {partner.badge_label ? (
                      <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                        {partner.badge_label}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs line-clamp-2">
                    {partner.deal_description || <span className="opacity-40">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={partner.is_active ? "default" : "secondary"} className="text-xs">
                      {partner.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(partner)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(partner.id, partner.places?.name)}
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

            {/* Place selector */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Lugar vinculado</Label>
              {selectedPlace && (
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs mb-1">
                  <span className="font-medium text-amber-800">{selectedPlace.name}</span>
                  <span className="text-amber-600 ml-1">({selectedPlace.category})</span>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                <Input
                  className="pl-8 text-sm"
                  placeholder="Buscar lugar pelo nome..."
                  value={placeSearch}
                  onChange={(e) => {
                    setPlaceSearch(e.target.value);
                    if (!e.target.value) setForm((f) => ({ ...f, place_id: "" }));
                  }}
                />
              </div>
              {placeSearch && !selectedPlace && (
                <div className="border border-border rounded-md max-h-48 overflow-y-auto bg-background shadow-sm">
                  {filteredPlaces.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 px-3 py-2">Nenhum lugar encontrado</p>
                  ) : (
                    filteredPlaces.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 border-b border-border/40 last:border-0"
                        onClick={() => {
                          setForm((f) => ({ ...f, place_id: p.id }));
                          setPlaceSearch(p.name);
                        }}
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{p.category}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Badge / Etiqueta</Label>
              <Input
                value={form.badge_label}
                onChange={(e) => setForm((f) => ({ ...f, badge_label: e.target.value }))}
                placeholder="Ex: Parceiro, Exclusivo, Destaque"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Vantagem / Descrição do acordo</Label>
              <Textarea
                rows={3}
                value={form.deal_description}
                onChange={(e) => setForm((f) => ({ ...f, deal_description: e.target.value }))}
                placeholder="Ex: 10% de desconto apresentando cartão do hotel"
              />
            </div>

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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.place_id}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

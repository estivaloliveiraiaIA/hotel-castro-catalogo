import { useEffect, useState, useRef } from "react";
import { Search, Plus, Pencil, Trash2, Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdminApi } from "@/hooks/useAdminApi";

interface Place {
  id: string;
  name: string;
  category: string;
  subcategories: string[];
  description: string;
  image: string | null;
  address: string;
  phone?: string;
  website?: string;
  price_level?: number;
  hotel_recommended: boolean;
  hotel_score?: number;
  is_active: boolean;
  rating?: number;
}

const emptyPlace: Omit<Place, "id"> = {
  name: "",
  category: "",
  subcategories: [],
  description: "",
  image: null,
  address: "",
  phone: "",
  website: "",
  price_level: undefined,
  hotel_recommended: false,
  hotel_score: undefined,
  is_active: true,
  rating: undefined,
};

export default function AdminPlaces() {
  const api = useAdminApi();
  const fileRef = useRef<HTMLInputElement>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [form, setForm] = useState<Omit<Place, "id">>(emptyPlace);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<Place[]>("/api/admin/places")
      .then(setPlaces)
      .catch(() => setError("Falha ao carregar lugares"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = places.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPlace);
    setDialogOpen(true);
  };

  const openEdit = (p: Place) => {
    setEditing(p);
    setForm({ ...p });
    setDialogOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const url = await api.uploadImage(file);
      setForm((f) => ({ ...f, image: url }));
    } catch {
      setError("Falha ao enviar imagem");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        const updated = await api.put<Place>("/api/admin/places", { id: editing.id, ...form });
        setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await api.post<Place>("/api/admin/places", form);
        setPlaces((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover "${name}"?`)) return;
    try {
      await api.del(`/api/admin/places?id=${id}`);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Falha ao remover lugar");
    }
  };

  const toggleRecommended = async (place: Place) => {
    try {
      const updated = await api.put<Place>("/api/admin/places", {
        id: place.id,
        hotel_recommended: !place.hotel_recommended,
      });
      setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      setError("Falha ao atualizar");
    }
  };

  const toggleActive = async (place: Place) => {
    try {
      const updated = await api.put<Place>("/api/admin/places", {
        id: place.id,
        is_active: !place.is_active,
      });
      setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      setError("Falha ao atualizar");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lugares</h1>
          <p className="text-gray-500 text-sm">{places.length} lugares cadastrados</p>
        </div>
        <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Lugar
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-4 py-3 mb-4">
          {error}
        </p>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-12">Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Categoria</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Recomendado</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Score</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Ativo</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((place) => (
                  <tr key={place.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {place.image && (
                          <img
                            src={place.image}
                            alt=""
                            className="w-8 h-8 rounded object-cover shrink-0"
                          />
                        )}
                        <span className="font-medium text-gray-800 line-clamp-1">{place.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{place.category}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleRecommended(place)}>
                        <Star
                          className={`w-5 h-5 mx-auto ${
                            place.hotel_recommended
                              ? "text-amber-500 fill-amber-500"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {place.hotel_score != null ? (
                        <Badge variant="outline" className="text-xs">
                          {place.hotel_score}
                        </Badge>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={place.is_active}
                        onCheckedChange={() => toggleActive(place)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEdit(place)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(place.id, place.name)}
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
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-12">Nenhum lugar encontrado</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Lugar" : "Novo Lugar"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nome">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Categoria">
              <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </Field>
            <Field label="Descrição">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>
            <Field label="Endereço">
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone">
                <Input value={form.phone || ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </Field>
              <Field label="Site">
                <Input value={form.website || ""} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Score do hotel (1-100)">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.hotel_score ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, hotel_score: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </Field>
              <Field label="Nível de preço (1-4)">
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={form.price_level ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, price_level: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </Field>
            </div>
            <Field label="Imagem">
              <div className="space-y-2">
                {form.image && (
                  <img src={form.image} alt="" className="w-full h-32 object-cover rounded-md" />
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="URL da imagem"
                    value={form.image || ""}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
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
                {uploadingImg && <p className="text-xs text-gray-400">Enviando imagem...</p>}
              </div>
            </Field>
            <div className="flex items-center justify-between">
              <Label>Recomendado pelo hotel</Label>
              <Switch
                checked={form.hotel_recommended}
                onCheckedChange={(v) => setForm((f) => ({ ...f, hotel_recommended: v }))}
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700"
            >
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
      <Label className="text-xs text-gray-500">{label}</Label>
      {children}
    </div>
  );
}

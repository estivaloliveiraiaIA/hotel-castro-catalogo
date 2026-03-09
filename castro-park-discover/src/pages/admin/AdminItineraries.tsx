import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, Upload, MapPin, ChevronUp, ChevronDown, X, Eye, EyeOff } from "lucide-react";
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

interface ItineraryStop {
  id?: string;
  place_id: string;
  order_index: number;
  note?: string;
  suggested_time?: string;
  places?: { id: string; name: string };
}

interface Itinerary {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  cover_image: string;
  duration: string;
  best_time: string;
  profile: string;
  tips: string[];
  is_active: boolean;
  itinerary_places?: ItineraryStop[];
}

type ItineraryForm = Omit<Itinerary, "id" | "itinerary_places"> & {
  places: Array<{ place_id: string; note: string; suggested_time: string; order_index: number }>;
};

const emptyForm: ItineraryForm = {
  title: "",
  subtitle: "",
  icon: "",
  cover_image: "",
  duration: "",
  best_time: "",
  profile: "",
  tips: [],
  is_active: true,
  places: [],
};

export default function AdminItineraries() {
  const api = useAdminApi();
  const fileRef = useRef<HTMLInputElement>(null);

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Itinerary | null>(null);
  const [form, setForm] = useState<ItineraryForm>(emptyForm);
  const [tipsText, setTipsText] = useState("");
  const [newStop, setNewStop] = useState({ place_id: "", note: "", suggested_time: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState("");
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const load = () => {
    setLoading(true);
    api
      .get<Itinerary[]>("/api/admin/itineraries")
      .then(setItineraries)
      .catch(() => setError("Falha ao carregar roteiros"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setTipsText("");
    setDialogOpen(true);
  };

  const openEdit = (it: Itinerary) => {
    setEditing(it);
    const stops = (it.itinerary_places || [])
      .sort((a, b) => a.order_index - b.order_index)
      .map((p, i) => ({
        place_id: p.place_id,
        note: p.note || "",
        suggested_time: p.suggested_time || "",
        order_index: i,
      }));
    setForm({
      title: it.title,
      subtitle: it.subtitle,
      icon: it.icon || "",
      cover_image: it.cover_image || "",
      duration: it.duration || "",
      best_time: it.best_time || "",
      profile: it.profile || "",
      tips: it.tips || [],
      is_active: it.is_active,
      places: stops,
    });
    setTipsText((it.tips || []).join("\n"));
    setDialogOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const url = await api.uploadImage(file);
      setForm((f) => ({ ...f, cover_image: url }));
    } catch {
      setError("Falha ao enviar imagem");
    } finally {
      setUploadingImg(false);
    }
  };

  const addStop = () => {
    if (!newStop.place_id.trim()) return;
    setForm((f) => ({
      ...f,
      places: [
        ...f.places,
        { ...newStop, order_index: f.places.length },
      ],
    }));
    setNewStop({ place_id: "", note: "", suggested_time: "" });
  };

  const removeStop = (idx: number) => {
    setForm((f) => ({
      ...f,
      places: f.places.filter((_, i) => i !== idx).map((p, i) => ({ ...p, order_index: i })),
    }));
  };

  const moveStop = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= form.places.length) return;
    const arr = [...form.places];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setForm((f) => ({ ...f, places: arr.map((p, i) => ({ ...p, order_index: i })) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const tips = tipsText.split("\n").map((t) => t.trim()).filter(Boolean);
    const payload = { ...form, tips, places: form.places };
    try {
      if (editing) {
        await api.put<Itinerary>("/api/admin/itineraries", { id: editing.id, ...payload });
      } else {
        await api.post<Itinerary>("/api/admin/itineraries", payload);
      }
      await load();
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (it: Itinerary) => {
    setTogglingIds((prev) => new Set(prev).add(it.id));
    try {
      await api.put<Itinerary>("/api/admin/itineraries", {
        id: it.id,
        is_active: !it.is_active,
      });
      setItineraries((prev) =>
        prev.map((x) => (x.id === it.id ? { ...x, is_active: !it.is_active } : x))
      );
    } catch {
      setError("Falha ao alterar status do roteiro");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(it.id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remover roteiro "${title}"?`)) return;
    try {
      await api.del(`/api/admin/itineraries?id=${id}`);
      setItineraries((prev) => prev.filter((it) => it.id !== id));
    } catch {
      setError("Falha ao remover roteiro");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Roteiros</h1>
          <p className="text-muted-foreground text-sm">{itineraries.length} roteiros cadastrados</p>
        </div>
        <Button onClick={openCreate} className="">
          <Plus className="w-4 h-4 mr-2" />
          Novo Roteiro
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-4 py-3 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground/60 text-sm text-center py-12">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {itineraries.map((it) => (
            <div
              key={it.id}
              className="bg-background rounded-lg border border-border p-4 flex items-start gap-4"
            >
              {it.cover_image && (
                <img
                  src={it.cover_image}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{it.icon}</span>
                  <span className="font-semibold text-foreground">{it.title}</span>
                  <Badge variant={it.is_active ? "default" : "secondary"} className="text-xs">
                    {it.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{it.subtitle}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                  <span>{it.duration}</span>
                  <span>·</span>
                  <span>{it.profile}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {(it.itinerary_places || []).length} paradas
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${it.is_active ? "text-green-500 hover:text-green-700" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  onClick={() => handleToggle(it)}
                  disabled={togglingIds.has(it.id)}
                  title={it.is_active ? "Desativar roteiro" : "Ativar roteiro"}
                >
                  {it.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(it)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(it.id, it.title)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Roteiro" : "Novo Roteiro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-4 gap-3">
              <Field label="Ícone (emoji)">
                <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="🌆" />
              </Field>
              <div className="col-span-3">
                <Field label="Título">
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </Field>
              </div>
            </div>
            <Field label="Subtítulo">
              <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Duração">
                <Input value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="Meio dia" />
              </Field>
              <Field label="Melhor horário">
                <Input value={form.best_time} onChange={(e) => setForm((f) => ({ ...f, best_time: e.target.value }))} placeholder="Manhã" />
              </Field>
              <Field label="Perfil">
                <Input value={form.profile} onChange={(e) => setForm((f) => ({ ...f, profile: e.target.value }))} placeholder="Família" />
              </Field>
            </div>
            <Field label="Imagem de capa">
              <div className="space-y-2">
                {form.cover_image && (
                  <img src={form.cover_image} alt="" className="w-full h-28 object-cover rounded-md" />
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="URL da imagem"
                    value={form.cover_image}
                    onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
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
                {uploadingImg && <p className="text-xs text-muted-foreground/60">Enviando...</p>}
              </div>
            </Field>
            <Field label="Dicas do concierge (uma por linha)">
              <Textarea
                rows={3}
                value={tipsText}
                onChange={(e) => setTipsText(e.target.value)}
                placeholder="Reserve com antecedência nos fins de semana"
              />
            </Field>

            {/* Stops section */}
            <div>
              <Label className="text-xs text-muted-foreground block mb-2">Paradas do roteiro</Label>
              <div className="space-y-2 mb-3">
                {form.places.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                    <span className="text-xs font-bold text-amber-600 w-5">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{stop.place_id}</p>
                      <p className="text-xs text-muted-foreground/60">
                        {stop.suggested_time && `${stop.suggested_time} · `}
                        {stop.note}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveStop(idx, -1)}
                        disabled={idx === 0}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveStop(idx, 1)}
                        disabled={idx === form.places.length - 1}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                        onClick={() => removeStop(idx)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Adicionar parada</p>
                <Input
                  placeholder="ID do lugar (ex: ChIJ...)"
                  value={newStop.place_id}
                  onChange={(e) => setNewStop((s) => ({ ...s, place_id: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Horário sugerido (ex: 12h)"
                    value={newStop.suggested_time}
                    onChange={(e) => setNewStop((s) => ({ ...s, suggested_time: e.target.value }))}
                  />
                  <Input
                    placeholder="Nota / observação"
                    value={newStop.note}
                    onChange={(e) => setNewStop((s) => ({ ...s, note: e.target.value }))}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStop}
                  disabled={!newStop.place_id.trim()}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>
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

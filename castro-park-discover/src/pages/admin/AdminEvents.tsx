import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, Upload, Calendar, ExternalLink, Sparkles, Link, Languages } from "lucide-react";
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

interface Event {
  id: string;
  title: string;
  description: string;
  address: string;
  category: string;
  image: string | null;
  start_date: string;
  end_date: string | null;
  link: string | null;
  is_active: boolean;
}

const emptyEvent: Omit<Event, "id"> = {
  title: "",
  description: "",
  address: "",
  category: "",
  image: null,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: null,
  link: null,
  is_active: true,
};

export default function AdminEvents() {
  const api = useAdminApi();
  const fileRef = useRef<HTMLInputElement>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState<Omit<Event, "id">>(emptyEvent);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState("");

  // ── Importação por URL ────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<Event[]>("/api/admin/events")
      .then(setEvents)
      .catch(() => setError("Falha ao carregar eventos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyEvent);
    setDialogOpen(true);
  };

  const openImport = () => {
    setImportUrl("");
    setImportError("");
    setImportOpen(true);
  };

  const handleImport = async () => {
    if (!importUrl.trim()) { setImportError("Cole uma URL válida"); return; }
    setImporting(true);
    setImportError("");
    try {
      const data = await api.post<Omit<Event, "id">>("/api/admin/scrape-event", { url: importUrl.trim() });
      setImportOpen(false);
      setEditing(null);
      setForm({ ...emptyEvent, ...data });
      setDialogOpen(true);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Falha ao importar");
    } finally {
      setImporting(false);
    }
  };

  const openEdit = (ev: Event) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description,
      address: ev.address,
      category: ev.category,
      image: ev.image,
      start_date: ev.start_date?.slice(0, 10) ?? "",
      end_date: ev.end_date?.slice(0, 10) ?? null,
      link: ev.link,
      is_active: ev.is_active,
    });
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
        const updated = await api.put<Event>("/api/admin/events", { id: editing.id, ...form });
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await api.post<Event>("/api/admin/events", form);
        setEvents((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleTranslate = async () => {
    if (!form.title && !form.description) return;
    setTranslating(true);
    setError("");
    try {
      const fields: Record<string, string> = {};
      if (form.title) fields.title = form.title;
      if (form.description) fields.description = form.description;
      const result = await api.post<Record<string, string>>("/api/admin/translate", { fields });
      setForm((f) => ({
        ...f,
        ...(result.title ? { title: result.title } : {}),
        ...(result.description ? { description: result.description } : {}),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao traduzir");
    } finally {
      setTranslating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remover "${title}"?`)) return;
    try {
      await api.del(`/api/admin/events?id=${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Falha ao remover evento");
    }
  };

  const formatDate = (str: string | null) => {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const isExpired = (ev: Event) => {
    const ref = ev.end_date || ev.start_date;
    return ref ? new Date(ref) < new Date(new Date().toDateString()) : false;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Eventos</h1>
          <p className="text-muted-foreground text-sm">{events.length} eventos cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openImport} className="border-amber-300 text-amber-700 hover:bg-amber-50">
            <Sparkles className="w-4 h-4 mr-2" />Importar com IA
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-4 py-3 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground/60 text-sm text-center py-12">Carregando...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/60">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum evento cadastrado</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Adicionar primeiro evento
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-background rounded-lg border border-border p-4 flex items-start gap-4"
            >
              {ev.image && (
                <img
                  src={ev.image}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{ev.title}</span>
                  {isExpired(ev) ? (
                    <Badge variant="secondary" className="text-xs text-muted-foreground">Encerrado</Badge>
                  ) : (
                    <Badge variant={ev.is_active ? "default" : "secondary"} className="text-xs">
                      {ev.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{ev.description}</p>
                <p className="text-xs text-muted-foreground/60">
                  {formatDate(ev.start_date)}
                  {ev.end_date && ` → ${formatDate(ev.end_date)}`}
                  {ev.address && ` · ${ev.address}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href="https://hotel-castro-catalogo-seven.vercel.app/events"
                  target="_blank"
                  rel="noreferrer"
                  title="Ver eventos no app"
                  className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-muted text-muted-foreground/50 hover:text-hotel-gold transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(ev)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(ev.id, ev.title)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog importar com IA */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Importar Evento com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
              Cole o link do evento — Sympla, site de shows, página de teatro ou qualquer página. A IA vai extrair automaticamente título, datas, local, descrição e categoria.
            </div>
            <Field label="Link do evento">
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  className="pl-9"
                  placeholder="https://sympla.com.br/... ou qualquer URL de evento"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !importing) handleImport(); }}
                  disabled={importing}
                />
              </div>
            </Field>
            {importing && (
              <div className="flex items-center gap-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Importando dados e gerando descrição com IA... pode levar até 20 segundos.</span>
              </div>
            )}
            {importError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">{importError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>Cancelar</Button>
            <Button onClick={handleImport} disabled={importing || !importUrl.trim()} className="bg-amber-600 hover:bg-amber-700">
              {importing ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Título">
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
            <Field label="Descrição">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Local / Endereço">
                <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </Field>
              <Field label="Categoria">
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="ex: Música, Cultura..."
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data de início">
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </Field>
              <Field label="Data de término">
                <Input
                  type="date"
                  value={form.end_date || ""}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value || null }))}
                />
              </Field>
            </div>
            <Field label="Link (site do evento)">
              <Input
                type="url"
                value={form.link || ""}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value || null }))}
                placeholder="https://..."
              />
            </Field>
            <Field label="Imagem">
              <div className="space-y-2">
                {form.image && (
                  <img src={form.image} alt="" className="w-full h-32 object-cover rounded-md" />
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="URL da imagem"
                    value={form.image || ""}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value || null }))}
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
                {uploadingImg && <p className="text-xs text-muted-foreground/60">Enviando imagem...</p>}
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
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              variant="outline"
              onClick={handleTranslate}
              disabled={translating || (!form.title && !form.description)}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 mr-auto"
              title="Traduz título e descrição para EN e ES via DeepL"
            >
              <Languages className="w-4 h-4 mr-2" />
              {translating ? "Traduzindo..." : "Traduzir EN+ES"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
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

import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Search, Plus, Pencil, Trash2, Star, Upload, ChevronLeft, ChevronRight, ExternalLink, X, ImagePlus, Sparkles, Link, ShieldAlert, Languages } from "lucide-react";
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

// ─── Taxonomia de categorias e subcategorias ───────────────────────────────
const CATEGORIES: { value: string; label: string }[] = [
  { value: "restaurants", label: "Restaurantes" },
  { value: "cafes",       label: "Cafés & Padarias" },
  { value: "nightlife",   label: "Vida Noturna" },
  { value: "nature",      label: "Natureza" },
  { value: "attractions", label: "Atrações" },
  { value: "culture",     label: "Cultura" },
  { value: "shopping",    label: "Compras" },
];

const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  restaurants: [
    "Italiana", "Japonesa", "Brasileira", "Típica Goiana", "Alta Gastronomia", "Churrascaria", "Hambúrguer",
    "Pizza", "Contemporânea", "Frutos do mar", "Vegetariana/Vegana",
    "Árabe", "Peruana", "Francesa", "Fast food", "Self service", "Rodízio", "Buffet",
  ],
  cafes: [
    "Café colonial", "Café especial", "Padaria", "Confeitaria",
    "Brunch", "Açaí", "Sorvetes", "Doces e bolos",
  ],
  nightlife: [
    "Bar", "Pub", "Balada", "Karaokê", "Rooftop", "Boteco", "Clube", "Jazz bar", "Happy hour",
  ],
  nature: [
    "Parque", "Lago", "Trilha", "Cachoeira", "Jardim botânico",
    "Reserva ecológica", "Praça", "Área verde",
  ],
  attractions: [
    "Museu", "Zoológico", "Aquário", "Parque temático",
    "Mirante", "Ponto histórico", "Memorial", "Passeio guiado",
  ],
  culture: [
    "Teatro", "Cinema", "Galeria de arte", "Centro cultural",
    "Exposição", "Show", "Música ao vivo", "Dança",
  ],
  shopping: [
    "Shopping center", "Mercado", "Outlet", "Mercado municipal",
    "Feira", "Loja de roupas", "Loja de presentes", "Artesanato",
  ],
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface Place {
  id: string;
  name: string;
  category: string;
  subcategories: string[];
  tags: string[];
  description: string;
  image: string | null;
  gallery?: string[];
  gallery_count?: number;
  address: string;
  phone?: string;
  website?: string;
  menu_url?: string;
  price_level?: number;
  hotel_recommended: boolean;
  hotel_score?: number;
  is_active: boolean;
  rating?: number;
  hours?: string;
  distance_km?: number;
}

const emptyPlace: Omit<Place, "id"> = {
  name: "", category: "", subcategories: [], tags: [],
  description: "", image: null, gallery: [],
  address: "", phone: "", website: "", menu_url: "",
  price_level: undefined, hotel_recommended: false,
  hotel_score: undefined, is_active: true, rating: undefined, hours: "",
  distance_km: undefined,
};

const APP_URL = "https://hotel-castro-catalogo-seven.vercel.app";
const PAGE_SIZE = 50;

// ── Calcula QA Score de 0-100 por lugar ───────────────────────────────────
function calcQaScore(p: Place): number {
  let score = 0;
  if (p.image) score += 20;
  const gc = p.gallery_count ?? (Array.isArray(p.gallery) ? p.gallery.length : 0);
  if (gc >= 3) score += 20;
  else if (gc >= 1) score += 10;
  if (p.description && p.description.length >= 50) score += 20;
  if (p.hours) score += 20;
  if (p.website) score += 10;
  if (p.menu_url) score += 10;
  return score;
}

function QaBadge({ score }: { score: number }) {
  const cfg =
    score >= 90 ? { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" } :
    score >= 70 ? { bg: "bg-blue-100",  text: "text-blue-700",  border: "border-blue-300" } :
    score >= 50 ? { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" } :
                  { bg: "bg-red-100",   text: "text-red-700",   border: "border-red-300" };
  return (
    <span className={`inline-flex items-center justify-center w-9 h-6 rounded text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {score}
    </span>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function AdminPlaces() {
  const api = useAdminApi();
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [recommendedFilter, setRecommendedFilter] = useState("");
  const [qaFilter, setQaFilter] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("qa") === "low" ? "low" : "";
  });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [form, setForm] = useState<Omit<Place, "id">>(emptyPlace);
  const [galleryInput, setGalleryInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [error, setError] = useState("");

  // ── Importação por URL ────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const load = () => {
    setLoading(true);
    api.get<Place[]>("/api/admin/places")
      .then(setPlaces)
      .catch(() => setError("Falha ao carregar lugares"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── Filtros ──────────────────────────────────────────────────────────────
  const filtered = places.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesActive =
      !activeFilter ||
      (activeFilter === "active" && p.is_active) ||
      (activeFilter === "inactive" && !p.is_active);
    const matchesRecommended =
      !recommendedFilter ||
      (recommendedFilter === "yes" && p.hotel_recommended) ||
      (recommendedFilter === "no" && !p.hotel_recommended);
    const qa = calcQaScore(p);
    const matchesQa =
      !qaFilter ||
      (qaFilter === "low"       && qa < 70) ||
      (qaFilter === "critical"  && qa < 50) ||
      (qaFilter === "regular"   && qa >= 50 && qa < 70) ||
      (qaFilter === "good"      && qa >= 70 && qa < 90) ||
      (qaFilter === "excellent" && qa >= 90);
    return matchesSearch && matchesCategory && matchesActive && matchesRecommended && matchesQa;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasFilters = !!(search || categoryFilter || activeFilter || recommendedFilter || qaFilter);

  const resetFilters = () => {
    setSearch(""); setCategoryFilter(""); setActiveFilter(""); setRecommendedFilter(""); setQaFilter(""); setPage(0);
  };

  // ── Bulk actions ─────────────────────────────────────────────────────────
  const toggleSelect = (id: string) =>
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleSelectAll = () =>
    setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((p) => p.id)));

  const bulkUpdate = async (patch: Partial<Place>) => {
    setBulkLoading(true);
    setError("");
    try {
      const results = await Promise.allSettled(
        Array.from(selected).map((id) => api.put<Place>("/api/admin/places", { id, ...patch }))
      );
      const succeeded = results
        .filter((r): r is PromiseFulfilledResult<Place> => r.status === "fulfilled")
        .map((r) => r.value);
      const failCount = results.filter((r) => r.status === "rejected").length;
      if (succeeded.length > 0) {
        setPlaces((prev) => prev.map((p) => succeeded.find((u) => u.id === p.id) ?? p));
      }
      if (failCount > 0) {
        setError(`${failCount} atualização(ões) falharam. ${succeeded.length} realizadas com sucesso.`);
      }
      setSelected(new Set());
    } catch {
      setError("Falha na ação em massa");
    } finally {
      setBulkLoading(false);
    }
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(emptyPlace);
    setGalleryInput("");
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
      const data = await api.post<Omit<Place, "id">>("/api/admin/scrape-place", { url: importUrl.trim() });
      setImportOpen(false);
      setEditing(null);
      setForm({ ...emptyPlace, ...data, gallery: [], subcategories: data.subcategories || [], tags: data.tags || [] });
      setGalleryInput("");
      setDialogOpen(true);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Falha ao importar");
    } finally {
      setImporting(false);
    }
  };

  const openEdit = async (p: Place) => {
    // Busca dados completos (incluindo gallery) antes de abrir o dialog
    setLoadingEditId(p.id);
    let full = p;
    try {
      full = await api.get<Place>(`/api/admin/places?id=${p.id}`);
    } catch {
      // fallback: usa dados da lista (gallery será vazio)
    } finally {
      setLoadingEditId(null);
    }
    setEditing(full);
    setForm({ ...full, gallery: full.gallery || [] });
    setGalleryInput("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setError("");
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

  const handleTranslate = async () => {
    if (!form.name && !form.description) return;
    setTranslating(true);
    setError("");
    try {
      const fields: Record<string, string> = {};
      if (form.name) fields.name = form.name;
      if (form.description) fields.description = form.description;
      const result = await api.post<Record<string, string>>("/api/admin/places", { action: "translate", fields });
      setForm((f) => ({
        ...f,
        ...(result.name ? { name: result.name } : {}),
        ...(result.description ? { description: result.description } : {}),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao traduzir");
    } finally {
      setTranslating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover "${name}"?`)) return;
    try {
      await api.del(`/api/admin/places?id=${id}`);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    } catch { setError("Falha ao remover lugar"); }
  };

  const toggleRecommended = async (place: Place) => {
    try {
      const updated = await api.put<Place>("/api/admin/places", { id: place.id, hotel_recommended: !place.hotel_recommended });
      setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch { setError("Falha ao atualizar"); }
  };

  const toggleActive = async (place: Place) => {
    try {
      const updated = await api.put<Place>("/api/admin/places", { id: place.id, is_active: !place.is_active });
      setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch { setError("Falha ao atualizar"); }
  };

  // ── Upload imagens ────────────────────────────────────────────────────────
  const handleCoverUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const url = await api.uploadImage(file);
      setForm((f) => ({ ...f, image: url }));
    }
    catch { setError("Falha ao enviar imagem"); }
    finally { setUploadingImg(false); }
  };

  const handleGalleryUpload = async (file: File) => {
    setUploadingGallery(true);
    try {
      const url = await api.uploadImage(file);
      setForm((f) => ({ ...f, gallery: [...(f.gallery || []), url] }));
    } catch { setError("Falha ao enviar imagem"); }
    finally { setUploadingGallery(false); }
  };

  const addGalleryUrl = () => {
    const url = galleryInput.trim();
    if (!url) return;
    setForm((f) => ({ ...f, gallery: [...(f.gallery || []), url] }));
    setGalleryInput("");
  };

  const removeGalleryImage = (idx: number) =>
    setForm((f) => ({ ...f, gallery: (f.gallery || []).filter((_, i) => i !== idx) }));

  // ── Subcategorias ────────────────────────────────────────────────────────
  const subcatOptions = SUBCATEGORY_OPTIONS[form.category] || [];

  const toggleSubcat = (sub: string) =>
    setForm((f) => ({
      ...f,
      subcategories: f.subcategories.includes(sub)
        ? f.subcategories.filter((s) => s !== sub)
        : [...f.subcategories, sub],
    }));

  const selectStyle = "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Lugares</h1>
          <p className="text-muted-foreground text-sm">{places.length} lugares cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openImport} className="border-amber-300 text-amber-700 hover:bg-amber-50">
            <Sparkles className="w-4 h-4 mr-2" />Importar com IA
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />Novo Lugar
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-4 py-3 mb-4">{error}</p>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input className="pl-9" placeholder="Buscar por nome..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }} className={selectStyle}>
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(0); }} className={selectStyle}>
          <option value="">Ativo / Inativo</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <select value={recommendedFilter} onChange={(e) => { setRecommendedFilter(e.target.value); setPage(0); }} className={selectStyle}>
          <option value="">Recomendados / Todos</option>
          <option value="yes">Recomendados</option>
          <option value="no">Não recomendados</option>
        </select>
        <select value={qaFilter} onChange={(e) => { setQaFilter(e.target.value); setPage(0); }} className={`${selectStyle} ${qaFilter === "low" || qaFilter === "critical" ? "border-red-300 text-red-700 bg-red-50" : ""}`}>
          <option value="">Qualidade / Todos</option>
          <option value="low">⚠️ Precisam atenção (&lt;70)</option>
          <option value="critical">🔴 Crítico (&lt;50)</option>
          <option value="regular">🟡 Regular (50-69)</option>
          <option value="good">🔵 Bom (70-89)</option>
          <option value="excellent">🟢 Excelente (90+)</option>
        </select>
        {hasFilters && (
          <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground underline px-1">Limpar filtros</button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-3 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-sm">
          <span className="font-medium text-amber-800">{selected.size} selecionados</span>
          <span className="text-amber-300 mx-1">|</span>
          <button onClick={() => bulkUpdate({ is_active: true })} disabled={bulkLoading} className="text-green-700 hover:underline disabled:opacity-50">Ativar</button>
          <button onClick={() => bulkUpdate({ is_active: false })} disabled={bulkLoading} className="text-red-600 hover:underline disabled:opacity-50">Desativar</button>
          <button onClick={() => bulkUpdate({ hotel_recommended: true })} disabled={bulkLoading} className="text-amber-700 hover:underline disabled:opacity-50">Recomendar</button>
          <button onClick={() => bulkUpdate({ hotel_recommended: false })} disabled={bulkLoading} className="text-muted-foreground hover:underline disabled:opacity-50">Remover recomendação</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-muted-foreground hover:text-foreground">✕ Desmarcar</button>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <p className="text-muted-foreground/60 text-sm text-center py-12">Carregando...</p>
      ) : (
        <div className="bg-background rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-muted/40">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length}
                      onChange={toggleSelectAll} className="rounded" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Recomendado</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    <span className="flex items-center justify-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />QA</span>
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ativo</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((place) => (
                  <tr key={place.id} className={`hover:bg-muted/40 ${selected.has(place.id) ? "bg-amber-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(place.id)} onChange={() => toggleSelect(place.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {place.image && <img src={place.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                        <div>
                          <span className="font-medium text-foreground line-clamp-1">{place.name}</span>
                          {(place.gallery_count ?? (place.gallery?.length ?? 0)) > 0 && (
                            <span className="text-[10px] text-muted-foreground/50 ml-1">
                              +{place.gallery_count ?? place.gallery?.length} foto{(place.gallery_count ?? place.gallery?.length ?? 0) > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {CATEGORIES.find((c) => c.value === place.category)?.label ?? place.category}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleRecommended(place)}>
                        <Star className={`w-5 h-5 mx-auto ${place.hotel_recommended ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <QaBadge score={calcQaScore(place)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={place.is_active} onCheckedChange={() => toggleActive(place)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`${APP_URL}/place/${encodeURIComponent(place.id)}`} target="_blank" rel="noreferrer"
                          title="Ver no app" className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-muted text-muted-foreground/50 hover:text-hotel-gold transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(place)} disabled={loadingEditId === place.id}>
                          <Pencil className={`w-4 h-4 ${loadingEditId === place.id ? "animate-spin opacity-50" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(place.id, place.name)}>
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
            <p className="text-center text-muted-foreground/60 text-sm py-12">Nenhum lugar encontrado</p>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-sm text-muted-foreground">
              <span>{filtered.length} lugares · página {page + 1} de {totalPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => { setPage((p) => Math.max(0, p - 1)); setSelected(new Set()); }} disabled={page === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => { setPage((p) => Math.min(totalPages - 1, p + 1)); setSelected(new Set()); }} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog importar com IA */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Importar Lugar com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
              Cole o link do lugar — Google Maps, TripAdvisor, Sympla, site do restaurante ou qualquer página. A IA vai extrair automaticamente nome, endereço, horários, categoria, descrição e mais.
            </div>
            <Field label="Link do lugar">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                  <Input
                    className="pl-9"
                    placeholder="https://maps.google.com/... ou https://tripadvisor.com/... ou qualquer URL"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !importing) handleImport(); }}
                    disabled={importing}
                  />
                </div>
              </div>
            </Field>
            {importing && (
              <div className="flex items-center gap-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Importando dados e gerando descrição com IA... pode levar até 15 segundos.</span>
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

      {/* Dialog editar / criar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Lugar" : "Novo Lugar"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">

            {/* ── Informações básicas ── */}
            <Field label="Nome">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria">
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subcategories: [] }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Selecionar categoria</option>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>

              <Field label="Nível de preço (1-4)">
                <Input type="number" min={1} max={4} value={form.price_level ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, price_level: e.target.value ? Number(e.target.value) : undefined }))} />
              </Field>
            </div>

            {/* Subcategorias — só aparece quando categoria está selecionada */}
            {form.category && subcatOptions.length > 0 && (
              <Field label={`Subcategorias — ${CATEGORIES.find((c) => c.value === form.category)?.label}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 rounded-md border border-input bg-background p-3">
                  {subcatOptions.map((sub) => (
                    <label key={sub} className="flex items-center gap-2 cursor-pointer text-sm hover:text-foreground">
                      <input
                        type="checkbox"
                        checked={form.subcategories.includes(sub)}
                        onChange={() => toggleSubcat(sub)}
                        className="rounded"
                      />
                      <span className={form.subcategories.includes(sub) ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {sub}
                      </span>
                    </label>
                  ))}
                </div>
                {form.subcategories.length > 0 && (
                  <p className="text-[11px] text-muted-foreground/60 mt-1">{form.subcategories.length} subcategoria(s) selecionada(s)</p>
                )}
              </Field>
            )}

            <Field label="Descrição">
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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

            <Field label="URL do Cardápio">
              <Input type="url" value={form.menu_url || ""} onChange={(e) => setForm((f) => ({ ...f, menu_url: e.target.value }))} placeholder="https://..." />
            </Field>

            <Field label="Tags (separadas por vírgula)">
              <Input
                value={(form.tags || []).join(", ")}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
                placeholder="romântico, família, vegano"
              />
            </Field>

            <Field label="Horários de funcionamento">
              <Textarea rows={3} value={form.hours || ""} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                placeholder={"Segunda a Sexta: 11h00–22h30\nSábado e Domingo: 10h00–23h00"} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Score do hotel (1-100)">
                <Input type="number" min={1} max={100} value={form.hotel_score ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, hotel_score: e.target.value ? Number(e.target.value) : undefined }))} />
              </Field>
              <Field label="Distância do hotel (km)">
                <Input type="number" min={0} step={0.1} value={form.distance_km ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, distance_km: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Auto via ORS" />
              </Field>
            </div>

            {/* ── Gestão de imagens ── */}
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Imagens</p>

              {/* Capa */}
              <Field label="Imagem de capa (principal)">
                <div className="space-y-2">
                  {form.image && (
                    <div className="relative inline-block">
                      <img src={form.image} alt="" className="h-28 w-full object-cover rounded-md" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, image: null }))}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL da imagem de capa"
                      value={form.image || ""}
                      onChange={(e) => setForm((f) => ({ ...f, image: e.target.value || null }))}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}
                      disabled={uploadingImg} className="shrink-0">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
                  {uploadingImg && <p className="text-xs text-muted-foreground/60">Enviando...</p>}
                </div>
              </Field>

              {/* Galeria */}
              <Field label={`Galeria (${(form.gallery || []).length} foto${(form.gallery || []).length !== 1 ? "s" : ""})`}>
                <div className="space-y-2">
                  {/* Grid de thumbnails */}
                  {(form.gallery || []).length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {(form.gallery || []).map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img src={url} alt="" className="w-full h-16 object-cover rounded-md border border-border" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adicionar por URL */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL de nova foto..."
                      value={galleryInput}
                      onChange={(e) => setGalleryInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGalleryUrl(); } }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addGalleryUrl} className="shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => galleryFileRef.current?.click()}
                      disabled={uploadingGallery} className="shrink-0" title="Upload para galeria">
                      <ImagePlus className="w-4 h-4" />
                    </Button>
                  </div>
                  <input ref={galleryFileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryUpload(f); e.target.value = ""; }} />
                  {uploadingGallery && <p className="text-xs text-muted-foreground/60">Enviando para galeria...</p>}
                  <p className="text-[11px] text-muted-foreground/50">Cole uma URL e pressione Enter, ou faça upload. Passe o mouse sobre a foto para remover.</p>
                </div>
              </Field>
            </div>

            {/* Switches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Recomendado pelo hotel</Label>
                <Switch checked={form.hotel_recommended} onCheckedChange={(v) => setForm((f) => ({ ...f, hotel_recommended: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativo (visível no app)</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              variant="outline"
              onClick={handleTranslate}
              disabled={translating || (!form.name && !form.description)}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 mr-auto"
              title="Traduz nome e descrição para EN e ES via DeepL"
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
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

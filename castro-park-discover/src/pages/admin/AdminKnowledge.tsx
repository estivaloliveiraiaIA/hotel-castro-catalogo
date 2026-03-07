import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Bot, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Chunk {
  id: number;
  topic: string;
  content: string;
  keywords: string[];
}

const emptyForm = { topic: "", content: "", keywords: "" };

export default function AdminKnowledge() {
  const api = useAdminApi();

  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Chunk | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    api.get<Chunk[]>("/api/admin/knowledge")
      .then(setChunks)
      .catch(() => setError("Falha ao carregar base de conhecimento"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Chunk) => {
    setEditing(c);
    setForm({ topic: c.topic, content: c.content, keywords: (c.keywords || []).join(", ") });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.topic || !form.content) { setError("Tópico e conteúdo são obrigatórios"); return; }
    setSaving(true);
    setError("");
    const keywords = form.keywords.split(",").map((k) => k.trim()).filter(Boolean);
    try {
      if (editing) {
        const updated = await api.put<Chunk>("/api/admin/knowledge", { id: editing.id, topic: form.topic, content: form.content, keywords });
        setChunks((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await api.post<Chunk>("/api/admin/knowledge", { topic: form.topic, content: form.content, keywords });
        setChunks((prev) => [...prev, created]);
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, topic: string) => {
    if (!confirm(`Remover chunk "${topic}"?`)) return;
    try {
      await api.del(`/api/admin/knowledge?id=${id}`);
      setChunks((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Falha ao remover chunk");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Concierge — Base de Conhecimento</h1>
          <p className="text-muted-foreground text-sm">{chunks.length} chunks · base RAG do concierge digital</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Chunk
        </Button>
      </div>

      <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
        Cada chunk é um bloco de informação que o concierge usa para responder perguntas sobre o hotel. Edite com cuidado — alterações afetam imediatamente as respostas da IA.
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Buscar por tópico, conteúdo ou keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-4 py-3 mb-4">{error}</p>
      )}

      {loading ? (
        <p className="text-muted-foreground/60 text-sm text-center py-12">Carregando...</p>
      ) : chunks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/60">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum chunk cadastrado</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>Adicionar primeiro chunk</Button>
        </div>
      ) : (() => {
        const q = search.toLowerCase().trim();
        const visible = q
          ? chunks.filter((c) =>
              c.topic.toLowerCase().includes(q) ||
              c.content.toLowerCase().includes(q) ||
              (c.keywords || []).some((kw) => kw.toLowerCase().includes(q))
            )
          : chunks;
        return (
        <div className="space-y-2">
          {visible.length === 0 && (
            <p className="text-center text-muted-foreground/60 text-sm py-12">Nenhum chunk encontrado para "{search}"</p>
          )}
          {visible.map((chunk) => (
            <div key={chunk.id} className="bg-background rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="outline" className="text-xs font-mono text-amber-700 border-amber-300 shrink-0">
                      {chunk.topic}
                    </Badge>
                    {(chunk.keywords || []).slice(0, 4).map((kw) => (
                      <span key={kw} className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{kw}</span>
                    ))}
                    {(chunk.keywords || []).length > 4 && (
                      <span className="text-[10px] text-muted-foreground/60">+{chunk.keywords.length - 4}</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">{chunk.content}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(chunk)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(chunk.id, chunk.topic)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        );
      })()}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Chunk" : "Novo Chunk"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tópico (identificador único)</Label>
              <Input
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                placeholder="ex: cafe_da_manha, piscina, checkin"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Conteúdo (o que o concierge vai dizer)</Label>
              <Textarea
                rows={6}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Descreva a informação em linguagem natural, como o concierge responderia ao hóspede..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Keywords (separadas por vírgula)</Label>
              <Input
                value={form.keywords}
                onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                placeholder="cafe, manha, buffet, horario, incluso"
              />
              <p className="text-[11px] text-muted-foreground/60">
                Palavras que ativam este chunk quando o hóspede faz uma pergunta.
              </p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

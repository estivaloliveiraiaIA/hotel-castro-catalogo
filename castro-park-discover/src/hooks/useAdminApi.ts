export function useAdminApi() {
  const token = typeof window !== "undefined" ? (localStorage.getItem("admin_token") || "") : "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function get<T>(path: string): Promise<T> {
    const res = await fetch(path, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Erro ${res.status}`);
    }
    return res.json();
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Erro ${res.status}`);
    }
    return res.json();
  }

  async function put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, { method: "PUT", headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Erro ${res.status}`);
    }
    return res.json();
  }

  async function del(path: string): Promise<void> {
    const res = await fetch(path, { method: "DELETE", headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Erro ${res.status}`);
    }
  }

  async function uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const result = await post<{ url: string }>("/api/admin/upload", {
            base64,
            contentType: file.type,
            filename: file.name,
          });
          resolve(result.url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
      reader.readAsDataURL(file);
    });
  }

  return { get, post, put, del, uploadImage };
}

import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function dedupeUrls(urls: Array<string | null | undefined>) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const u of urls) {
    if (!u) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

type PlaceGalleryProps = {
  name: string;
  image?: string | null;
  gallery?: string[] | null;
};

export function PlaceGallery({ name, image, gallery }: PlaceGalleryProps) {
  const images = useMemo(() => {
    const all = dedupeUrls([image, ...(gallery || [])]);
    return all;
  }, [image, gallery]);

  const preview = images.slice(0, 5);
  const hasGallery = images.length > 0;

  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!open) return;
    if (!emblaApi) return;
    emblaApi.scrollTo(startIndex, true);
  }, [open, emblaApi, startIndex]);

  if (!hasGallery) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="overflow-hidden rounded-xl border bg-card">
        {/* Mosaic (desktop) / stacked (mobile) */}
        <div className="grid gap-2 p-2 md:grid-cols-4 md:grid-rows-2">
          {preview.map((url, idx) => {
            const isMain = idx === 0;
            const isLastPreview = idx === preview.length - 1;
            const remaining = Math.max(0, images.length - preview.length);

            return (
              <DialogTrigger asChild key={`${url}-${idx}`}>
                <button
                  type="button"
                  onClick={() => setStartIndex(idx)}
                  className={cn(
                    "group relative overflow-hidden rounded-lg bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isMain && "md:col-span-2 md:row-span-2",
                  )}
                >
                  <AspectRatio ratio={isMain ? 16 / 9 : 4 / 3}>
                    <img
                      src={url}
                      alt={`${name} — foto ${idx + 1}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                      loading={isMain ? "eager" : "lazy"}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </AspectRatio>

                  {/* subtle overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100" />

                  {/* CTA on the last tile */}
                  {isLastPreview && remaining > 0 && (
                    <div className="absolute inset-0 flex items-end justify-end p-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                        <Images className="h-4 w-4" />
                        +{remaining} fotos
                      </div>
                    </div>
                  )}

                  {/* Badge on main */}
                  {isMain && (
                    <div className="absolute left-3 top-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
                        <Images className="h-4 w-4 text-primary" />
                        {images.length} fotos
                      </div>
                    </div>
                  )}
                </button>
              </DialogTrigger>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Toque para ver em tela cheia
          </div>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" onClick={() => setStartIndex(0)}>
              <Images className="mr-2 h-4 w-4" />
              Ver fotos
            </Button>
          </DialogTrigger>
        </div>
      </div>

      <DialogContent className="h-[100svh] w-[100svw] max-w-none border-0 bg-black p-0 text-white sm:rounded-none">
        <div className="flex h-full flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="text-xs text-white/60">
                Foto {selectedIndex + 1} de {images.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => emblaApi?.scrollPrev()}
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => emblaApi?.scrollNext()}
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main carousel */}
          <div className="relative flex-1">
            <div className="h-full overflow-hidden" ref={emblaRef}>
              <div className="flex h-full">
                {images.map((url, idx) => (
                  <div className="relative min-w-0 flex-[0_0_100%]" key={`${url}-${idx}`}>
                    <div className="flex h-full items-center justify-center">
                      <img
                        src={url}
                        alt={`${name} — foto ${idx + 1}`}
                        className="max-h-[calc(100svh-150px)] w-auto max-w-full object-contain"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="border-t border-white/10 px-4 py-3">
            <ScrollArea className="w-full" orientation="horizontal">
              <div className="flex gap-2 pb-2">
                {images.map((url, idx) => (
                  <button
                    key={`${url}-thumb-${idx}`}
                    type="button"
                    onClick={() => emblaApi?.scrollTo(idx)}
                    className={cn(
                      "relative overflow-hidden rounded-md border transition",
                      idx === selectedIndex ? "border-white" : "border-white/20 opacity-70 hover:opacity-100",
                    )}
                    aria-label={`Ir para foto ${idx + 1}`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-14 w-20 object-cover"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

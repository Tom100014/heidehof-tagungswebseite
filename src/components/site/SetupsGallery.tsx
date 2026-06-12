import { useEffect, useState } from "react";
import { Users, Image as ImageIcon } from "lucide-react";
import { fetchRoomSetups, type RoomSetup } from "@/services/conference/setups-service";

export const SetupsGallery = () => {
  const [items, setItems] = useState<RoomSetup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoomSetups().then((data) => {
      setItems(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] cine-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((s) => (
        <article key={s.id} className="cine-card rounded-2xl overflow-hidden group reveal-up">
          <div className="relative aspect-[4/3] overflow-hidden bg-background/30">
            {s.image_url ? (
              <img
                src={s.image_url}
                alt={`Bestuhlung ${s.title}`}
                width={800}
                height={600}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform [transition-duration:1500ms] group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground/40">
                <ImageIcon className="w-12 h-12" />
                <span className="text-xs uppercase tracking-[0.3em]">Bild folgt</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1.5 flex items-center gap-2">
                <span className="inline-block w-6 h-px bg-gold/60" /> Setup
              </p>
              <h3 className="font-serif text-2xl text-foreground">{s.title}</h3>
            </div>
          </div>
          <div className="p-5 space-y-3 border-t border-gold/10">
            {s.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            )}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-gold/10">
              {s.capacity_range && (
                <span className="flex items-center gap-1.5 text-gold font-medium tracking-[0.1em] uppercase">
                  <Users className="w-3.5 h-3.5" /> {s.capacity_range}
                </span>
              )}
              {s.ideal_for && (
                <span className="text-muted-foreground/80 truncate ml-2">{s.ideal_for}</span>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

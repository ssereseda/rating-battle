import { useState } from 'react';
import { Film } from 'lucide-react';
import type { Show } from '../lib/data';
import { embeddedData } from '../lib/embedded';
import posterPaths from '../lib/poster-paths.json';
export function Poster({ show, className = '' }: { show: Show; className?: string }) {
  const [failed, setFailed] = useState(false);
  const localPath = (posterPaths as Record<string, string>)[show.poster];
  return (
    <div className={`poster ${className}`}>
      {show.poster && !failed ? (
        <img
          src={
            embeddedData<Record<string, string>>('rating-battle-posters')?.[show.poster] ||
            (localPath ? `${import.meta.env.BASE_URL}${localPath}` : show.poster)
          }
          alt={`Постер сериала «${show.title}»`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="poster-fallback">
          <Film aria-hidden="true" />
          <span>{show.title}</span>
        </div>
      )}
    </div>
  );
}

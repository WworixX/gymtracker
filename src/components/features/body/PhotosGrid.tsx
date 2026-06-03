'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import type { ProgressPhoto } from '@/types';

export function PhotosGrid() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<ProgressPhoto | null>(null);

  const loadPhotos = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('progress_photos').select('*').eq('user_id', user.id).order('logged_at', { ascending: false });
    const list = (data ?? []) as ProgressPhoto[];
    setPhotos(list);
    const urls: Record<string, string> = {};
    for (const p of list) {
      const { data: signedData } = await supabase.storage.from('progress-photos').createSignedUrl(p.storage_path, 3600);
      if (signedData) urls[p.id] = signedData.signedUrl;
    }
    setPhotoUrls(urls);
    setLoading(false);
  }, []);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('progress-photos').upload(path, file);
    if (!error) {
      await supabase.from('progress_photos').insert({ user_id: user.id, storage_path: path, logged_at: new Date().toISOString().split('T')[0] });
      await loadPhotos();
    }
    setUploading(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-4">
      <label className="cursor-pointer">
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        <div className={`w-full h-11 px-4 flex items-center justify-center gap-2 bg-transparent border border-border-active text-text-secondary hover:bg-bg-elevated rounded-lg text-sm font-semibold transition-all ${uploading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
          {uploading ? <Spinner size="sm" /> : <Upload size={14} />}
          Ajouter une photo
        </div>
      </label>
      {!photos.length ? (
        <EmptyState title="Aucune photo" description="Documente ta progression avec des photos." />
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className="aspect-square rounded-lg overflow-hidden bg-bg-elevated border border-border relative">
              {photoUrls[p.id] && <Image src={photoUrls[p.id]} alt={p.logged_at} fill className="object-cover" />}
            </button>
          ))}
        </div>
      )}
      <Modal open={!!selected} onClose={() => setSelected(null)} className="p-3">
        {selected && photoUrls[selected.id] && (
          <div className="flex flex-col gap-3">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden">
              <Image src={photoUrls[selected.id]} alt={selected.logged_at} fill className="object-cover" />
            </div>
            <p className="text-xs font-mono text-text-secondary text-center">{formatDate(selected.logged_at)}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

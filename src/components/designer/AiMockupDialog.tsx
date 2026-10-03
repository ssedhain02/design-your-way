import { useEffect, useState } from 'react';
import { Download, Loader2, Sparkles, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDesignerStore } from '@/store/designerStore';
import { buildDesignCanvas } from '@/lib/designTexture';
import { streamImage } from '@/lib/streamImage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mockup`;

const toBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

export default function AiMockupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { elements, activeView, selectedProduct } = useDesignerStore();
  const { user } = useAuth();
  const [garment, setGarment] = useState<File | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [artPreview, setArtPreview] = useState<string | null>(null);
  const [artBlob, setArtBlob] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const view = activeView === 'back' ? 'back' : 'front';

  // Capture the placed artwork when the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    const canvas = buildDesignCanvas(elements, view, () => {});
    if (!canvas) { setArtBlob(null); setArtPreview(null); return; }
    setArtPreview(canvas.toDataURL('image/png'));
    toBlob(canvas).then(setArtBlob);
  }, [open, elements, view]);

  // Default the garment reference to the vendor product photo.
  useEffect(() => {
    if (!open || garment || !selectedProduct?.imageUrl) return;
    fetch(selectedProduct.imageUrl)
      .then((r) => r.blob())
      .then((b) => {
        setGarment(new File([b], 'garment.png', { type: b.type || 'image/png' }));
        setGarmentPreview(selectedProduct.imageUrl);
      })
      .catch(() => {});
  }, [open, garment, selectedProduct]);

  const pickGarment = (f: File | undefined) => {
    if (!f) return;
    setGarment(f);
    setGarmentPreview(URL.createObjectURL(f));
  };

  const generate = async () => {
    if (!garment || !artBlob) return;
    setLoading(true); setError(null); setResult(null); setIsFinal(false);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Please sign in to generate mockups');
      const form = new FormData();
      form.append('garment', garment);
      form.append('artwork', new File([artBlob], 'artwork.png', { type: 'image/png' }));
      if (notes.trim()) form.append('notes', notes.trim());
      await streamImage(FN_URL, form, (src, final) => { setResult(src); setIsFinal(final); }, undefined, {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generation failed';
      setError(/402/.test(msg) ? 'AI credits are used up. Add credits to keep generating.' : /429/.test(msg) ? 'Too many requests — please wait a moment and try again.' : msg.replace(/^Image generation failed: \d+ /, '').slice(0, 300));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI realistic mockup</DialogTitle>
          <DialogDescription>Combine a garment photo with your {view} artwork into a photo-real, fabric-shaped mockup.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium mb-1">Garment reference</p>
              <label className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/40 hover:bg-muted">
                {garmentPreview ? <img src={garmentPreview} alt="Garment reference" className="h-full w-full object-contain" />
                  : <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground"><Upload className="w-5 h-5" />Upload garment photo</span>}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pickGarment(e.target.files?.[0])} />
              </label>
            </div>
            <div>
              <p className="text-xs font-medium mb-1">Placed artwork ({view})</p>
              <div className="flex aspect-[4/5] items-center justify-center rounded-md border border-border bg-muted/40 p-2">
                {artPreview ? <img src={artPreview} alt="Artwork" className="max-h-full object-contain" />
                  : <span className="text-xs text-muted-foreground text-center px-4">Add artwork to the {view} first.</span>}
              </div>
            </div>
            <Textarea placeholder="Optional: e.g. 'model on hanger, warm light'" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className="text-xs" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
              {result ? <img src={result} alt="Generated mockup" className={cn('h-full w-full object-contain transition-[filter] duration-500', !isFinal && 'blur-lg')} />
                : loading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                : <span className="text-xs text-muted-foreground">Your mockup appears here</span>}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {!user && <p className="text-xs text-muted-foreground">Sign in to generate mockups.</p>}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={generate} disabled={loading || !garment || !artBlob || !user}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {loading ? 'Generating…' : result ? 'Regenerate' : 'Generate mockup'}
              </Button>
              {result && isFinal && (
                <Button variant="outline" asChild>
                  <a href={result} download="mockup.png"><Download className="w-4 h-4" /></a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

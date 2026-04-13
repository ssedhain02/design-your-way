import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDesignerStore } from '@/store/designerStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SaveProductDialog({ open, onOpenChange }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('29.99');
  const [saving, setSaving] = useState(false);
  const { elements, garmentColor } = useDesignerStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const generatePreview = async (): Promise<Blob | null> => {
    // Render the garment SVG + design elements to a high-res canvas (print-ready)
    const SCALE = 4; // 4x for print quality
    const BASE_W = 500;
    const BASE_H = 580;
    const canvas = document.createElement('canvas');
    canvas.width = BASE_W * SCALE;   // 2000px
    canvas.height = BASE_H * SCALE;  // 2320px
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(SCALE, SCALE);

    // Draw garment background
    ctx.fillStyle = garmentColor;
    ctx.beginPath();
    ctx.moveTo(150, 80);
    ctx.quadraticCurveTo(150, 40, 200, 30);
    ctx.quadraticCurveTo(220, 25, 250, 50);
    ctx.quadraticCurveTo(280, 25, 300, 30);
    ctx.quadraticCurveTo(350, 40, 350, 80);
    ctx.lineTo(400, 120);
    ctx.lineTo(420, 200);
    ctx.lineTo(360, 180);
    ctx.lineTo(360, 530);
    ctx.lineTo(140, 530);
    ctx.lineTo(140, 180);
    ctx.lineTo(80, 200);
    ctx.lineTo(100, 120);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Design area bounds (front view) — coordinates in base units
    const dx = BASE_W * 0.30;
    const dy = BASE_H * 0.22;
    const dw = BASE_W * 0.40;
    const dh = BASE_H * 0.50;

    // Draw design elements (front view only for preview)
    const frontElements = elements.filter(el => el.view === 'front');
    for (const el of frontElements) {
      const ex = dx + (el.x / 200) * dw;
      const ey = dy + (el.y / 290) * dh;
      const ew = (el.width / 200) * dw;
      const eh = (el.height / 290) * dh;

      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;

      if (el.type === 'text') {
        ctx.fillStyle = el.color || '#000';
        const fontSize = Math.round(((el.fontSize || 24) / 200) * dw);
        ctx.font = `${el.fontWeight || 'normal'} ${el.fontStyle || 'normal'} ${fontSize}px ${el.fontFamily || 'Arial'}`;
        ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'left';
        const textX = el.textAlign === 'center' ? ex + ew / 2 : el.textAlign === 'right' ? ex + ew : ex;
        ctx.fillText(el.content, textX, ey + fontSize);
      } else if (el.type === 'shape') {
        ctx.fillStyle = el.fill || '#000';
        if (el.shapeType === 'rectangle') {
          ctx.fillRect(ex, ey, ew, eh);
        } else if (el.shapeType === 'circle') {
          ctx.beginPath();
          ctx.ellipse(ex + ew / 2, ey + eh / 2, ew / 2, eh / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (el.type === 'image' && el.content) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = el.content;
          });
          ctx.drawImage(img, ex, ey, ew, eh);
        } catch { /* skip broken images */ }
      }

      ctx.restore();
    }

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!title.trim()) return;

    setSaving(true);
    try {
      // Generate preview image
      const blob = await generatePreview();
      let imageUrl: string | null = null;

      if (blob) {
        const fileName = `${user.id}/${Date.now()}.png`;
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(fileName, blob, { contentType: 'image/png' });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      // Insert product
      const { error } = await supabase.from('products').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        price: parseFloat(price) || 0,
        garment_color: garmentColor,
        garment_type: 't-shirt',
        design_data: elements as any,
        image_url: imageUrl,
        is_published: true,
      });

      if (error) throw error;

      toast({ title: 'Product published!', description: 'Your design is now live in the marketplace.' });
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setPrice('29.99');
    } catch (err: any) {
      toast({ title: 'Error saving product', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish Design</DialogTitle>
          <DialogDescription>Save your design to the marketplace for others to purchase.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="My Custom Tee" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A brief description of your design" rows={3} />
          </div>
          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input id="price" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Publish to Marketplace'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

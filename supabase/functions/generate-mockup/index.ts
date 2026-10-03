import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const imageSettings = {
  baseURL: 'https://ai.gateway.lovable.dev',
  model: 'openai/gpt-image-2.5-sunburst',
}

const PROMPT = `Create a photorealistic e-commerce product mockup.
Image 1 is the garment reference: keep its exact garment type, cut, fabric, color, folds and lighting.
Image 2 is the customer's artwork: print it on the chest of the garment exactly as given — same colors, shapes, text and proportions, no additions or omissions.
The print must follow the fabric: bend with folds and wrinkles, pick up the garment's shading and texture, like real screen/DTG printing.
Clean light studio background, no watermark, no logos or text other than the artwork.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Please sign in to generate mockups' }, 401)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json({ error: 'Please sign in to generate mockups' }, 401)

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) return json({ error: 'AI is not configured' }, 500)

    const input = await req.formData()
    const garment = input.get('garment')
    const artwork = input.get('artwork')
    if (!(garment instanceof File) || !(artwork instanceof File)) {
      return json({ error: 'Garment reference and artwork images are required' }, 400)
    }
    const extra = input.get('notes')
    const streaming = input.get('stream') !== 'false'

    const form = new FormData()
    form.set('model', imageSettings.model)
    form.set('prompt', typeof extra === 'string' && extra.trim() ? `${PROMPT}\nExtra instructions: ${extra.slice(0, 500)}` : PROMPT)
    form.append('image[]', garment)
    form.append('image[]', artwork)
    form.set('size', '1024x1536')
    if (streaming) {
      form.set('stream', 'true')
      form.set('partial_images', '1')
    }

    const upstream = await fetch(`${imageSettings.baseURL}/v1/images/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (e) {
    console.error(e)
    return json({ error: 'Internal error' }, 500)
  }
})

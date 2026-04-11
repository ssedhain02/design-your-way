import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { order_id, action } = await req.json()

    if (action === 'assign_printer') {
      // Find first available printer vendor
      const { data: printers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'vendor_printer')

      if (!printers || printers.length === 0) {
        return new Response(JSON.stringify({ error: 'No printer vendors available' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Simple round-robin: pick first printer
      const printerId = printers[0].user_id

      await supabase.from('vendor_assignments').insert({
        order_id, vendor_id: printerId, vendor_type: 'vendor_printer',
      })

      await supabase.from('orders').update({ status: 'pending' }).eq('id', order_id)

      return new Response(JSON.stringify({ success: true, vendor_id: printerId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'assign_delivery') {
      const { data: drivers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'vendor_delivery')

      if (!drivers || drivers.length === 0) {
        return new Response(JSON.stringify({ error: 'No delivery vendors available' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const driverId = drivers[0].user_id

      await supabase.from('vendor_assignments').insert({
        order_id, vendor_id: driverId, vendor_type: 'vendor_delivery',
      })

      return new Response(JSON.stringify({ success: true, vendor_id: driverId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

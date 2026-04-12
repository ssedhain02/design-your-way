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
    // Validate JWT - get the user from the auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify the calling user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check that caller is an admin
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate input
    const body = await req.json()
    const { order_id, action } = body

    if (!order_id || typeof order_id !== 'string' || order_id.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid order_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!['assign_printer', 'assign_delivery'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'assign_printer') {
      const { data: printers } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'vendor_printer')

      if (!printers || printers.length === 0) {
        return new Response(JSON.stringify({ error: 'No printer vendors available' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const printerId = printers[0].user_id

      await supabaseAdmin.from('vendor_assignments').insert({
        order_id, vendor_id: printerId, vendor_type: 'vendor_printer',
      })

      await supabaseAdmin.from('orders').update({ status: 'pending' }).eq('id', order_id)

      return new Response(JSON.stringify({ success: true, vendor_id: printerId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'assign_delivery') {
      const { data: drivers } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'vendor_delivery')

      if (!drivers || drivers.length === 0) {
        return new Response(JSON.stringify({ error: 'No delivery vendors available' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const driverId = drivers[0].user_id

      await supabaseAdmin.from('vendor_assignments').insert({
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
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

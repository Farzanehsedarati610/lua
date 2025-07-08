// File: supabase/functions/transferToCoinbase.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async (req) => {
  try {
    const { hex, coinbaseAddress } = await req.json()

    if (!hex || !coinbaseAddress) {
      return new Response(JSON.stringify({ error: 'Missing hex or Coinbase address' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 🔍 Look up symbolic account
    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('account_number', hex)
      .single()

    if (error || !account) {
      return new Response(JSON.stringify({ error: 'Account not found' }), { status: 404 })
    }

    // 🧮 Parse symbolic balance
    const rawBalance = account.balance.toString()
    const parsed = parseFloat(rawBalance.slice(0, 8)) // e.g., "10505296"
    const usdcAmount = parsed * 0.0001 // e.g., 1050.5296 USDC

    if (usdcAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Insufficient symbolic balance' }), { status: 400 })
    }

    // 🔁 Trigger real transfer (replace with your webhook or wallet logic)
    const transferResponse = await fetch('https://your-transfer-service.com/send-usdc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: coinbaseAddress,
        amount: usdcAmount.toFixed(6)
      })
    })

    if (!transferResponse.ok) {
      return new Response(JSON.stringify({ error: 'Transfer failed' }), { status: 500 })
    }

    // 🧾 Log transfer
    await supabase.from('transfers').insert({
      from_account: hex,
      to: coinbaseAddress,
      amount: usdcAmount.toFixed(6),
      status: 'sent'
    })

    return new Response(JSON.stringify({ success: true, amount: usdcAmount.toFixed(6) }), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error', details: err.message }), { status: 500 })
  }
})


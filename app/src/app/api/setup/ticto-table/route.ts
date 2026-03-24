import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function POST() {
  const supabase = getServiceSupabase()

  // Create ticto_sales table using raw SQL via RPC
  // First, create the RPC function if it doesn't exist
  const { error: rpcError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.ticto_sales (
        id bigint generated always as identity primary key,
        order_id text not null,
        order_hash text,
        transaction_hash text,
        status text not null,
        status_date timestamptz,
        payment_method text,
        product_name text,
        offer_id text,
        quantity integer default 1,
        price numeric(12,2),
        paid_amount numeric(12,2),
        installments integer default 1,
        customer_name text,
        customer_email text,
        customer_cpf text,
        customer_city text,
        customer_state text,
        utm_source text,
        utm_medium text,
        utm_campaign text,
        utm_content text,
        utm_term text,
        raw_payload jsonb,
        created_at timestamptz default now(),
        updated_at timestamptz default now(),
        UNIQUE(order_id, status)
      );
      CREATE INDEX IF NOT EXISTS idx_ticto_sales_date ON public.ticto_sales(status_date);
      CREATE INDEX IF NOT EXISTS idx_ticto_sales_status ON public.ticto_sales(status);
      CREATE INDEX IF NOT EXISTS idx_ticto_sales_utm ON public.ticto_sales(utm_source, utm_campaign);
    `
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message, hint: 'Run the SQL manually in Supabase Dashboard' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Table ticto_sales created' })
}

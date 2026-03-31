import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

// POST /api/criativos/[id]/upload — upload file to Supabase Storage
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getServiceSupabase();

  // Verify criativo exists
  const { data: criativo, error: fetchError } = await sb
    .from('criativos')
    .select('id')
    .eq('id', id)
    .single();

  if (fetchError || !criativo) {
    return NextResponse.json({ error: 'Criativo not found' }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 100MB` },
      { status: 400 },
    );
  }

  const ext = file.name.split('.').pop() || 'bin';
  const storagePath = `criativos/${id}/original.${ext}`;

  // Upload to Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await sb.storage
    .from('criativos')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = sb.storage.from('criativos').getPublicUrl(storagePath);

  // Update criativo record
  const { data: updated, error: updateError } = await sb
    .from('criativos')
    .update({
      arquivo_principal: storagePath,
      arquivo_thumbnail: storagePath, // Same for now; could generate thumbnail later
      mime_type: file.type,
      tamanho_bytes: file.size,
      updated_by: 'upload',
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: updated,
    url: urlData.publicUrl,
    path: storagePath,
  });
}

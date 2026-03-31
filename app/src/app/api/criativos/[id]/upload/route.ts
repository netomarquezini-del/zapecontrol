import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

// POST /api/criativos/[id]/upload — two modes:
// 1) With file in body (small files < 4.5MB) — direct upload
// 2) Without file, with ?signed=true — returns signed URL for client-side upload
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

  const isSigned = req.nextUrl.searchParams.get('signed') === 'true';

  // ── Mode 2: Return signed URL for client-side upload ──
  if (isSigned) {
    const body = await req.json();
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType required' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json({ error: `Invalid file type: ${fileType}` }, { status: 400 });
    }
    if (fileSize && fileSize > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max: 100MB' }, { status: 400 });
    }

    const ext = fileName.split('.').pop() || 'bin';
    const storagePath = `criativos/${id}/original.${ext}`;

    const { data: signedData, error: signError } = await sb.storage
      .from('criativos')
      .createSignedUploadUrl(storagePath, { upsert: true });

    if (signError || !signedData) {
      return NextResponse.json({ error: `Signed URL failed: ${signError?.message}` }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      path: storagePath,
      fileType,
    });
  }

  // ── Mode 1: Direct upload (small files) ──
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 100MB` },
      { status: 400 },
    );
  }

  const ext = file.name.split('.').pop() || 'bin';
  const storagePath = `criativos/${id}/original.${ext}`;

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

  const { data: urlData } = sb.storage.from('criativos').getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  const { data: updated, error: updateError } = await sb
    .from('criativos')
    .update({
      arquivo_principal: publicUrl,
      arquivo_thumbnail: publicUrl,
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
    url: publicUrl,
    path: storagePath,
  });
}

// PATCH /api/criativos/[id]/upload — confirm signed upload (client calls after uploading to signed URL)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getServiceSupabase();
  const { path, fileType, fileSize } = await req.json();

  if (!path) {
    return NextResponse.json({ error: 'path required' }, { status: 400 });
  }

  const { data: urlData } = sb.storage.from('criativos').getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  const { data: updated, error } = await sb
    .from('criativos')
    .update({
      arquivo_principal: publicUrl,
      arquivo_thumbnail: publicUrl,
      mime_type: fileType || null,
      tamanho_bytes: fileSize || null,
      updated_by: 'upload',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: updated, url: publicUrl });
}

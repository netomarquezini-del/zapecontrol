import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BUCKET = 'marketing-docs';
const SUPABASE_URL = 'https://mrchphqqgbssndijichd.supabase.co';

// ── GET: list all documents ─────────────────────────────────
export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('marketing_documents')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: upload a new PDF ──────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Apenas arquivos PDF sao aceitos' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo excede o limite de 50MB' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Generate unique file path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${timestamp}_${safeName}`;

    // Upload to storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Erro no upload: ${uploadError.message}` }, { status: 500 });
    }

    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;

    // Create database record
    const { data: doc, error: dbError } = await supabase
      .from('marketing_documents')
      .insert({
        name: file.name.replace(/\.pdf$/i, ''),
        file_path: filePath,
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: 'user',
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete uploaded file
      await supabase.storage.from(BUCKET).remove([filePath]);
      return NextResponse.json({ error: `Erro ao salvar: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PATCH: update document name OR reorder ─────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Reorder action ──
    if (body.action === 'reorder' && Array.isArray(body.items)) {
      const supabase = getServiceSupabase();
      const updates = body.items as { id: string; sort_order: number }[];

      for (const item of updates) {
        const { error } = await supabase
          .from('marketing_documents')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      return NextResponse.json({ ok: true });
    }

    // ── Rename action ──
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID e nome sao obrigatorios' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('marketing_documents')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE: remove document from storage + table ────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID e obrigatorio' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get file_path first
    const { data: doc, error: fetchError } = await supabase
      .from('marketing_documents')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Documento nao encontrado' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([doc.file_path]);

    if (storageError) {
      console.error('[Marketing Documentos] Storage delete error:', storageError.message);
    }

    // Delete from table
    const { error: dbError } = await supabase
      .from('marketing_documents')
      .delete()
      .eq('id', id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

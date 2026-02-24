'use server';

import { createClient } from '@/utils/supabase/server';
import { encrypt, decrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';

export interface ExternalSite {
    id: string;
    site_name: string;
    api_key: string;
    webhook_url: string | null;
    created_at: string;
    updated_at: string;
}

export async function getExternalSites() {
    const supabase = await createClient() as any;
    const { data, error } = await supabase.database
        .from('external_sites')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Decrypt API keys before sending to client (if needed)
    // Actually, for security, maybe we should only send partial/masked keys
    // But the user might want to edit it. Let's decrypt for now.
    return (data || []).map((site: any) => ({
        ...site,
        api_key: decrypt(site.api_key)
    })) as ExternalSite[];
}

export async function addExternalSite(formData: { site_name: string; api_key: string; webhook_url?: string }) {
    const supabase = await createClient() as any;

    const encryptedKey = encrypt(formData.api_key);

    const { data, error } = await supabase.database
        .from('external_sites')
        .insert([
            {
                site_name: formData.site_name,
                api_key: encryptedKey,
                webhook_url: formData.webhook_url || null
            }
        ])
        .select();

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/settings/connections');
    return data[0];
}

export async function updateExternalSite(id: string, formData: { site_name?: string; api_key?: string; webhook_url?: string }) {
    const supabase = await createClient() as any;

    const updates: any = { ...formData };
    if (formData.api_key) {
        updates.api_key = encrypt(formData.api_key);
    }

    const { data, error } = await supabase.database
        .from('external_sites')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/settings/connections');
    return data[0];
}

export async function deleteExternalSite(id: string) {
    const supabase = await createClient() as any;

    const { error } = await supabase.database
        .from('external_sites')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/settings/connections');
    return { success: true };
}

import { getSupabaseClient } from './supabaseClient';
import { storageService } from './storageService';
import { toast } from 'sonner';

let isSyncing = false;
let lastSyncTimestamp = 0;

export const cloudSync = {
  /**
   * Upload all local data (IndexedDB + Settings) to Supabase cloud
   */
  async upload(userId: string, silent: boolean = false): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return false;

    if (isSyncing) return false;
    isSyncing = true;

    try {
      const loaded = await storageService.loadAll();
      const payload = {
        user_id: userId,
        data: loaded.state,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_sync_data')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        console.error('[CloudSync] Erro ao enviar dados para o Supabase:', error);
        if (!silent) toast.error('Erro na sincronização em nuvem: ' + error.message);
        return false;
      }

      lastSyncTimestamp = Date.now();
      localStorage.setItem('last_cloud_sync', new Date().toISOString());
      if (!silent) toast.success('Dados salvos na nuvem com sucesso!');
      return true;
    } catch (err: any) {
      console.error('[CloudSync] Falha no upload:', err);
      return false;
    } finally {
      isSyncing = false;
    }
  },

  /**
   * Download and restore all data from Supabase cloud into local IndexedDB
   */
  async download(userId: string, silent: boolean = false): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return false;

    try {
      const { data, error } = await supabase
        .from('user_sync_data')
        .select('data, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[CloudSync] Erro ao baixar dados do Supabase:', error);
        return false;
      }

      if (data && data.data && Object.keys(data.data).length > 0) {
        console.log('[CloudSync] Dados encontrados na nuvem. Restaurando workspace...');
        await storageService.importAll(data.data);
        localStorage.setItem('last_cloud_sync', data.updated_at || new Date().toISOString());
        if (!silent) toast.success('Dados sincronizados da nuvem com sucesso!');
        return true;
      } else {
        // No data on cloud yet, upload local data as initial baseline
        console.log('[CloudSync] Nenhum dado na nuvem para este usuário. Enviando dados locais iniciais...');
        await this.upload(userId, true);
        return true;
      }
    } catch (err) {
      console.error('[CloudSync] Falha no download:', err);
      return false;
    }
  },

  /**
   * Listen for changes made on other devices (Realtime)
   */
  subscribe(userId: string, onUpdate: () => void) {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return () => {};

    const channel = supabase
      .channel(`sync-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sync_data',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // If updated by another device
          const serverTime = new Date((payload.new as any)?.updated_at || 0).getTime();
          if (serverTime > lastSyncTimestamp + 2000) {
            console.log('[CloudSync] Atualização detectada de outro dispositivo. Atualizando tela...');
            if ((payload.new as any)?.data) {
              await storageService.importAll((payload.new as any).data);
              onUpdate();
              toast.info('Sua Central foi atualizada com alterações de outro dispositivo.');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

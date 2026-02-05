import { Injectable } from '@angular/core';
import { supabase } from './supabaseClient';

@Injectable({ providedIn: 'root' })
export class OnlineGameService {


  async createGame(board: any, hostId: string) {
  return supabase.from('games').insert({
    board_state: board,
    current_player: board.currentPlayer,
    host_id: hostId,
    guest_id: null
  }).select().single();
}


  async getGame(id: string) {
    return supabase.from('games').select('*').eq('id', id).single();
  }

async updateGame(gameId: string, board: any, playerId: string, movePit?: number) {
  console.log('[DB] updateGame', gameId, playerId, 'pit:', movePit);
  console.log('[DB] board object sent', board);

  const { error } = await supabase
    .from('games')
    .update({
      board_state: board,
      current_player: board.currentPlayer,
      last_move_pit: movePit,
      last_move_player: playerId
    })
    .eq('id', gameId);

  if (error) {
    console.error('[DB ERROR]', error);
  }
}



  listenToGame(gameId: string, callback: (game: any) => void) {
    return supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log('[REALTIME] Supabase payload received:', payload);
          callback(payload.new);
        },
      )

      .subscribe();
  }

  async assignGuest(gameId: string, playerId: string) {
  return supabase
    .from('games')
    .update({ guest_id: playerId })
    .eq('id', gameId)
    .select()
    .single();
}


}

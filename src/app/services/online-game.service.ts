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

async updateGame(id: string, board: any) {
  console.log('[SYNC] Sending board to server');

  return supabase
    .from('games')
    .update({
      board_state: board,
      current_player: board.currentPlayer,
    })
    .eq('id', id);
}



  listenToGame(gameId: string, callback: (game: any) => void) {
    return supabase
      .channel('games-room')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
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

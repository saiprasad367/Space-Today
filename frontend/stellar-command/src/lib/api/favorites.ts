import { api } from "./client";

export interface Favorite {
  id: string;
  user_id: string;
  item_type: "apod" | "asteroid" | "mars_photo" | "earth_event";
  item_payload: Record<string, unknown>;
  saved_at: string;
}

export interface FavoriteListResponse {
  favorites: Favorite[];
  total: number;
}

export function getFavorites(): Promise<FavoriteListResponse> {
  return api.get<FavoriteListResponse>("/favorites");
}

export function addFavorite(
  item_type: Favorite["item_type"],
  item_payload: Record<string, unknown>,
): Promise<Favorite> {
  return api.post<Favorite>("/favorites", { item_type, item_payload });
}

export function removeFavorite(id: string): Promise<void> {
  return api.delete<void>(`/favorites/${id}`);
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFavorites, addFavorite, removeFavorite } from "@/lib/api/favorites";
import type { Favorite } from "@/lib/api/favorites";
import { toast } from "sonner";

const QUERY_KEY = ["favorites"];

export function useFavorites() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getFavorites,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      item_type,
      item_payload,
    }: {
      item_type: Favorite["item_type"];
      item_payload: Record<string, unknown>;
    }) => addFavorite(item_type, item_payload),

    // Optimistic update
    onMutate: async (newFav) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData(QUERY_KEY);

      const optimistic: Favorite = {
        id: `temp-${Date.now()}`,
        user_id: "",
        item_type: newFav.item_type,
        item_payload: newFav.item_payload,
        saved_at: new Date().toISOString(),
      };

      queryClient.setQueryData(QUERY_KEY, (old: any) => ({
        favorites: [optimistic, ...(old?.favorites ?? [])],
        total: (old?.total ?? 0) + 1,
      }));

      return { previous };
    },

    onError: (_err, _newFav, context) => {
      queryClient.setQueryData(QUERY_KEY, context?.previous);
      toast.error("Failed to save favorite");
    },

    onSuccess: () => {
      toast.success("Saved to favorites");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeFavorite(id),

    // Optimistic update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData(QUERY_KEY);

      queryClient.setQueryData(QUERY_KEY, (old: any) => ({
        favorites: (old?.favorites ?? []).filter((f: Favorite) => f.id !== id),
        total: Math.max((old?.total ?? 1) - 1, 0),
      }));

      return { previous };
    },

    onError: (_err, _id, context) => {
      queryClient.setQueryData(QUERY_KEY, context?.previous);
      toast.error("Failed to remove favorite");
    },

    onSuccess: () => {
      toast.success("Removed from favorites");
    },
  });
}

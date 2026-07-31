import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mapsApi } from '../api/maps.api';

export function graphQueryKey(mapId: string | null) {
  return ['graph', mapId] as const;
}

export function useGraphData(mapId: string | null) {
  const query = useQuery({
    queryKey: graphQueryKey(mapId),
    queryFn: () => mapsApi.graph(mapId as string),
    enabled: mapId !== null
  });

  const queryClient = useQueryClient();
  const refetch = () => queryClient.invalidateQueries({ queryKey: graphQueryKey(mapId) });

  return { ...query, refetch };
}

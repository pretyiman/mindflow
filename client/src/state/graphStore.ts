import { create } from 'zustand';

interface FilterState {
  searchQuery: string;
  selectedTagIds: string[];
  connectedToNodeId: string | null;
}

const emptyFilterState: FilterState = {
  searchQuery: '',
  selectedTagIds: [],
  connectedToNodeId: null
};

interface GraphUiState extends FilterState {
  currentMapId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isManageCategoriesOpen: boolean;
  isManageRelationTypesOpen: boolean;
  isManageTagsOpen: boolean;
  isAccountSettingsOpen: boolean;
  // The map a Share modal is open for - set from either the maps list page's
  // row menu or (when open) the current board, independent of currentMapId.
  shareModalMapId: string | null;

  setCurrentMapId: (mapId: string | null) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  clearSelection: () => void;
  setManageCategoriesOpen: (open: boolean) => void;
  setManageRelationTypesOpen: (open: boolean) => void;
  setManageTagsOpen: (open: boolean) => void;
  setAccountSettingsOpen: (open: boolean) => void;
  setShareModalMapId: (mapId: string | null) => void;

  setSearchQuery: (query: string) => void;
  toggleFilterTag: (tagId: string) => void;
  setConnectedToNodeId: (nodeId: string | null) => void;
  clearFilters: () => void;
}

export const useGraphStore = create<GraphUiState>((set) => ({
  currentMapId: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  isManageCategoriesOpen: false,
  isManageRelationTypesOpen: false,
  isManageTagsOpen: false,
  isAccountSettingsOpen: false,
  shareModalMapId: null,
  ...emptyFilterState,

  setCurrentMapId: (mapId) =>
    set({ currentMapId: mapId, selectedNodeId: null, selectedEdgeId: null, ...emptyFilterState }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),
  setManageCategoriesOpen: (open) => set({ isManageCategoriesOpen: open }),
  setManageRelationTypesOpen: (open) => set({ isManageRelationTypesOpen: open }),
  setManageTagsOpen: (open) => set({ isManageTagsOpen: open }),
  setAccountSettingsOpen: (open) => set({ isAccountSettingsOpen: open }),
  setShareModalMapId: (mapId) => set({ shareModalMapId: mapId }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleFilterTag: (tagId) =>
    set((state) => ({
      selectedTagIds: state.selectedTagIds.includes(tagId)
        ? state.selectedTagIds.filter((id) => id !== tagId)
        : [...state.selectedTagIds, tagId]
    })),
  setConnectedToNodeId: (nodeId) => set({ connectedToNodeId: nodeId }),
  clearFilters: () => set(emptyFilterState)
}));

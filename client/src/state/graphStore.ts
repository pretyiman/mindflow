import { create } from 'zustand';

interface FilterState {
  selectedTagIds: string[];
  propertyFilterKey: string;
  propertyFilterValue: string;
  connectedToNodeId: string | null;
}

const emptyFilterState: FilterState = {
  selectedTagIds: [],
  propertyFilterKey: '',
  propertyFilterValue: '',
  connectedToNodeId: null
};

interface GraphUiState extends FilterState {
  currentMapId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isManageCategoriesOpen: boolean;
  isManageRelationTypesOpen: boolean;
  isManageTagsOpen: boolean;
  isShareOpen: boolean;

  setCurrentMapId: (mapId: string | null) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  clearSelection: () => void;
  setManageCategoriesOpen: (open: boolean) => void;
  setManageRelationTypesOpen: (open: boolean) => void;
  setManageTagsOpen: (open: boolean) => void;
  setShareOpen: (open: boolean) => void;

  toggleFilterTag: (tagId: string) => void;
  setPropertyFilter: (key: string, value: string) => void;
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
  isShareOpen: false,
  ...emptyFilterState,

  setCurrentMapId: (mapId) =>
    set({ currentMapId: mapId, selectedNodeId: null, selectedEdgeId: null, ...emptyFilterState }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),
  setManageCategoriesOpen: (open) => set({ isManageCategoriesOpen: open }),
  setManageRelationTypesOpen: (open) => set({ isManageRelationTypesOpen: open }),
  setManageTagsOpen: (open) => set({ isManageTagsOpen: open }),
  setShareOpen: (open) => set({ isShareOpen: open }),

  toggleFilterTag: (tagId) =>
    set((state) => ({
      selectedTagIds: state.selectedTagIds.includes(tagId)
        ? state.selectedTagIds.filter((id) => id !== tagId)
        : [...state.selectedTagIds, tagId]
    })),
  setPropertyFilter: (key, value) => set({ propertyFilterKey: key, propertyFilterValue: value }),
  setConnectedToNodeId: (nodeId) => set({ connectedToNodeId: nodeId }),
  clearFilters: () => set(emptyFilterState)
}));

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mapsApi } from './api/maps.api';
import { useGraphData } from './hooks/useGraphData';
import { useGraphStore } from './state/graphStore';
import { useAuthStore } from './state/authStore';
import AuthPage from './components/auth/AuthPage';
import AccountBadge from './components/auth/AccountBadge';
import GraphCanvas from './components/graph/GraphCanvas';
import NodeDetailPanel from './components/panels/NodeDetailPanel';
import Toolbar from './components/panels/Toolbar';
import MapsListPage from './components/maps/MapsListPage';
import ManageCategoriesModal from './components/settings/ManageCategoriesModal';
import ManageRelationTypesModal from './components/settings/ManageRelationTypesModal';
import ManageTagsModal from './components/settings/ManageTagsModal';
import ShareModal from './components/settings/ShareModal';
import AccountSettingsModal from './components/settings/AccountSettingsModal';

export default function App() {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const {
    currentMapId,
    setCurrentMapId,
    selectedNodeId,
    selectNode,
    clearSelection,
    isManageCategoriesOpen,
    setManageCategoriesOpen,
    isManageRelationTypesOpen,
    setManageRelationTypesOpen,
    isManageTagsOpen,
    setManageTagsOpen,
    isAccountSettingsOpen,
    setAccountSettingsOpen,
    shareModalMapId,
    setShareModalMapId
  } = useGraphStore();

  const mapsQuery = useQuery({ queryKey: ['maps'], queryFn: mapsApi.list, enabled: !!token });
  const graphQuery = useGraphData(token ? currentMapId : null);
  const currentMap = mapsQuery.data?.find((m) => m.id === currentMapId);
  // Defaults to the most restrictive role while the map list is still loading,
  // so edit affordances never flash on before the real role is known.
  const myRole = currentMap?.myRole ?? 'VIEWER';
  const canEdit = myRole === 'OWNER' || myRole === 'EDITOR';

  if (!token) return <AuthPage />;

  const handleCreateMap = async (name: string) => {
    const map = await mapsApi.create({ name });
    await queryClient.invalidateQueries({ queryKey: ['maps'] });
    setCurrentMapId(map.id);
  };

  const handleDeleteMap = async (mapId: string) => {
    await mapsApi.remove(mapId);
    if (currentMapId === mapId) setCurrentMapId(null);
    await queryClient.invalidateQueries({ queryKey: ['maps'] });
  };

  const handleGraphChanged = () => graphQuery.refetch();

  return (
    <div className="app-container">
      <AccountBadge onOpenSettings={() => setAccountSettingsOpen(true)} />

      {!currentMapId ? (
        <MapsListPage
          maps={mapsQuery.data ?? []}
          onOpenMap={setCurrentMapId}
          onCreateMap={handleCreateMap}
          onDeleteMap={handleDeleteMap}
          onShareMap={setShareModalMapId}
        />
      ) : (
        <>
          <div className="main-column">
            <Toolbar
              mapName={currentMap?.name ?? ''}
              onBack={() => setCurrentMapId(null)}
              graph={graphQuery.data ?? null}
            />
            {graphQuery.data ? (
              <GraphCanvas
                mapId={currentMapId}
                data={graphQuery.data}
                selectedNodeId={selectedNodeId}
                onNodeClick={selectNode}
                onBackgroundClick={clearSelection}
                onChanged={handleGraphChanged}
                canEdit={canEdit}
                onOpenCategories={() => setManageCategoriesOpen(true)}
                onOpenRelationTypes={() => setManageRelationTypesOpen(true)}
                onOpenTags={() => setManageTagsOpen(true)}
              />
            ) : (
              <div className="empty-state">Loading graph...</div>
            )}
          </div>

          {graphQuery.data && selectedNodeId && (
            <NodeDetailPanel
              graph={graphQuery.data}
              selectedNodeId={selectedNodeId}
              onClose={clearSelection}
              onChanged={handleGraphChanged}
              canEdit={canEdit}
            />
          )}

          {isManageCategoriesOpen && graphQuery.data && (
            <ManageCategoriesModal
              mapId={currentMapId}
              graph={graphQuery.data}
              onClose={() => setManageCategoriesOpen(false)}
              onChanged={handleGraphChanged}
            />
          )}
          {isManageRelationTypesOpen && graphQuery.data && (
            <ManageRelationTypesModal
              mapId={currentMapId}
              graph={graphQuery.data}
              onClose={() => setManageRelationTypesOpen(false)}
              onChanged={handleGraphChanged}
            />
          )}
          {isManageTagsOpen && graphQuery.data && (
            <ManageTagsModal
              mapId={currentMapId}
              graph={graphQuery.data}
              onClose={() => setManageTagsOpen(false)}
              onChanged={handleGraphChanged}
            />
          )}
        </>
      )}

      {shareModalMapId && (
        <ShareModal mapId={shareModalMapId} onClose={() => setShareModalMapId(null)} />
      )}
      {isAccountSettingsOpen && (
        <AccountSettingsModal onClose={() => setAccountSettingsOpen(false)} />
      )}
    </div>
  );
}

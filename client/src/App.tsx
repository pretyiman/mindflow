import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mapsApi } from './api/maps.api';
import { useGraphData } from './hooks/useGraphData';
import { useGraphStore } from './state/graphStore';
import { useAuthStore } from './state/authStore';
import AuthPage from './components/auth/AuthPage';
import GraphCanvas from './components/graph/GraphCanvas';
import FilterPanel from './components/panels/FilterPanel';
import NodeDetailPanel from './components/panels/NodeDetailPanel';
import Toolbar from './components/panels/Toolbar';
import ManageCategoriesModal from './components/settings/ManageCategoriesModal';
import ManageRelationTypesModal from './components/settings/ManageRelationTypesModal';
import ManageTagsModal from './components/settings/ManageTagsModal';
import ShareModal from './components/settings/ShareModal';

export default function App() {
  const queryClient = useQueryClient();
  const { token, user, logout } = useAuthStore();
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
    isShareOpen,
    setShareOpen
  } = useGraphStore();

  const mapsQuery = useQuery({ queryKey: ['maps'], queryFn: mapsApi.list, enabled: !!token });
  const graphQuery = useGraphData(token ? currentMapId : null);
  const currentMap = mapsQuery.data?.find((m) => m.id === currentMapId);
  // Defaults to the most restrictive role while the map list is still loading,
  // so edit affordances never flash on before the real role is known.
  const myRole = currentMap?.myRole ?? 'VIEWER';
  const canEdit = myRole === 'OWNER' || myRole === 'EDITOR';
  const isOwner = myRole === 'OWNER';

  useEffect(() => {
    if (!currentMapId && mapsQuery.data && mapsQuery.data.length > 0) {
      setCurrentMapId(mapsQuery.data[0].id);
    }
  }, [mapsQuery.data, currentMapId, setCurrentMapId]);

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
      <div className="account-badge">
        <span>{user?.email}</span>
        <button className="icon-btn" onClick={logout} title="Log out">
          ⎋
        </button>
      </div>
      <div className="main-column">
        <Toolbar
          maps={mapsQuery.data ?? []}
          currentMapId={currentMapId}
          onSelectMap={setCurrentMapId}
          onCreateMap={handleCreateMap}
          onDeleteMap={handleDeleteMap}
          graph={graphQuery.data ?? null}
          onNodeAdded={handleGraphChanged}
          onOpenCategories={() => setManageCategoriesOpen(true)}
          onOpenRelationTypes={() => setManageRelationTypesOpen(true)}
          onOpenTags={() => setManageTagsOpen(true)}
          onOpenShare={() => setShareOpen(true)}
          canEdit={canEdit}
          isOwner={isOwner}
        />
        {graphQuery.data && <FilterPanel graph={graphQuery.data} />}
        {graphQuery.data && currentMapId ? (
          <GraphCanvas
            mapId={currentMapId}
            data={graphQuery.data}
            selectedNodeId={selectedNodeId}
            onNodeClick={selectNode}
            onBackgroundClick={clearSelection}
            onChanged={handleGraphChanged}
            canEdit={canEdit}
          />
        ) : (
          <div className="empty-state">
            {currentMapId ? 'Loading graph...' : 'Create or select a map to get started.'}
          </div>
        )}
      </div>

      {graphQuery.data && (
        <NodeDetailPanel
          graph={graphQuery.data}
          selectedNodeId={selectedNodeId}
          onClose={clearSelection}
          onChanged={handleGraphChanged}
          canEdit={canEdit}
        />
      )}

      {isManageCategoriesOpen && currentMapId && graphQuery.data && (
        <ManageCategoriesModal
          mapId={currentMapId}
          graph={graphQuery.data}
          onClose={() => setManageCategoriesOpen(false)}
          onChanged={handleGraphChanged}
        />
      )}
      {isManageRelationTypesOpen && currentMapId && graphQuery.data && (
        <ManageRelationTypesModal
          mapId={currentMapId}
          graph={graphQuery.data}
          onClose={() => setManageRelationTypesOpen(false)}
          onChanged={handleGraphChanged}
        />
      )}
      {isManageTagsOpen && currentMapId && graphQuery.data && (
        <ManageTagsModal
          mapId={currentMapId}
          graph={graphQuery.data}
          onClose={() => setManageTagsOpen(false)}
          onChanged={handleGraphChanged}
        />
      )}
      {isShareOpen && currentMapId && isOwner && (
        <ShareModal mapId={currentMapId} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

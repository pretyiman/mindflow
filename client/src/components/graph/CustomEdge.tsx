import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import type { RFEdge } from './graphAdapter';

const DASH_PATTERNS: Record<string, string | undefined> = {
  solid: undefined,
  dashed: '10 6',
  dotted: '2 5'
};

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style
}: EdgeProps<RFEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  // `style` carries render-time overrides (currently just filter-dimming opacity) that
  // aren't part of the edge's persisted data, so it's merged on top rather than replacing.
  const opacity = (style as { opacity?: number } | undefined)?.opacity ?? 1;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: data?.color ?? '#cccccc',
          strokeWidth: data?.width ?? 2,
          strokeDasharray: data?.lineStyle ? DASH_PATTERNS[data.lineStyle] : undefined,
          opacity
        }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="flow-edge-label"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              color: data.color,
              opacity
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

import type { NodeProps } from '@xyflow/react';
import type { RFGroupNode } from './graphAdapter';

export default function GroupNode({ data, selected }: NodeProps<RFGroupNode>) {
  return (
    <div
      className={`flow-group${selected ? ' flow-group-selected' : ''}`}
      style={{ borderColor: data.color }}
    >
      {data.name && <div className="flow-group-label">{data.name}</div>}
    </div>
  );
}

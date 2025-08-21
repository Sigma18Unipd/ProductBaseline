import { Handle, Position } from '@xyflow/react';
import { Card, CardTitle } from '@/components/ui/card';

export function AiSummarize() {
  return (
    <Card style={{ padding: '20px' }} className='gap-2'>
      <Handle type='target' position={Position.Left} isConnectable />
      <div className='flex items-center gap-6'>
        <div className='justify-between'>
          <CardTitle>AI: Summarize</CardTitle>
          <span style={{ fontSize: '14px', color: 'gray' }}>Using last block output as input</span>
        </div>
      </div>
      <Handle type='source' position={Position.Right} isConnectable />
    </Card>
  );
}

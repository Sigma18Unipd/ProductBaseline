import { Handle, Position } from '@xyflow/react';
import { Card, CardTitle } from '@/components/ui/card';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReactFlow } from '@xyflow/react';

export function AiSummarize({ id }: { id: string }) {
  const reactFlowInstance = useReactFlow();
  return (
    <Card style={{ padding: '20px' }} className='gap-2'>
      <Handle type='target' position={Position.Left} isConnectable />
      <div className='flex items-center gap-6'>
        <div className='justify-between'>
          <CardTitle>AI: Summarize</CardTitle>
          <span style={{ fontSize: '14px', color: 'gray' }}>Using last block output as input</span>
        </div>
        <Button 
          variant="ghost"
          size='icon'
          onClick={()=> {
          reactFlowInstance.setNodes((nodeList) => nodeList.filter((thisNode) => thisNode.id !== id));
        }}>
          <Trash className='h-4 w-4' />
        </Button>
      </div>
      <Handle type='source' position={Position.Right} isConnectable />
    </Card>
  );
}

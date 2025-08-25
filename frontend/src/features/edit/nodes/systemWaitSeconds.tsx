import { useReactFlow, Handle, Position } from '@xyflow/react';
import { Card, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function SystemWaitSeconds({ id, data }: { id: string, data: { seconds: string } }) {
  const [seconds, setSeconds] = useState(data.seconds);
  const [draftSeconds, setDraftSeconds] = useState(seconds);
  const reactFlowInstance = useReactFlow();
  return (
    <Card style={{ padding: '20px 10px 20px 20px' }} className='gap-2'>
      <Handle type='target' position={Position.Left} isConnectable />
      <div className='flex items-center gap-6'>
        <div className='justify-between'>
          <CardTitle>System: Wait Seconds</CardTitle>
          <span style={{ fontSize: '14px', color: 'gray' }}>{seconds} seconds</span>
        </div>
        <Dialog onOpenChange={(open) => {
            if (open) setDraftSeconds(seconds);
          }}>
          <DialogTrigger asChild>
            <Button variant='ghost' size='icon'>
              <Settings className='h-4 w-4' />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block Settings</DialogTitle>
            </DialogHeader>
            <p>Here you can configure the settings for this <em>System: Wait (Seconds)</em> block.</p>
            <div className='grid gap-2'>
              <Label>Seconds</Label>
              <Input
                type='text'
                value={draftSeconds}
                onChange={(e) => setDraftSeconds(e.target.value)}
              />
            </div>
            <DialogFooter>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    reactFlowInstance.setNodes((nodeList) => nodeList.filter((thisNode) => thisNode.id !== id));
                  }}
                >
                  Remove Block
              </Button>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={() => {
                  setSeconds(draftSeconds)
                  reactFlowInstance.setNodes((nodeList) =>
                    nodeList.map((thisNode) => {
                      if (thisNode.id === id) {
                        thisNode.data = { ...thisNode.data, seconds: draftSeconds }
                      }
                      return thisNode
                    })
                  )
                }}>Save</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Handle type='source' position={Position.Right} isConnectable />
    </Card>
  );
}

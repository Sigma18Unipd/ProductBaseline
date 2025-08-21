import { useReactFlow, Handle, Position } from '@xyflow/react';
import { Card, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function NotionGetPage({ id, data }: { id: string, data: { internalIntegrationToken: string, pageID: string } }) {
  const [internalIntegrationToken, setInternalIntegrationToken] = useState(data.internalIntegrationToken)
  const [draftInternalIntegrationToken, setDraftInternalIntegrationToken] = useState(internalIntegrationToken);
  const [pageID, setPageID] = useState(data.pageID);
  const [draftPageID, setDraftPageID] = useState(pageID);
  const reactFlowInstance = useReactFlow();

  return (
    <Card style={{ padding: '20px 10px 20px 20px' }} className='gap-2'>
      <Handle type='target' position={Position.Left} isConnectable />
      <div className='flex justify-between items-center gap-6'>
        <div className='justify-between'>
          <CardTitle>Notion: Get Page</CardTitle>
          <span style={{ fontSize: '14px', color: 'gray' }}>
            {pageID.length > 20 ? pageID.slice(0, 20) + '…' : pageID}
          </span>
        </div>
        <Dialog onOpenChange={(open) => {
            if (open) {
              setDraftInternalIntegrationToken(internalIntegrationToken);
              setDraftPageID(pageID);
            }
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
            <p>Here you can configure the settings for this <em>Notion: Get Page</em> block.</p>
            <div className='grid gap-2'>
              <Label>Internal Integration Token</Label>
              <Input type='text' placeholder='Enter your Internal Integration Token' value={draftInternalIntegrationToken} onChange={(e) => setDraftInternalIntegrationToken(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label>Page ID</Label>
              <Input type='text' placeholder='Enter your Page ID' value={draftPageID} onChange={(e) => setDraftPageID(e.target.value)} />
            </div>
            <DialogFooter>
               <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={() => {
                  setInternalIntegrationToken(draftInternalIntegrationToken);
                  setPageID(draftPageID);
                  reactFlowInstance.setNodes((nodeList) =>
                    nodeList.map((thisNode) => {
                      if (thisNode.id === id) {
                        thisNode.data = { ...thisNode.data, internalIntegrationToken: draftInternalIntegrationToken, pageID: draftPageID };
                      }
                      return thisNode;
                    })
                  );
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

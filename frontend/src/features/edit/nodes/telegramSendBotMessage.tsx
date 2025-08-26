import { useReactFlow, Handle, Position } from '@xyflow/react';
import { Card, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function TelegramSendBotMessage({ id, data }: { id: string, data: { botToken: string, chatId: string, message?: string } }) {
  const [botToken, setBotToken] = useState(data.botToken)
  const [draftBotToken, setDraftBotToken] = useState(botToken);
  const [chatId, setChatId] = useState(data.chatId);
  const [draftChatId, setDraftChatId] = useState(chatId);
  const [message, setMessage] = useState(data.message  || '');
  const [draftMessage, setDraftMessage] = useState(message);
  const reactFlowInstance = useReactFlow();

  return (
    <Card style={{ padding: '20px 10px 20px 20px' }} className='gap-2'>
      <Handle type='target' position={Position.Left} isConnectable />
      <div className='flex justify-between items-center gap-6'>
        <div className='justify-between'>
          <CardTitle>Telegram: Send Bot Message</CardTitle>
          {message === '{{LASTOUTPUT}}' ? (
            <span style={{ fontSize: '14px', color: 'gray' }}>Using last block output as input</span>
          ) : (
            <span style={{ fontSize: '14px', color: 'gray' }}>
              {message.length > 20 ? message.slice(0, 20) + '…' : message}
            </span>
          )}
        </div>
        <Dialog onOpenChange={(open) => {
            if (open) {
              setDraftBotToken(botToken);
              setDraftChatId(chatId);
              setDraftMessage(message);
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
            <p>Here you can configure the settings for this <em>Telegram: Send Bot Message</em> block.</p>
            <div className='grid gap-2'>
              <Label>Bot Token</Label>
              <Input type='text' placeholder='Enter your Bot token' value={draftBotToken} onChange={(e) => setDraftBotToken(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label>Chat ID</Label>
              <Input type='text' placeholder='Enter your Chat ID' value={draftChatId} onChange={(e) => setDraftChatId(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label>Message</Label>
              <Input type='text' placeholder='Enter your message' value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} />
              <p className='text-sm text-gray-500'>To reference the output of the previous block as message (if available), click <span onClick={() => setDraftMessage('{{LASTOUTPUT}}')} className='cursor-pointer underline'>here</span> to set <code>{`{{LASTOUTPUT}}`}</code>.</p>
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
                  setBotToken(draftBotToken);
                  setChatId(draftChatId);
                  setMessage(draftMessage);
                  reactFlowInstance.setNodes((nodeList) =>
                    nodeList.map((thisNode) => {
                      if (thisNode.id === id) {
                        thisNode.data = { ...thisNode.data, botToken: draftBotToken, chatId: draftChatId, message: draftMessage };
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

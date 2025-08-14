import { Handle, Position } from '@xyflow/react';
import { Card, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function telegramSendBotMessage({ data }: { data: { botToken: string, chatId: string, message?: string } }) {
  return (
    <Card style={{ padding: '20px 10px 20px 20px' }} className='gap-2'>
      <Handle type='target' position={Position.Left} isConnectable />
      <div className='flex justify-between items-center gap-6'>
        <CardTitle>Telegram - Send Bot Message</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='ghost' size='icon'>
              <Settings className='h-4 w-4' />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block Settings</DialogTitle>
            </DialogHeader>
            Here you can configure the settings for this block.
            <div className='grid gap-2'>
              <Label>Bot Token</Label>
              <Input type='text' placeholder='Enter your Bot token' defaultValue={data.botToken} />
            </div>
            <div className='grid gap-2'>
              <Label>Chat ID</Label>
              <Input type='text' placeholder='Enter your Chat ID' defaultValue={data.chatId} />
            </div>
            <div className='grid gap-2'>
              <Label>Message</Label>
              <Input type='text' placeholder='Enter your message' defaultValue={data.message} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Save</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Handle type='source' position={Position.Right} isConnectable />
    </Card>
  );
}

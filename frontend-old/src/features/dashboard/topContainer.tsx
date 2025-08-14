import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';


function logout() {
  axios.post("http://localhost:5000/logout", {}, { withCredentials: true }).then((res) => {
    if (res.status === 200 ) {
      window.location.href = "/login";
    }
  })
}



function createNewWorkflow(newWorkflowName: string) {
  axios.post("http://localhost:5000/api/new", { 'name': newWorkflowName }, { withCredentials: true }).then((res) => {
    if (res.status === 200 && res.data.id) {
      window.location.href = `/edit/${res.data.id}`;
    }
  }).catch((error) => {
    console.error('Failed to create workflow:', error);
  });
}



export function TopContainer() {
  const [newWorkflowName, setNewWorkflowName] = useState('');
  return (
    <div className='flex items-center place-content-between' style={{ margin: '0 24px', gridArea: 'topContainer' }}>
      <div>Sigma18 PoC v1.7.10 Pro Max</div>
      <div className='flex gap-4'>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create a Workflow</Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>Create a new workflow</DialogTitle>
            </DialogHeader>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name-1'>Name</Label>
                <Input onChange={(e) => setNewWorkflowName(e.target.value)} type='text' placeholder='Enter the name of your workflow' className='resize-none' />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
                <Button type='submit' onClick={() => createNewWorkflow(newWorkflowName)}>
                  Create
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant={'destructive'} onClick={() => logout()}>Logout</Button>
      </div>
    </div>
  );
}

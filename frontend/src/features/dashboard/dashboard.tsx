import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Play } from 'lucide-react';
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import axios from 'axios';

axios.defaults.withCredentials = true;

type Workflow = {
  id: number;
  clientEmail: string;
  name: string;
  contents: string;
};



function createNewWorkflow(newWorkflowName: string) {
  axios.post('http://localhost:5000/api/new', { name: newWorkflowName })
    .then(res => {
      window.location.href = `/edit/${res.data.id}`;
    })
    .catch(error => {
      toast.error(error.response?.data?.error || "An error occurred during the creation of your workflow");
    });
}



document.addEventListener("readystatechange", () => {
  if (document.readyState === "complete") {
    setTimeout(() => {
      if (localStorage.getItem("nextPageAlert")) {
        toast.error(localStorage.getItem("nextPageAlert"));
        localStorage.removeItem("nextPageAlert");
      }
    }, 1000);
  }
});



export default function Dashboard() {
  const navigate = useNavigate();
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .post('http://localhost:5000/dashboard')
      .then(res => {
        setLoading(false);
        setWorkflows(res.data.flows);
        setEmail(res.data.email);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);
  if (loading) return null;
  return (
    <div className="grid grid-cols-1 [grid-template-rows:80px_1fr] [grid-template-areas:'topContainer''listContainer'] h-screen">
      <Toaster />
      <div className="flex items-center place-content-between mx-[24px]" style={{ gridArea: 'topContainer' }}>
        <div>{email}</div>
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
                  <Input
                    onChange={e => setNewWorkflowName(e.target.value)}
                    type='text'
                    placeholder='Enter the name of your workflow'
                    className='resize-none'
                  />
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
          <Button variant={'destructive'} onClick={() => {
            axios.post('http://localhost:5000/logout', {}, { withCredentials: true })
            .then((res) => {
              if (res.status === 200) window.location.href = '/login';
            });
          }}>
            Logout
          </Button>
        </div>
      </div>
      <div className="[grid-area:listContainer] flex flex-col gap-[10px] items-center pt-5">
        {workflows.length > 0 ? (
          workflows.map(workflow => (
            <Card
              className='w-full max-w-sm'
              onClick={() => (window.location.href = `/edit/${workflow.id}`)}
              key={workflow.id}
            >
              <div className="flex justify-between items-center gap-6 pr-[10px] pl-5">
                {workflow.name}
                <Button variant='ghost' size='icon'>
                  <Play className='h-4 w-4' />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <p className="text-center text-gray-500">Create a workflow to start</p>
          </div>
        )}
      </div>
    </div>
  );
}

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RainbowButton } from '@/components/magicui/rainbow-button';
import axios from 'axios';
import type { Edge, Node } from '@xyflow/react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PencilIcon } from "lucide-react"

export function TopContainer(
  props: { 
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    nodes: Node[];
    edges: Edge[];
    name: string;
  }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promptValue, setPromptValue] = useState('');
  const [newName, setNewName] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openAiWorkflowDialog, setOpenAiWorkflowDialog] = useState(false);
  const [openChangeNameDialog, setOpenChangeNameDialog] = useState(false);
  return (
    <div className='flex items-center place-content-between' style={{ margin: '0 24px', gridArea: 'topContainer' }}>
      <div>
        <Button onClick= { ()=> { navigate("/dashboard") }}>Back to Dashboard</Button>
        <span style={{ marginLeft: 20 }}>{props.name}</span>




    <Dialog open={openChangeNameDialog} onOpenChange={setOpenChangeNameDialog}>
      <DialogTrigger asChild>
        <Button style={{ marginLeft: 5 }}  variant="ghost" size="icon">
          <PencilIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>Edit Workflow Name</DialogTitle>
            </DialogHeader>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name-1'>Insert a new name</Label>
                <Input type='text' onChange={(e) => setNewName(e.target.value)} placeholder='New name here' />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <Button
                onClick={async () => {
                  axios.post('http://localhost:5000/api/flows/${id}/editName', { 'newName': newName }, { withCredentials: true }).then(res => {
                    console.log(res.data);
                  }).finally(() => {
                    console.log("Name changed");
                    setOpenChangeNameDialog(false);
                  })}}>
                Edit Name
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>






      </div>
      <div className='flex gap-4'>
        <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <DialogTrigger asChild>
            <Button variant={'destructive'}>Delete</Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>Delete workflow</DialogTitle>
              <DialogDescription>Are you sure you want to delete this workflow?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <Button variant='destructive'
                onClick={() => {
                  axios.delete(`http://localhost:5000/api/flows/${id}/delete`, { withCredentials: true })
                    .then(res => {
                      console.log("Workflow deleted", res.data);
                      navigate("/dashboard");
                    })
                    .catch(err => {
                      console.error("Error deleting workflow:", err);
                    })
                    .finally(() => {
                      setOpenDeleteDialog(false);
                    });
                }}>
                Delete Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={openAiWorkflowDialog} onOpenChange={setOpenAiWorkflowDialog}>
          <DialogTrigger asChild>
            <RainbowButton>AI Workflow Builder</RainbowButton>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>AI Workflow Builder</DialogTitle>
              <DialogDescription>From words to workflows, powered by AI.</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name-1'>Prompt</Label>
                <Textarea onChange={(e) => setPromptValue(e.target.value)} placeholder='Describe your workflow here' className='resize-none' />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <RainbowButton
                onClick={async () => {
                  console.log("Prompt value:", promptValue);
                  axios.post('http://localhost:5000/api/flows/prompt', { 'prompt': promptValue }, { withCredentials: true }).then(res => {
                    console.log(res.data);
                    props.setNodes(res.data.nodes);
                    props.setEdges(res.data.edges);
                  }).finally(() => {
                    console.log("Workflow generated");
                    setOpenAiWorkflowDialog(false);
                  })}}>
                Generate Workflow
              </RainbowButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button onClick={() => {
          const workflowData = {
            name: props.name,
            contents: JSON.stringify({
              nodes: props.nodes,
              edges: props.edges
            })
          };
          console.log("Saving workflow data:", workflowData);
          axios.post(`http://localhost:5000/api/flows/${id}/save`, workflowData, { withCredentials: true }).then(res => {
            console.log("Workflow saved", res.data);
          }).catch(err => {
            console.error("Error saving workflow:", err);
          });
        }}>
          Save
        </Button>
        <Button onClick={() => {
          const workflowData = {
            name: props.name,
            contents: JSON.stringify({
              nodes: props.nodes,
              edges: props.edges
            })
          };
          console.log("Saving workflow data:", workflowData);
          axios.post(`http://localhost:5000/api/flows/${id}/save`, workflowData, { withCredentials: true }).then(res => {
            console.log("Workflow saved", res.data);
            console.log("Workflow run initiated");
            axios.post(`http://localhost:5000/api/flows/${id}/run`, { withCredentials: true }).then(res => {
              console.log("Workflow run response:", res.data);
            }).catch(err => {
              console.error("Error running workflow:", err);
            });
          }).catch(err => {
            console.error("Error saving workflow:", err);
          });
        }}>Run</Button>
      </div>
    </div>
  );
}

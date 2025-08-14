/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
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
import { RainbowButton } from '@/components/magicui/rainbow-button';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useCallback} from 'react';
import { useNavigate, useParams } from 'react-router';
import { systemWaitSeconds } from './nodes/systemWaitSeconds';
import { telegramSendBotMessage } from './nodes/telegramSendBotMessage';
import axios from 'axios';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { PencilIcon } from "lucide-react"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"



const nodeTypes = { systemWaitSeconds: systemWaitSeconds, telegramSendBotMessage: telegramSendBotMessage };
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];



export default function Edit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const [workflowName, setWorkflowName] = useState('');
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [openChangeNameDialog, setOpenChangeNameDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openAiWorkflowDialog, setOpenAiWorkflowDialog] = useState(false);
  const [promptValue, setPromptValue] = useState('');
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // ------------ GET DATA --------------
  useEffect(() => {
    axios.post(`http://localhost:5000/api/flows/${id}`)
      .then((res) => {
        setLoading(false);
        setWorkflowName(res.data.name);
        if (res.data.contents !== "") {
          const contents = JSON.parse(res.data.workflow.contents);
          setNodes(contents['nodes']);
          setEdges(contents['edges']);
        }
      })
      .catch((err) => {
        localStorage.setItem('nextPageAlert', err.response.data.error);
        navigate('/dashboard');
      });
  }, [id, navigate]);

  // ------------ REACTFLOW STUFF --------------
  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params: any) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );
  if (loading) return null;

  return (
    <div className="grid grid-cols-1 [grid-template-rows:80px_1fr] [grid-template-areas:'topContainer''editorContainer'] h-screen">
      <Toaster />
      <div className='flex items-center place-content-between' style={{ margin: '0 24px', gridArea: 'topContainer' }}>
        <div className='flex gap-4 items-center'>
          <Button onClick= { ()=> { navigate("/dashboard") }}>Back to Dashboard</Button>
          <span style={{ marginLeft: 8 }}>{workflowName}</span>
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
                  <Label htmlFor='name-1'>Rename your workflow</Label>
                  <Input type='text' onChange={(e) => setNewWorkflowName(e.target.value)} placeholder='New name here' />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant='outline'>Cancel</Button>
                </DialogClose>
                <Button
                  onClick={async () => {
                    setWorkflowName(newWorkflowName);
                    setOpenChangeNameDialog(false);
                  }}>
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
                    //TODO
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
                  onClick={() => {
                    //TODO
                  }}>
                  Generate Workflow
                </RainbowButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => {
            //TODO
          }}>
            Save
          </Button>
          <Button onClick={() => {
            //TODO
          }}>Run</Button>
        </div>
      </div>
      <div style={{ gridArea: 'editorContainer' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          proOptions={{ hideAttribution: true }}
          fitView>
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

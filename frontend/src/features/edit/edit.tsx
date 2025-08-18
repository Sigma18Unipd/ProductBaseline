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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"



axios.defaults.withCredentials = true;
const nodeTypes = { systemWaitSeconds: systemWaitSeconds, telegramSendBotMessage: telegramSendBotMessage };
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];



export default function Edit() {
  const [blockSearch, setBlockSearch] = useState("");
  const blockList = [
    {
      key: 'systemWaitSeconds',
      label: 'System: Wait (Seconds)',
      data: { seconds: '0' }
    },
    {
      key: 'telegramSendBotMessage',
      label: 'Telegram: Send Bot Message',
      data: { botToken: 'TOKEN HERE', chatId: 'CHAT ID HERE', message: 'MESSAGE HERE' }
    }
  ];
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
        try {
          const contents = JSON.parse(res.data.contents);
          setNodes(contents['nodes']);
          setEdges(contents['edges']);
        } catch (error) { /* empty */ } 
      })
      .catch((err) => {
        localStorage.setItem('nextPageAlert', err.response?.data?.error);
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
      <div className='flex items-center place-content-between px-[24px]' style={{ gridArea: 'topContainer', borderBottom: '1px solid #e5e5e5' }}>
        <div className='flex gap-4 items-center'>
          <Button onClick={()=> { navigate("/dashboard") }}>Back to Dashboard</Button>
          <div className='flex gap-4 items-center' style={{ paddingLeft: "10px", border: '1px solid #e5e5e5', borderRadius: 'var(--radius)' }}>
            <span>{workflowName}</span>
            <Dialog open={openChangeNameDialog} onOpenChange={setOpenChangeNameDialog}>
              <DialogTrigger asChild>
                <span>
                  <Button size="icon" variant="ghost">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </span>
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
        </div>
        <div className='flex gap-4'>
          <Sheet>
            <SheetTrigger asChild>
              <span>
                <Button>Add a Block</Button>
              </span>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Block list</SheetTitle>
                <SheetDescription>
                  Add manually a block to your workflow by clicking on it.
                </SheetDescription>
                
                <div className="grid gap-2 mt-2">
                  <Input
                    type="text"
                    placeholder="Search blocks..."
                    value={blockSearch}
                    onChange={e => setBlockSearch(e.target.value)}
                  />
                  {blockList
                    .filter(block => block.label.toLowerCase().includes(blockSearch.toLowerCase()))
                    .map(block => (
                    <Button
                      key={block.key}
                      variant="outline"
                      onClick={() => {
                        const newNode: Node = {
                          id: `${block.key}-${Date.now()}`,
                          type: block.key,
                          position: { x: 0, y: 0 },
                          data: block.data
                        };
                        setNodes(nodes => [...nodes, newNode]);
                      }}
                    >
                      {block.label}
                    </Button>
                  ))}
                </div>
              </SheetHeader>
            </SheetContent>
          </Sheet>
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
                    axios.post('http://localhost:5000/api/prompt', { prompt: promptValue })
                      .then((res) => {
                        console.log("AI Workflow Response: ", res.data);
                        setNodes(res.data.nodes);
                        setEdges(res.data.edges);
                      })
                      .catch((err) => {
                        toast.error(err.response?.data?.error || "An error occurred while generating the workflow");
                      });
                    setOpenAiWorkflowDialog(false);
                  }}>
                  Generate Workflow
                </RainbowButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger style={{ border: '1px solid #e5e5e5' }}>Workflow Menu</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavigationMenuLink asChild><Button variant={'ghost'} onClick={() => {
                    axios.post(`http://localhost:5000/api/flows/${id}/save`, {
                      name: workflowName,
                      contents: JSON.stringify({ nodes, edges }),
                    })
                      .then(() => {
                        toast.error("Workflow saved successfully");
                      })
                      .catch(err => {
                        toast.error(err.response?.data?.error || "An error occurred while saving the workflow");
                      });
                  }}>Save</Button></NavigationMenuLink>
                  <NavigationMenuLink asChild><Button variant={'ghost'}>Run</Button></NavigationMenuLink>
                  <Separator />
                  <NavigationMenuLink asChild><Button variant={'ghost'} onClick={() => setOpenDeleteDialog(true)}>Delete</Button></NavigationMenuLink>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
            <DialogContent className='sm:max-w-[500px]'>
              <DialogHeader>
                <DialogTitle>Delete workflow</DialogTitle>
                <DialogDescription>Are you sure you want to delete this workflow?</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant='outline'>Cancel</Button>
                </DialogClose>
                <Button variant='destructive' onClick={() => {
                  axios.delete(`http://localhost:5000/api/flows/${id}/delete`)
                    .then(() => {
                      localStorage.setItem("nextPageAlert", "Workflow deleted successfully");
                      navigate("/dashboard");
                    })
                    .catch(err => {
                      localStorage.setItem("nextPageAlert", err.response?.data?.error);
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

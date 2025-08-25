/* eslint-disable @typescript-eslint/no-unused-vars */
import { ReactFlow, Controls, Background, addEdge, applyEdgeChanges, applyNodeChanges, type Node, type Edge, type NodeChange, type EdgeChange } from '@xyflow/react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RainbowButton } from '@/components/magicui/rainbow-button';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useCallback} from 'react';
import { useNavigate, useParams } from 'react-router';
import { SystemWaitSeconds } from './nodes/systemWaitSeconds';
import { TelegramSendBotMessage } from './nodes/telegramSendBotMessage';
import axios from 'axios';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import confetti from "canvas-confetti";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Save, Play, Delete, Edit2, ChevronLeft } from "lucide-react";
import { AiSummarize } from './nodes/aiSummarize';
import { NotionGetPage } from './nodes/notionGetPage';
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';





function confettiAIAnimation() {
  const end = Date.now() + 3 * 1000;
  const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
  const frame = () => {
    if (Date.now() > end) return;
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });
    requestAnimationFrame(frame);
  };
  frame();
};





axios.defaults.withCredentials = true;
const nodeTypes = { systemWaitSeconds: SystemWaitSeconds, telegramSendBotMessage: TelegramSendBotMessage, aiSummarize: AiSummarize, notionGetPage: NotionGetPage };
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];
const blockList = [
  {
    key: 'systemWaitSeconds',
    label: 'System: Wait Seconds',
    data: { seconds: '0' }
  },
  {
    key: 'telegramSendBotMessage',
    label: 'Telegram: Send Bot Message',
    data: { botToken: 'TOKEN HERE', chatId: 'CHAT ID HERE', message: 'YOUR MESSAGE' }
  },
  {
    key: 'aiSummarize',
    label: 'AI: Summarize',
  },
  {
    key: 'notionGetPage',
    label: 'Notion: Get Page',
    data: { internalIntegrationToken: 'TOKEN HERE', pageID: 'PAGE ID HERE' }
  }
];





export default function Edit() {
  const [colorMode, setColorMode] = useState<'dark' | 'light'>(localStorage.getItem("theme") === "dark" ? "dark" : "light");
  const [blockSearch, setBlockSearch] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const [workflowName, setWorkflowName] = useState('');
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [openDialogMenu, setOpenDialogMenu] = useState(false);
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
  useEffect(() => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (k, v) {
      originalSetItem.apply(this, [k, v]);
      if (k === "theme"){
        setColorMode(v === "dark" ? "dark" : "light");
      };
    };
    return () => {
      localStorage.setItem = originalSetItem;
    };
  }, []);
  if (loading) return null;



  // ------------ WORKFLOW FUNCTIONS --------------
  function saveWorkflow() {
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
  }
  function deleteWorkflow() {
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
  }
  function runWorkflow() {
    saveWorkflow();
    axios.post(`http://localhost:5000/api/flows/${id}/run`)
      .then(() => {
        toast.error("Workflow started successfully");
      })
      .catch(err => {
        toast.error(err.response?.data?.error || "An error occurred while while running the workflow");
      });
  }



  return (
    <div className="grid grid-cols-1 [grid-template-rows:80px_1fr] [grid-template-areas:'topContainer''editorContainer'] h-screen">
      <Toaster />
      <div className='flex items-center place-content-between px-[24px]' style={{ gridArea: 'topContainer', borderBottom: '1px solid #e5e5e5' }}>
        <div className='flex gap-4 items-center'>
          <Button onClick={() => setOpenDialogMenu(true)}>Workflow Menu</Button>
          <CommandDialog className="rounded-lg border shadow-md md:min-w-[450px]" open={openDialogMenu} onOpenChange={setOpenDialogMenu}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Actions"> 
                <CommandItem onSelect={() => {
                  saveWorkflow();
                  setOpenDialogMenu(false);
                }}>
                  <Save />
                  <span>Save</span>
                </CommandItem>
                <CommandItem onSelect={() => {
                  runWorkflow();
                  setOpenDialogMenu(false);
                }}>
                  <Play />
                  <span>Run</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                <CommandItem onSelect={() => {
                  setOpenDeleteDialog(true);
                  setOpenDialogMenu(false);
                }}>
                  <Delete/>
                  <span>Delete Workflow</span>
                </CommandItem>
                <CommandItem onSelect={() => {
                  setOpenChangeNameDialog(true);
                  setOpenDialogMenu(false);
                }}>
                  <Edit2 />
                  <span>Edit Workflow Name</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={() => {
                  navigate("/dashboard");
                  setOpenDialogMenu(false);
                }}>
                  <ChevronLeft />
                  <span>Back to Dashboard</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
          <div className='flex gap-4 items-center'>
          {workflowName}
          </div>
        </div>
        <div className='flex gap-4'>
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
                        setOpenAiWorkflowDialog(false);
                        confettiAIAnimation();
                      })
                      .catch((err) => {
                        setOpenAiWorkflowDialog(false);
                        toast.error(err.response?.data?.error || "An error occurred while generating the workflow");
                      });
                  }}>
                  Generate Workflow
                </RainbowButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  {blockList.filter(block => block.label.toLowerCase().includes(blockSearch.toLowerCase()))
                    .map(block => (
                    <Button
                      key={block.key}
                      variant="outline"
                      onClick={() => {
                        const newNode: Node = {
                          id: `${block.key}-${Date.now()}`,
                          type: block.key,
                          position: { x: Math.random() * 300, y: Math.random() * 300 },
                          data: block.data ?? {}
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
          <AnimatedThemeToggler />
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
                <Button variant='destructive' onClick={deleteWorkflow}>
                  Delete Workflow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={openChangeNameDialog} onOpenChange={setOpenChangeNameDialog}>
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
      <div style={{ gridArea: 'editorContainer' }}>
        <ReactFlow
          onContextMenu={e => {
            e.preventDefault();
            setOpenDialogMenu(true);
          }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          colorMode={colorMode}
          proOptions={{ hideAttribution: true }}
          fitView>
          <Controls />
          <Background />
        </ReactFlow>
      </div>
  </div>
  );
}

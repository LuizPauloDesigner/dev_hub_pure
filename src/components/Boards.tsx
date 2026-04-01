import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp, Board, BoardElement, BoardConnection } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Plus, StickyNote, ImageIcon, Trash2, Settings, Columns, ChevronLeft, Search, Maximize2, Move, LayoutGrid, CheckSquare, Heading as HeadingIcon, Table as TableIcon, MessageCircle, FolderOpen, ArrowUpRight, Upload, Pencil, FileText, Video, Music, Map, Palette, MoreHorizontal, ExternalLink, Code, Zap, Layers, Sparkles, Link2, Calendar, UserPlus, Smile, Type, Baseline, ArrowRight, Clock, Layout, SmilePlus, ArrowLeft, MoreVertical, Minus, Type as TypeIconSquare, File, Mic2, MapPin, Play, Grab, MousePointer2, Eraser, Trash, Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// -- Constants --
const CANVAS_PADDING = 3000;
const ELEMENT_SIZES = {
  small: { width: 140, height: 100 },
  medium: { width: 220, height: 140 },
  large: { width: 320, height: 220 }
};

const CARD_COLORS = [
  { name: 'Padrão', value: 'bg-card border-border' },
  { name: 'Amarelo', value: 'bg-yellow-100/60 dark:bg-yellow-900/20 border-yellow-300/50 dark:border-yellow-800/50 shadow-sm' },
  { name: 'Azul', value: 'bg-blue-100/60 dark:bg-blue-900/20 border-blue-300/50 dark:border-blue-800/50 shadow-sm' },
  { name: 'Verde', value: 'bg-green-100/60 dark:bg-green-900/20 border-green-300/50 dark:border-green-800/50 shadow-sm' },
  { name: 'Vermelho', value: 'bg-red-100/60 dark:bg-red-900/20 border-red-300/50 dark:border-red-800/50 shadow-sm' },
  { name: 'Roxo', value: 'bg-purple-100/60 dark:bg-purple-900/20 border-purple-300/50 dark:border-purple-800/50 shadow-sm' },
];

// -- SVG Line Component --
const SvgLine = ({ element, onUpdate, isSelected, onSelect, zoom, allElements = [] }: any) => {
  const { content } = element;
  const data = useMemo(() => {
    try { return content && content.startsWith('{') ? JSON.parse(content) : { endX: 200, endY: 200, startArrow: false, endArrow: true, weight: 3, dashed: false }; }
    catch(e) { return { endX: 200, endY: 200, startArrow: false, endArrow: true, weight: 3, dashed: false }; }
  }, [content]);

  const [pos, setPos] = useState({ endX: data.endX, endY: data.endY, startX: element.x, startY: element.y });
  
  useEffect(() => { 
     let sx = element.x; let sy = element.y;
     let ex = data.endX; let ey = data.endY;
     
     if (data.startNodeId) {
        const startNode = allElements.find((e:any) => e.id === data.startNodeId);
        if (startNode) { sx = startNode.x + (startNode.width||220)/2; sy = startNode.y + (startNode.height||140)/2; }
     }
     
     if (data.endNodeId) {
        const endNode = allElements.find((e:any) => e.id === data.endNodeId);
        if (endNode) {
           const absEX = endNode.x + (endNode.width||220)/2;
           const absEY = endNode.y + (endNode.height||140)/2;
           ex = absEX - sx; ey = absEY - sy;
        }
     }
     
     setPos({ endX: ex, endY: ey, startX: sx, startY: sy }); 
  }, [data, element.x, element.y, allElements]);

  return (
    <svg className={cn("absolute overflow-visible pointer-events-none z-0", isSelected && "z-[1000]")} style={{ left: pos.startX, top: pos.startY, width: 1, height: 1 }}>
      <defs>
        <marker id={`arrowhead-${element.id}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#4B5563" /></marker>
        <marker id={`arrowtail-${element.id}`} markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto-start-reverse"><polygon points="0 0, 10 3.5, 0 7" fill="#4B5563" /></marker>
      </defs>
      <line 
         x1="0" y1="0" x2={pos.endX} y2={pos.endY} 
         stroke={data.startNodeId || data.endNodeId ? "#eb3b5a" : "#4B5563"} strokeWidth={data.weight || 3} strokeDasharray={data.dashed ? "8,6" : "none"}
         markerEnd={data.endArrow ? `url(#arrowhead-${element.id})` : ''}
         markerStart={data.startArrow ? `url(#arrowtail-${element.id})` : ''}
         className="pointer-events-auto cursor-pointer transition-colors hover:stroke-primary"
         onMouseDown={(e) => { e.stopPropagation(); onSelect(element.id, e.shiftKey || e.ctrlKey); }}
      />
      {isSelected && (
        <>
          <circle cx="0" cy="0" r="6" fill="white" stroke="#4B5563" strokeWidth="2" className="pointer-events-auto cursor-move shadow-md hover:scale-110 active:scale-95 transition-transform" onMouseDown={(e)=>{
             e.stopPropagation(); const sX = e.clientX; const sY = e.clientY; const ix = element.x; const iy = element.y;
             let lastX = ix, lastY = iy;
             const onMM = (ev: MouseEvent) => { const dx=(ev.clientX-sX)/zoom; const dy=(ev.clientY-sY)/zoom; lastX=Math.round((ix+dx)/10)*10; lastY=Math.round((iy+dy)/10)*10; setPos(p => ({...p, startX: lastX, startY: lastY})); };
             const onMU = () => { 
                window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU); 
                let tId = null;
                for (const cd of allElements) {
                   if(cd.id===element.id||cd.type==='line') continue;
                   const bw=cd.width||220; const bh=cd.height||140;
                   if(lastX>cd.x && lastX<cd.x+bw && lastY>cd.y && lastY<cd.y+bh){ tId=cd.id; break; }
                }
                if(tId) toast.success("Base conectada inteligentemente!");
                onUpdate(element.id, { x: lastX, y: lastY, content: JSON.stringify({...data, startNodeId: tId}) }); 
             };
             window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU);
          }} />
          <circle cx={pos.endX} cy={pos.endY} r="6" fill="white" stroke="#4B5563" strokeWidth="2" className="pointer-events-auto cursor-move shadow-md hover:scale-110 active:scale-95 transition-transform" onMouseDown={(e)=>{
             e.stopPropagation(); const sX = e.clientX; const sY = e.clientY; const iex = pos.endX; const iey = pos.endY;
             let lastEndX = iex, lastEndY = iey;
             const onMM = (ev: MouseEvent) => { const dx=(ev.clientX-sX)/zoom; const dy=(ev.clientY-sY)/zoom; lastEndX=iex+dx; lastEndY=iey+dy; setPos(p => ({...p, endX: lastEndX, endY: lastEndY})); };
             const onMU = () => { 
                window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU); 
                let tId = null; const absX = pos.startX + lastEndX; const absY = pos.startY + lastEndY;
                for (const cd of allElements) {
                   if(cd.id===element.id||cd.type==='line') continue;
                   const bw=cd.width||220; const bh=cd.height||140;
                   if(absX>cd.x && absX<cd.x+bw && absY>cd.y && absY<cd.y+bh){ tId=cd.id; break; }
                }
                if(tId) toast.success("Alvo conectado inteligentemente!");
                onUpdate(element.id, { content: JSON.stringify({...data, endX: lastEndX, endY: lastEndY, endNodeId: tId}) }); 
             };
             window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU);
          }} />
        </>
      )}
    </svg>
  );
};

// -- Element Component --
const ElementCard = ({ element, onUpdate, onDelete, onNavigate, onSelect, selectedIds, zoom, allElements }: any) => {
  const [content, setContent] = useState(element.content);
  const [isEditing, setIsEditing] = useState(false);
  const sizeKey = (element.width && element.width < 180) ? 'small' : (element.width && element.width > 280) ? 'large' : 'medium';
  // Use explicit ts-ignore or typing if needed, but here simple mapping is fine
  const size = ELEMENT_SIZES[sizeKey as keyof typeof ELEMENT_SIZES];
  const isSelected = selectedIds?.includes(element.id);

  useEffect(() => {
    if (!isSelected) setIsEditing(false);
  }, [isSelected]);

  const defaultHeight = ['note', 'todo', 'comment', 'column', 'heading'].includes(element.type) ? 'auto' : size.height;
  const [pos, setPos] = useState({ x: element.x, y: element.y, w: element.width || size.width, h: element.height || defaultHeight });
  
  useEffect(() => { 
    setPos({ x: element.x, y: element.y, w: element.width || size.width, h: element.height || defaultHeight }); 
  }, [element.x, element.y, element.width, element.height, size.width, defaultHeight]);

  if (element.type === 'line') return <SvgLine element={element} onUpdate={onUpdate} isSelected={isSelected} onSelect={onSelect} zoom={zoom} allElements={allElements} />;

  const isContainer = element.type === 'board' || element.type === 'column';
  const childCount = isContainer ? allElements.filter((e: any) => e.boardId === element.content || e.parentId === element.id).length : 0;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: pos.x,
    top: pos.y,
    width: pos.w,
    height: pos.h,
    minHeight: ['note', 'todo', 'comment'].includes(element.type) ? 60 : 60,
    zIndex: isSelected ? 100 : (element.zIndex || 1),
  };

  const [guides, setGuides] = useState<{h: number|null, v: number|null}>({h: null, v: null});

  return (
    <div className={cn("group relative flex flex-col transition-shadow duration-200 select-none", isSelected && "z-50")} style={style} onMouseDown={(e) => { e.stopPropagation(); onSelect(element.id, e.shiftKey || e.ctrlKey || e.metaKey); }}>
      {guides.v !== null && <div className="absolute top-[-3000px] bottom-[-3000px] w-px bg-rose-500/50 z-[9999]" style={{ left: 0 }} />}
      {guides.h !== null && <div className="absolute left-[-3000px] right-[-3000px] h-px bg-rose-500/50 z-[9999]" style={{ top: 0 }} />}
      {isSelected && <div className="absolute -inset-[3px] border-[2px] border-primary rounded-xl pointer-events-none z-0"><div className="absolute -top-1 -left-1 h-2 w-2 bg-background border border-primary rounded-full shadow-sm" /><div className="absolute -top-1 -right-1 h-2 w-2 bg-background border border-primary rounded-full shadow-sm" /><div className="absolute -bottom-1 -left-1 h-2 w-2 bg-background border border-primary rounded-full shadow-sm" /><div className="absolute -bottom-1 -right-1 h-2 w-2 bg-background border border-primary rounded-full shadow-sm" /></div>}

      <Card className={cn("flex-1 transition-all border overflow-hidden relative z-10", isSelected ? "shadow-none border-transparent ring-2 ring-primary ring-offset-2 ring-offset-background" : "shadow-sm hover:shadow-md dark:shadow-none", (element.type === 'board' || element.type === 'column') ? "bg-transparent border-none shadow-none ring-0 focus-visible:ring-0" : (element.color || 'bg-card border-border'))}>
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 z-50">
           {['note', 'todo', 'board', 'column'].includes(element.type) && (
             <Popover>
               <PopoverTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted font-bold transition-colors" onMouseDown={(e)=>e.stopPropagation()}><Palette size={12}/></Button>
               </PopoverTrigger>
               <PopoverContent className="w-auto p-2 border-border shadow-xl rounded-xl z-[9999] bg-popover" sideOffset={8}>
                 <div className="flex gap-1.5 break-inside-avoid">
                   {CARD_COLORS.map(c => (
                     <div key={c.name} title={c.name} onClick={(e) => { e.stopPropagation(); onUpdate(element.id, { color: c.value }); }} className={cn("w-6 h-6 rounded-full cursor-pointer border hover:scale-110 active:scale-95 transition-all shadow-sm", c.value.split(' ')[0])} />
                   ))}
                 </div>
               </PopoverContent>
             </Popover>
           )}
           <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => onDelete(element.id)}><Trash2 size={12}/></Button>
            <div className="h-6 w-6 rounded-md bg-background border border-border flex items-center justify-center cursor-move hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" onMouseDown={(e) => {
                 e.stopPropagation();
                 const sX = e.clientX; const sY = e.clientY; const iX = element.x; const iY = element.y;
                 let lastX = iX, lastY = iY;
                 const onMM = (ev: MouseEvent) => { 
                    const dx=(ev.clientX-sX)/zoom; const dy=(ev.clientY-sY)/zoom; 
                    let nX = Math.round((iX+dx)/10)*10; let nY = Math.round((iY+dy)/10)*10; 
                    let gH = null; let gV = null;
                    for (const cand of allElements) {
                       if (cand.id === element.id || cand.type==='line' || cand.boardId !== element.boardId) continue;
                       if (Math.abs(nX - cand.x) < 15) { nX = cand.x; gV = cand.x; }
                       if (Math.abs(nY - cand.y) < 15) { nY = cand.y; gH = cand.y; }
                    }
                    setGuides({h: gH, v: gV});
                    lastX = nX; lastY = nY;
                    setPos(p => ({ ...p, x: nX, y: nY })); 
                 };
                 const onMU = () => { 
                    setGuides({h: null, v: null});
                    window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU); 
                    const cols = allElements.filter((e:any) => e.type === 'column' && e.boardId === element.boardId && e.id !== element.id);
                    let targetParent = '';
                    for(const col of cols) {
                       const cw = col.width || 220; const ch = col.height || 300; 
                       if (lastX + 50 > col.x && lastX < col.x + cw && lastY + 50 > col.y && lastY < col.y + ch) {
                           targetParent = col.id; break;
                       }
                    }
                    if (targetParent && element.parentId !== targetParent) toast.success("Movido para a coluna!");
                    onUpdate(element.id, { x: lastX, y: lastY, parentId: targetParent ? targetParent : (element.parentId === targetParent ? element.parentId : '') }); 
                 };
                 window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU);
           }}><Grab size={12} className="opacity-40" /></div>
        </div>

        <CardContent className={cn("p-4 h-full flex flex-col items-start")}>
          {element.type === 'heading' && <Textarea value={content} onChange={(e)=>setContent(e.target.value)} onBlur={()=>onUpdate(element.id, {content})} className="bg-transparent border-none resize-none focus-visible:ring-0 p-0 text-3xl font-black w-full text-foreground" placeholder="Título..." rows={1} />}
          
          {element.type === 'note' && (
             <div className="w-full h-full min-h-[40px]" onDoubleClick={()=>setIsEditing(true)}>
                {isEditing ? (
                  <Textarea 
                    autoFocus
                    value={content} 
                    onChange={(e)=>setContent(e.target.value)} 
                    onBlur={() => { onUpdate(element.id, {content}); setIsEditing(false); }} 
                    className="bg-transparent border-none resize-none focus-visible:ring-0 p-0 text-base font-medium w-full h-full text-foreground" 
                    placeholder="Markdown..." 
                    rows={4} 
                  />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-headings:my-1 opacity-90 cursor-text w-full h-full text-foreground">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{element.content || '_Vazio_'}</ReactMarkdown>
                  </div>
                )}
             </div>
          )}
          
          {element.type === 'todo' && (
             <div className="w-full space-y-2">
                {JSON.parse(element.content || '{"items":[]}').items.map((it: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center"><button onClick={()=>{const d=JSON.parse(element.content); d.items[i].done=!d.items[i].done; onUpdate(element.id, {content:JSON.stringify(d)});}} className={cn("h-4 w-4 rounded border flex items-center justify-center", it.done ? "bg-primary border-primary" : "border-muted-foreground/30", "bg-transparent")}>{it.done && <Plus size={10} className="text-white"/>}</button><span className={cn("text-sm text-foreground", it.done && "line-through opacity-40")}>{it.text}</span></div>
                ))}
             </div>
          )}
          
          {element.type === 'board' && (
             <div className="flex flex-col items-center gap-3 w-full py-6" onDoubleClick={() => onNavigate(element.content)}>
                <div className="w-24 h-24 rounded-[30px] bg-blue-500/10 border-[4px] border-background flex items-center justify-center shadow-lg"><LayoutGrid size={32} className="text-blue-600 dark:text-blue-400" /></div>
                <div className="text-center font-bold text-lg text-foreground">{element.parentId || 'Board'}</div>
             </div>
          )}
          
          {element.type === 'column' && (
             <div className="w-full flex flex-col gap-2">
                <Input className="bg-transparent border-b-2 border-primary/20 text-xl font-bold p-0 mb-2 focus-visible:ring-0 text-foreground" value={content} onChange={(e)=>setContent(e.target.value)} onBlur={()=>onUpdate(element.id, {content})} placeholder="Nova Coluna" />
                <p className="text-[10px] font-bold opacity-30 uppercase text-foreground">{childCount} itens dentro</p>
                <div className="flex flex-col gap-2 min-h-[100px] w-full bg-muted/40 rounded-md p-2 border border-dashed border-border" onMouseDown={(e)=>e.stopPropagation()}>
                   {allElements.filter((e:any) => e.parentId === element.id).map((child:any) => (
                       <div key={child.id} title="Duplo-clique para ejetar" className="w-full bg-background p-2 text-xs font-medium rounded shadow-sm border border-border truncate cursor-pointer hover:border-primary transition-all text-foreground" onDoubleClick={(e)=>{ e.stopPropagation(); onUpdate(child.id, { parentId: '' }); toast.success("Cartão ejetado da coluna!"); }}>
                          {['note','heading'].includes(child.type) ? (child.content || 'Vazio') : child.type.toUpperCase()}
                       </div>
                   ))}
                   <div className="text-[9px] opacity-40 text-center w-full mt-2 select-none uppercase pointer-events-none">Duplo-clique para ejetar</div>
                </div>
             </div>
          )}
          
          {/* Middle states for other types */}
          {['video', 'map', 'audio', 'sketch', 'document'].includes(element.type) && (
            <div className="w-full flex flex-col items-center justify-center py-6 gap-3 opacity-20">
               {element.type === 'video' && <Play size={32}/>}
               {element.type === 'map' && <MapPin size={32}/>}
               {element.type === 'audio' && <Mic2 size={32}/>}
               {element.type === 'sketch' && <Pencil size={32}/>}
               {element.type === 'document' && <File size={32}/>}
               <span className="text-[9px] font-black uppercase tracking-widest">{element.type}</span>
            </div>
          )}
        </CardContent>

        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-zinc-300 hover:text-primary transition-colors hover:bg-zinc-100 rounded-tl-md" onMouseDown={(e) => {
           e.stopPropagation();
           const sX = e.clientX; const sY = e.clientY;
           const parentElem = e.currentTarget.parentElement;
           const iW = parentElem?.offsetWidth || pos.w;
           const iH = parentElem?.offsetHeight || (typeof pos.h === 'number' ? pos.h : 60);
           
           let lastW = iW; let lastH = iH;
           const onMM = (ev: MouseEvent) => { 
             lastW = Math.max(120, Number(iW) + (ev.clientX - sX)/zoom); 
             lastH = Math.max(60, Number(iH) + (ev.clientY - sY)/zoom); 
             // Temporarily disable 'auto' height during drag if needed, but we can just force the height locally
             setPos(prev => ({ ...prev, w: lastW, h: lastH }));
           };
           const onMU = () => { window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU); onUpdate(element.id, { width: lastW, height: lastH }); };
           window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU);
        }}>
           <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 mr-0.5 mb-0.5" preserveAspectRatio="none"><path d="M8 0L10 0L10 10L0 10L0 8L8 8Z" fill="currentColor"/></svg>
        </div>
      </Card>
    </div>
  );
};

export const Boards = () => {
  const { state, currentProject, addBoard, deleteBoard, addBoardElement, updateBoardElement, deleteBoardElement } = useApp();
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ sx: number, sy: number, cx: number, cy: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const activeElements = useMemo(() => state.boardElements.filter(e => e.boardId === activeBoardId), [state.boardElements, activeBoardId]);
  const activeBoard = state.boards.find(b => b.id === activeBoardId);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); const t = e.dataTransfer.getData('board-element-type') as BoardElement['type'];
    if(!t || !canvasRef.current || !activeBoardId) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left + canvasRef.current.scrollLeft - CANVAS_PADDING - 110 * zoom) / zoom / 10) * 10;
    const y = Math.round((e.clientY - rect.top + canvasRef.current.scrollTop - CANVAS_PADDING - 40 * zoom) / zoom / 10) * 10;
    let content = ''; let parentId = '';
    if (t === 'board') { const sid = addBoard({ title: 'Novo Board', projectId: currentProject }); content = sid; parentId = 'Novo Board'; }
    if (t === 'line') content = JSON.stringify({ endX: 200, endY: 200, startArrow: false, endArrow: true, weight: 3, dashed: false });
    if (t === 'todo') content = JSON.stringify({ items: [] });
    if (t === 'heading') content = 'Novo Título';
    if (t === 'column') content = 'Nova Coluna';
    addBoardElement({ boardId: activeBoardId, type: t, x, y, content, parentId, zIndex: activeElements.length + 1 });
  };

  const [isPanning, setIsPanning] = useState(false);
  
  const handleCanvasPointerDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      e.preventDefault();
    } else if (e.button === 0) {
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) setSelectedIds([]);
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left + canvasRef.current!.scrollLeft - CANVAS_PADDING) / zoom;
      const y = (e.clientY - rect.top + canvasRef.current!.scrollTop - CANVAS_PADDING) / zoom;
      setSelectionBox({ sx: x, sy: y, cx: x, cy: y });
    }
  };

  const handleCanvasPointerMove = (e: React.MouseEvent) => {
    if (isPanning && canvasRef.current) {
      canvasRef.current.scrollLeft -= e.movementX;
      canvasRef.current.scrollTop -= e.movementY;
    } else if (selectionBox && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left + canvasRef.current.scrollLeft - CANVAS_PADDING) / zoom;
      const y = (e.clientY - rect.top + canvasRef.current.scrollTop - CANVAS_PADDING) / zoom;
      setSelectionBox(s => s ? { ...s, cx: x, cy: y } : null);
      
      const minX = Math.min(selectionBox.sx, x); const maxX = Math.max(selectionBox.sx, x);
      const minY = Math.min(selectionBox.sy, y); const maxY = Math.max(selectionBox.sy, y);
      
      const intersecting = activeElements.filter(el => {
         const elW = el.width || 220; const elH = el.height || 140;
         const cx = el.x + elW/2; const cy = el.y + elH/2;
         return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
      }).map(el => el.id);
      
      setSelectedIds(intersecting);
    }
  };

  const handleCanvasPointerUp = () => {
    setIsPanning(false);
    setSelectionBox(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if(e.button !== 0 || isPanning || selectionBox || e.defaultPrevented) return;
    if(!canvasRef.current || !activeBoardId) return;
    if (e.target !== canvasRef.current && (e.target as HTMLElement).tagName !== 'DIV') return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left + canvasRef.current.scrollLeft - CANVAS_PADDING) / zoom / 10) * 10 - 70;
    const y = Math.round((e.clientY - rect.top + canvasRef.current.scrollTop - CANVAS_PADDING) / zoom / 10) * 10 - 50;
    addBoardElement({ boardId: activeBoardId, type: 'note', x, y, content: '', zIndex: activeElements.length + 1 });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          selectedIds.forEach(id => deleteBoardElement(id));
          setSelectedIds([]);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
         if (selectedIds.length > 0) {
            const els = activeElements.filter(el => selectedIds.includes(el.id));
            if(els.length > 0) {
               sessionStorage.setItem('milanote_clipboard', JSON.stringify(els));
               toast.success(`${els.length} ${els.length>1?'blocos copiados':'bloco copiado'}!`, { description: 'Pressione Ctrl+V para colar' });
            }
         }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
         const clip = sessionStorage.getItem('milanote_clipboard');
         if (clip && activeBoardId) {
            const els = JSON.parse(clip);
            els.forEach((el: any) => {
               const { id, ...newElem } = el;
               addBoardElement({ ...newElem, boardId: activeBoardId, x: el.x + 40, y: el.y + 40, zIndex: activeElements.length + 1 });
            });
         }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
         e.preventDefault();
         if (selectedIds.length > 0 && activeBoardId) {
            const els = activeElements.filter(el => selectedIds.includes(el.id));
            els.forEach(el => {
               const { id, ...newElem } = el;
               addBoardElement({ ...newElem, boardId: activeBoardId, x: el.x + 40, y: el.y + 40, zIndex: activeElements.length + 1 });
            });
            toast.success(`${els.length} ${els.length>1?'blocos duplicados':'bloco duplicado'}!`);
         }
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
         if (selectedIds.length > 0) {
            e.preventDefault();
            const dx = e.key === 'ArrowLeft' ? -10 : e.key === 'ArrowRight' ? 10 : 0;
            const dy = e.key === 'ArrowUp' ? -10 : e.key === 'ArrowDown' ? 10 : 0;
            const els = activeElements.filter(el => selectedIds.includes(el.id));
            els.forEach(el => updateBoardElement(el.id, { x: el.x + dx, y: el.y + dy }));
         }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, activeElements, activeBoardId, deleteBoardElement, addBoardElement, updateBoardElement]);

  if(!activeBoardId) {
    return (
      <div className="p-12 space-y-12 bg-background text-foreground h-full overflow-hidden select-none">
         <div className="flex justify-between items-end border-b border-border pb-8 cursor-default"><h1 className="text-4xl font-black tracking-tighter uppercase">Board Criativo</h1><Button onClick={()=>{const id=addBoard({title:'Meu Projeto', projectId: currentProject}); setActiveBoardId(id);}} className="rounded-xl h-12 px-8 font-bold"><Plus className="mr-2"/> NOVO BOARD</Button></div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-48 overflow-y-auto">
            {state.boards.filter(b=>b.projectId===currentProject).map(b=>(<Card key={b.id} className="p-8 cursor-pointer hover:shadow-xl transition-all rounded-[30px] bg-card border-border select-none" onClick={()=>setActiveBoardId(b.id)}><LayoutGrid size={40} className="text-muted-foreground mb-6"/><h3 className="font-bold text-xl truncate">{b.title}</h3></Card>))}
         </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="h-full w-full flex overflow-hidden relative bg-background text-foreground">
       {/* Milanote-Style Unified Sidebar */}
       <div className="w-[88px] border-r border-border bg-card/50 flex flex-col items-center py-6 gap-2 shrink-0 z-50 overflow-y-auto custom-scrollbar shadow-xl backdrop-blur-md">
          <ToolboxBtn icon={StickyNote} type="note" label="Note" />
          <ToolboxBtn icon={Link2} type="link" label="Link" />
          <ToolboxBtn icon={CheckSquare} type="todo" label="To-do" />
          <ToolboxBtn icon={Move} type="line" label="Line" />
          <ToolboxBtn icon={LayoutGrid} type="board" label="Board" />
          <ToolboxBtn icon={Columns} type="column" label="Column" />
          <ToolboxBtn icon={MessageCircle} type="comment" label="Comment" />
          <ToolboxBtn icon={TableIcon} type="table" label="Table" />
          
          <Popover>
             <PopoverTrigger asChild>
                <div className="flex flex-col items-center py-2 w-full group cursor-pointer animate-pulse duration-[2000ms]">
                   <button className="w-14 h-14 bg-background border border-border rounded-lg flex items-center justify-center hover:shadow-md transition-all active:scale-95 shadow-inner"><MoreHorizontal size={24} className="text-muted-foreground"/></button>
                   <span className="text-[9px] font-black uppercase text-muted-foreground mt-1 tracking-widest">Mais</span>
                </div>
             </PopoverTrigger>
             <PopoverContent side="right" sideOffset={15} className="w-[280px] p-8 rounded-[40px] shadow-3xl bg-card border-border z-[9999]">
                <div className="grid grid-cols-3 gap-8">
                   <GridToolItem icon={Pencil} type="sketch" label="Sketch" color="text-zinc-500 dark:text-zinc-400" />
                   <GridToolItem icon={Palette} type="color" label="Color" color="text-red-500" />
                   <GridToolItem icon={FileText} type="document" label="Document" color="text-zinc-500 dark:text-zinc-400" />
                   <GridToolItem icon={Mic2} type="audio" label="Audio" color="text-emerald-500" />
                   <GridToolItem icon={MapPin} type="map" label="Map" color="text-orange-500" />
                   <GridToolItem icon={Play} type="video" label="Video" color="text-purple-500" />
                   <GridToolItem icon={Type} type="heading" label="Heading" color="text-zinc-600 dark:text-zinc-300" />
                </div>
             </PopoverContent>
          </Popover>

          <div className="flex-1 min-h-[40px]" />
          <ToolboxBtn icon={ImageIcon} type="image" label="Add image" noBG />
          <ToolboxBtn icon={Upload} type="upload" label="Upload" noBG />
          <ToolboxBtn icon={Pencil} type="draw" label="Draw" noBG />
          <button className="h-14 w-14 flex items-center justify-center text-muted-foreground hover:text-destructive group"><Trash size={24} className="group-hover:scale-110 transition-transform"/></button>
       </div>

       {/* Workspace Content */}
       <div className="flex-1 flex flex-col relative h-full">
          <div className="h-14 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-30 shadow-sm">
             <div className="flex items-center gap-4">
               <Button variant="ghost" size="sm" onClick={()=>{
                  const parentElem = state.boardElements.find(e => e.type === 'board' && e.content === activeBoardId);
                  if (parentElem) setActiveBoardId(parentElem.boardId);
                  else setActiveBoardId(null);
               }} className="hover:bg-accent rounded-full w-8 h-8 p-0"><ArrowLeft size={16}/></Button>
               <div className="flex items-center gap-2 select-none">
                  {(() => {
                     const breadcrumbs = [];
                     let currId: string|null = activeBoardId;
                     while(currId) {
                        const obj = state.boards.find(b=>b.id===currId);
                        if(obj) breadcrumbs.unshift(obj.title);
                        const parentElem = state.boardElements.find(e => e.type === 'board' && e.content === currId);
                        currId = parentElem ? parentElem.boardId : null;
                     }
                     return (
                        <h2 className="font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                           {breadcrumbs.length > 1 && <span className="opacity-40">{breadcrumbs[breadcrumbs.length-2]} / </span>}
                           <span className="truncate max-w-[200px]">{activeBoard?.title}</span>
                        </h2>
                     );
                  })()}
               </div>
             </div>
             <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50 select-none">
               <span className="text-[10px] font-black tracking-widest text-muted-foreground px-2 uppercase">ZOOM</span>
               <button onClick={()=>setZoom(p=>Math.max(p-0.1,0.2))} className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:bg-background hover:shadow-sm rounded transition-all">-</button>
               <span className="text-xs font-black w-12 text-center text-primary">{Math.round(zoom*100)}%</span>
               <button onClick={()=>setZoom(p=>Math.min(p+0.1,3))} className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:bg-background hover:shadow-sm rounded transition-all">+</button>
             </div>
          </div>
          <div 
            ref={canvasRef} 
            className={cn("flex-1 overflow-auto relative p-[3000px] text-muted-foreground/30", isPanning ? "cursor-grabbing" : "cursor-default")}
            style={{ backgroundImage: `radial-gradient(circle, currentColor 1.2px, transparent 1.2px)`, backgroundSize: `${30 * zoom}px ${30 * zoom}px`, backgroundColor: 'transparent' }}
            onMouseDown={handleCanvasPointerDown}
            onMouseMove={handleCanvasPointerMove}
            onMouseUp={handleCanvasPointerUp}
            onMouseLeave={handleCanvasPointerUp}
            onDoubleClick={handleDoubleClick}
            onDragOver={(e)=>e.preventDefault()}
            onDrop={handleDrop}
          >
             <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: '10000px', height: '10000px' }}>
                {selectionBox && (
                   <div className="absolute border-[1px] border-primary bg-primary/10 pointer-events-none z-[9999]" style={{
                      left: Math.min(selectionBox.sx, selectionBox.cx),
                      top: Math.min(selectionBox.sy, selectionBox.cy),
                      width: Math.abs(selectionBox.cx - selectionBox.sx),
                      height: Math.abs(selectionBox.cy - selectionBox.sy)
                   }} />
                )}
                {activeElements.filter(e => !e.parentId || e.type === 'board').map(e => <ElementCard key={e.id} element={e} allElements={state.boardElements} onUpdate={updateBoardElement} onDelete={deleteBoardElement} onNavigate={setActiveBoardId} onSelect={(id:string, multi:boolean)=>setSelectedIds(p => multi ? (p.includes(id) ? p.filter(i=>i!==id) : [...p, id]) : [id])} selectedIds={selectedIds} zoom={zoom} />)}
             </div>
          </div>

          {/* Minimap UI Elite */}
          {(() => {
             const els = activeElements.filter((e:any) => e.type !== 'line');
             if(!els.length) return null;
             const minX = Math.min(...els.map((e:any)=>e.x));
             const maxX = Math.max(...els.map((e:any)=>e.x+(e.width||220)));
             const minY = Math.min(...els.map((e:any)=>e.y));
             const maxY = Math.max(...els.map((e:any)=>e.y+(e.height||140)));
             const bbW = Math.max(maxX - minX, 1000); 
             const bbH = Math.max(maxY - minY, 1000);
             const mapS = Math.min(140 / bbW, 100 / bbH);
             return (
                <div className="absolute bottom-6 left-6 w-40 h-32 bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl z-50 p-2 overflow-hidden flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
                   <div className="relative w-full h-full bg-muted/50 rounded-lg">
                      {els.map((e:any) => (
                         <div key={e.id} className={cn("absolute rounded-[2px] transition-all", selectedIds.includes(e.id) ? "bg-red-500 scale-125 z-10" : e.type==='board'?'bg-blue-500':e.type==='column'?'bg-foreground/20':'bg-muted-foreground')} style={{ left: (e.x - minX + (bbW-(maxX-minX))/2) * mapS, top: (e.y - minY + (bbH-(maxY-minY))/2) * mapS, width: Math.max((e.width||220)*mapS, 2), height: Math.max((e.height||140)*mapS, 2) }} />
                      ))}
                      {canvasRef.current && (
                          <div className="absolute border-[1.5px] border-primary/80 bg-primary/10 pointer-events-none transition-all duration-300 rounded-[2px]" style={{
                              left: (canvasRef.current.scrollLeft - CANVAS_PADDING - minX + (bbW-(maxX-minX))/2) * mapS,
                              top: (canvasRef.current.scrollTop - CANVAS_PADDING - minY + (bbH-(maxY-minY))/2) * mapS,
                              width: (canvasRef.current.clientWidth / zoom) * mapS,
                              height: (canvasRef.current.clientHeight / zoom) * mapS
                          }} />
                      )}
                   </div>
                </div>
             );
          })()}

       </div>
    </div>
    </TooltipProvider>
  );
};

const ToolboxBtn = ({ icon: Icon, type, label, noBG }: any) => (
  <div draggable onDragStart={(e)=>e.dataTransfer.setData('board-element-type', type)} className="flex flex-col items-center py-2 w-full group cursor-grab active:scale-95 transition-all">
     <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center shadow-sm border transition-all active:shadow-inner text-muted-foreground group-hover:text-foreground", noBG ? "bg-transparent border-transparent" : "bg-card border-border group-hover:border-primary/50")}>
        <Icon size={24} />
     </div>
     <span className="text-[10px] font-medium text-muted-foreground mt-1">{label}</span>
  </div>
);

const GridToolItem = ({ icon: Icon, type, label, color }: any) => (
  <div draggable onDragStart={(e)=>e.dataTransfer.setData('board-element-type', type)} className="flex flex-col items-center gap-2 group cursor-grab hover:scale-105 transition-transform">
     <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center border border-border group-hover:border-primary group-hover:bg-card transition-all shadow-sm"><Icon size={28} className={color} /></div>
     <span className="text-[11px] font-bold text-foreground">{label}</span>
  </div>
);

const ContextTool = ({ icon: Icon, label, onClick, children }: any) => (
  <Popover>
    <PopoverTrigger asChild><button onClick={onClick} className="flex flex-col items-center gap-1 group"><Icon size={24} className="text-zinc-400 group-hover:text-primary"/><span className="text-[9px] font-black opacity-20 uppercase tracking-tighter">{label}</span></button></PopoverTrigger>
    {children && <PopoverContent side="right" className="rounded-3xl p-4 ml-6 shadow-2xl">{children}</PopoverContent>}
  </Popover>
);

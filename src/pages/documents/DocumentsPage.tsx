import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Upload, Download, Trash2, Eye, PenLine,
  X, CheckCircle, Clock, FileEdit, Search, ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Document, DocumentStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<DocumentStatus, { label: string; variant: 'gray' | 'warning' | 'success'; icon: React.ReactNode }> = {
  draft:      { label: 'Draft',     variant: 'gray',    icon: <FileEdit size={12} /> },
  'in-review':{ label: 'In Review', variant: 'warning', icon: <Clock size={12} /> },
  signed:     { label: 'Signed',    variant: 'success', icon: <CheckCircle size={12} /> },
};

const SEED_DOCS: Document[] = [
  { id: 'd1', name: 'Pitch Deck 2026.pdf',        type: 'PDF',        size: '2.4 MB', lastModified: '2026-06-15', shared: true,  url: '', ownerId: 'e1', status: 'signed',    signedAt: '2026-06-20' },
  { id: 'd2', name: 'Investment Term Sheet.pdf',  type: 'PDF',        size: '1.1 MB', lastModified: '2026-06-28', shared: true,  url: '', ownerId: 'i1', status: 'in-review' },
  { id: 'd3', name: 'Business Plan.docx',         type: 'Document',   size: '3.2 MB', lastModified: '2026-06-05', shared: false, url: '', ownerId: 'e1', status: 'draft' },
  { id: 'd4', name: 'Market Research.pdf',        type: 'PDF',        size: '5.1 MB', lastModified: '2026-05-28', shared: false, url: '', ownerId: 'e1', status: 'draft' },
  { id: 'd5', name: 'NDA Agreement.pdf',          type: 'PDF',        size: '0.8 MB', lastModified: '2026-06-10', shared: true,  url: '', ownerId: 'i1', status: 'signed',    signedAt: '2026-06-12' },
];

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>(SEED_DOCS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'all'>('all');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [signDoc, setSignDoc] = useState<Document | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  // Signature canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const filtered = documents.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // --- Dropzone ---
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!user) return;
    acceptedFiles.forEach(file => {
      const newDoc: Document = {
        id: `d${Date.now()}`,
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'PDF' : file.name.endsWith('.docx') ? 'Document' : 'File',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        lastModified: new Date().toISOString().split('T')[0],
        shared: false,
        url: URL.createObjectURL(file),
        ownerId: user.id,
        status: 'draft',
      };
      setDocuments(prev => [newDoc, ...prev]);
      toast.success(`${file.name} uploaded`);
    });
  }, [user]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    noClick: true,
  });

  const updateStatus = (docId: string, status: DocumentStatus) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status } : d));
    toast.success(`Status updated to ${STATUS_CONFIG[status].label}`);
  };

  const deleteDoc = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    toast.success('Document deleted');
  };

  // --- Signature canvas ---
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current || !lastPos.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => { isDrawing.current = false; lastPos.current = null; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const applySignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !signDoc) return;
    const dataUrl = canvas.toDataURL();
    // Check if anything was drawn (not just blank canvas)
    const blank = document.createElement('canvas');
    blank.width = canvas.width; blank.height = canvas.height;
    if (dataUrl === blank.toDataURL()) {
      toast.error('Please draw your signature first');
      return;
    }
    setIsSigning(true);
    setTimeout(() => {
      setDocuments(prev => prev.map(d =>
        d.id === signDoc.id
          ? { ...d, status: 'signed', signedAt: new Date().toISOString().split('T')[0], signatureDataUrl: dataUrl }
          : d
      ));
      setIsSigning(false);
      setSignDoc(null);
      toast.success('Document signed successfully!');
    }, 1000);
  };

  const counts = {
    all: documents.length,
    draft: documents.filter(d => d.status === 'draft').length,
    'in-review': documents.filter(d => d.status === 'in-review').length,
    signed: documents.filter(d => d.status === 'signed').length,
  };

  return (
    <div className="space-y-6 animate-fade-in" {...getRootProps()}>
      <input {...getInputProps()} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Chamber</h1>
          <p className="text-gray-600 text-sm mt-0.5">Upload, review, and sign deal documents</p>
        </div>
        <Button leftIcon={<Upload size={18} />} onClick={open}>
          Upload Document
        </Button>
      </div>

      {/* Drag overlay */}
      {isDragActive && (
        <div className="fixed inset-0 z-50 bg-primary-600/20 border-4 border-dashed border-primary-500 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-xl px-8 py-6 shadow-xl text-center">
            <Upload size={40} className="text-primary-600 mx-auto mb-2" />
            <p className="text-lg font-semibold text-primary-700">Drop your files here</p>
            <p className="text-sm text-gray-500 mt-1">PDF or DOCX files supported</p>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'draft', 'in-review', 'signed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : STATUS_CONFIG[status].label}
            <span className="ml-1.5 text-xs opacity-75">({counts[status]})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Used</span><span className="font-medium text-gray-700">12.5 GB / 20 GB</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-primary-600 rounded-full" style={{ width: '62%' }} />
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200 space-y-1">
              {(['draft', 'in-review', 'signed'] as DocumentStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <span className="flex items-center gap-2">
                    {STATUS_CONFIG[s].icon}
                    {STATUS_CONFIG[s].label}
                  </span>
                  <span className="text-xs text-gray-400">{counts[s]}</span>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Document list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              fullWidth
              startAdornment={<Search size={16} className="text-gray-400" />}
            />
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardBody className="py-12 text-center">
                <FileText size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No documents found</p>
                <p className="text-sm text-gray-400 mt-1">Upload a PDF or DOCX to get started</p>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="p-0">
                {filtered.map((doc, idx) => {
                  const sc = STATUS_CONFIG[doc.status];
                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <div className="p-2.5 bg-primary-50 rounded-lg shrink-0">
                        <FileText size={22} className="text-primary-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                          <Badge variant={sc.variant} size="sm" rounded>
                            <span className="flex items-center gap-1">{sc.icon}{sc.label}</span>
                          </Badge>
                          {doc.shared && <Badge variant="secondary" size="sm" rounded>Shared</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{doc.type}</span>
                          <span>{doc.size}</span>
                          <span>Modified {doc.lastModified}</span>
                          {doc.signedAt && <span className="text-success-600">Signed {doc.signedAt}</span>}
                        </div>
                      </div>

                      {/* Status actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {doc.status === 'draft' && (
                          <button
                            onClick={() => updateStatus(doc.id, 'in-review')}
                            className="text-xs text-warning-600 hover:text-warning-700 px-2 py-1 rounded hover:bg-warning-50 transition-colors whitespace-nowrap"
                          >
                            Send for Review
                          </button>
                        )}
                        {doc.status === 'in-review' && (
                          <button
                            onClick={() => setSignDoc(doc)}
                            className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50 transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            <PenLine size={12} /> Sign
                          </button>
                        )}

                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                          aria-label="Preview"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          aria-label="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => deleteDoc(doc.id)}
                          className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-md transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-primary-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{previewDoc.name}</h3>
                  <p className="text-xs text-gray-400">{previewDoc.size} · {previewDoc.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_CONFIG[previewDoc.status].variant} size="sm" rounded>
                  {STATUS_CONFIG[previewDoc.status].label}
                </Badge>
                <button onClick={() => setPreviewDoc(null)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {previewDoc.url ? (
                <iframe src={previewDoc.url} className="w-full h-96 rounded border border-gray-200" title="Document preview" />
              ) : (
                <div className="h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <FileText size={48} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">{previewDoc.name}</p>
                  <p className="text-gray-400 text-sm mt-1">Preview not available for seed documents</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              {previewDoc.status === 'in-review' && (
                <Button size="sm" leftIcon={<PenLine size={14} />} onClick={() => { setPreviewDoc(null); setSignDoc(previewDoc); }}>
                  Sign Document
                </Button>
              )}
              {previewDoc.status === 'draft' && (
                <Button size="sm" variant="outline" onClick={() => { updateStatus(previewDoc.id, 'in-review'); setPreviewDoc(null); }}>
                  Send for Review
                </Button>
              )}
              {previewDoc.status === 'signed' && (
                <span className="flex items-center gap-1.5 text-success-600 text-sm font-medium">
                  <CheckCircle size={16} /> Signed on {previewDoc.signedAt}
                </span>
              )}
              <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E-Signature modal */}
      {signDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">Sign Document</h3>
                <p className="text-xs text-gray-400 mt-0.5">{signDoc.name}</p>
              </div>
              <button onClick={() => setSignDoc(null)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Draw your signature in the box below:</p>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={160}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                <span className="absolute bottom-2 left-3 text-xs text-gray-300 pointer-events-none select-none">Sign here</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <button onClick={clearCanvas} className="text-sm text-gray-500 hover:text-gray-700 underline">
                  Clear
                </button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSignDoc(null)}>Cancel</Button>
                  <Button size="sm" isLoading={isSigning} leftIcon={<CheckCircle size={14} />} onClick={applySignature}>
                    Apply Signature
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                By clicking "Apply Signature", you agree this constitutes a legally binding electronic signature.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

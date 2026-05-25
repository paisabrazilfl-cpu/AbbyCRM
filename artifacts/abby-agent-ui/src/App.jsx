import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, File, FileText, Image, Video, Music, 
  Archive, X, Send, Bot, User, Paperclip, Loader2
} from 'lucide-react';
import JSZip from 'jszip';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_MTOS_API_BASE || 'http://localhost:3000';

function App() {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'assistant', 
      content: 'Hello! I\'m ABBY, your AbbyCRM AI assistant. I have full access to the CRM system and can help you with:\n\n• Lead management (create, assign, route)\n• Case management and eligibility checks\n• NPI verification for physicians\n• Paralegal assignment and load balancing\n• Document automation\n• Running reports and queries\n\nYou can also upload files (documents, images, zips) and I\'ll analyze them for you.\n\nHow can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (type.includes('zip') || type.includes('archive')) return <Archive className="w-4 h-4" />;
    if (type.includes('pdf') || type.includes('text')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const processFiles = async (files) => {
    const processed = [];
    
    for (const file of files) {
      try {
        if (file.name.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          const contents = [];
          zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
              contents.push(zipEntry.name);
            }
          });
          processed.push({ 
            name: file.name, 
            type: 'archive', 
            content: `ZIP contains: ${contents.slice(0, 10).join(', ')}${contents.length > 10 ? '...' : ''}`,
            fullContents: contents
          });
        } else {
          const text = await file.text();
          processed.push({ 
            name: file.name, 
            type: file.type, 
            content: text.substring(0, 5000) 
          });
        }
      } catch (e) {
        processed.push({ 
          name: file.name, 
          type: file.type, 
          content: `[Binary file - ${file.size} bytes]` 
        });
      }
    }
    
    return processed;
  };

  const sendMessage = async () => {
    if (!input.trim() && files.length === 0) return;
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      files: files.map(f => f.name),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // Process files if any
      let fileContext = '';
      if (files.length > 0) {
        setUploading(true);
        const processed = await processFiles(files);
        fileContext = '\n\n📎 Attached files:\n' + processed.map(p => 
          `- ${p.name} (${p.type}):\n${p.content}`
        ).join('\n');
        setUploading(false);
        setFiles([]);
      }
      
      // Send to OpenClaw webhook
      const response = await axios.post(`${API_BASE}/webhook/openclaw`, {
        action: 'chat',
        message: input + fileContext,
        history: messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        }))
      }, {
        timeout: 60000
      });
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response || response.data.message || 'I processed your request.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Fallback: simulate response for demo
      const demoResponse = generateDemoResponse(input);
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: demoResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  const generateDemoResponse = (query) => {
    const q = query.toLowerCase();
    
    if (q.includes('lead')) {
      return 'I can help with lead management. Here are the recent leads:\n\n| ID | Name | Tort | State | Status |\n|---|---|---|---|---|\n| 1 | John Smith | Mesothelioma | TX | New |\n| 2 | Jane Doe | Opioid | FL | Assigned |\n| 3 | Bob Wilson | Benzene | CA | Screening |\n\nWould you like me to create a new lead, assign one, or run a different query?';
    }
    
    if (q.includes('case')) {
      return 'Case management ready. I can:\n• List all cases\n• Check eligibility\n• Advance case status\n• Run case reports\n\nWhat would you like to do?';
    }
    
    if (q.includes('npi') || q.includes('doctor') || q.includes('physician')) {
      return 'I can verify NPI numbers against the CMS NPPES registry. Just provide:\n• Doctor\'s first name\n• Doctor\'s last name  \n• State\n\nOr give me an NPI number and I\'ll verify it.';
    }
    
    if (q.includes('paralegal') || q.includes('assign')) {
      return 'Paralegal assignment system ready. I can:\n• List paralegals by tort/state\n• Check current loads\n• Auto-assign leads\n• Rebalance loads\n\nWhich paralegals would you like to see?';
    }
    
    return `I understand you're asking about: "${query}"\n\nAs your AbbyCRM AI assistant, I can help with:\n• Lead & case management\n• NPI/physician verification\n• Paralegal routing\n• Document automation\n• Reports & analytics\n\nWhat would you like to do?`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ABBY</h1>
              <p className="text-xs text-slate-400">AbbyCRM AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-slate-400">Online</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
          {/* Messages */}
          <div className="h-[60vh] overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'assistant' 
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600' 
                    : 'bg-slate-600'
                }`}>
                  {msg.role === 'assistant' ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className={`max-w-[70%] rounded-xl p-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600/20 border border-blue-500/30' 
                    : 'bg-slate-700/50 border border-slate-600/30'
                }`}>
                  <p className="text-white whitespace-pre-wrap text-sm">{msg.content}</p>
                  {msg.files && msg.files.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-600/30">
                      <p className="text-xs text-slate-400">📎 {msg.files.join(', ')}</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-slate-700/50 border border-slate-600/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File Preview */}
          {files.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1.5 border border-slate-600/30"
                  >
                    {getFileIcon(file.type)}
                    <span className="text-sm text-slate-300 max-w-[150px] truncate">
                      {file.name}
                    </span>
                    <button 
                      onClick={() => removeFile(index)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drop Zone */}
          <div className="px-4">
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-2 transition-colors ${
                isDragActive 
                  ? 'border-cyan-500 bg-cyan-500/10' 
                  : 'border-slate-600/50 hover:border-slate-500'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Upload className="w-4 h-4" />
                <span>Drop files here or click to upload</span>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex gap-2">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask ABBY anything about AbbyCRM..."
                className="flex-1 bg-slate-700/30 border border-slate-600/50 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
              />
              <button 
                onClick={sendMessage}
                disabled={loading || (!input.trim() && files.length === 0)}
                className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button 
            onClick={() => setInput('Show me recent leads')}
            className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            📋 Recent Leads
          </button>
          <button 
            onClick={() => setInput('List all paralegals with their current loads')}
            className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            👥 Paralegals
          </button>
          <button 
            onClick={() => setInput('Verify NPI for Dr. John Smith in Texas')}
            className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            🔍 Verify NPI
          </button>
          <button 
            onClick={() => setInput('Show me all cases in screening status')}
            className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            📁 Cases
          </button>
          <button 
            onClick={() => setInput('Run a report on lead sources this month')}
            className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            📊 Reports
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

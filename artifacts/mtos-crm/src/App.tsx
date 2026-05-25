import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Settings, Zap, MessageSquare,
  ChevronRight, Plus, Search, Filter, MoreVertical, Phone, Mail,
  MapPin, Calendar, AlertCircle, CheckCircle, Clock, X
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

// Types
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  tort: string;
  status: 'new' | 'contacted' | 'qualified' | 'submitted' | 'rejected';
  createdAt: string;
  notes?: string;
}

// Mock data
const mockLeads: Lead[] = [
  { id: '1', firstName: 'John', lastName: 'Smith', email: 'john@email.com', phone: '555-0101', state: 'FL', tort: 'Mesothelioma', status: 'new', createdAt: '2024-05-20' },
  { id: '2', firstName: 'Maria', lastName: 'Garcia', email: 'maria@email.com', phone: '555-0102', state: 'TX', tort: 'Opioid', status: 'contacted', createdAt: '2024-05-19' },
  { id: '3', firstName: 'Robert', lastName: 'Johnson', email: 'robert@email.com', phone: '555-0103', state: 'CA', tort: 'Talcum Powder', status: 'qualified', createdAt: '2024-05-18' },
  { id: '4', firstName: 'Sarah', lastName: 'Williams', email: 'sarah@email.com', phone: '555-0104', state: 'NY', tort: 'Roundup', status: 'submitted', createdAt: '2024-05-17' },
  { id: '5', firstName: 'Michael', lastName: 'Brown', email: 'michael@email.com', phone: '555-0105', state: 'FL', tort: 'Benzene', status: 'new', createdAt: '2024-05-16' },
];

const tortTypes = ['Mesothelioma', 'Opioid', 'Benzene', 'Talcum Powder', 'Roundup', 'Sexual Abuse', 'Police Brutality', 'Car Accident', 'Slip & Fall', 'Medical Malpractice'];
const states = ['FL', 'TX', 'CA', 'NY', 'PA', 'OH', 'IL', 'GA', 'NC', 'MI'];

// Components
function Sidebar() {
  const location = useLocation();
  const items = [
    { icon: LayoutDashboard, label: 'Main', path: '/' },
    { icon: Users, label: 'Intake', path: '/intake' },
    { icon: FileText, label: 'Work', path: '/work' },
    { icon: FileText, label: 'Documents', path: '/documents' },
    { icon: Zap, label: 'Intelligence', path: '/intelligence' },
    { icon: Zap, label: 'Automation', path: '/automation' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: MessageSquare, label: 'BOS-OMEGA', path: '/boss' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold">AbbyCRM</h1>
        <p className="text-xs text-slate-400">Mass Tort Operating System</p>
      </div>
      <nav className="flex-1 p-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${
                isActive ? 'bg-blue-600' : 'hover:bg-slate-800'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400">v1.0.0</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Lead['status'] }) {
  const styles = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-purple-100 text-purple-800',
    submitted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Dashboard() {
  const stats = [
    { label: 'Total Leads', value: '156', icon: Users, color: 'bg-blue-500' },
    { label: 'New Today', value: '12', icon: Plus, color: 'bg-green-500' },
    { label: 'Qualified', value: '34', icon: CheckCircle, color: 'bg-purple-500' },
    { label: 'Pending', value: '8', icon: Clock, color: 'bg-yellow-500' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="text-white" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Recent Leads</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-2">Name</th>
              <th className="pb-2">Tort</th>
              <th className="pb-2">State</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {mockLeads.slice(0, 5).map((lead) => (
              <tr key={lead.id} className="border-b last:border-0">
                <td className="py-3">{lead.firstName} {lead.lastName}</td>
                <td className="py-3">{lead.tort}</td>
                <td className="py-3">{lead.state}</td>
                <td className="py-3"><StatusBadge status={lead.status} /></td>
                <td className="py-3 text-gray-500">{lead.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Intake() {
  const [leads] = useState<Lead[]>(mockLeads);
  const [search, setSearch] = useState('');
  const [filterTort, setFilterTort] = useState('');
  const [filterState, setFilterState] = useState('');

  const filtered = leads.filter(l => {
    const matchSearch = !search || 
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase());
    const matchTort = !filterTort || l.tort === filterTort;
    const matchState = !filterState || l.state === filterState;
    return matchSearch && matchTort && matchState;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Intake</h2>
        <button 
          onClick={() => toast.success('New intake form opened')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> New Lead
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select 
            value={filterTort} 
            onChange={(e) => setFilterTort(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Torts</option>
            {tortTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select 
            value={filterState} 
            onChange={(e) => setFilterState(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
              <th className="p-4">Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Tort</th>
              <th className="p-4">State</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{lead.firstName} {lead.lastName}</td>
                <td className="p-4">
                  <div className="text-sm">{lead.email}</div>
                  <div className="text-sm text-gray-500">{lead.phone}</div>
                </td>
                <td className="p-4">{lead.tort}</td>
                <td className="p-4">{lead.state}</td>
                <td className="p-4"><StatusBadge status={lead.status} /></td>
                <td className="p-4 text-gray-500">{lead.createdAt}</td>
                <td className="p-4">
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Work() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Work</h2>
      <div className="grid grid-cols-3 gap-4">
        {['Active Cases', 'Pending Review', 'Completed'].map((title) => (
          <div key={title} className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-3xl font-bold text-blue-600">{Math.floor(Math.random() * 50)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Documents() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Documents</h2>
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Document management coming soon</p>
      </div>
    </div>
  );
}

function Intelligence() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Intelligence</h2>
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <Zap size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">AI Intelligence dashboard coming soon</p>
      </div>
    </div>
  );
}

function Automation() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Automation</h2>
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <Zap size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Workflow automation coming soon</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold mb-4">Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">API Base URL</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="https://api.example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2" placeholder="Enter API key" />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function BOSPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">BOS-OMEGA Agent</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare size={24} className="text-blue-600" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <p className="text-gray-500 mb-4">Chat with BOS-OMEGA for CRM assistance</p>
        <div className="border rounded-lg p-4 h-64 mb-4 bg-gray-50">
          <p className="text-gray-400 text-center mt-20">Chat interface loading...</p>
        </div>
        <div className="flex gap-2">
          <input type="text" className="flex-1 border rounded-lg px-3 py-2" placeholder="Type a message..." />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 bg-gray-50 min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/intake" element={<Intake />} />
            <Route path="/work" element={<Work />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/boss" element={<BOSPage />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;

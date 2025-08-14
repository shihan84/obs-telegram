'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot, Settings, Users, Activity, Wifi, WifiOff, Play, Square, Mic, MicOff, Eye, EyeOff, 
  AlertTriangle, CheckCircle, XCircle, Clock, Zap, Shield, Database, Monitor, 
  Network, Terminal, Sparkles, TrendingUp, Globe, Server, Cpu, HardDrive,
  Video, Radio, Cast, Signal, Stream, Tv, Camera, Volume2, Headphones, Edit, Trash2,
  Send, MessageSquare, Broadcast, RadioIcon, CirclePlay, CircleStop
} from 'lucide-react';

interface BotStatus {
  isRunning: boolean;
  userCount: number;
  activeUsers: number;
  botConfigured: boolean;
  obsConnections: Array<{
    id: number;
    name: string;
    connected: boolean;
  }>;
}

interface OBSConnection {
  id: number;
  name: string;
  host: string;
  port: number;
  password?: string;
  isConnected: boolean;
}

interface TelegramUser {
  id: number;
  username?: string;
  firstName?: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

interface OBSDiagnostics {
  host: string;
  port: number;
  isReachable: boolean;
  isPortOpen: boolean;
  connectionTime: number;
  error?: string;
  recommendations: string[];
}

interface SystemInfo {
  platform: string;
  nodeVersion: string;
  networkInterfaces: Array<{ name: string; address: string; netmask?: string; mac?: string }>;
}

interface BroadcastStats {
  isStreaming: boolean;
  viewerCount: number;
  streamTitle: string;
  streamUptime: string;
  bitrate: number;
  fps: number;
  resolution: string;
}

export default function Home() {
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isRunning: false,
    userCount: 0,
    activeUsers: 0,
    botConfigured: false,
    obsConnections: []
  });

  const [botToken, setBotToken] = useState('');
  const [obsConnections, setObsConnections] = useState<OBSConnection[]>([]);
  const [newObsConnection, setNewObsConnection] = useState({
    name: '',
    host: 'localhost',
    port: 4455,
    password: ''
  });
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [diagnostics, setDiagnostics] = useState<{ diagnostics: OBSDiagnostics; systemInfo: SystemInfo } | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [broadcastStats, setBroadcastStats] = useState<BroadcastStats>({
    isStreaming: false,
    viewerCount: 0,
    streamTitle: '',
    streamUptime: '00:00:00',
    bitrate: 0,
    fps: 0,
    resolution: ''
  });

  // Stream control state
  const [streamStatus, setStreamStatus] = useState<{[key: number]: {
    isStreaming: boolean;
    isRecording: boolean;
    streamTimecode: string;
    recordTimecode: string;
  }}>({});
  const [streamLoading, setStreamLoading] = useState(false);

  // Bot test state
  const [botTestResults, setBotTestResults] = useState<{
    apiConnection: boolean;
    botInfo: any;
    lastTestTime: string;
    error?: string;
  } | null>(null);
  const [botTestLoading, setBotTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testChatId, setTestChatId] = useState('');

  // Editing state
  const [editingConnection, setEditingConnection] = useState<OBSConnection | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    host: '',
    port: 4455,
    password: ''
  });
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    fetchBotStatus();
    fetchObsConnections();
    fetchUsers();
  }, []);

useEffect(() => {
    // Fetch stream status for all connected OBS connections
    obsConnections.forEach(connection => {
      if (connection.isConnected) {
        fetchStreamStatus(connection.id);
      }
    });
  }, [obsConnections]);

  const fetchBotStatus = async () => {
    try {
      const response = await fetch('/api/bot/status');
      if (response.ok) {
        const data = await response.json();
        setBotStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch bot status:', error);
    }
  };

  const fetchObsConnections = async () => {
    try {
      const response = await fetch('/api/obs/connections');
      if (response.ok) {
        const data = await response.json();
        setObsConnections(data);
      }
    } catch (error) {
      console.error('Failed to fetch OBS connections:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSaveBotToken = async () => {
    if (!botToken.trim()) {
      setMessage({ type: 'error', text: 'Bot token is required' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Bot token saved successfully' });
        fetchBotStatus();
      } else {
        setMessage({ type: 'error', text: 'Failed to save bot token' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save bot token' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartBot = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bot/start', { method: 'POST' });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Bot started successfully' });
        fetchBotStatus();
      } else {
        setMessage({ type: 'error', text: 'Failed to start bot' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start bot' });
    } finally {
      setLoading(false);
    }
  };

  const handleStopBot = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bot/stop', { method: 'POST' });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Bot stopped successfully' });
        fetchBotStatus();
      } else {
        setMessage({ type: 'error', text: 'Failed to stop bot' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to stop bot' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddObsConnection = async () => {
    if (!newObsConnection.name.trim()) {
      setMessage({ type: 'error', text: 'Connection name is required' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/obs/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newObsConnection)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'OBS connection added successfully' });
        setNewObsConnection({ name: '', host: 'localhost', port: 4455, password: '' });
        fetchObsConnections();
        fetchBotStatus();
      } else {
        setMessage({ type: 'error', text: 'Failed to add OBS connection' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add OBS connection' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleObsConnection = async (id: number, connect: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/obs/connections/${id}/${connect ? 'connect' : 'disconnect'}`, {
        method: 'POST'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `OBS connection ${connect ? 'connected' : 'disconnected'} successfully` });
        fetchObsConnections();
        fetchBotStatus();
      } else {
        setMessage({ type: 'error', text: `Failed to ${connect ? 'connect' : 'disconnect'} OBS connection` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to ${connect ? 'connect' : 'disconnect'} OBS connection` });
    } finally {
      setLoading(false);
    }
  };

  const handleEditConnection = (connection: OBSConnection) => {
    setEditingConnection(connection);
    setEditForm({
      name: connection.name,
      host: connection.host,
      port: connection.port,
      password: connection.password || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingConnection) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/obs/connections/${editingConnection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'OBS connection updated successfully' });
        setShowEditDialog(false);
        setEditingConnection(null);
        fetchObsConnections();
      } else {
        setMessage({ type: 'error', text: 'Failed to update OBS connection' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update OBS connection' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConnection = async (id: number) => {
    if (!confirm('Are you sure you want to delete this OBS connection?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/obs/connections/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'OBS connection deleted successfully' });
        fetchObsConnections();
        fetchBotStatus();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete OBS connection' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete OBS connection' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserAdmin = async (userId: number, isAdmin: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `User admin status updated successfully` });
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: 'Failed to update user admin status' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user admin status' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiagnostics = async (host: string, port: number) => {
    setDiagnosticsLoading(true);
    try {
      const response = await fetch('/api/obs/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port })
      });

      if (response.ok) {
        const data = await response.json();
        setDiagnostics(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to run diagnostics' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to run diagnostics' });
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  const handleTestBot = async () => {
    setBotTestLoading(true);
    try {
      const response = await fetch('/api/bot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setBotTestResults(data);
        setMessage({ type: 'success', text: 'Bot test completed successfully' });
      } else {
        const error = await response.json();
        setBotTestResults({
          apiConnection: false,
          botInfo: null,
          lastTestTime: new Date().toISOString(),
          error: error.error || 'Unknown error'
        });
        setMessage({ type: 'error', text: 'Bot test failed' });
      }
    } catch (error) {
      setBotTestResults({
        apiConnection: false,
        botInfo: null,
        lastTestTime: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Network error'
      });
      setMessage({ type: 'error', text: 'Failed to test bot' });
    } finally {
      setBotTestLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testChatId.trim() || !testMessage.trim()) {
      setMessage({ type: 'error', text: 'Chat ID and message are required' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bot/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: testChatId, message: testMessage })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test message sent successfully' });
        setTestMessage('');
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to send test message' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test message' });
    } finally {
      setLoading(false);
    }
  };

  const handleStreamControl = async (connectionId: number, action: 'start' | 'stop', type: 'stream' | 'record') => {
    setStreamLoading(true);
    try {
      const response = await fetch(`/api/obs/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, connectionId })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: `${type === 'stream' ? 'Stream' : 'Recording'} ${action}ed successfully` 
        });
        
        // Refresh stream status
        await fetchStreamStatus(connectionId);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || `Failed to ${action} ${type}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to ${action} ${type}` });
    } finally {
      setStreamLoading(false);
    }
  };

  const fetchStreamStatus = async (connectionId: number) => {
    try {
      const [streamResponse, recordResponse] = await Promise.all([
        fetch(`/api/obs/stream/status?connectionId=${connectionId}`),
        fetch(`/api/obs/record/status?connectionId=${connectionId}`)
      ]);

      if (streamResponse.ok && recordResponse.ok) {
        const streamData = await streamResponse.json();
        const recordData = await recordResponse.json();

        setStreamStatus(prev => ({
          ...prev,
          [connectionId]: {
            isStreaming: streamData.outputActive,
            isRecording: recordData.outputActive,
            streamTimecode: streamData.outputTimecode,
            recordTimecode: recordData.outputTimecode
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch stream status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 dark:from-red-950 dark:via-purple-950 dark:to-blue-950">
      {/* Header */}
      <div className="border-b bg-black/40 backdrop-blur-md border-red-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                  <div className="relative p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl border-2 border-red-400/50">
                    <Video className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                      LiveStream Control
                    </h1>
                    {broadcastStats.isStreaming && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-500 rounded-full animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span className="text-xs font-bold text-white">LIVE</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-300">Professional broadcast control center</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-900/30 border border-red-500/30">
                <div className={`w-2 h-2 rounded-full ${botStatus.isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-sm font-medium text-green-300">
                  {botStatus.isRunning ? "Online" : "Offline"}
                </span>
              </div>
              {broadcastStats.isStreaming && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-500/30">
                  <Users className="h-4 w-4 text-blue-300" />
                  <span className="text-sm font-medium text-blue-300">
                    {broadcastStats.viewerCount} viewers
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-400 font-mono">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Status Messages */}
        {message && (
          <Alert variant={message.type === 'error' ? "destructive" : "default"} className="border-l-4 bg-black/20 backdrop-blur-sm border-red-500/50 text-white">
            <AlertDescription className="flex items-center gap-2">
              {message.type === 'error' ? (
                <XCircle className="h-4 w-4 text-red-400" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-400" />
              )}
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-12 p-1 bg-black/40 backdrop-blur-md rounded-xl border border-red-500/20 shadow-2xl">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg text-gray-300 hover:text-white transition-all">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="bot" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg text-gray-300 hover:text-white transition-all">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Bot</span>
            </TabsTrigger>
            <TabsTrigger value="obs" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg text-gray-300 hover:text-white transition-all">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">OBS</span>
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg text-gray-300 hover:text-white transition-all">
              <Terminal className="h-4 w-4" />
              <span className="hidden sm:inline">Diagnostics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg text-gray-300 hover:text-white transition-all">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-red-600 to-red-800 text-white shadow-xl">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-100">Stream Status</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Video className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-2 flex items-center gap-2">
                  {broadcastStats.isStreaming ? "LIVE" : "OFFLINE"}
                  {broadcastStats.isStreaming && (
                    <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-red-300" />
                  <p className="text-xs text-red-100">
                    {broadcastStats.isStreaming ? broadcastStats.streamUptime : "Ready to stream"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-xl">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Viewers</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-2">{broadcastStats.viewerCount}</div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-purple-300" />
                  <p className="text-xs text-purple-100">
                    {broadcastStats.isStreaming ? "Watching now" : "No stream"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Stream Quality</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Signal className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-2">{broadcastStats.bitrate > 0 ? `${broadcastStats.bitrate}K` : '0K'}</div>
                <div className="flex items-center gap-2">
                  <Radio className="h-3 w-3 text-blue-300" />
                  <p className="text-xs text-blue-100">
                    {broadcastStats.resolution || 'Not streaming'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-600 to-red-700 text-white shadow-xl">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">Stream Control</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  {broadcastStats.isStreaming ? <Square className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <Button
                  onClick={() => {}} // TODO: Implement stream control
                  disabled={!botStatus.isRunning}
                  size="sm"
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {broadcastStats.isStreaming ? "Stop Stream" : "Start Stream"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions and Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-2xl transition-all duration-300 border-0 bg-black/40 backdrop-blur-md shadow-xl border-red-500/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Zap className="h-5 w-5 text-red-400" />
                  </div>
                  Stream Controls
                </CardTitle>
                <CardDescription className="text-gray-300">Quick broadcast actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!broadcastStats.isStreaming}
                    className="h-12 flex flex-col items-center gap-1 border-red-500/30 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-xs">Camera</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!broadcastStats.isStreaming}
                    className="h-12 flex flex-col items-center gap-1 border-red-500/30 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-all"
                  >
                    <Mic className="w-4 h-4" />
                    <span className="text-xs">Mic</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!broadcastStats.isStreaming}
                    className="h-12 flex flex-col items-center gap-1 border-red-500/30 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="text-xs">Audio</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!broadcastStats.isStreaming}
                    className="h-12 flex flex-col items-center gap-1 border-red-500/30 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-all"
                  >
                    <Cast className="w-4 h-4" />
                    <span className="text-xs">Record</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-all duration-300 border-0 bg-black/40 backdrop-blur-md shadow-xl border-red-500/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-400" />
                  </div>
                  Stream Activity
                </CardTitle>
                <CardDescription className="text-gray-300">Latest broadcast events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Stream started</div>
                      <div className="text-xs text-gray-400">2 min ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Viewer joined</div>
                      <div className="text-xs text-gray-400">5 min ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">OBS connected</div>
                      <div className="text-xs text-gray-400">10 min ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bot" className="space-y-6">
          <Card className="hover:shadow-2xl transition-all duration-300 border-0 bg-black/40 backdrop-blur-md shadow-xl border-red-500/20">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">Bot Configuration</div>
                  <CardDescription className="mt-1 text-gray-300">Configure your Telegram bot for stream control</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="botToken" className="text-sm font-medium flex items-center gap-2 text-white">
                    <Shield className="h-4 w-4" />
                    Bot Token
                  </Label>
                  <Input
                    id="botToken"
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Enter your Telegram bot token"
                    className="h-12 border-2 border-red-500/30 focus:border-red-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
                  />
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Get your bot token from @BotFather on Telegram
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex-1">
                  <div className="font-medium text-red-200">Security Note</div>
                  <div className="text-sm text-red-300">
                    Your bot token is sensitive information. Keep it secure and never share it publicly.
                  </div>
                </div>
                <Shield className="h-5 w-5 text-red-400" />
              </div>

              <Button 
                onClick={handleSaveBotToken} 
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Save Bot Token
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Bot Test Card */}
          <Card className="hover:shadow-2xl transition-all duration-300 border-0 bg-black/40 backdrop-blur-md shadow-xl border-red-500/20">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <Terminal className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">Bot Testing</div>
                  <CardDescription className="mt-1 text-gray-300">Test your Telegram bot connectivity and functionality</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Bot Connection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-green-400" />
                    Connection Test
                  </h3>
                  <Button
                    onClick={handleTestBot}
                    disabled={botTestLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {botTestLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Testing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Test Bot
                      </div>
                    )}
                  </Button>
                </div>

                {/* Test Results */}
                {botTestResults && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-black/20 rounded-lg border border-green-500/20">
                      <div className={`w-3 h-3 rounded-full ${botTestResults.apiConnection ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          API Connection: {botTestResults.apiConnection ? '✅ Connected' : '❌ Failed'}
                        </div>
                        <div className="text-sm text-gray-400">
                          Last test: {new Date(botTestResults.lastTestTime).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {botTestResults.botInfo && (
                      <div className="p-4 bg-black/20 rounded-lg border border-blue-500/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-400">Bot Name:</span>
                            <span className="ml-2 text-white font-medium">{botTestResults.botInfo.first_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Username:</span>
                            <span className="ml-2 text-white font-medium">@{botTestResults.botInfo.username}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Bot ID:</span>
                            <span className="ml-2 text-white font-medium">{botTestResults.botInfo.id}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Can Join Groups:</span>
                            <span className="ml-2 text-white font-medium">{botTestResults.botInfo.can_join_groups ? '✅ Yes' : '❌ No'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {botTestResults.error && (
                      <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="text-red-200 font-medium">Error Details:</div>
                        <div className="text-red-300 text-sm mt-1">{botTestResults.error}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator className="bg-red-500/20" />

              {/* Send Test Message */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-400" />
                  Send Test Message
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="testChatId" className="text-sm font-medium flex items-center gap-2 text-white">
                      <Users className="h-4 w-4" />
                      Chat ID
                    </Label>
                    <Input
                      id="testChatId"
                      value={testChatId}
                      onChange={(e) => setTestChatId(e.target.value)}
                      placeholder="Enter Telegram chat ID"
                      className="h-12 border-2 border-blue-500/30 focus:border-blue-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
                    />
                    <p className="text-sm text-gray-400">
                      Get your chat ID from @userinfobot on Telegram
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="testMessage" className="text-sm font-medium flex items-center gap-2 text-white">
                      <MessageSquare className="h-4 w-4" />
                      Test Message
                    </Label>
                    <Textarea
                      id="testMessage"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Enter test message..."
                      className="min-h-[3rem] border-2 border-blue-500/30 focus:border-blue-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors resize-none"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendTestMessage}
                  disabled={loading || !testChatId.trim() || !testMessage.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Test Message
                    </div>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex-1">
                  <div className="font-medium text-green-200">Testing Tips</div>
                  <div className="text-sm text-green-300">
                    1. Test bot connection first<br/>
                    2. Get your chat ID from @userinfobot<br/>
                    3. Send a test message to verify functionality
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obs" className="space-y-6">
          {/* Add Connection Card */}
          <Card className="hover:shadow-2xl transition-all duration-300 border-0 bg-black/40 backdrop-blur-md shadow-xl border-red-500/20">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">Add OBS Connection</div>
                  <CardDescription className="mt-1 text-gray-300">Configure a new OBS Studio connection for streaming</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="connName" className="text-sm font-medium flex items-center gap-2 text-white">
                    <Cpu className="h-4 w-4" />
                    Connection Name
                  </Label>
                  <Input
                    id="connName"
                    value={newObsConnection.name}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, name: e.target.value })}
                    placeholder="My OBS Studio"
                    className="h-12 border-2 border-purple-500/30 focus:border-purple-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connHost" className="text-sm font-medium flex items-center gap-2 text-white">
                    <Globe className="h-4 w-4" />
                    Host
                  </Label>
                  <Input
                    id="connHost"
                    value={newObsConnection.host}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, host: e.target.value })}
                    placeholder="localhost"
                    className="h-12 border-2 border-purple-500/30 focus:border-purple-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connPort" className="text-sm font-medium flex items-center gap-2 text-white">
                    <Network className="h-4 w-4" />
                    Port
                  </Label>
                  <Input
                    id="connPort"
                    type="number"
                    value={newObsConnection.port}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, port: parseInt(e.target.value) })}
                    className="h-12 border-2 border-purple-500/30 focus:border-purple-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connPassword" className="text-sm font-medium flex items-center gap-2 text-white">
                    <Shield className="h-4 w-4" />
                    Password (Optional)
                  </Label>
                  <Input
                    id="connPassword"
                    type="password"
                    value={newObsConnection.password}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, password: e.target.value })}
                    placeholder="OBS WebSocket password"
                    className="h-12 border-2 border-purple-500/30 focus:border-purple-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddObsConnection} 
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Add Connection
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Connections List */}
          <Card className="hover:shadow-2xl transition-all duration-300 border-0 bg-black/40 backdrop-blur-md shadow-xl border-red-500/20">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">OBS Connections</div>
                  <CardDescription className="mt-1 text-gray-300">Manage your OBS Studio connections</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {obsConnections.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Server className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="text-lg font-medium text-gray-400">
                      No OBS connections configured
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Add your first OBS connection above to get started
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {obsConnections.map((connection) => (
                      <div key={connection.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 border-gray-700 rounded-xl hover:border-purple-500/50 transition-all duration-300 bg-black/20 gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className={`p-3 rounded-lg ${connection.isConnected ? 'bg-green-500/20' : 'bg-gray-800'}`}>
                            <Server className={`h-5 w-5 ${connection.isConnected ? 'text-green-400' : 'text-gray-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white">{connection.name}</div>
                            <div className="text-sm text-gray-400">
                              {connection.host}:{connection.port}
                            </div>
                            {connection.isConnected && streamStatus[connection.id] && (
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${streamStatus[connection.id].isStreaming ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`} />
                                  <span className={streamStatus[connection.id].isStreaming ? 'text-red-300' : 'text-gray-400'}>
                                    Stream: {streamStatus[connection.id].isStreaming ? streamStatus[connection.id].streamTimecode : 'OFF'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${streamStatus[connection.id].isRecording ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`} />
                                  <span className={streamStatus[connection.id].isRecording ? 'text-red-300' : 'text-gray-400'}>
                                    Record: {streamStatus[connection.id].isRecording ? streamStatus[connection.id].recordTimecode : 'OFF'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${connection.isConnected ? 'bg-green-500/20 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
                            {connection.isConnected ? 'Connected' : 'Disconnected'}
                          </div>
                          
                          {connection.isConnected && (
                            <>
                              {/* Stream Controls */}
                              <div className="flex items-center gap-1 border border-red-500/30 rounded-lg p-1 bg-red-500/10">
                                <Button
                                  onClick={() => handleStreamControl(connection.id, streamStatus[connection.id]?.isStreaming ? 'stop' : 'start', 'stream')}
                                  disabled={streamLoading}
                                  size="sm"
                                  className={`h-8 w-8 p-0 ${streamStatus[connection.id]?.isStreaming ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                                  title={streamStatus[connection.id]?.isStreaming ? 'Stop Stream' : 'Start Stream'}
                                >
                                  {streamStatus[connection.id]?.isStreaming ? <Square className="h-4 w-4" /> : <CirclePlay className="h-4 w-4" />}
                                </Button>
                                <div className={`w-2 h-2 rounded-full ${streamStatus[connection.id]?.isStreaming ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`} />
                              </div>

                              {/* Record Controls */}
                              <div className="flex items-center gap-1 border border-orange-500/30 rounded-lg p-1 bg-orange-500/10">
                                <Button
                                  onClick={() => handleStreamControl(connection.id, streamStatus[connection.id]?.isRecording ? 'stop' : 'start', 'record')}
                                  disabled={streamLoading}
                                  size="sm"
                                  className={`h-8 w-8 p-0 ${streamStatus[connection.id]?.isRecording ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                                  title={streamStatus[connection.id]?.isRecording ? 'Stop Recording' : 'Start Recording'}
                                >
                                  {streamStatus[connection.id]?.isRecording ? <Square className="h-4 w-4" /> : <RadioIcon className="h-4 w-4" />}
                                </Button>
                                <div className={`w-2 h-2 rounded-full ${streamStatus[connection.id]?.isRecording ? 'bg-orange-400 animate-pulse' : 'bg-gray-500'}`} />
                              </div>
                            </>
                          )}
                          
                          <Button
                            onClick={() => handleToggleObsConnection(connection.id, !connection.isConnected)}
                            disabled={loading}
                            size="sm"
                            className={`h-9 ${connection.isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                          >
                            {connection.isConnected ? 'Disconnect' : 'Connect'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRunDiagnostics(connection.host, connection.port)}
                            disabled={diagnosticsLoading}
                            className="h-9 border-orange-500/30 hover:bg-orange-500/20 text-orange-300 hover:text-orange-200"
                            title="Run Diagnostics"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditConnection(connection)}
                            disabled={loading}
                            className="h-9 border-blue-500/30 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200"
                            title="Edit Connection"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteConnection(connection.id)}
                            disabled={loading}
                            className="h-9 border-red-500/30 hover:bg-red-500/20 text-red-300 hover:text-red-200"
                            title="Delete Connection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <Card className="hover:shadow-2xl transition-all duration-300 border-0 bg-black/40 backdrop-blur-md shadow-xl border-red-500/20">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                  <Terminal className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">Stream Diagnostics</div>
                  <CardDescription className="mt-1 text-gray-300">Test connectivity and troubleshoot streaming issues</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diagHost" className="text-sm font-medium flex items-center gap-2 text-white">
                    <Globe className="h-4 w-4" />
                    Host
                  </Label>
                  <Input
                    id="diagHost"
                    value={newObsConnection.host}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, host: e.target.value })}
                    placeholder="103.167.123.195"
                    className="h-12 border-2 border-orange-500/30 focus:border-orange-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagPort" className="text-sm font-medium flex items-center gap-2 text-white">
                    <Network className="h-4 w-4" />
                    Port
                  </Label>
                  <Input
                    id="diagPort"
                    type="number"
                    value={newObsConnection.port}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, port: parseInt(e.target.value) })}
                    placeholder="4466"
                    className="h-12 border-2 border-orange-500/30 focus:border-orange-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    onClick={() => handleRunDiagnostics(newObsConnection.host, newObsConnection.port)}
                    disabled={diagnosticsLoading}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {diagnosticsLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Running...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Terminal className="h-5 w-5" />
                        Run Diagnostics
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              {diagnostics && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-black/20 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">Connection Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Host Reachable:</span>
                          {diagnostics.diagnostics.isReachable ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Port Open:</span>
                          {diagnostics.diagnostics.isPortOpen ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Response Time:</span>
                          <span className="text-sm text-white">{diagnostics.diagnostics.connectionTime}ms</span>
                        </div>
                        {diagnostics.diagnostics.pingTime && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Ping Time:</span>
                            <span className="text-sm text-white">{diagnostics.diagnostics.pingTime}ms</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">Connection Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Test Method:</span>
                          <span className="text-sm text-white">{diagnostics.diagnostics.portCheckMethod || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Firewall Status:</span>
                          <span className="text-sm text-white">{diagnostics.diagnostics.firewallStatus || 'Unknown'}</span>
                        </div>
                        {diagnostics.diagnostics.obsWebSocketReady !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">OBS WebSocket:</span>
                            {diagnostics.diagnostics.obsWebSocketReady ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">System Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Platform:</span>
                          <span className="text-sm text-white">{diagnostics.systemInfo.platform}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Node.js:</span>
                          <span className="text-sm text-white">{diagnostics.systemInfo.nodeVersion}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Firewall:</span>
                          <span className="text-sm text-white">{diagnostics.systemInfo.firewallStatus || 'Unknown'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {diagnostics.diagnostics.error && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <AlertDescription>
                        <strong>Connection Error:</strong> {diagnostics.diagnostics.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {diagnostics.diagnostics.recommendations.length > 0 && (
                    <Card className="bg-black/20 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2 text-white">
                          <AlertTriangle className="w-4 h-4 text-orange-400" />
                          Troubleshooting Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {diagnostics.diagnostics.recommendations.map((rec, index) => {
                            // Handle multi-line recommendations with proper formatting
                            if (rec.startsWith('❌') || rec.startsWith('✅') || rec.startsWith('⚠️') || rec.startsWith('🔥') || rec.startsWith('🚫') || rec.startsWith('🔧') || rec.startsWith('💡')) {
                              return (
                                <div key={index} className="space-y-1">
                                  <div className="font-medium text-white">{rec}</div>
                                </div>
                              );
                            } else if (rec.startsWith('•')) {
                              return (
                                <div key={index} className="ml-4 text-gray-400">
                                  {rec}
                                </div>
                              );
                            } else if (rec === '') {
                              return <div key={index} className="h-2"></div>;
                            } else {
                              return (
                                <div key={index} className="flex items-start gap-2">
                                  <span className="text-gray-400 mt-1">•</span>
                                  <span className="text-gray-300">{rec}</span>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {diagnostics.systemInfo.portScanResults && diagnostics.systemInfo.portScanResults.length > 0 && (
                    <Card className="bg-black/20 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-sm text-white">Local Port Scan Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {diagnostics.systemInfo.portScanResults.map((port, index) => (
                            <div key={index} className={`flex items-center justify-between p-2 border rounded ${
                              port.status === 'Open' ? 'border-green-500/30 bg-green-500/10' : 
                              port.status === 'Closed' ? 'border-red-500/30 bg-red-500/10' : 
                              'border-gray-700 bg-gray-800/50'
                            }`}>
                              <span className="font-medium text-white">Port {port.port}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  port.status === 'Open' ? 'bg-green-500/20 text-green-300' : 
                                  port.status === 'Closed' ? 'bg-red-500/20 text-red-300' : 
                                  'bg-gray-700 text-gray-400'
                                }`}>
                                  {port.status}
                                </span>
                                {port.service && (
                                  <span className="text-xs text-gray-400">{port.service}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {diagnostics.systemInfo.networkInterfaces.length > 0 && (
                    <Card className="bg-black/20 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-sm text-white">Available Network Interfaces</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {diagnostics.systemInfo.networkInterfaces.map((iface, index) => (
                            <div key={index} className="flex flex-col p-3 border rounded space-y-1 border-gray-700 bg-gray-800/30">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white">{iface.name}</span>
                                <span className="text-gray-400">{iface.address}</span>
                              </div>
                              {iface.netmask && (
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                  <span>Netmask:</span>
                                  <span>{iface.netmask}</span>
                                </div>
                              )}
                              {iface.mac && (
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                  <span>MAC:</span>
                                  <span>{iface.mac}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {!diagnostics && (
                <div className="text-center py-8 text-gray-400">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <p>Run diagnostics to test streaming connectivity and get troubleshooting recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="hover:shadow-2xl transition-all duration-300 border-0 bg-black/40 backdrop-blur-md shadow-xl border-red-500/20">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">Stream Viewers</div>
                  <CardDescription className="mt-1 text-gray-300">Manage bot users and their streaming permissions</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="text-lg font-medium text-gray-400">
                      No viewers registered yet
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Users will appear here when they interact with your stream
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border-2 border-gray-700 rounded-xl hover:border-green-500/50 transition-all duration-300 bg-black/20">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${user.isActive ? 'bg-green-500/20' : 'bg-gray-800'}`}>
                            <Users className={`h-5 w-5 ${user.isActive ? 'text-green-400' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">
                                {user.username || user.firstName || `User ${user.id}`}
                              </span>
                              {user.isAdmin && (
                                <div className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                                  Admin
                                </div>
                              )}
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
                                {user.isActive ? "Active" : "Inactive"}
                              </div>
                            </div>
                            <div className="text-sm text-gray-400">
                              ID: {user.id} • Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={user.isAdmin}
                              onCheckedChange={(checked) => handleToggleUserAdmin(user.id, checked)}
                              disabled={loading}
                              className="data-[state=checked]:bg-green-500"
                            />
                            <span className="text-sm font-medium text-white">Admin</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Connection Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px] bg-black/90 backdrop-blur-md border border-red-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Edit className="h-5 w-5 text-blue-400" />
              Edit OBS Connection
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Update your OBS Studio connection settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName" className="text-sm font-medium text-white">
                Connection Name
              </Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="My OBS Studio"
                className="h-12 border-2 border-blue-500/30 focus:border-blue-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editHost" className="text-sm font-medium text-white">
                Host Address
              </Label>
              <Input
                id="editHost"
                value={editForm.host}
                onChange={(e) => setEditForm({ ...editForm, host: e.target.value })}
                placeholder="localhost or IP address"
                className="h-12 border-2 border-blue-500/30 focus:border-blue-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPort" className="text-sm font-medium text-white">
                Port
              </Label>
              <Input
                id="editPort"
                type="number"
                value={editForm.port}
                onChange={(e) => setEditForm({ ...editForm, port: parseInt(e.target.value) || 4455 })}
                placeholder="4455"
                className="h-12 border-2 border-blue-500/30 focus:border-blue-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPassword" className="text-sm font-medium text-white">
                Password (Optional)
              </Label>
              <Input
                id="editPassword"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="WebSocket password"
                className="h-12 border-2 border-blue-500/30 focus:border-blue-500 bg-black/20 text-white placeholder:text-gray-400 transition-colors"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={loading || !editForm.name.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Save Changes
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
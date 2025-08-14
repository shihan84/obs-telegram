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
import { 
  Bot, Settings, Users, Activity, Wifi, WifiOff, Play, Square, Mic, MicOff, Eye, EyeOff, 
  AlertTriangle, CheckCircle, XCircle, Clock, Zap, Shield, Database, Monitor, 
  Network, Terminal, Sparkles, TrendingUp, Globe, Server, Cpu, HardDrive
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
  networkInterfaces: Array<{ name: string; address: string }>;
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

  useEffect(() => {
    fetchBotStatus();
    fetchObsConnections();
    fetchUsers();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    OBS Telegram Bot
                  </h1>
                  <p className="text-sm text-muted-foreground">Control OBS Studio remotely via Telegram</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                <div className={`w-2 h-2 rounded-full ${botStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {botStatus.isRunning ? "Online" : "Offline"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
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
          <Alert variant={message.type === 'error' ? "destructive" : "default"} className="border-l-4">
            <AlertDescription className="flex items-center gap-2">
              {message.type === 'error' ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-12 p-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="bot" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Bot</span>
            </TabsTrigger>
            <TabsTrigger value="obs" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">OBS</span>
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg">
              <Terminal className="h-4 w-4" />
              <span className="hidden sm:inline">Diagnostics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Bot Status</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-2">{botStatus.isRunning ? "Online" : "Offline"}</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${botStatus.isRunning ? 'bg-green-300 animate-pulse' : 'bg-red-300'}`} />
                  <p className="text-xs text-blue-100">
                    {botStatus.botConfigured ? "Configured" : "Not configured"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-100">Total Users</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-2">{botStatus.userCount}</div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-green-300" />
                  <p className="text-xs text-green-100">
                    {botStatus.activeUsers} active
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-500 to-violet-600 text-white">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">OBS Connections</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Server className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-2">{obsConnections.length}</div>
                <div className="flex items-center gap-2">
                  <Network className="h-3 w-3 text-purple-300" />
                  <p className="text-xs text-purple-100">
                    {obsConnections.filter(c => c.isConnected).length} connected
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-500 to-red-600 text-white">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">Bot Control</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  {botStatus.isRunning ? <Square className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <Button
                  onClick={botStatus.isRunning ? handleStopBot : handleStartBot}
                  disabled={loading || !botStatus.botConfigured}
                  size="sm"
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {botStatus.isRunning ? "Stop Bot" : "Start Bot"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions and Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-slate-800 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Quick Actions
                </CardTitle>
                <CardDescription>Common bot commands</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!botStatus.isRunning}
                    className="h-12 flex flex-col items-center gap-1 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs">Scenes</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!botStatus.isRunning}
                    className="h-12 flex flex-col items-center gap-1 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <EyeOff className="w-4 h-4" />
                    <span className="text-xs">Sources</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!botStatus.isRunning}
                    className="h-12 flex flex-col items-center gap-1 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Mic className="w-4 h-4" />
                    <span className="text-xs">Mute</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!botStatus.isRunning}
                    className="h-12 flex flex-col items-center gap-1 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <MicOff className="w-4 h-4" />
                    <span className="text-xs">Unmute</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-slate-800 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest bot events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Bot status check</div>
                      <div className="text-xs text-muted-foreground">2 min ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">User joined</div>
                      <div className="text-xs text-muted-foreground">5 min ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">OBS connected</div>
                      <div className="text-xs text-muted-foreground">10 min ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bot" className="space-y-6">
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-slate-800 shadow-md">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">Bot Configuration</div>
                  <CardDescription className="mt-1">Configure your Telegram bot token and settings</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="botToken" className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Bot Token
                  </Label>
                  <Input
                    id="botToken"
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Enter your Telegram bot token"
                    className="h-12 border-2 focus:border-blue-500 transition-colors"
                  />
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Get your bot token from @BotFather on Telegram
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex-1">
                  <div className="font-medium text-blue-900 dark:text-blue-100">Security Note</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Your bot token is sensitive information. Keep it secure and never share it publicly.
                  </div>
                </div>
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>

              <Button 
                onClick={handleSaveBotToken} 
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
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
        </TabsContent>

        <TabsContent value="obs" className="space-y-6">
          {/* Add Connection Card */}
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-slate-800 shadow-md">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">Add OBS Connection</div>
                  <CardDescription className="mt-1">Configure a new OBS Studio connection</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="connName" className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Connection Name
                  </Label>
                  <Input
                    id="connName"
                    value={newObsConnection.name}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, name: e.target.value })}
                    placeholder="My OBS Studio"
                    className="h-12 border-2 focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connHost" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Host
                  </Label>
                  <Input
                    id="connHost"
                    value={newObsConnection.host}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, host: e.target.value })}
                    placeholder="localhost"
                    className="h-12 border-2 focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connPort" className="text-sm font-medium flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Port
                  </Label>
                  <Input
                    id="connPort"
                    type="number"
                    value={newObsConnection.port}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, port: parseInt(e.target.value) })}
                    className="h-12 border-2 focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connPassword" className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Password (Optional)
                  </Label>
                  <Input
                    id="connPassword"
                    type="password"
                    value={newObsConnection.password}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, password: e.target.value })}
                    placeholder="OBS WebSocket password"
                    className="h-12 border-2 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddObsConnection} 
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
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
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-slate-800 shadow-md">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">OBS Connections</div>
                  <CardDescription className="mt-1">Manage your OBS Studio connections</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {obsConnections.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Server className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                      No OBS connections configured
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Add your first OBS connection above to get started
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {obsConnections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${connection.isConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            <Server className={`h-5 w-5 ${connection.isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <div className="font-medium">{connection.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {connection.host}:{connection.port}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${connection.isConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                            {connection.isConnected ? 'Connected' : 'Disconnected'}
                          </div>
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
                            className="h-9 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Run Diagnostics"
                          >
                            <AlertTriangle className="w-4 h-4" />
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
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-slate-800 shadow-md">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                  <Terminal className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">OBS Connection Diagnostics</div>
                  <CardDescription className="mt-1">Test connectivity to OBS Studio and troubleshoot connection issues</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diagHost" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Host
                  </Label>
                  <Input
                    id="diagHost"
                    value={newObsConnection.host}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, host: e.target.value })}
                    placeholder="103.167.123.195"
                    className="h-12 border-2 focus:border-orange-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagPort" className="text-sm font-medium flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Port
                  </Label>
                  <Input
                    id="diagPort"
                    type="number"
                    value={newObsConnection.port}
                    onChange={(e) => setNewObsConnection({ ...newObsConnection, port: parseInt(e.target.value) })}
                    placeholder="4466"
                    className="h-12 border-2 focus:border-orange-500 transition-colors"
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
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Connection Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Host Reachable:</span>
                          {diagnostics.diagnostics.isReachable ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Port Open:</span>
                          {diagnostics.diagnostics.isPortOpen ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Response Time:</span>
                          <span className="text-sm">{diagnostics.diagnostics.connectionTime}ms</span>
                        </div>
                        {diagnostics.diagnostics.pingTime && (
                          <div className="flex items-center justify-between">
                            <span>Ping Time:</span>
                            <span className="text-sm">{diagnostics.diagnostics.pingTime}ms</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Connection Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Test Method:</span>
                          <span className="text-sm">{diagnostics.diagnostics.portCheckMethod || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Firewall Status:</span>
                          <span className="text-sm">{diagnostics.diagnostics.firewallStatus || 'Unknown'}</span>
                        </div>
                        {diagnostics.diagnostics.obsWebSocketReady !== undefined && (
                          <div className="flex items-center justify-between">
                            <span>OBS WebSocket:</span>
                            {diagnostics.diagnostics.obsWebSocketReady ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">System Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Platform:</span>
                          <span className="text-sm">{diagnostics.systemInfo.platform}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Node.js:</span>
                          <span className="text-sm">{diagnostics.systemInfo.nodeVersion}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Firewall:</span>
                          <span className="text-sm">{diagnostics.systemInfo.firewallStatus || 'Unknown'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {diagnostics.diagnostics.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Connection Error:</strong> {diagnostics.diagnostics.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {diagnostics.diagnostics.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
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
                                  <div className="font-medium">{rec}</div>
                                </div>
                              );
                            } else if (rec.startsWith('•')) {
                              return (
                                <div key={index} className="ml-4 text-muted-foreground">
                                  {rec}
                                </div>
                              );
                            } else if (rec === '') {
                              return <div key={index} className="h-2"></div>;
                            } else {
                              return (
                                <div key={index} className="flex items-start gap-2">
                                  <span className="text-muted-foreground mt-1">•</span>
                                  <span>{rec}</span>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {diagnostics.systemInfo.portScanResults && diagnostics.systemInfo.portScanResults.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Local Port Scan Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {diagnostics.systemInfo.portScanResults.map((port, index) => (
                            <div key={index} className={`flex items-center justify-between p-2 border rounded ${
                              port.status === 'Open' ? 'border-green-200 bg-green-50' : 
                              port.status === 'Closed' ? 'border-red-200 bg-red-50' : 
                              'border-gray-200'
                            }`}>
                              <span className="font-medium">Port {port.port}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  port.status === 'Open' ? 'bg-green-100 text-green-800' : 
                                  port.status === 'Closed' ? 'bg-red-100 text-red-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {port.status}
                                </span>
                                {port.service && (
                                  <span className="text-xs text-muted-foreground">{port.service}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {diagnostics.systemInfo.networkInterfaces.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Available Network Interfaces</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {diagnostics.systemInfo.networkInterfaces.map((iface, index) => (
                            <div key={index} className="flex flex-col p-3 border rounded space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{iface.name}</span>
                                <span className="text-muted-foreground">{iface.address}</span>
                              </div>
                              {iface.netmask && (
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Netmask:</span>
                                  <span>{iface.netmask}</span>
                                </div>
                              )}
                              {iface.mac && (
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <p>Run diagnostics to test OBS connectivity and get troubleshooting recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-slate-800 shadow-md">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">Telegram Users</div>
                  <CardDescription className="mt-1">Manage bot users and their permissions</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                      No users registered yet
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Users will appear here when they interact with your bot
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-300 dark:hover:border-green-600 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${user.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            <Users className={`h-5 w-5 ${user.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {user.username || user.firstName || `User ${user.id}`}
                              </span>
                              {user.isAdmin && (
                                <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                                  Admin
                                </div>
                              )}
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                {user.isActive ? "Active" : "Inactive"}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
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
                            <span className="text-sm font-medium">Admin</span>
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
    </div>
    </div>
  );
}
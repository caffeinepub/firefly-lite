import { useState } from 'react';
import { useGetBankConnections, useCreateBankConnection, useDeleteBankConnection, useSyncBankConnection } from '../hooks/useFinanceQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, RefreshCw, Link as LinkIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { BankConnection, BankConnectionId } from '../backend';

export default function BankConnectionsPage() {
  const { data: connections = [], isLoading } = useGetBankConnections();
  const createConnection = useCreateBankConnection();
  const deleteConnection = useDeleteBankConnection();
  const syncConnection = useSyncBankConnection();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newConnectionName, setNewConnectionName] = useState('');
  const [newConnectionType, setNewConnectionType] = useState('');
  const [deleteDialogConnection, setDeleteDialogConnection] = useState<BankConnectionId | null>(null);

  const handleCreateConnection = async () => {
    if (!newConnectionName.trim() || !newConnectionType) {
      toast.error('Please provide a name and select a connection type');
      return;
    }

    try {
      await createConnection.mutateAsync({
        name: newConnectionName.trim(),
        connectionType: newConnectionType,
      });
      toast.success('Bank connection created successfully');
      setIsAddDialogOpen(false);
      setNewConnectionName('');
      setNewConnectionType('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create bank connection');
    }
  };

  const handleDeleteConnection = async (connectionId: BankConnectionId) => {
    try {
      await deleteConnection.mutateAsync(connectionId);
      toast.success('Bank connection deleted successfully');
      setDeleteDialogConnection(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete bank connection');
    }
  };

  const handleSyncConnection = async (connectionId: BankConnectionId, connectionName: string) => {
    try {
      await syncConnection.mutateAsync(connectionId);
      toast.success(`Syncing ${connectionName}...`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync bank connection');
    }
  };

  const getStatusBadge = (connection: BankConnection) => {
    if (connection.status.__kind__ === 'inProgress') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Syncing
        </Badge>
      );
    }
    if (connection.status.__kind__ === 'lastSynced') {
      const timestamp = Number(connection.status.lastSynced.timestamp);
      const date = new Date(timestamp);
      return (
        <Badge variant="outline" className="gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          Last synced: {date.toLocaleString()}
        </Badge>
      );
    }
    if (connection.status.__kind__ === 'syncError') {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Error: {connection.status.syncError.error}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Idle
      </Badge>
    );
  };

  const isSyncing = (connection: BankConnection) => {
    return connection.status.__kind__ === 'inProgress';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Connections</h1>
          <p className="text-muted-foreground mt-1">
            Connect your bank accounts to automatically import transactions
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bank Connection</DialogTitle>
              <DialogDescription>
                Create a new connection to import transactions from your bank
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="connection-name">Connection Name</Label>
                <Input
                  id="connection-name"
                  placeholder="e.g., My Checking Account"
                  value={newConnectionName}
                  onChange={(e) => setNewConnectionName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="connection-type">Connection Type</Label>
                <Select value={newConnectionType} onValueChange={setNewConnectionType}>
                  <SelectTrigger id="connection-type">
                    <SelectValue placeholder="Select a connection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mock Bank">Mock Bank</SelectItem>
                  </SelectContent>
                </Select>
                {newConnectionType === 'Mock Bank' && (
                  <p className="text-xs text-muted-foreground">
                    Mock Bank will generate sample transactions for testing purposes
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewConnectionName('');
                  setNewConnectionType('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateConnection} disabled={createConnection.isPending}>
                {createConnection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Connection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LinkIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bank connections yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first bank connection to start importing transactions automatically
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <Card key={connection.id.toString()}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {connection.name}
                      <Badge variant="secondary">{connection.connectionType}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Created: {new Date(Number(connection.createdTimestamp)).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncConnection(connection.id, connection.name)}
                      disabled={isSyncing(connection) || syncConnection.isPending}
                    >
                      {isSyncing(connection) ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Sync Now
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialogConnection(connection.id)}
                      disabled={deleteConnection.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status</p>
                    {getStatusBadge(connection)}
                  </div>
                  {connection.retryAttempts > 0n && (
                    <div className="text-sm text-muted-foreground">
                      Sync attempts: {connection.retryAttempts.toString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteDialogConnection !== null}
        onOpenChange={(open) => !open && setDeleteDialogConnection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bank Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bank connection? This action cannot be undone.
              Existing transactions will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogConnection && handleDeleteConnection(deleteDialogConnection)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteConnection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

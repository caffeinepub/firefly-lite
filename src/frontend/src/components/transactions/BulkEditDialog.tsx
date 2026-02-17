import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useGetAccounts, useGetCategories, useGetTags } from '../../hooks/useFinanceQueries';
import { Loader2 } from 'lucide-react';
import type { TransactionId, AccountId, CategoryId, TagId } from '../../backend';
import TagMultiSelect from '../tags/TagMultiSelect';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTransactionIds: TransactionId[];
  onBulkEdit: (action: BulkEditAction) => Promise<void>;
  onBulkDelete: () => Promise<void>;
}

export type BulkEditAction =
  | { type: 'changeAccount'; accountId: AccountId }
  | { type: 'changeCategory'; categoryId: CategoryId }
  | { type: 'changeDate'; date: bigint }
  | { type: 'addTags'; tagIds: TagId[] }
  | { type: 'removeTags'; tagIds: TagId[] };

export default function BulkEditDialog({
  open,
  onOpenChange,
  selectedTransactionIds,
  onBulkEdit,
  onBulkDelete,
}: BulkEditDialogProps) {
  const { data: accounts = [] } = useGetAccounts();
  const { data: categories = [] } = useGetCategories();
  const { data: tags = [] } = useGetTags();

  const [activeTab, setActiveTab] = useState('edit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState('');
  const [addTagIds, setAddTagIds] = useState<TagId[]>([]);
  const [removeTagIds, setRemoveTagIds] = useState<TagId[]>([]);

  const handleApplyEdit = async () => {
    setIsProcessing(true);
    try {
      if (accountId) {
        await onBulkEdit({ type: 'changeAccount', accountId: BigInt(accountId) });
      }
      if (categoryId) {
        await onBulkEdit({ type: 'changeCategory', categoryId: BigInt(categoryId) });
      }
      if (date) {
        await onBulkEdit({ type: 'changeDate', date: BigInt(new Date(date).getTime()) });
      }
      if (addTagIds.length > 0) {
        await onBulkEdit({ type: 'addTags', tagIds: addTagIds });
      }
      if (removeTagIds.length > 0) {
        await onBulkEdit({ type: 'removeTags', tagIds: removeTagIds });
      }
      resetForm();
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkDelete();
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setAccountId('');
    setCategoryId('');
    setDate('');
    setAddTagIds([]);
    setRemoveTagIds([]);
    setActiveTab('edit');
  };

  const hasChanges = accountId || categoryId || date || addTagIds.length > 0 || removeTagIds.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bulk Edit Transactions</DialogTitle>
            <DialogDescription>
              Apply changes to {selectedTransactionIds.length} selected transaction{selectedTransactionIds.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="delete">Delete</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="bulk-account">Change Account (optional)</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger id="bulk-account">
                    <SelectValue placeholder="Keep current accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keep current accounts</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id.toString()} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bulk-category">Change Category (optional)</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="bulk-category">
                    <SelectValue placeholder="Keep current categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keep current categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id.toString()} value={category.id.toString()}>
                        {category.name} ({category.isExpense ? 'Expense' : 'Income'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bulk-date">Change Date (optional)</Label>
                <Input
                  id="bulk-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="Keep current dates"
                />
              </div>

              <div>
                <Label>Add Tags (optional)</Label>
                <TagMultiSelect
                  tags={tags}
                  selectedTagIds={addTagIds}
                  onSelectedChange={setAddTagIds}
                  placeholder="Select tags to add..."
                />
              </div>

              <div>
                <Label>Remove Tags (optional)</Label>
                <TagMultiSelect
                  tags={tags}
                  selectedTagIds={removeTagIds}
                  onSelectedChange={setRemoveTagIds}
                  placeholder="Select tags to remove..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyEdit} disabled={!hasChanges || isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Apply Changes'
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="delete" className="space-y-4 mt-4">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive font-medium">
                  Warning: This action cannot be undone
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  You are about to permanently delete {selectedTransactionIds.length} transaction{selectedTransactionIds.length !== 1 ? 's' : ''}. Account balances will be updated accordingly.
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                  Delete Transactions
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure? This will permanently delete {selectedTransactionIds.length} transaction{selectedTransactionIds.length !== 1 ? 's' : ''} and update account balances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isProcessing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

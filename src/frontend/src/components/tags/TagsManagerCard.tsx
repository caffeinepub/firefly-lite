import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useGetTags, useCreateTag, useDeleteTag } from '../../hooks/useFinanceQueries';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TagsManagerCard() {
  const { data: tags = [], isLoading } = useGetTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();

  const [newTagName, setNewTagName] = useState('');
  const [deleteTagId, setDeleteTagId] = useState<bigint | null>(null);

  const handleCreate = async () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      toast.error('Tag name is required');
      return;
    }

    if (tags.some((tag) => tag.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error('A tag with this name already exists');
      return;
    }

    try {
      await createTag.mutateAsync(trimmedName);
      setNewTagName('');
      toast.success('Tag created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create tag');
    }
  };

  const handleDelete = async () => {
    if (!deleteTagId) return;

    try {
      await deleteTag.mutateAsync(deleteTagId);
      setDeleteTagId(null);
      toast.success('Tag deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete tag');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>Create and manage tags for organizing transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-tag" className="sr-only">
                New Tag Name
              </Label>
              <Input
                id="new-tag"
                placeholder="Enter tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
              />
            </div>
            <Button onClick={handleCreate} disabled={createTag.isPending || !newTagName.trim()} className="gap-2">
              {createTag.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Tag
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : tags.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No tags yet. Create your first tag above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag Name</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id.toString()}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTagId(tag.id)}
                        disabled={deleteTag.isPending}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteTagId !== null} onOpenChange={(open) => !open && setDeleteTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tag? This action cannot be undone. The tag will be removed from all transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteTag.isPending}>
              {deleteTag.isPending ? (
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

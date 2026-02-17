import { useState, useMemo } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Tag, TagId } from '../../backend';

interface TagMultiSelectProps {
  tags: Tag[];
  selectedTagIds: TagId[];
  onSelectedChange: (tagIds: TagId[]) => void;
  placeholder?: string;
}

export default function TagMultiSelect({ tags, selectedTagIds, onSelectedChange, placeholder = 'Select tags...' }: TagMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedTags = useMemo(() => {
    return tags.filter((tag) => selectedTagIds.some((id) => id === tag.id));
  }, [tags, selectedTagIds]);

  const handleToggle = (tagId: TagId) => {
    const isSelected = selectedTagIds.some((id) => id === tagId);
    if (isSelected) {
      onSelectedChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onSelectedChange([...selectedTagIds, tagId]);
    }
  };

  const handleRemove = (tagId: TagId) => {
    onSelectedChange(selectedTagIds.filter((id) => id !== tagId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Plus className="mr-2 h-4 w-4" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.some((id) => id === tag.id);
                  return (
                    <CommandItem
                      key={tag.id.toString()}
                      onSelect={() => handleToggle(tag.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`h-4 w-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span>{tag.name}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag.id.toString()} variant="secondary" className="gap-1">
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

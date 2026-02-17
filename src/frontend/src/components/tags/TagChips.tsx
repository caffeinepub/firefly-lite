import { Badge } from '@/components/ui/badge';
import type { Tag, TagId } from '../../backend';

interface TagChipsProps {
  tagIds: TagId[];
  tags: Tag[];
  maxDisplay?: number;
}

export default function TagChips({ tagIds, tags, maxDisplay = 3 }: TagChipsProps) {
  if (tagIds.length === 0) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const displayTags = tags.filter((tag) => tagIds.some((id) => id === tag.id));
  const visibleTags = displayTags.slice(0, maxDisplay);
  const remainingCount = displayTags.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map((tag) => (
        <Badge key={tag.id.toString()} variant="outline" className="text-xs">
          {tag.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

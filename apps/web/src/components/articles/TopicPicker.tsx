import type { Topic } from '@/hooks/useNewAnalysis';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Props = {
  topics: Topic[];
  topic: Topic;
  disabled: boolean;
  onSelect: (topic: Topic) => void;
};

export function TopicPicker({ topics, topic, disabled, onSelect }: Props) {
  return <Dialog>
    <DialogTrigger asChild>
      <Button type="button" variant="link" size="xs" disabled={disabled}>Change</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Example topic</DialogTitle>
        <DialogDescription>Example links for your article and both competitors switch to the chosen topic.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        {topics.map(item => <DialogClose key={item.title} asChild>
          <Button type="button" variant={item === topic ? 'secondary' : 'outline'} className="h-auto flex-col items-start py-3" onClick={() => onSelect(item)}>
            <span>{item.title}</span>
            <span className="font-normal text-muted-foreground">{[item.article, ...item.competitors].map(example => example.site).join(' · ')}</span>
          </Button>
        </DialogClose>)}
      </div>
    </DialogContent>
  </Dialog>;
}

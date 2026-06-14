import Markdown from "react-markdown"
import { ChevronDownIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface LessonContentProps {
  markdown: string
}

/** Bloco colapsável com o conteúdo da lição (markdown estilizado). */
export function LessonContent({ markdown }: LessonContentProps) {
  if (!markdown.trim()) return null

  return (
    <Collapsible className="flex flex-col gap-3">
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="group flex w-fit items-center gap-1.5 font-heading text-sm font-medium"
          >
            Conteúdo da lição
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
          </button>
        }
      />
      <CollapsibleContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Markdown>{markdown}</Markdown>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

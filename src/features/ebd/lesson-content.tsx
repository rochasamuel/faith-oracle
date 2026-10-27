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
    <Collapsible className="flex flex-col gap-4">
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="group flex min-h-12 w-full items-center justify-between gap-3 border-b border-rule pb-2.5 text-left font-heading text-2xl font-semibold"
          >
            Texto da lição
            <span className="flex items-center gap-1.5 font-sans text-base font-semibold text-primary">
              <span className="group-data-[panel-open]:hidden">Mostrar</span>
              <span className="hidden group-data-[panel-open]:inline">Esconder</span>
              <ChevronDownIcon className="size-5 transition-transform duration-200 group-data-[panel-open]:rotate-180" />
            </span>
          </button>
        }
      />
      <CollapsibleContent>
        <div className="prose prose-lg max-w-[68ch] dark:prose-invert prose-headings:font-heading prose-headings:font-semibold prose-p:leading-relaxed">
          <Markdown>{markdown}</Markdown>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

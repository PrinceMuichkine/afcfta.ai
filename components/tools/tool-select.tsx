import { ChatbotUIContext } from "@/context/context"
import { LLM, LLMID, ModelProvider } from "@/types"
import {
  IconCheck,
  IconChevronDown,
  IconPuzzle,
  IconSettings
} from "@tabler/icons-react"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Tables } from "@/supabase/types"
import { Separator } from "@/components/ui/separator"
import { validatePlanForTools } from "@/lib/subscription"
import { cn } from "@/lib/utils"

interface ToolSelectProps {
  className?: string
  selectedTools: Tables<"tools">[]
  onSelectTools: (tools: Tables<"tools">[]) => void
}

function ToolDetails({ tool }: { tool: Tables<"tools"> }) {
  return (
    <div className="mr-2 hidden w-[240px] flex-col space-y-1 border-r px-2 py-1 sm:flex">
      <div className="font-semibold">{tool.name}</div>
      <div className="text-xs">{tool.description}</div>
    </div>
  )
}

export const ToolSelect: FC<ToolSelectProps> = ({
  selectedTools,
  onSelectTools,
  className
}) => {
  const { profile, tools, setIsPaywallOpen } = useContext(ChatbotUIContext)

  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const [flash, setFlash] = useState(false)

  const [isOpen, setIsOpen] = useState(false)

  const [hoveredTool, setHoveredTool] = useState<Tables<"tools">>(tools[0])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100) // FIX: hacky
    }
  }, [isOpen])

  function createHandleSelectTool(tool: Tables<"tools">) {
    return (selected: boolean) => {
      handleSelectTool(tool, selected)
    }
  }
  function handleSelectTool(tool: Tables<"tools">, selected: boolean) {
    if (!validatePlanForTools(profile, [tool])) {
      setIsPaywallOpen(true)
      return
    }
    if (selected) {
      onSelectTools([...selectedTools, tool])
    } else {
      onSelectTools(selectedTools.filter(t => t.id !== tool.id))
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setFlash(true)
      setTimeout(() => {
        setFlash(false)
      }, 500)
    }
  }, [selectedTools])

  if (!profile) return null

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={isOpen => {
        setIsOpen(isOpen)
      }}
    >
      <DropdownMenuTrigger></DropdownMenuTrigger>

      <DropdownMenuContent
        className="relative mx-2 -ml-[140px] flex max-h-[300px] overflow-auto p-2"
        // style={{ width: triggerRef.current?.offsetWidth }}
      >
        <ToolDetails tool={hoveredTool} />
        <div>
          {tools.map(tool => {
            return (
              <DropdownMenuItem
                key={tool.id}
                onMouseEnter={() => setHoveredTool(tool as Tables<"tools">)}
                className={"flex w-full justify-between space-x-3"}
              >
                <div>{tool.name}</div>
                <Switch
                  checked={selectedTools.some(t => t.id === tool.id)}
                  onClick={e => e.stopPropagation()}
                  onCheckedChange={createHandleSelectTool(tool)}
                />
                {/*{selectedModelId === model.modelId && (*/}
                {/*  <IconCheck className="ml-2" size={32} />*/}
                {/*)}*/}

                {/*<ModelOption*/}
                {/*  key={model.modelId}*/}
                {/*  model={model}*/}
                {/*  selected={selectedModelId === model.modelId}*/}
                {/*  onSelect={() => handleSelectModel(model.modelId)}*/}
                {/*/>*/}
              </DropdownMenuItem>
            )
          })}
        </div>
        {/*<Separator />*/}
        {/*<DropdownMenuItem className={"flex w-full items-center space-x-2"}>*/}
        {/*  <IconSettings size={16} />*/}
        {/*  <div>Manage tools</div>*/}
        {/*</DropdownMenuItem>*/}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

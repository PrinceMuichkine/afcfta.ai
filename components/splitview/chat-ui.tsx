import Loading from "@/components/ui/loading"
import { useChatHandler } from "@/components/splitview/splitview-hooks/use-chat-handler"
import {
  FC,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react"
import { ChatInput } from "@/components/splitview/chat-input"
import { ChatMessages } from "@/components/splitview/chat-messages"
import { useScroll } from "@/components/splitview/splitview-hooks/use-scroll"
import { ChatSettings } from "@/components/splitview/chat-settings"
import { ChatbotUIChatContext, ChatbotUIChatProvider } from "@/context/chat"
import { LLMID, ModelProvider } from "@/types"
import { ChatbotUIContext } from "@/context/context"
import { cn } from "@/lib/utils"
import { IconGauge } from "@tabler/icons-react"
import { WithTooltip } from "@/components/ui/with-tooltip"

interface ChatUIProps {}

interface ChatMessagesRef {
  isGenerating: boolean
  selectedModel: {
    modelId: LLMID
    modelName: string
    provider: ModelProvider
    hostedId: string
    platformLink: string
    imageInput: boolean
    tools: boolean
  }
  handleSendEdit: (message: string) => void
  handleStopMessage: () => void
  handleSendMessage: (input: string, isRegeneration: boolean) => void
}

const ChatWrapper = forwardRef(
  (
    {
      onGeneratingChange,
      onModelChange
    }: {
      onGeneratingChange?: (isGenerating: boolean) => void
      onModelChange?: (model: any) => void
    },
    ref
  ) => {
    const { messagesStartRef, messagesEndRef, handleScroll } = useScroll()
    const {
      models,
      availableHostedModels,
      availableLocalModels,
      availableOpenRouterModels
    } = useContext(ChatbotUIContext)
    const { handleSendEdit, handleStopMessage, handleSendMessage } =
      useChatHandler()
    const {
      isGenerating,
      chatMessages,
      chatSettings,
      requestTokensTotal,
      responseTimeToFirstToken,
      responseTokensTotal,
      responseTimeTotal
    } = useContext(ChatbotUIChatContext)

    const allModels = [
      ...models.map(model => ({
        modelId: model.model_id as LLMID,
        modelName: model.name,
        provider: "custom" as ModelProvider,
        hostedId: model.id,
        platformLink: "",
        imageInput: false,
        tools: false,
        pricing: null
      })),
      ...availableHostedModels,
      ...availableLocalModels,
      ...availableOpenRouterModels
    ]

    const selectedModel = allModels.find(x => x.modelId === chatSettings?.model)

    useImperativeHandle(
      ref,
      () => ({
        handleSendEdit,
        handleStopMessage,
        handleSendMessage: (input: string, isRegeneration: boolean) =>
          handleSendMessage(input, chatMessages, isRegeneration, false)
      }),
      [selectedModel]
    )

    useEffect(() => {
      onGeneratingChange?.(isGenerating)
      onModelChange?.(selectedModel)
    }, [isGenerating, chatSettings])

    const cost = (
      (requestTokensTotal * (selectedModel?.pricing?.inputCost || 0)) /
        1000000 +
      (responseTokensTotal *
        (selectedModel?.pricing?.outputCost ||
          selectedModel?.pricing?.inputCost ||
          0)) /
        10000
    ).toFixed(6)

    return (
      <div className={"flex w-full flex-col"}>
        <ChatSettings className="w-auto border-b pr-2 pt-1" />
        <div
          className="flex grow flex-col overflow-auto p-4"
          onScroll={handleScroll}
        >
          <div ref={messagesStartRef} />
          <ChatMessages />
          <div ref={messagesEndRef} />
        </div>
        <div
          className={"flex items-center border-t px-2 py-3 font-mono text-xs"}
        >
          <div className={"border-r px-2"}>
            <IconGauge stroke={1.5} size={18} />
          </div>
          <div className={"border-r px-2"}>
            {responseTimeToFirstToken.toFixed(1)}{" "}
            <span className={"text-foreground/70"}>sec to first token</span>
          </div>
          <div className={"border-r px-2"}>
            {(responseTokensTotal > 0
              ? responseTokensTotal / responseTimeTotal
              : 0
            ).toFixed(1)}{" "}
            <span className={"text-foreground/70"}>tokens/sec</span>
          </div>
          <div className={"border-r px-2"}>
            {responseTokensTotal}{" "}
            <span className={"text-foreground/70"}>tokens</span>
          </div>
          <div className={"border-r px-2"}>
            {responseTimeTotal.toFixed(1)}{" "}
            <span className={"text-foreground/70"}>sec</span>
          </div>
          <div className={"px-2"}>
            <WithTooltip
              display={
                <div className={"flex items-center"}>
                  {responseTokensTotal} output tokens * ¢
                  {(
                    (selectedModel?.pricing?.outputCost ||
                      selectedModel?.pricing?.inputCost ||
                      0) / 10000
                  ).toFixed(6)}{" "}
                  + {requestTokensTotal} input tokens * ¢
                  {((selectedModel?.pricing?.inputCost || 0) / 10000).toFixed(
                    6
                  )}{" "}
                  = ¢{cost}
                </div>
              }
              trigger={<>¢{cost}</>}
            />
          </div>
        </div>
      </div>
    )
  }
)

ChatWrapper.displayName = "ChatWrapper"

function range(size: number, startAt = 0) {
  return [...Array(size).keys()].map(i => i + startAt)
}

export const ChatUI: FC<ChatUIProps> = () => {
  const [chatsSize, setChatsSize] = useState(2)
  const { newMessageImages, newMessageFiles, chatImages, chatFiles } =
    useContext(ChatbotUIContext)
  const [isGeneratingArray, setIsGeneratingArray] = useState<boolean[]>(
    new Array(chatsSize).fill(false)
  )
  const [toolsAllowedArray, setToolsAllowedArray] = useState<boolean[]>(
    new Array(chatsSize).fill(false)
  )
  const [imagesAllowedArray, setImagesAllowedArray] = useState<boolean[]>(
    new Array(chatsSize).fill(false)
  )

  const chatMessagesRef = useRef<ChatMessagesRef[]>([])

  const handleSendMessage = (input: string, isRegeneration: boolean) => {
    chatMessagesRef.current.forEach(ref => {
      ref.handleSendMessage(input, isRegeneration)
    })
  }

  const handleStopMessage = () => {
    chatMessagesRef.current.forEach(ref => {
      try {
        ref.handleStopMessage()
      } catch (e) {
        console.log(e)
      }
    })
  }

  return (
    <div className="flex size-full flex-col px-6 pt-4">
      <div
        className={cn(
          "flex max-h-[calc(100%-90px)] grow justify-around space-x-3",
          newMessageImages.length > 0 || newMessageFiles.length > 0
            ? "max-h-[calc(100%-164px)]"
            : ""
        )}
      >
        {range(chatsSize).map(i => (
          <div
            key={i}
            className={
              "flex size-full rounded-xl border sm:w-[200px] md:w-[250px] lg:w-[400px] xl:w-[640px]"
            }
          >
            <ChatbotUIChatProvider id={i.toString()}>
              <ChatWrapper
                ref={(ref: ChatMessagesRef) => {
                  chatMessagesRef.current[i] = ref
                }}
                onGeneratingChange={isGenerating => {
                  setIsGeneratingArray(prevState => {
                    const newState = [...prevState]
                    newState[i] = isGenerating
                    return newState
                  })
                }}
                onModelChange={model => {
                  setToolsAllowedArray(prevState => {
                    const newState = [...prevState]
                    newState[i] = !!model?.tools
                    return newState
                  })
                  setImagesAllowedArray(prevState => {
                    const newState = [...prevState]
                    newState[i] = !!model?.imageInput
                    return newState
                  })
                }}
              />
            </ChatbotUIChatProvider>
          </div>
        ))}
      </div>
      <div className="relative mx-auto w-full px-4 sm:w-[400px] md:w-[500px] lg:w-[660px] xl:w-[800px]">
        <ChatInput
          toolsAllowed={toolsAllowedArray.every(x => x)}
          imagesAllowed={imagesAllowedArray.every(x => x)}
          isGenerating={isGeneratingArray.some(x => x)}
          handleSendMessage={handleSendMessage}
          handleStopMessage={handleStopMessage}
        />
      </div>
    </div>
  )
}

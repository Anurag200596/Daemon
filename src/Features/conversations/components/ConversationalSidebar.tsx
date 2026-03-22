import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation"
import { Id } from "../../../../convex/_generated/dataModel"
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message"
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputTools, type PromptInputMessage } from "@/components/ai-elements/prompt-input"
import { DEFAULT_CONVERSATION_TITLE } from "../../../../convex/constants"
import { Button } from "@/components/ui/button"
import { CopyIcon, HistoryIcon, LoaderIcon, PlusIcon } from "lucide-react"
import { useconverSation, useConversations, useMessages, userCreateConversation } from "../hooks/use-conversation"
import { useState } from "react"
import { toast } from "sonner"
import ky from "ky"
import { HistoryBox } from "./History"

interface conversationalSidebarProps {
    projectId : Id<"projects">
}
PromptInput
export const ConversationalSidebar = ({ projectId }: conversationalSidebarProps) => {
    const [input, setinput] = useState("");
    const conversations = useConversations(projectId)
    const [selectedConversationId,setSelectedCoversationId] = useState<Id<"conversations">|null>(null)
    const [historyopen, sethistoryopen] = useState(false);

    const acitveConversationId = selectedConversationId ?? conversations?.[0]?._id ?? null
    const activeConversation = useconverSation(acitveConversationId)

    const conversationMessages = useMessages(acitveConversationId)

    const isProcessing = conversationMessages?.some(
    (msg) => msg.status === "processing"
    )
    

    const handleCreateConversation = async() => {
        try {
            const newConversationId = await createConversation({
                projectId,
                title : DEFAULT_CONVERSATION_TITLE
            })
            setSelectedCoversationId(newConversationId)
            return newConversationId
            
        } catch (error) {
            toast.error("Unable to create new Conversation")
            return null
        }

    }

    const handleSubmit = async(message : PromptInputMessage) => {
        setinput("")
        if(isProcessing || !message.text){
            await handleCancel()
            setinput("")
            return 
        }

        let conversationId = acitveConversationId

        if(!conversationId){
             conversationId = await handleCreateConversation()
             if(!conversationId) return 
        }

        try {
            await ky.post("/api/messages",{
                json: {
                    conversationId,
                    message : message.text
                }

            })    
        } catch (error) {
            toast.error("Message failed to send")
            
        }

    }

    const handleCancel = async() => {
        try {
            await ky.post("/api/messages/cancel",{
                json : { projectId }
            }
            )
        } catch (error) {
           toast.error("Unable to cancel request"); 
        }
        
    }

    const createConversation = userCreateConversation()

    return (
        <>
        <HistoryBox
        projectId={projectId}
        onSelect={setSelectedCoversationId}
        open = {historyopen}
        onopenChange={sethistoryopen}
        />
        <div className="flex flex-col h-full bg-sidebar">
            <div className="h-8.75 flex items-center justify-between border-b">
                <div className="text-sm truncate pl-3 font-semibold italic"> 
                    { activeConversation ? activeConversation.title : DEFAULT_CONVERSATION_TITLE}
                </div>
                <div className="flex items-center px-1 gap-1">
                    <Button onClick={() => sethistoryopen(true)} size="icon-xs" variant="highlight">
                        <HistoryIcon className="size-3.5"/>
                    </Button>
                    <Button onClick={handleCreateConversation} size="icon-xs" variant="highlight">
                        <PlusIcon  className="size-3.5"/>
                    </Button>

                </div>

            </div>
            <Conversation className="flex-1 flex flex-col">
                <ConversationContent>
                    {
                        conversationMessages?.map((message,messageIndex) =>(
                            <Message
                            key={messageIndex}
                            from = {message.role}
                            >
                            <MessageContent>
                            {message.status === "processing" ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <LoaderIcon  className="size-4 animate-spin"/>
                                    <span>Thinking...</span>
                                </div>

                            ) :
                            message.status == "cancelled" ?
                            (
                                <span className="text-muted-foreground italic">
                                    Request Cancelled
                                </span>

                            )
                            :
                            <MessageResponse>
                                {message.content}
                            </MessageResponse>   
                            }
                            </MessageContent>
                            {
                                message.role === "assistant" && message.status === "completed" && messageIndex === (conversationMessages.length ?? 0) - 1 && (
                                    <MessageActions>
                                        <MessageAction onClick={() => {navigator.clipboard.writeText(message.content)}} label = "copy">
                                            <CopyIcon className="size-3"/>
                                        </MessageAction>
                                    </MessageActions>
                                )
                            }
                            </Message>
                        ) )
                    }
                </ConversationContent>
                <ConversationScrollButton/>
                <div className="p-3">
                <PromptInput
                onSubmit={handleSubmit}
                className="mt-2"                
                >
                    <PromptInputBody>
                        <PromptInputTextarea
                        placeholder="Ask Daemon anything"
                        onChange={(e) => setinput(e.target.value)}
                        value = {input}
                        disabled = {false}
                        >
                        </PromptInputTextarea>
                    </PromptInputBody>
                    <PromptInputFooter>
                        <PromptInputTools/>
                        <PromptInputSubmit
                        disabled = {isProcessing ? false : !input}
                        status = {isProcessing ? "streaming" : undefined}
                        />
                    </PromptInputFooter>


                </PromptInput>

                </div>

            </Conversation>

        </div>
        </>
    )
}
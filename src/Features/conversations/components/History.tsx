"use client"

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Id } from "../../../../convex/_generated/dataModel"
import { useconverSation, useConversations } from "../hooks/use-conversation"
import { formatDistanceToNow } from "date-fns"

interface HisotryProps {
    projectId : Id<"projects">
    open : boolean,
    onopenChange : (open : boolean) => void
    onSelect : (conversationId : Id<"conversations">) => void
}


export const HistoryBox = ({
    projectId,
    open,
    onopenChange,
    onSelect
}:HisotryProps) => {
    const conversations = useConversations(projectId)

    const handleSelect = (conversationId : Id<"conversations">) => {
        onSelect(conversationId)
        onopenChange(false)
    }

    return (
        <CommandDialog 
        open = {open}
        onOpenChange={onopenChange}
        title="Past Conversations"
        description="Search and select a past conversation"
        >
            <CommandInput placeholder="Search Conversations..."/>
            <CommandList>
                <CommandEmpty>No Conversations Found.</CommandEmpty>
                <CommandGroup heading= " Conversations">
                    {
                        conversations?.map((conv) => (
                            <CommandItem
                            key={conv._id}
                            value={`${conv.title} - ${conv._id}`}
                            onSelect={() => handleSelect(conv._id)}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span>
                                        {conv.title}
                                    </span>
                                    <span className="text-xx text-muted-foreground">
                                        {
                                            formatDistanceToNow(conv._creationTime,{
                                                addSuffix : true
                                            })
                                        }
                                    </span>

                                </div>

                            </CommandItem>
                        ))
                    }

                </CommandGroup>
            </CommandList>

        </CommandDialog>
    )


}
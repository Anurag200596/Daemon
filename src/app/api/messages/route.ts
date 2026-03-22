import { convex } from "@/lib/convex-client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { inngest } from "@/inngest/client";

const requestSchema = z.object({
    conversationId : z.string(),
    message : z.string()
})

export async function POST (request : Request) {
    const { userId } = await auth()

    if(!userId) return NextResponse.json(
        {error : "Unauthorized"},
        {status : 400}
    )
    const internalKey = process.env.DAEMON_CONVEX_INTERNAL_KEY

    if(!internalKey) return NextResponse.json(
        {error : "Internal Key not configured"},
        {status: 500}
    )
    

    const body = await request.json()
    const { conversationId,message } = requestSchema.parse(body)

    const conversation = await convex.query(api.system.getConversationById,{
        id : conversationId as Id<"conversations">,
        internalKey
    })
    if(!conversation) return NextResponse.json(
        {error : "Conversation not Found"},
        {status: 500}
    )

    const projectId = conversation.projectId

    const processingMessages = await convex.query(api.system.getProcessingMessage, {
        internalKey,
        projectId: projectId as Id<"projects">
    })

    if (processingMessages.length > 0) {
        await Promise.all(processingMessages.map(async (msg) => {
            await inngest.send({
                name: "message/cancel",
                data: {
                    messageId: msg._id
                }
            })
            await convex.mutation(api.system.updateMessageStatus, {
                internalKey,
                messageId: msg._id,
                status: "cancelled"
            })
        }
        ))
    }
    
    const messageId = await convex.mutation(api.system.createMessage,{
        internalKey,
        conversationId : conversationId as Id<"conversations">,
        projectId,
        role : "user",
        content : message,
    })

  const assistantMessageId = await convex.mutation(api.system.createMessage,{
        internalKey,
        conversationId : conversationId as Id<"conversations">,
        projectId,
        status : "processing",
        role : "assistant",
        content : ""
    })

    const event = await inngest.send({
        name : "message/sent",
        data : {
            messageId : assistantMessageId,
            conversationId : conversationId,
            projectId : projectId,
            message : message
        }
    })



    return NextResponse.json({
        success : true,
        eventId : event.ids[0],
        messageId : assistantMessageId
    })



}
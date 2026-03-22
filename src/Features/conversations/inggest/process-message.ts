import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import { getRecentMessages } from "../../../../convex/system";
import { CODING_AGENT_SYSTEM_PROMPT, TITLE_GENERATOR_SYSTEM_PROMPT } from "./constants";
import { DEFAULT_CONVERSATION_TITLE } from "../../../../convex/constants";
import { createAgent, createNetwork, gemini } from "@inngest/agent-kit";
import { createReadFilesTool } from "./tools/read-file";
import { createListFilesTool } from "./tools/list-file";
import { createUpdateFileTool } from "./tools/update-file";
import { createCreateFilesTool } from "./tools/create-files";
import { createCreateFolderTool } from "./tools/create-folder";
import { createRenameFileTool } from "./tools/rename-file";
import { createDeleteFilesTool } from "./tools/delete-file";
import { createScrapeUrlsTool } from "./tools/scrape-urls";


interface MessageEvent {
    messageId: Id<"messages">
    projectId: Id<"projects">
    conversationId: Id<"conversations">
    message: string
}

export const processMessage = inngest.createFunction(
    {
        id: "process-message",
        cancelOn: [{
            event: "message/cancel",
            if: "event.data.messageId == async.data.messageId"
        }],
        onFailure: async ({ event, step }) => {
            const { messageId } = event.data.event.data as MessageEvent;
            const internalKey = process.env.DAEMON_CONVEX_INTERNAL_KEY;
            if (internalKey) {
                await step.run("update-message-on-failure", async () => {
                    await convex.mutation(api.system.updateMessageContent, {
                        internalKey,
                        messageId,
                        content:
                            "My apologies, I encountered an error while processing your request. Let me know if you need anything else!",
                    });
                });
            }
        }
    },
    {
        event: "message/sent"
    },
    async ({ step, event }) => {
        const {
            messageId,
            projectId,
            conversationId,
            message
        } = event.data as MessageEvent

        const internalKey = process.env.DAEMON_CONVEX_INTERNAL_KEY
        if (!internalKey) throw new NonRetriableError("DAEMON_CONVEX_INTERNAL_KEY is not configured")

        // await step.run("throw-on-Purpose",async() => {
        //     throw new NonRetriableError("pusposly threw this")
        // })
        await step.sleep("wait-for-dbSync", "1s")

        const conversation = await step.run("get-conversation", async () => {
            return await convex.query(api.system.getConversationById, {
                internalKey,
                id: conversationId
            })

        })

        if (!conversation) throw new NonRetriableError("Conversation not found")

        const recentMessages = await step.run("get-recent-messages", async () => {
            return await convex.query(api.system.getRecentMessages, {
                internalKey,
                conversationId,
                limit: 10
            })
        })

        let system_prompt = CODING_AGENT_SYSTEM_PROMPT

        const contextMessages = recentMessages.filter((msg) => {
            return msg._id !== messageId && msg.content.trim() !== ""
        })
        let historyText = ""

        if (contextMessages.length > 0) {
            historyText += contextMessages.map((msg) => {
                return `${msg.role} : ${msg.content}`
            }).join("\n\n")
        }


        system_prompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;


        const shouldGenerateTitle = conversation.title === DEFAULT_CONVERSATION_TITLE

        if (shouldGenerateTitle) {
            const titleAgent = createAgent({
                name: "title-agent",
                system: TITLE_GENERATOR_SYSTEM_PROMPT,
                model: gemini({
                    model: "gemini-2.5-flash",
                    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
                }),
            })

            console.log("GOOGLE KEY EXISTS:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY)

            const { output } = await titleAgent.run(message, { step })

            const textMessage = output.find((m) => m.type === "text" && m.role === "assistant")

            if (textMessage?.type === "text") {
                const title =
                    typeof textMessage.content === "string" ? textMessage.content.trim() :
                        textMessage.content.map((c) => c.text).join("").trim()
                if (title) {
                    step.run("update-title", async () => {
                        await convex.mutation(api.system.updateConversationTitle, {
                            internalKey,
                            title,
                            conversationId
                        })
                    })
                }
            }
        }

        const codingAgent = createAgent({
            name: "Daemon",
            system: system_prompt,
            model: gemini({
                model: "gemini-2.5-flash",
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
            }),
            tools: [
                    createListFilesTool({ internalKey, projectId }),
                    createReadFilesTool({ internalKey }),
                    createUpdateFileTool({ internalKey }),
                    createCreateFilesTool({ projectId, internalKey }),
                    createCreateFolderTool({ projectId, internalKey }),
                    createRenameFileTool({ internalKey }),
                    createDeleteFilesTool({ internalKey }),
                    createScrapeUrlsTool(),      
            ]

        })

        // Create network with single agent
        const network = createNetwork({
            name: "daemon-network",
            agents: [codingAgent],
            maxIter: 20,
            router: ({ network }) => {
                const lastResult = network.state.results.at(-1);
                const hasTextResponse = lastResult?.output.some(
                    (m) => m.type === "text" && m.role === "assistant"
                );
                const hasToolCalls = lastResult?.output.some(
                    (m) => m.type === "tool_call"
                );

                // Anthropic outputs text AND tool calls together
                // Only stop if there's text WITHOUT tool calls (final response)
                if (hasTextResponse && !hasToolCalls) {
                    return undefined;
                }
                return codingAgent;
            }
        });

        // Run the agent
        const result = await network.run(message);

        // Extract the assistant's text response from the last agent result
        const lastResult = result.state.results.at(-1);
        const textMessage = lastResult?.output.find(
            (m) => m.type === "text" && m.role === "assistant"
        );

        let assistantResponse =
            "I processed your request. Let me know if you need anything else!";

        if (textMessage?.type === "text") {
            assistantResponse =
                typeof textMessage.content === "string"
                    ? textMessage.content
                    : textMessage.content.map((c) => c.text).join("");
        }
        await step.run("update-assistant-message", async () => {
            await convex.mutation(api.system.updateMessageContent, {
                internalKey,
                messageId,
                content:assistantResponse
            })
        })
        return { success: true, messageId, conversationId };
    }
)
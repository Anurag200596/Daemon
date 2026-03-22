import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";


export const useconverSation = (id : Id<"conversations"> | null) => {
    return useQuery(api.conversations.getById, id ? {id} : "skip")
}

export const useMessages = (id: Id<"conversations"> | null) => {
    return useQuery(api.conversations.getMessages,id ? {id} : "skip")
}

export const useConversations = (id : Id<"projects">) => {
    return useQuery(api.conversations.getByProject,id ? {id} : "skip")
}

export const userCreateConversation = () => {
    return useMutation(api.conversations.Create)
}
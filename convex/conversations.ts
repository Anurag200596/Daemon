import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const Create = mutation({
    args : {
        projectId : v.id("projects"),
        title : v.string()
    },
    handler : async(ctx,args) => {
        const identity = await ctx.auth.getUserIdentity()
        if(!identity) throw new Error("Unauthorized User");

        const project = await ctx.db.get("projects",args.projectId)

        if(!project) throw new Error("Project does not exist");

        if(identity.subject != project.ownerId) throw new Error("Unauthorized access to the Project");

        const conversationId = await ctx.db.insert("conversations",{
            projectId : args.projectId,
            title : args.title,
            updatedAt : Date.now()
        })

        return conversationId
    }
})

export const getById = query({
    args: { 
        id : v.id("conversations")
    },
    handler: async(ctx,args) => {
        const identity = await ctx.auth.getUserIdentity()
        if(!identity) throw new Error("Unauthorised User");
        const conversation = await ctx.db.get("conversations",args.id)
        if(!conversation) throw new Error("Conversation does not exist");

        const project = await ctx.db.get("projects",conversation.projectId)

        if(!project) throw new Error("Project does not exist");

        if(identity.subject != project.ownerId) throw new Error("Unauthorised access to the project");

        return conversation
        
    }
})

export const getByProject = query({
    args: {
        id : v.id("projects")
    },
    handler : async(ctx,args) => {
        const identity = await ctx.auth.getUserIdentity()
        if(!identity) throw new Error("Unauthorized User");

        const project = await ctx.db.get("projects",args.id)

        if(!project) throw new Error("Project does not exist");

        if(identity.subject != project.ownerId) throw new Error("Unauthorized access to the Project");

        return await ctx.db.query("conversations").withIndex("by_project", (q) => q.eq("projectId",args.id)).order("desc").collect()

        
    }
})

export const getMessages = query({
    args: { 
        id : v.id("conversations")
    },
    handler: async(ctx,args) => {
        const identity = await ctx.auth.getUserIdentity()

        if(!identity) throw new Error("Unauthorised User");
        const conversation = await ctx.db.get("conversations",args.id)

        if(!conversation) throw new Error("Conversation does not exist");

        const project = await ctx.db.get("projects",conversation.projectId)

        if(!project) throw new Error("Project does not exist");

        if(identity.subject != project.ownerId) throw new Error("Unauthorised access to the project");

        return ctx.db.query("messages").withIndex("by_conversation", (q) => q.eq("conversationId",args.id)).order("asc").collect()    
    }
})

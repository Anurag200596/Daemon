import { v, VString } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        name: v.string()
    },
    handler: async(ctx,args) => {
        const identity = await ctx.auth.getUserIdentity()
        if(!identity) throw new Error("Unuthorized")
        
        const projectId = await ctx.db.insert("projects",{
            name: args.name,
            ownerId : identity.subject,
            updatedAt : Date.now()
        }) 
        
        return projectId
    }
})

export const get = query({
    args: {},
    handler: async(ctx) => {

        const identity = await ctx.auth.getUserIdentity()
        if(!identity) return []

        return await ctx.db.query("projects").withIndex("by_owner",(q) => q.eq("ownerId" , identity.subject)).order("desc").collect()

    }
    
})

export const getPartial = query({
    args: {
        limit : v.number()
    },
    handler: async(ctx,args) => {

        const identity = await ctx.auth.getUserIdentity()
        if(!identity) return []

        return await ctx.db.query("projects").withIndex("by_owner",(q) => q.eq("ownerId" , identity.subject)).order("desc").take(args.limit)

    }
    
})

// export const getById = query({
//     args: {
//         id: v.id("projects")
//     },
//     handler: async(ctx,args) => {

//         const identity = await ctx.auth.getUserIdentity()
//         if(!identity) return []


//         const project = await ctx.db.get("projects",args.id)

//         if(!project) throw new Error("Project does not Exist")

//         if(project._id !== identity.subject) throw new Error("Unauthorized access of the Project")  
            
//             return project

//     }
    
// })

export const updateSettings = mutation({
  args : {
    id : v.id("projects"),
    settings : v.object({
      installCommand : v.optional(v.string()),
      devCommand : v.optional(v.string())
    })
  },
  handler : async(ctx,args) => {
    const identity = await ctx.auth.getUserIdentity()
    if(!identity) return

    
    const project = await ctx.db.get("projects", args.id);
  
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access to this project");
    }

    await ctx.db.patch("projects",args.id,{
      settings : args.settings,
      updatedAt : Date.now()
    })

  }
})
export const getById = query({
    args: {
      id: v.id("projects")
    },
    handler: async (ctx, args) => {
    //   const identity = await verifyAuth(ctx);
    const identity = await ctx.auth.getUserIdentity()
      if(!identity) return null
  
      const project = await ctx.db.get("projects", args.id);
  
      if (!project) {
        throw new Error("Project not found");
      }
  
      if (project.ownerId !== identity.subject) {
        throw new Error("Unauthorized access to this project");
      }
  
      return project;
    },
  });

  export const rename = mutation({
    args: {
      id: v.id("projects"),
      name : v.string()
    },
    handler: async (ctx, args) => {
    //   const identity = await verifyAuth(ctx);
    const identity = await ctx.auth.getUserIdentity()
      if(!identity) return;
  
      const project = await ctx.db.get("projects", args.id);
  
      if (!project) {
        throw new Error("Project not found");
      }
  
      if (project.ownerId !== identity.subject) {
        throw new Error("Unauthorized access to this project");
      }

      await ctx.db.patch("projects",args.id,{
        name : args.name,
        updatedAt: Date.now()

      })
  
    },
  });

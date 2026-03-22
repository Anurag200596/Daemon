import { convex } from "@/lib/convex-client"
import { createTool } from "@inngest/agent-kit"
import z from "zod"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"


interface ListFileOptions {
    internalKey : string
    projectId : Id<"projects">
}

const paramSchema = z.object({
    fileIds: z.array(z.string().min(1,"FileId cannot be empty"))
    .min(1,"Provide atleast 1 FileId")
})

export const createListFilesTool = ({internalKey,projectId} : ListFileOptions) => {
    return createTool({
        name : "ListFiles",
        description : "List all files and the folders in the project.Returns Name,ID,Type and ParentID for each item,Items with ParentId : null are at the root level. Use the parentId to understand the folder structure - Items with the same parentId are in the same folder",
        parameters : z.object({}),
        handler : async(_, {step : toolStep}) => {
            try {
                return await toolStep?.run("list-files",async() => {
                    const files = await convex.query(api.system.getProjectFiles,{
                        internalKey,
                        projectId
                    })

                    const sorted = files.sort((a,b) => {
                        if(a.type !== b.type){
                            return a.type === "folder" ? -1 : 1
                        }
                        return a.name.localeCompare(b.name)
                    })

                    
                    
                    const fileList = sorted.map((f) => ({
                        id : f._id,
                        name : f.name,
                        type : f.type,
                        parentId : f.parentId ?? null
                    }))
                    
                    
                    return JSON.stringify(fileList)


                })

        
        
                
            } catch (error) {
                return Error("Error Listing files")
                
            }


        }

    })

}
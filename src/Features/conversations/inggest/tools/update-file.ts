import { convex } from "@/lib/convex-client"
import { createTool } from "@inngest/agent-kit"
import z from "zod"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"


interface UpdateFileToolOptions {
    internalKey : string
}

const paramSchema = z.object({
    fileId: z.string().min(1,"FileId is required"),
    content : z.string()
})

export const createUpdateFileTool = ({internalKey} : UpdateFileToolOptions) => {
    return createTool({
        name : "Update-files",
        description : "Update the content of an existing file",
        parameters : paramSchema,
        handler : async(params , {step : toolStep}) => {
            const parsed = paramSchema.safeParse(params)
            if(!parsed.success){
                return `Error : ${parsed.error.issues[0].message}`
            }

            const { fileId, content } = parsed.data

            const file = await convex.query(api.system.getFileById,{
                internalKey,
                fileId : fileId as Id<"files">
            })

            if(!file){
                return `Error : File with fileId : ${fileId} does not found. Use Listfiles to get valid filesIds`
            }
            if(file.type === "folder") return `Error : ${fileId} is a folder not a file. You can only update file contents`



            try {
                return await toolStep?.run("update-file",async() => {
                   await convex.mutation(api.system.updateFile,{
                    internalKey,
                    fileId : fileId as Id<"files">,
                    content
                   })

                   return `File ${fileId} updated successfully`
                })
                
            } catch (error) {
                    return `Error updating file: ${error}`
                
            }


        }

    })

}
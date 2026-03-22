import { convex } from "@/lib/convex-client"
import { createTool } from "@inngest/agent-kit"
import z from "zod"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"


interface ReadFileToolOptions {
    internalKey : string
}

const paramSchema = z.object({
    fileIds: z.array(z.string().min(1,"FileId cannot be empty"))
    .min(1,"Provide atleast 1 FileId")
})

export const createReadFilesTool = ({internalKey} : ReadFileToolOptions) => {
    return createTool({
        name : "ReadFiles",
        description : "Read the content of the files from the project. Returns file contents",
        parameters : paramSchema,
        handler : async(params , {step : toolStep}) => {
            const parsed = paramSchema.safeParse(params)
            if(!parsed.success){
                return `Error : ${parsed.error.issues[0].message}`
            }

            const { fileIds } = parsed.data

            try {
                return await toolStep?.run("read-files",async() => {
                    const results : {id :string;name : string;content:string}[] = []

                    for(const fileId of fileIds){
                        const file = await convex.query(api.system.getFileById,{
                            internalKey,
                            fileId: fileId as Id<"files">
                        })
                        if(file && file.content){
                            results.push({
                                id : file._id,
                                name : file.name,
                                content : file.content 
                            })
                        }
                    }

                    if(results.length === 0) return "Error : No files found with provided Ids. Try ListFiles to get valid FileIds"

                    return JSON.stringify(results)


                })
                
            } catch (error) {
                return Error("Error reading files")
                
            }


        }

    })

}
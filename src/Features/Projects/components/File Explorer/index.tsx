import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils";
import { ChevronRightIcon, CopyMinusIcon, FilePlusCornerIcon, FolderPlusIcon } from "lucide-react"
import { useState } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useProject } from "@/Features/Hooks/use-projects";
import { Button } from "@/components/ui/button";
import { useCreateFile, useCreateFolder, useFolderContents } from "@/Features/Hooks/use-files";
import { CreateInput } from "./createInput";
import { LoadingRow } from "./LoadingRow";
import { Tree } from "./Tree";




export const FileExplorer = ({projectId} : {projectId : Id<"projects">}) => {
    const [isOpen, setisOpen] = useState(true);

    const project = useProject(projectId)
    const rootFiles  = useFolderContents({projectId,enabled : isOpen})
    const [creating, setcreating] = useState<"file" | "folder" | null >(null);
    const [collapseKey, setcollapseKey] = useState(0);


        const createFile = useCreateFile()
        const  createfolder = useCreateFolder()

        const handleCreate = (name :string) => {
            setcreating(null)
            if(creating === "file"){
                createFile({
                    projectId,
                    name,
                    content : "",
                    parentId : undefined
                })
            }
            else{
                createfolder({
                    projectId,
                    name,
                    parentId : undefined

                })
            }

        }
    return (
        <div className="h-full bg-sidebar">
            <ScrollArea>
                <div
                role="button"
                onClick={() => setisOpen((value) => !value)}
                className="group/project cursor-pointer text-left w-full flex items-center gap-0.5 h-5.5 bg-accent font-bold"
                >
                    <ChevronRightIcon className={cn("size-4 shrink-0 text-muted-foreground",isOpen && "rotate-90")} />

                <p className="text-xs uppercase line-clamp-1">{project?.name ?? "Loading..."}</p>
                <div className="opacity-0 group-hover/project:opacity-100 transition-none flex duration-0 items-center gap-0.5 ml-auto ">
                <Button  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setisOpen(true)
                    setcreating("file")
                }} variant="highlight" size="icon-xs">
                    <FilePlusCornerIcon className="size-3.5"/>

                </Button>
                <Button  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setisOpen(true)
                    setcreating("folder")
                }} variant="highlight" size="icon-xs">
                  <FolderPlusIcon className="size-3.5"/>

                </Button>
                <Button  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setcollapseKey((prev) => prev + 1)
                }} variant="highlight" size="icon-xs">
                    <CopyMinusIcon className="size-3.5"/>

                </Button>

                </div>
                </div>
                {
                    isOpen && (
                        <>
                        {rootFiles === undefined && <LoadingRow level = {0} />} 
                        {
                            creating &&   <CreateInput 
                            type = {creating}
                            level = {0}
                            onSubmit = {handleCreate}
                            onCancel = {() => {setcreating(null)}}
                            />
                        }
                        {
                            rootFiles?.map((file) => (
                                <Tree
                                key = {`${file._id} - ${collapseKey}`}
                                projectId = {projectId}
                                item = {file}
                                level = {0}
                                />
                            ))
                        }

                        </>
                    )
                }

            </ScrollArea>

        </div>
    )
}
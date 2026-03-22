import { useEditor } from "@/Features/Hooks/use-editor"
import { Id } from "../../../../convex/_generated/dataModel"
import { TopNavigation } from "./TopNavigation"
import { FileBreadCrumbs } from "./FileBreadCrumbs"
import { useFile, useUpdateFile } from "@/Features/Hooks/use-files"
import Image from "next/image"
import { CodeEditor } from "./codeEditor"
import { useRef } from "react"

export const EditorView = ({projectId} : {projectId : Id<"projects">}) => {
    const Debounce_Ms = 1500
    const {activeTabId}= useEditor(projectId)
    const activeFile = useFile(activeTabId)
    const updateFile = useUpdateFile()
    const timeOutRef = useRef<NodeJS.Timeout|null>(null)
    const isActiveFileBinary = activeFile && activeFile.storageId
    const isActiveFileText = activeFile && !activeFile.storageId
        return (
        <div className="h-full flex flex-col">
            <div className="flex items-center">
                <TopNavigation projectId = {projectId}/>
            </div>
            {activeTabId && <FileBreadCrumbs projectId = {projectId}/>}
            <div className="flex-1 min-h-0 bg-background">
                {
                    !activeFile && (
                        <div className="size-full flex items-center justify-center">
                            <Image
                            src = "/vercel.svg"
                            alt = "logo"
                            height={100}
                            width={100}
                            className="opacity-25"
                            />
                        </div>

                    )
                }
                {isActiveFileText && <CodeEditor
                 fileName = {activeFile.name}
                 key={activeFile._id}
                 initialValue={activeFile.content ?? "Yaha Likh Code Bro"}
                 onChange={(content:string) => {
                    if(timeOutRef.current){
                        clearTimeout(timeOutRef.current)
                    }
                    timeOutRef.current = setTimeout(() => {
                        updateFile({id:activeFile._id,content})
                        
                    }, Debounce_Ms);
                 } }
                 />}

                 {
                    isActiveFileBinary && (
                        <div>
                            This i a Binary File
                        </div>
                    )
                 }

            </div>
        </div>
    )
}

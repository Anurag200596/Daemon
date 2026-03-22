"use client"

import { cn } from "@/lib/utils"
import { Id } from "../../../../convex/_generated/dataModel"
import { useState } from "react"
import { FaGithub } from "react-icons/fa"
import { Allotment } from "allotment"


import "allotment/dist/style.css"
import { FileExplorer } from "./File Explorer"
import { EditorView } from "@/Features/Editor/components/editor-view"
import { PreviewView } from "./preview-view"
import { ExportPopover } from "./export-popover"





const Tab = ({
    label,
    isActive,
    onClick,
}: {
    label: string,
    isActive: boolean,
    onClick: () => void
}) => {
    return (
        <div onClick={onClick} className={cn("flex items-center gap-2 h-full px-3 cursor-pointer text-muted-foreground border-rose-50 hover:bg-accent/30", isActive && "bg-background text-foreground")}>
            <span className="text-sm">{label}</span>

        </div>
    )

}
const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 800
const DEFAULT_SIDEBAR_WIDTH = 350
const DEFAULT_MAIN_SIZE = 1000
export const ProjectIdView = ({ projectId }: { projectId: Id<"projects"> }) => {
    const [activeView, setactiveView] = useState<"editor" | "preview">("editor");

    return (
        <div className="h-full flex flex-col">
            <nav className="h-8.75 flex items-center bg-sidebar border-b">
                <Tab label="Code"
                    isActive={activeView === "editor"}
                    onClick={() => setactiveView("editor")}
                />
                <Tab label="Preview"
                    isActive={activeView === "preview"}
                    onClick={() => setactiveView("preview")}
                />
                <div className="flex-1 flex justify-end h-full">
                 <ExportPopover projectId={projectId}/>

                </div>
            </nav>

            <div className="flex-1 relative h-full">
                <div className={cn("absolute inset-0 h-full", activeView === "editor" ? "visible" : "invisible")}>
                    <div className="h-full">
                        <Allotment defaultSizes={[DEFAULT_SIDEBAR_WIDTH, DEFAULT_MAIN_SIZE]}>
                            <Allotment.Pane minSize={MIN_SIDEBAR_WIDTH} maxSize={MAX_SIDEBAR_WIDTH} preferredSize={DEFAULT_SIDEBAR_WIDTH}>
                                <FileExplorer projectId={projectId} />
                            </Allotment.Pane>
                            <Allotment.Pane>
                                <div className="h-full"><EditorView projectId={projectId} /></div>
                            </Allotment.Pane>

                        </Allotment>
                    </div>
                </div>
                <div className={cn("absolute inset-0 ", activeView === "preview" ? "visible" : "invisible")}>
                    <PreviewView projectId={projectId} />
                </div>
            </div>

        </div>
    )

}
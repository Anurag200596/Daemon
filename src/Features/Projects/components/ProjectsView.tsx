"use client"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { SparkleIcon } from "lucide-react"
import { Poppins } from "next/font/google"
import {FaGithub} from "react-icons/fa"
import { ProjectsList } from "./ProjectsList"
import { useCreateProject } from "@/Features/Hooks/use-projects"
import {adjectives,animals,colors,uniqueNamesGenerator} from "unique-names-generator"

import { ProjectsCommandDialog } from "./projects-command-dialogBox"
import { useEffect, useState } from "react"
import { ImportDialogBox } from "./import-github-dialog"

const font = Poppins({
    subsets : ["latin"],
    weight : ["400","500","600","700"]
})


export const  ProjectsView = () => {
    const [commandDialogOpen, setcommandDialogOpen] = useState(false);
    const [importDialog, setImportDialog] = useState(false);
    useEffect(() => {
        const handleKeyDown = (e : KeyboardEvent) =>{
            if(e.metaKey || e.ctrlKey){
                if(e.key == "k") {
                    e.preventDefault()
                    setcommandDialogOpen(true)
                }
            }
            if(e.key === "i"){
                e.preventDefault()
                setImportDialog(true)
            }
            if(e.key === "j"){
                e.preventDefault()
                const projectName = uniqueNamesGenerator({
                    length:3,
                    separator : "-",
                    dictionaries : [
                        adjectives,
                        animals,
                        colors
                    ]
                })
                createProject({
                    name : projectName
                })
            }
            
        }
        
        
        document.addEventListener("keydown",handleKeyDown);
        return () => document.removeEventListener("keydown",handleKeyDown)
        
        
    }, []);
    
    
    const createProject = useCreateProject()
    return(
        <>
        <ProjectsCommandDialog
        open = {commandDialogOpen}
        onOpenChange = {setcommandDialogOpen}
        />
        <ImportDialogBox
        open = {importDialog}
        onOpenChange={setImportDialog}
        />
        <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center p-6 md:p-16">
            <div className="w-full max-w-sm mx-auto flex flex-col gap-4 items-center">
                <div className="flex justify-between gap-4 w-full items-center">
                    <div className="flex items-center gap-2 w-full group/logo">
                    <img src="/vercel.svg" alt="daemon" className="size-[32px] md:size-[46px]" />
                    <h1
                    className={
                        cn("text-4xl md:text-5xl font-semibold",font.className)}
                    >Daemon</h1>
                    </div>

                </div>
                <div className="flex flex-col gap-4 w-full">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                        variant="outline"
                        onClick={() => {
                            const ProjectName = uniqueNamesGenerator({
                                dictionaries : [
                                    adjectives,
                                    animals,
                                    colors
                                ],
                                separator: '-',
                                length : 3
                            })
                            createProject({
                                name : ProjectName
                            })
                        }}
                        className="h-full items-start justify-start p-4 bg-background broder flex flex-col gap-6 rounded-none"
                        >
                            <div className="flex items-center justify-between w-full">
                                <SparkleIcon className="size-4"/>
                                <Kbd className="bg-accent border">⌘J</Kbd>

                            </div>
                            <div>
                                <span className="text-sm">New</span>
                            </div>

                        </Button>
                        <Button
                        variant="outline"
                        onClick={() => setImportDialog(true)}
                        className="h-full items-start justify-start p-4 bg-background broder flex flex-col gap-6 rounded-none"
                        >
                            <div className="flex items-center justify-between w-full">
                                <FaGithub className="size-4"/>
                                <Kbd className="bg-accent border">⌘I</Kbd>

                            </div>
                            <div>
                                <span className="text-sm">Import</span>
                            </div>

                        </Button>

                    </div>
                    <ProjectsList onViewAll={() =>setcommandDialogOpen(true)}/>

                </div>

            </div>

        </div>

                            </>
    )
}
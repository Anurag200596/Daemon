import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Id } from "../../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Poppins } from "next/font/google"
import { UserButton } from "@clerk/clerk-react"
import { useProject, useRenameProject } from "@/Features/Hooks/use-projects"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip"
import { CloudCheckIcon, LoaderIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"






const font = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"]
})

export const Navbar = ({ projectId }: { projectId: Id<"projects">}) => {
    const [name, setname] = useState("");
    const [isRenaming, setisRenaming] = useState(false);
    const renameProject = useRenameProject({projectId})
    const project = useProject(projectId)
    const handleStartRename = () => {
        if(!project) return ;
        setname(project.name)
        setisRenaming(true)

    }
    const handleSubmit = () => {
        if(!project) return
        setisRenaming(false)
        const trimmedName = name.trim();

        if(!trimmedName || trimmedName === project.name) return;
        renameProject({id : projectId , name:trimmedName})

    }

    const handleKeyDown = (e:React.KeyboardEvent) =>{
        if(e.key === "Enter"){
            handleSubmit();
        }
        if(e.key === "Escape"){
            setisRenaming(false)
        }

    }
    return (
        <nav className="flex justify-between items-center gap-x-2 p-2 bg-sidebar border-b">
            <div className="flex
         items-center gap-2">
                <Breadcrumb>
                    <BreadcrumbList className="gap-0!">

                        <BreadcrumbItem>
                            <BreadcrumbLink className="flex items-center gap-1.5" asChild>
                                <Button variant="ghost" className="w-fit! p-1.5! h-7!" asChild>
                                    <Link href="/">
                                        <Image
                                            src="/vercel.svg"
                                            alt="Logo"
                                            height={20}
                                            width={20}
                                        />
                                            <span className={
                                                cn("text-sm font-medium", font.className)
                                            }>
                                                Daemon
                                            </span>      
                                    </Link>
                                </Button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="ml-0! mr-1!" />
                        <BreadcrumbItem>
                        {
                            isRenaming ?
                            <input autoFocus type="text" value={name} onChange={(e) => setname(e.target.value)}
                            onBlur={handleSubmit}
                            onKeyDown={handleKeyDown}
                            onFocus={(e) => e.currentTarget.select()}
                            className="text-sm bg-transparent text-foreground outline-none focus:ring-1 focus:ring-inset focus:ring-ring
                            font-medium max-w-40 truncate"
                            />

                             :
                            <BreadcrumbPage onClick={handleStartRename} className="text-sm cursor-pointer hover:text-primary font-medium max-w-40 truncate">
                            {project?.name ?? "Loading..."}
                            </BreadcrumbPage>

                        }
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                {
                    project?.importStatus === "importing" ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <LoaderIcon className="size-4 text-muted-foreground animate-spin"/>

                            </TooltipTrigger>
                            <TooltipContent>Importing...</TooltipContent>
                        </Tooltip>

                    ) : 
                    (
                        project?.updatedAt && (
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <CloudCheckIcon className="size-4 text-muted-foreground"/>

                            </TooltipTrigger>
                            <TooltipContent>Saved{" "}{ formatDistanceToNow(project.updatedAt, {addSuffix:true})} </TooltipContent>
                        </Tooltip>

                        )

                    )
                }
            </div>
            <div className="flex items-center gap-2">
                <UserButton/>

            </div>
        </nav>
    )

}
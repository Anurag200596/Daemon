
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { useProjectsPartial } from "@/Features/Hooks/use-projects"
import { Doc } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { AlertCircleIcon, ArrowRightIcon, GlobeIcon, Loader2Icon } from "lucide-react"
import { FaGithub } from "react-icons/fa"
import { ButtonGroup } from "@/components/ui/button-group"

interface ListProps {
    onViewAll : () => void
}
const formatTimeStamp = (timeStamp : number) => {
    return formatDistanceToNow(new Date(timeStamp),{
        addSuffix : true
    })
}

const ProjectItem = ({data} : {data : Doc<"projects">}) => {
    return(
    <Link href= {`/projects/${data._id}`} className="text-sm text-foreground/60 font-medium hover:text-foreground py-1 flex items-center justify-between w-full group">
    <div className="flex items-center gap-2">
       {getProjectImage(data)}
    </div>
    <span className="truncate font-medium">{data.name}</span>
        <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/60 transition-colors">
            {formatTimeStamp(data.updatedAt)}
        </span>
        
    </Link>
    )


}

const ContinueCard = ({data} : {data : Doc<"projects">}) => {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">Last Updated</span>
            <Button
             variant="outline"
             asChild
             className="h-auto items-start justify-start p-4 bg-background border rounded-none flex flex-col gap-2"
             >
                <Link href={`/projects/${data._id}`} className="group">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        {getProjectImage(data)}
                        <span className="font-medium truncate">
                            {data.name}
                        </span>
                    </div>
                    <ArrowRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform"/>
                </div>
                <span className="text-xs text-muted-foreground">
                    {formatTimeStamp(data.updatedAt)}

                </span>
                </Link>
             </Button>
        </div>
    )


}

const getProjectImage = (data : Doc<"projects">) => {
    switch (data.importStatus) {
        case "completed":
            return <FaGithub className="size-3.5 text-muted-foreground"/>
            break;
        case "failed":
            return <AlertCircleIcon className="size-3.5 text-muted-foreground"/>    
            break;
        case "importing":
            return <Loader2Icon className="size-3.5 text-muted-foreground animate-spin"/>  
            break;    
        default:
            return <GlobeIcon className="size-3.5 text-muted-foreground"/>
            break;
    }
}


export const ProjectsList = ({
    onViewAll
} : ListProps) => {

    const projects = useProjectsPartial(5)

    if(projects === undefined) return <Spinner className="size-4 text-ring"></Spinner>

    const [mostRecent, ...rest] = projects

    
    return(
        <div className="flex flex-col gap-4">
            {mostRecent ? <ContinueCard data={mostRecent} /> : null}
            {
                rest.length > 0 && (
                    <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 justify-between">
                        <span  className="text-xs text-muted-foreground">Recent Projects</span>
                        <Button onClick={onViewAll} className="flex items-center gap-2 text-muted-foreground bg-transparent hover:text-black text-xs transition-colors">
                            <span>View all</span>
                            <Kbd className="bg-accent border">
                              ⌘K
                            </Kbd>
                            
                        </Button>
                    </div>
                    <ul className="flex flex-col gap-4">
                        {
                            rest.map((project) => (
                                <ProjectItem key = {project._id} data = {project}/>
    
                            ))
    
                        }
                    </ul>
    
                </div>
                ) 
            }

           

        </div>
    )

}
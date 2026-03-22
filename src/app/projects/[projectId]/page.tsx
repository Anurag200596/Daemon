import { ProjectIdView } from "@/Features/Projects/components/Project-id-view"
import { Id } from "../../../../convex/_generated/dataModel"




const ProjectIdPage = async({params} : {params : Promise<{projectId : string}>}) =>{
    const {projectId} = await params
    return (
        <div className="text-white h-full">
          <ProjectIdView projectId = {projectId as Id<"projects">}/>

        </div>
    )
}

export default ProjectIdPage
"use client"

import { Navbar } from "./Navbar"
import { Id } from "../../../../convex/_generated/dataModel"
import { Allotment } from "allotment"




import { ConversationalSidebar } from "@/Features/conversations/components/ConversationalSidebar"
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 800;
const DEAFULT_CONVERSATION_SIDEBAR_WIDTH = 400;
const DEFAULT_MAIN_SIZE = 1000
export const ProjectIdLayout = ({children,projectId} : {children : React.ReactNode, projectId : Id<"projects">}) =>{
    return(
        <div className="w-full h-screen flex flex-col">
            <Navbar projectId = {projectId}/>
            <div className="flex-1 flex overflow-hidden">
                <Allotment className="flex-1" defaultSizes={[DEAFULT_CONVERSATION_SIDEBAR_WIDTH,DEFAULT_MAIN_SIZE]}>
                    <Allotment.Pane snap minSize={MIN_SIDEBAR_WIDTH} maxSize={MAX_SIDEBAR_WIDTH} preferredSize={DEAFULT_CONVERSATION_SIDEBAR_WIDTH}>
                        <ConversationalSidebar projectId = {projectId}/>

                    </Allotment.Pane>
                    <Allotment.Pane>
                        {children}

                    </Allotment.Pane>

                </Allotment>
           

            </div>
        </div>
    )

}
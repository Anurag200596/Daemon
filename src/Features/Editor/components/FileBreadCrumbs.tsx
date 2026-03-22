import { useEditor } from "@/Features/Hooks/use-editor";
import { Id } from "../../../../convex/_generated/dataModel";
import { useFilePath } from "@/Features/Hooks/use-files";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import React from "react";
import { FileIcon } from "@react-symbols/icons/utils";



export const FileBreadCrumbs = ({projectId} : {projectId :Id<"projects">}) => {
    const {activeTabId} = useEditor(projectId)
    const filepath = useFilePath(activeTabId)

    if(filepath === undefined || !activeTabId){
        return (
            <div className="p-2 pl-4 bg-background border-b">
                <Breadcrumb>
                <BreadcrumbList className="gap-0.5">
                <BreadcrumbItem className="text-sm">
                <BreadcrumbPage>
                &nbsp;
                </BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
                </Breadcrumb>

            </div>
        ) 
    }

    if(!filepath || filepath.length === 0){
        return null
    }

    return (
        <div className="p-2 bg-background pl-4 border-b">
            <Breadcrumb>
            <BreadcrumbList className="gap-0.5 sm:gap-0.5">
            {
                filepath.map((item,index) => {
                    const isLast = index === filepath.length - 1
                    return (
                        <React.Fragment key={item._id}>
                            <BreadcrumbItem className="text-sm">
                            {
                                isLast ? (
                                 <BreadcrumbPage className="flex items-center gap-1">
                                    <FileIcon fileName={item.name} autoAssign className="size-4"/>
                                    {item.name}

                                </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href="#">
                                        {item.name}
                                    </BreadcrumbLink>
                                )
                            }
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator className="mt-1"/>}

                        </React.Fragment>
                    )
})
            }
            </BreadcrumbList>
            </Breadcrumb>

        </div>
    )

}
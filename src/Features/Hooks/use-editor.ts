import { useCallback } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { useEditorStore } from "../Store/use-editor-file";


export const useEditor = (projectId : Id<"projects">) =>{
    const store  = useEditorStore();
    const tabState = useEditorStore((state) => state.getTabState(projectId))

    const openFile = useCallback(
        ( 
            fileId : Id<"files">,
            options: {pinned : boolean}
        ) => {
            store.openFile(projectId,fileId,options)
            
        },
        [store,projectId],
    );

    const closeTab = useCallback(
        (fileId : Id<"files">) => {
            store.closeTab(projectId,fileId)
            
        },
        [store,projectId],
    );
    const closeAllTabs = useCallback(
        (fileId : Id<"files">) => {
            store.closeAllTabs(projectId)
            
        },
        [store,projectId],
    );
    const setActiveTab = useCallback(
        (fileId : Id<"files">) => {
            store.setActiveTab(projectId,fileId)
            
        },
        [store,projectId],
    );


    return {
        openTabs : tabState.openTabs,
        activeTabId : tabState.activeTabId,
        previewTabId : tabState.previewTabId,
        openFile,
        closeTab,
        closeAllTabs,
        setActiveTab
    }


}
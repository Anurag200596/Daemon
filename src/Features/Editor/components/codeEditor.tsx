import { useEffect, useMemo, useRef } from "react"
import { EditorView,keymap } from "@codemirror/view"
import {javascript} from "@codemirror/lang-javascript"
import {oneDark} from "@codemirror/theme-one-dark"
import { customTheme } from "../Extensions/theme"
import { getLanguageExtension } from "../Extensions/language-extensions"
import { indentWithTab } from "@codemirror/commands"
import { minimap } from "../Extensions/minimap"
import {indentationMarkers} from "@replit/codemirror-indentation-markers"
import { customSetup } from "../Extensions/custom-setup"
import { suggestion } from "../Extensions/Suggestions"
import { quickEdit } from "../Extensions/quick-edit"
import { selectionTooltip } from "../Extensions/selection-tooltip"



export const CodeEditor = ({
    fileName,
    initialValue = "",
    onChange
} 
    :
     {
        fileName : string,
        initialValue? : string,
        onChange : (value:string) => void
    }) => {
    const editorRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)

    const languageExtension = useMemo(() => getLanguageExtension(fileName),[fileName])

    useEffect(() => {
        if(!editorRef.current) return
        const View = new EditorView({
            doc :  initialValue? initialValue :  "Yaha Likh Apna Code",
            parent : editorRef.current,
            extensions : [
                oneDark,
                customTheme,
                customSetup,
                suggestion(fileName),
                quickEdit(fileName),
                selectionTooltip(),
                languageExtension,
                keymap.of([indentWithTab]),
                minimap(),
                indentationMarkers(),
                EditorView.updateListener.of((update) => {
                    if(update.docChanged){
                        onChange(update.state.doc.toString())
                    }
                }
                )
            ]

        })
        viewRef.current = View
        return () => {
           View.destroy()
        }
    }, [languageExtension]);


    return(
        <div ref={editorRef} className="size-full pl-4 bg-background">

        </div>
    )
}
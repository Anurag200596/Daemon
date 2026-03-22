"use client"

import "@xterm/xterm/css/xterm.css"
import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"

interface previewTerminalProps {
    output: string,
}

export const PreviewTerminal = ({ output }: previewTerminalProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const terminalRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)
    const lastLengthRef = useRef(0)


    useEffect(() => {
        if (!containerRef.current || terminalRef.current) return
        const terminal = new Terminal({
            cursorBlink: true,
            convertEol: true,
            fontFamily: "monospace",
            fontSize: 12,
            theme: { background: "#1f2228" },
            disableStdin: false
        })

        terminal.onSelectionChange(() => {
            const text = terminal.getSelection();
            if (text) {
              navigator.clipboard.writeText(text);
            }
          });
        const fitAddon = new FitAddon()
        terminal.loadAddon(fitAddon)
        terminal.open(containerRef.current)

        terminalRef.current = terminal
        fitAddonRef.current = fitAddon

        if (output) {
            terminal.write(output)
            lastLengthRef.current = output.length
        }

        requestAnimationFrame(() => fitAddon.fit())

        const resizeObserver = new ResizeObserver(() => fitAddon.fit())
        resizeObserver.observe(containerRef.current)

        return () => {
            resizeObserver.disconnect()
            terminal.dispose()
            terminalRef.current = null
            fitAddonRef.current = null
        }


    }, []);

    useEffect(() => {
        if (!terminalRef.current) return
        if (output.length < lastLengthRef.current) {
            terminalRef.current.clear()
            lastLengthRef.current = 0
        }

        const newData = output.slice(lastLengthRef.current)
        if (newData) {
            terminalRef.current.write(newData)
            lastLengthRef.current = output.length
        }

    }, [output]);

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            className="flex-1 min-h-0 p-3 select-text [&_.xterm]:h-full! [&_.xterm-viewport]:h-full! [&_.xterm-screen]:h-full! bg-sidebar"
        />


    )

}
import {
    Decoration,          // Used to create visual changes (marks, widgets, line styles)
    DecorationSet,       // Efficient collection of multiple decorations
    EditorView,          // Represents the editor instance
    ViewPlugin,          // Allows reacting to view updates (typing, cursor move, etc.)
    ViewUpdate,          // Information about what changed in the editor
    WidgetType,          // Base class for custom inline DOM widgets
    keymap,              // Used to define custom keyboard shortcuts
  } from "@codemirror/view";
  
  import { StateEffect, StateField } from "@codemirror/state";
  import { fetcher } from "../fetcher";
  
  
  
  // ==============================
  // STATE MANAGEMENT
  // ==============================
  
  
  // StateEffect:
  // A mechanism to send "instructions" during a dispatch.
  // Here we define an effect that carries either:
  // - a string (new suggestion)
  // - null (clear suggestion)
  const setSuggestionEffect = StateEffect.define<string | null>();
  
  
  // StateField:
  // Persistent storage inside CodeMirror's state.
  // It stores the current suggestion text.
  const suggestionState = StateField.define<string | null>({
    
    // Runs once when editor initializes
    create() {
      return null; // Initially, no suggestion exists
    },
  
    // Runs on every transaction (typing, cursor move, dispatch, etc.)
    update(value, transaction) {
      
      // Check all effects in this transaction
      for (const effect of transaction.effects) {
        
        // If we find our custom suggestion effect,
        // update the state with its new value
        if (effect.is(setSuggestionEffect)) {
          return effect.value;
        }
      }
  
      // If no suggestion effect found,
      // keep the existing suggestion unchanged
      return value;
    },
  });
  
  
  // ==============================
  // GHOST TEXT WIDGET
  // ==============================
  
  
  // WidgetType:
  // Used to insert custom DOM elements inside the editor.
  // This is how ghost text is rendered visually.
  class SuggestionWidget extends WidgetType {
    
    // Store suggestion text inside the widget
    constructor(readonly text: string) {
      super();
    }
  
    // Called by CodeMirror to create actual DOM element
    toDOM() {
      const span = document.createElement("span");
  
      // Insert suggestion text visually
      span.textContent = this.text;
  
      // Make it look like ghost text
      span.style.opacity = "0.4";
  
      // Prevent it from blocking mouse interactions
      span.style.pointerEvents = "none";
  
      return span;
    }
  }
  
  
  // ==============================
  // GLOBAL CONTROL VARIABLES
  // ==============================
  
  
  // Timer for debounce (prevents too many API calls)
  let debounceTimer: number | null = null;
  
  // Flag to indicate suggestion is being fetched
  let isWaitingForSuggestion = false;
  
  // Delay before calling AI (in milliseconds)
  const DEBOUNCE_DELAY = 300;
  
  // Used to cancel previous API requests if user types again
  let currentAbortController: AbortController | null = null;
  
  
  // ==============================
  // CONTEXT GENERATION FOR AI
  // ==============================
  
  
  // Creates structured payload for AI request
  const generatePayload = (view: EditorView, fileName: string) => {
    
    // Get full editor content
    const code = view.state.doc.toString();
  
    // If document is empty, don't request suggestion
    if (!code || code.trim().length === 0) return null;
  
    // Get cursor position
    const cursorPosition = view.state.selection.main.head;
  
    // Get current line at cursor
    const currentLine = view.state.doc.lineAt(cursorPosition);
  
    // Position of cursor inside that line
    const cursorInLine = cursorPosition - currentLine.from;
  
  
    // --------------------------
    // Collect Previous Lines
    // --------------------------
    const previousLines: string[] = [];
  
    // Max 5 lines above
    const previousLinesToFetch = Math.min(5, currentLine.number - 1);
  
    for (let i = previousLinesToFetch; i >= 1; i--) {
      previousLines.push(view.state.doc.line(currentLine.number - i).text);
    }
  
  
    // --------------------------
    // Collect Next Lines
    // --------------------------
    const nextLines: string[] = [];
    const totalLines = view.state.doc.lines;
  
    // Max 5 lines below
    const linesToFetch = Math.min(5, totalLines - currentLine.number);
  
    for (let i = 1; i <= linesToFetch; i++) {
      nextLines.push(view.state.doc.line(currentLine.number + i).text);
    }
  
  
    // Return structured object for backend
    return {
      fileName,
      code,
      currentLine: currentLine.text,
      previousLines: previousLines.join("\n"),
      textBeforeCursor: currentLine.text.slice(0, cursorInLine),
      textAfterCursor: currentLine.text.slice(cursorInLine),
      nextLines: nextLines.join("\n"),
      lineNumber: currentLine.number,
    }
  }
  
  
  // ==============================
  // DEBOUNCE + FETCH PLUGIN
  // ==============================
  
  
  const createDebouncePlugin = (fileName: string) => {
    return ViewPlugin.fromClass(
      class {
  
        // Runs when plugin initializes
        constructor(view: EditorView) {
          this.triggerSuggestion(view);
        }
  
        // Runs whenever editor updates
        update(update: ViewUpdate) {

            if (!update.docChanged) return;
  
          // If user typed or moved cursor
          if (update.docChanged || update.selectionSet) {
            this.triggerSuggestion(update.view);
          }
        }
  
        // Core logic for fetching suggestion
        triggerSuggestion(view: EditorView) {
  
          // Clear previous debounce timer
          if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
          }
  
          // Abort previous API request if still running
          if (currentAbortController !== null) {
            currentAbortController.abort();
          }
  
          // Mark as waiting
          isWaitingForSuggestion = true;
  
          // Start new debounce timer
          debounceTimer = window.setTimeout(async () => {
  
            const payload = generatePayload(view, fileName);
  
            // If no valid context, clear suggestion
            if (!payload) {
              isWaitingForSuggestion = false;
              view.dispatch({ effects: setSuggestionEffect.of(null) });
              return;
            }
  
            // Create new AbortController for this request
            currentAbortController = new AbortController();
  
            // Call backend/AI
            const suggestion = await fetcher(
              payload,
              currentAbortController.signal
            );
  
            // Mark fetch completed
            isWaitingForSuggestion = false;
  
            // Update state with new suggestion
            view.dispatch({
              effects: setSuggestionEffect.of(suggestion),
            });
  
          }, DEBOUNCE_DELAY);
        }
  
        // Cleanup when plugin is destroyed
        destroy() {
          if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
          }
  
          if (currentAbortController !== null) {
            currentAbortController.abort();
          }
        }
      }
    )
  }
  
  
  // ==============================
  // RENDER GHOST TEXT PLUGIN
  // ==============================
  
  
  const renderPlugin = ViewPlugin.fromClass(
    class {
  
      // Stores current decorations
      decorations: DecorationSet;
  
      constructor(view: EditorView) {
        this.decorations = this.build(view);
      }
  
      update(update: ViewUpdate) {
  
        // Detect if suggestion changed
        const suggestionChanged = update.transactions.some((transaction) => {
          return transaction.effects.some((effect) => {
            return effect.is(setSuggestionEffect);
          });
        });
  
        // Rebuild if document changed, cursor moved, or suggestion updated
        const shouldRebuild =
          update.docChanged || update.selectionSet || suggestionChanged;
  
        if (shouldRebuild) {
          this.decorations = this.build(update.view);
        }
      }
  
      build(view: EditorView) {
  
        // If still waiting for suggestion, render nothing
        if (isWaitingForSuggestion) {
          return Decoration.none;
        }
  
        // Get current suggestion from state
        const suggestion = view.state.field(suggestionState);
  
        if (!suggestion) {
          return Decoration.none;
        }
  
        // Place ghost text at cursor position
        const cursor = view.state.selection.main.head;
  
        return Decoration.set([
          Decoration.widget({
            widget: new SuggestionWidget(suggestion),
            side: 1, // Render AFTER cursor
          }).range(cursor),
        ]);
      }
    },
  
    // Tell CodeMirror to use this plugin's decorations
    { decorations: (plugin) => plugin.decorations }
  );
  
  
  // ==============================
  // TAB TO ACCEPT SUGGESTION
  // ==============================
  
  
  const acceptSuggestionKeymap = keymap.of([
    {
      key: "Tab",
  
      run: (view) => {
  
        // Get current suggestion
        const suggestion = view.state.field(suggestionState);
  
        // If no suggestion exists, allow normal Tab behavior
        if (!suggestion) {
          return false;
        }
  
        const cursor = view.state.selection.main.head;
  
        // Insert suggestion into document
        view.dispatch({
          changes: { from: cursor, insert: suggestion },
          selection: { anchor: cursor + suggestion.length },
          effects: setSuggestionEffect.of(null), // Clear suggestion after accepting
        });
  
        return true; // Prevent normal indentation
      },
    },
  ]);
  
  
  // ==============================
  // FINAL BUNDLE EXTENSION
  // ==============================
  
  
  // Combines everything into one reusable extension
  export const suggestion = (fileName: string) => [
    suggestionState,                 // Stores suggestion text
    createDebouncePlugin(fileName),  // Fetches suggestion after typing
    renderPlugin,                    // Displays ghost text
    acceptSuggestionKeymap,          // Allows Tab to accept suggestion
  ];
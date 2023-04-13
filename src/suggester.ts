// Suggester module is modified from claremacrae's great work: Tasks
// https://github.com/obsidian-tasks-group/obsidian-tasks

import { App, Editor, EditorSuggest, TFile, } from 'obsidian';
import type { EditorPosition, EditorSuggestContext, EditorSuggestTriggerInfo } from 'obsidian';
import {ToggleListSettings, Setup, PopState} from 'src/settings'
import {match_sg, processOneLine, processOneLine2} from 'src/tlAction'

export type SuggestInfo = {
    suggestionType?: 'match' | 'default' | 'empty';
    // What to display to the user
    displayText: string;
    // What to append to the note
    appendText: string;
    // At what index in the line to do the insertion (if not specified, the cursor location is used)
    insertAt?: number;
    // How many characters to skip from the original line (e.g. if replacing existing text)
    insertSkip?: number;
};

export type SuggestInfoWithContext = SuggestInfo & {
    context: EditorSuggestContext;
};

export function buildSuggestions(line_num:number, line: string, idx: number, setup: Setup, direction:number): SuggestInfo[] {
    let suggestions: SuggestInfo[] = [];
    const N = setup.states.length
    const nidx = (idx+direction+N)%N
    const final = [...Array(N).keys()].map(i=>(i*direction+nidx+N)%N)
    for(let i = 0; i < N-1; i++) {
        const curIdx = final[i]
        suggestions.push({
            displayText: setup.states[curIdx],
            appendText: line,
            insertAt: line_num,
            insertSkip: curIdx,
        })
    }
    return suggestions;
}

export class EditorSuggestor extends EditorSuggest<SuggestInfoWithContext> {
    private settings: ToggleListSettings;
    private popw: PopState
    constructor(app: App, settings: ToggleListSettings) {
        super(app);
        this.settings = settings;
        this.popw = settings.pop_state
    }

    onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile): EditorSuggestTriggerInfo | null {
        if(!this.popw.hot){
            this.popw.popon = false;
        }
        else{
            this.popw.hot = false;
            const context = this.settings.pop_context
            const line = editor.getLine(cursor.line);
            return {start: cursor, end:{line: cursor.line, ch:context.stateIdx}, query:line}
            // const line = editor.getLine(cursor.line);
            // const bindings = this.settings.cur_cmd.bindings
            // // Match the selected binding
            // for (let i = 0; i < bindings.length; i++) {
            //     const setup = this.settings.setup_list[bindings[i]]
            //     const r = match_sg(line, setup)
            //     if (r.success){
            //         // Set matched Setup for suggester
            //         this.settings.cur_setup = setup
            //         return {
            //             start: cursor,
            //             end: {
            //                 line: cursor.line,
            //                 ch: r.offset,
            //             },
            //             query: line,
            //         };
            //     } 
            // } 
        }
        return null;
    }

    getSuggestions(context: EditorSuggestContext): SuggestInfoWithContext[] {
        const line = context.query;
        const line_idx = context.start.line
        let state_idx = context.end.ch
        const pop_context = this.settings.pop_context
        const N = pop_context.setup.states.length

        this.popw.incr = 0;
        state_idx += (N+pop_context.direction)%N;

        const suggestions: SuggestInfo[] = buildSuggestions(
            line_idx, line, state_idx, pop_context.setup, pop_context.direction);
        
        // Add the editor context to all the suggestions
        const suggestionsWithContext: SuggestInfoWithContext[] = [];
        for (const suggestion of suggestions) suggestionsWithContext.push({ ...suggestion, context: context });
        
        this.popw.popon = true;
        return suggestionsWithContext;
    }

    renderSuggestion(value: SuggestInfoWithContext, el: HTMLElement) {
        el.setText(value.displayText);
    }

    selectSuggestion(value: SuggestInfoWithContext, _evt: MouseEvent | KeyboardEvent) {
        const editor = value.context.editor;
        const line = value.appendText;
        const cur_steup = this.settings.pop_context.setup
        const r = processOneLine2(line, cur_steup, value.insertSkip||0)
        const line_idx = value.insertAt||0
        const cursor = editor.getCursor();
        editor.setLine(line_idx, r.content);
        const ch = (cursor.ch+r.offset > r.content.length) ? 
                r.content.length : cursor.ch+r.offset
        editor.setCursor(line_idx, ch);
        this.popw.popon = false;
        this.popw.incr = 0;
    }
}
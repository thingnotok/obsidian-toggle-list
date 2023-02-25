// Suggester module is modified from claremacrae's great work: Tasks
// https://github.com/obsidian-tasks-group/obsidian-tasks

import { App, Editor, EditorSuggest, TFile, } from 'obsidian';
import type { EditorPosition, EditorSuggestContext, EditorSuggestTriggerInfo } from 'obsidian';
import {ToggleListSettings, Setup, match_sg, processOneLine2} from 'src/settings'
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


export function buildSuggestions(line_num:number, line: string, idx: number, setup: Setup): SuggestInfo[] {
    let suggestions: SuggestInfo[] = [];
    const N = setup.states.length
    const nidx = idx+1==N ? 0 : idx+1
    const stateIdices = [...Array(N-nidx).keys()].map(i=>i+nidx).concat(
        [...Array(nidx).keys()])
    for(let i = 0; i < N; i++) {
        const curIdx = stateIdices[i]
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

    constructor(app: App, settings: ToggleListSettings) {
        super(app);
        this.settings = settings;
    }

    onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile): EditorSuggestTriggerInfo | null {
        if(this.settings.hot){
            this.settings.hot = false;
            const line = editor.getLine(cursor.line);
            const bindings = this.settings.cur_cmd.bindings
            for (let i = 0; i < bindings.length; i++) {
                const setup = this.settings.setup_list[bindings[i]]
                const r = match_sg(line, setup)
                if (r.success){
                    this.settings.cur_setup = setup
                    return {
                        start: cursor,
                        end: {
                            line: cursor.line,
                            ch: r.offset,
                        },
                        query: line,
                    };
                } 
            }
        }
        return null;
    }

    getSuggestions(context: EditorSuggestContext): SuggestInfoWithContext[] {
        const line = context.query;
        const line_idx = context.start.line
        const state_idx = context.end.ch
        const suggestions: SuggestInfo[] = buildSuggestions(
            line_idx, line, state_idx, this.settings.cur_setup);

        // Add the editor context to all the suggestions
        const suggestionsWithContext: SuggestInfoWithContext[] = [];
        for (const suggestion of suggestions) suggestionsWithContext.push({ ...suggestion, context: context });

        return suggestionsWithContext;
    }

    renderSuggestion(value: SuggestInfoWithContext, el: HTMLElement) {
        el.setText(value.displayText);
    }

    selectSuggestion(value: SuggestInfoWithContext, _evt: MouseEvent | KeyboardEvent) {
        const editor = value.context.editor;
        const line = value.appendText;
        const r = processOneLine2(line, this.settings.cur_setup, value.insertSkip||0)
        // console.log(r)
        const line_idx = value.insertAt||0
        const cursor = editor.getCursor();
        editor.setLine(line_idx, r.content)
        const ch = (cursor.ch+r.offset > r.content.length) ? 
                r.content.length : cursor.ch+r.offset
        editor.setCursor(line_idx, ch)
    }
}
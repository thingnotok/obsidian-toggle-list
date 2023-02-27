import { Editor } from "obsidian";
import { Command } from "./settings";
import { ToggleListSettings } from "./settings";

function triggerSuggestionEditor(editor: Editor){
	const cur = editor.getCursor();
	const next = Object.assign({}, cur);
	editor.replaceRange(" ", cur);
	next.ch = cur.ch + 1;
	editor.replaceRange("", cur, next);
}

export function popAction(editor:Editor, action:Command, settings:ToggleListSettings) {
	triggerSuggestionEditor(editor);
	settings.pop_state.hot = true;
	settings.cur_cmd = action;
}

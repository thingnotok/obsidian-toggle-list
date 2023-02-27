import { Editor } from "obsidian";
import { Command } from "./settings";
import { ToggleListSettings } from "./settings";

export function popAction(editor:Editor, action:Command, settings:ToggleListSettings) {
	const cur = editor.getCursor();
	const next = Object.assign({}, cur);
	settings.hot = true;
	settings.cur_cmd = action;
	editor.replaceRange(" ", cur);
	next.ch = cur.ch + 1;
	editor.replaceRange("", cur, next);
}

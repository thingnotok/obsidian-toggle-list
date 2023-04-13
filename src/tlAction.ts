import { Editor ,App} from "obsidian";
import { Command } from "./settings";
import { ToggleListSettings, EMPTY_TOKEN, Setup } from "./settings";

const SUR_DICT = new Map([
	['{tasks-today}', getTasksSuffix],
]);

const REG_DICT = [
	{ rule: /\\{tasks-today\\}/, pattern: "✅ [0-9]{4}-[0-9]{2}-[0-9]{2}" }
]

function getDate() {
	// Return Date in YYYY-MM-DD format.
	return new Date().toJSON().slice(0, 10)
}
function getTasksSuffix() {
	return " ✅ " + getDate()
}

function triggerSuggestionEditor(editor: Editor){
	const cur = editor.getCursor();
	const next = Object.assign({}, cur);
	editor.replaceRange(" ", cur);
	next.ch = cur.ch + 1;
	editor.replaceRange("", cur, next);
}

function triggerSuggestionEditorByToggleState(editor: Editor, cmd:Command, settings:ToggleListSettings, direction:number){
	// update line
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	console.log('pop action')
	console.log(cmd.bindings)
	// Match the selected binding
	for (let i = 0; i < cmd.bindings.length; i++) {
		const setup = settings.setup_list[cmd.bindings[i]]
		console.log('try')
		console.log(setup)
		const r = match_sg(line, setup)
		if (r.success){
			// Set matched Setup for suggester
			// settings.cur_setup = setup
			const stateIdx = r.offset
			const result = processOneLine(line, setup, direction)
			editor.setLine(cursor.line, result.content);
			const ch = (cursor.ch+result.offset > result.content.length) ? 
	        result.content.length : cursor.ch+result.offset
			editor.setCursor(cursor.line, ch);
			//register current state for suggestions
			if(cmd.isPopOver)
				settings.pop_state.hot = true;
			// settings.cur_cmd = action;
			settings.pop_context = {setup, stateIdx, direction}
			return
		} 
	}
}

export function popAction(editor:Editor, cmd:Command, settings:ToggleListSettings, direction:number, app:App) {


	// const selections = editor.listSelections()[0]
	// const isMultiLine = (selections.anchor.line != selections.head.line)
	// if(!isMultiLine){
	// 	console.log("Not multiline")
	// 	return triggerSuggestionEditorByToggleState(editor, cmd, settings, direction);
	// }
	// else{
	// 	console.log("multipline")
	// 	return toggleAction(editor, settings.setup_list, cmd.bindings, direction)
	// }
}


export function renderEmptyLine(text: string): string{
	const emptyline = EMPTY_TOKEN + '\n'
	const emptyline_last = '\n'+EMPTY_TOKEN
	let result = text.replace(/(^\n)/gm, emptyline)
	result = result.replace(/\n$/gm, emptyline_last)
	if(result == "")
		result = EMPTY_TOKEN
	return result
}

function parseSuffix(text: string) {
	const regex = /(\{.*\})/;
	const ff = text.match(regex);
	const found = ff || [];
	let suffix = text
	if (found.length > 0) {
		suffix = (SUR_DICT.get(found[1]) || (() => ""))() || suffix;
	}
	return suffix
}

function ChangeState(text: string, prev: Array<string>, next: Array<string>) {
	const pre = next[0] || ""
	const sur = parseSuffix(next[1]) || ""
	return pre + text + sur
}

function getRegExp(text: string) {
	let t = text || ""
	t = t.replace(/([\.\+\*\?\^\$\(\)\[\]\{\}\|\\])/g, "\\$1")
	for (let i = 0; i < REG_DICT.length; i++)
		t = t.replace(REG_DICT[i].rule, REG_DICT[i].pattern)
	return t
}

function getCurrentState(text: string, states: Array<string>) {
	// console.log(states)
	for (let i = 0; i < states.length; i++) {
		const s = states[i].split('||');
		const prefix = getRegExp(s[0])
		const suffix = getRegExp(s[1])

		let state_regex = new RegExp(`^(\\s*)${prefix}(.*)${suffix}$`);
		const result = text.match(state_regex) || []
		// console.log(state_regex)
		// console.log(result)
		if (result.length > 0) {
			// console.log(`${prefix}::${result[2]}||${suffix}`)
			return { sorted_idx: i, raw: result[2], idents: result[1] }
		}
	}
	return { sorted_idx: -1, raw: "" }
}

function separatePreSur(state: string): Array<string> {
	const strings = state.split('||')
	strings.push('')
	return strings
}

function roundAdd(a: number, b: number, low: number, high: number): number {
	let result = a + b;
	if (result == high)
		result = low;
	if (result < low)
		result = high - 1;
	return result
}

export function processOneLine2(text: string, setup: Setup, toIdx: number) {
	const cur_match = getCurrentState(text, setup.sorteds);
	if (cur_match.sorted_idx < 0) {
		return { success: false, content: text, offset: 0 }
	}
	const cur_idx = setup.states_dict.get(cur_match.sorted_idx) || 0;
	const next_idx = toIdx
	const cur_pair = separatePreSur(setup.states[cur_idx])
	const next_pair = separatePreSur(setup.states[next_idx])
	const new_text = cur_match.idents + ChangeState(cur_match.raw, cur_pair, next_pair)
	const offset = next_pair[0].length - cur_pair[0].length
	return { success: true, content: new_text, offset: offset}
}

export function processOneLine(text: string, setup: Setup, direction: number) {
	const cur_match = getCurrentState(text, setup.sorteds);
	if (cur_match.sorted_idx < 0) {
		return { success: false, content: text, offset: 0 }
	}
	const cur_idx = setup.states_dict.get(cur_match.sorted_idx) || 0;
	const next_idx = roundAdd(cur_idx, direction, 0, setup.states.length)
	const cur_pair = separatePreSur(setup.states[cur_idx])
	const next_pair = separatePreSur(setup.states[next_idx])
	const new_text = cur_match.idents + ChangeState(cur_match.raw, cur_pair, next_pair)
	const offset = next_pair[0].length - cur_pair[0].length
	return { success: true, content: new_text, offset: offset}
}

export function match_sg(text: string, setup: Setup){
	const cur_match = getCurrentState(text, setup.sorteds);
	if (cur_match.sorted_idx < 0) {
		return { success: false, content: text, offset: 0 }
	}
	const cur_idx = setup.states_dict.get(cur_match.sorted_idx) || 0;
	const cur_pair = separatePreSur(setup.states[cur_idx])
	// match status, current state pair, state_index
	return { success: true, content: cur_pair[0], offset: cur_idx }
}

export function toggleAction(editor: Editor, sg_list: Setup[], bindings: number[], direction: number) {
	// console.log('action')
	// console.log(setup)
	console.log("Toggle Action")
	console.log(bindings)
	let selection = editor.listSelections()[0];
	let cursor = editor.getCursor();
	let set_cur = false;
	if (selection.head.ch == selection.anchor.ch && selection.head.line == selection.anchor.line)
		set_cur = true;
	const head = selection.head.line
	const anchor = selection.anchor.line
	// console.log("head=" + selection.head.ch)
	// console.log("anchor=" + selection.anchor.ch)
	let start_line = head;
	let end_line = anchor;
	if (start_line > end_line) {
		start_line = anchor;
		end_line = head;
	}
	for (let i = start_line; i <= end_line; i++) {
		const origin = editor.getLine(i);
		// console.log("processing: " + origin)
		// console.log("bindings=" + bindings)
		let r = { success: false, content: origin, offset: 0 }
		for (let i = 0; i < bindings.length; i++) {
			// console.log("bindins:" + i)
			r = processOneLine(origin, sg_list[bindings[i]], direction);
			// console.log(sg_list[bindings[i]])
			// console.log(r)
			if (r.success)
				break;
		}
		// console.log(r)
		// const r = updateState(origin);
		editor.setLine(i, r.content);

		if (i == cursor.line) {
			if (cursor.ch < -r.offset)
				cursor.ch = 0;
			else if (cursor.ch + r.offset > r.content.length)
				cursor.ch = r.content.length
			else
				cursor.ch = cursor.ch + r.offset;
			// console.log("Cursor=" + cursor.ch)
		}
		if (i == head) {
			if (selection.head.ch < -r.offset)
				selection.head.ch = 0;
			else if (selection.head.ch + r.offset > r.content.length)
				selection.head.ch = r.content.length;
			else
				selection.head.ch = selection.head.ch + r.offset;
		}
		if (i == anchor) {
			if (selection.anchor.ch < -r.offset)
				selection.anchor.ch = 0;
			else if (selection.anchor.ch + r.offset > r.content.length)
				selection.anchor.ch = r.content.length
			else
				selection.anchor.ch = selection.anchor.ch + r.offset;
		}
	}
	editor.setSelection(selection.anchor, selection.head)
	// console.log("Nhead=" + selection.head.ch)
	// console.log("Nanchor=" + selection.anchor.ch)
	if (set_cur)
		editor.setCursor(cursor)
}

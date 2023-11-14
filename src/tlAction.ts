import { Editor ,App, EditorPosition} from "obsidian";
import { Command } from "./settings";
import { ToggleListSettings, EMPTY_TOKEN, Setup } from "./settings";

const timeFormats = [
    { rule: /\\{time:: YYYY-MM-DD hh:mm\\}/, pattern: "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}" },
    { rule: /\\{time:: YYYY-MM-DD\\}/, pattern: "\\d{4}-\\d{2}-\\d{2}" },
    { rule: /\\{time:: hh:mm:ss\\}/, pattern: "\\d{2}:\\d{2}:\\d{2}" },
    { rule: /\\{time:: hh:mm\\}/, pattern: "\\d{2}:\\d{2}" },
    { rule: /\\{time:: YYYY-MM\\}/, pattern: "\\d{4}-\\d{2}" },
    { rule: /\\{time:: MM-DD\\}/, pattern: "\\d{2}-\\d{2}" },
    { rule: /\\{time:: YYYY\\}/, pattern: "\\d{4}" },
    { rule: /\\{time:: MM\\}/, pattern: "\\d{2}" },
    { rule: /\\{time:: DD\\}/, pattern: "\\d{2}" },
    { rule: /\\{time:: hh\\}/, pattern: "\\d{2}" },
    { rule: /\\{time:: mm\\}/, pattern: "\\d{2}" },
    { rule: /\\{time:: ss\\}/, pattern: "\\d{2}" }
];

function formatDate(format: string, date: Date) {
    const day = date.getDate();
    const month = date.getMonth() + 1; // 0-based index
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const replacements: { [key: string]: string } = {
        'YYYY': year.toString(),
        'YY': String(year).slice(-2),
        'MM': month.toString().padStart(2, '0'),
        'DD': day.toString().padStart(2, '0'),
        'hh': hours.toString().padStart(2, '0'),
        'mm': minutes.toString().padStart(2, '0'),
        'ss': seconds.toString().padStart(2, '0'),
        'M': month.toString(),
        'D': day.toString(),
        'h': hours.toString(),
        'm': minutes.toString(),
        's': seconds.toString()
    };

    let formattedDate = format;
    for (let key in replacements) {
        formattedDate = formattedDate.replace(key, replacements[key]);
    }

    return formattedDate;
}


function getDate() {
	// Return Date in YYYY-MM-DD format.
	// Fix Date with time zone offset
	const localDate = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
	return localDate
}
function getTasksSuffix() {
	return getDate()
}

function triggerSuggestionEditor(editor: Editor){
	const cur = editor.getCursor();
	const next = Object.assign({}, cur);
	editor.replaceRange(" ", cur);
	next.ch = cur.ch + 1;
	editor.replaceRange("", cur, next);
}
function setupCursor(cursor:EditorPosition, offset:number, origin_set: {x:number, a:number, y:number, z:number}, new_set: {x:number, a:number, y:number, z:number}){
	// cursor in prefix, move to head of content
	const x0 = (origin_set?.x||0)
	const y0 = (origin_set?.y||0)
	const x1 = (new_set?.x||0)
	const y1 = (new_set?.y||0)
	const a = (origin_set?.a ||0)
	const z = (origin_set?.z ||0)
	// cursor in prefix, move to head of content
	if(cursor.ch <= x0)
		cursor.ch = x1
	// cursor in content, keep in the same location of content
	else if (cursor.ch <=(x0+a))
		cursor.ch = cursor.ch+offset
	// cursor in surfix, move to end of content
	else if (cursor.ch> (x0+a) && cursor.ch <=(x0+a+y0))
		cursor.ch = x1+a
	// cursor in blkID, move to end of line
	else
		cursor.ch = (x1+a+y1+z)
	return cursor
}
function triggerSuggestionEditorByToggleState(editor: Editor, cmd:Command, settings:ToggleListSettings, direction:number){
	// update line
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	// Match the selected binding
	for (let i = 0; i < cmd.bindings.length; i++) {
		const setup = settings.setup_list[cmd.bindings[i]]
		const r = match_sg(line, setup)
		if (r.success){
			// Set matched Setup for suggester
			// settings.cur_setup = setup
			const stateIdx = r.offset
			const result = processOneLine(line, setup, -1, direction)
			editor.setLine(cursor.line, result.content);
			const new_cursor  = setupCursor(cursor, result.offset, result.origin_set, result.new_set)
			editor.setCursor(new_cursor.line, new_cursor.ch);
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
	const selections = editor.listSelections()[0]
	const isMultiLine = (selections.anchor.line != selections.head.line)
	if(!isMultiLine){
		// console.log("Not multiline")
		return triggerSuggestionEditorByToggleState(editor, cmd, settings, direction);
	}
	else{
		// console.log("multipline")
		return toggleAction(editor, settings.setup_list, cmd.bindings, direction)
	}
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

function getFormatTime(time_format: string): string{
	// const now = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
	const now = new Date(new Date().getTime())
	const convertTime = formatDate(time_format, now) || ""
	return convertTime
}

function applyTimeFormats(text: string) {
	// Check if next state use {date}
	const regex = /\{(time::.*)\}/;
	const ff = text.match(regex);
	const found = ff || [];
	let suffix = text
	if (found.length > 0) { //detect special format
		const tag = found[1]
		const tag_ = tag.split(':: ')
		const time_format = tag_[1]
		const convertTime = getFormatTime(time_format)
		// const date_txt = (SUR_DICT.get(found[1]) || (() => ""))() || ""
		suffix = suffix.replace("{"+found[1]+"}", convertTime);
	}
	return suffix
}

function ChangeState(text: string, prev: Array<string>, next: Array<string>) {
	const pre = applyTimeFormats(next[0]) || ""
	const sur = applyTimeFormats(next[1]) || ""
	return pre + text + sur
}

function getRegExp(text: string) {
	let t = text || ""
	t = t.replace(/([\.\+\*\?\^\$\(\)\[\]\{\}\|\\])/g, "\\$1")
	for (let i = 0; i < timeFormats.length; i++)
		t = t.replace(timeFormats[i].rule, timeFormats[i].pattern)
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
		if (result.length > 0) {
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

function getBlkID(line: string): { blockId: string, lineWithoutBlockId: string } {
    // Regular expression for matching the block ID
    const blockIdRegex = /( \^[a-zA-Z0-9-]+)/;

    // Find the block ID
    const blockIdMatch = line.match(blockIdRegex);
    const blockId = blockIdMatch ? blockIdMatch[0] : '';

    // Remove the block ID from the line
    const lineWithoutBlockId = line.replace(blockIdRegex, '').trim();

    return { blockId, lineWithoutBlockId };
}

interface processResult {
    success: boolean;
    content: string; // Replace with actual type of 'new_text'
    offset: number; // Replace with actual type of 'offset'
    origin_set: { x: number; a: number; y: number; z: number };
    new_set: { x: number; a: number; y: number; z: number };
}

export function processOneLine(text: string, setup: Setup, specifyIdx: number, direction: number): processResult{
	const { blockId, lineWithoutBlockId } = getBlkID(text);
	const cur_match = getCurrentState(lineWithoutBlockId, setup.sorteds);
	if (cur_match.sorted_idx < 0) {
		return { success: false, content: lineWithoutBlockId, offset: 0, origin_set: {x:0, a:0, y:0, z:0}, new_set: {x:0, a:0, y:0, z:0}}
	}
	const cur_idx = setup.states_dict.get(cur_match.sorted_idx) || 0;
	let next_idx = specifyIdx
	if(specifyIdx<0)
		next_idx = roundAdd(cur_idx, direction, 0, setup.states.length)
	const cur_pair = separatePreSur(setup.states[cur_idx])
	const next_pair = separatePreSur(setup.states[next_idx])
	let new_text = cur_match.idents + ChangeState(cur_match.raw, cur_pair, next_pair)
	let next_txt = next_pair[0]
	let cur_txt = cur_pair[0]
	next_txt = applyTimeFormats(next_txt)
	cur_txt = applyTimeFormats(cur_txt)
	new_text = new_text + blockId
	const offset = next_txt.length - cur_txt.length
	// length estimation
	let x0 = applyTimeFormats(cur_pair[0]).length || 0
	let y0 = applyTimeFormats(cur_pair[1]).length || 0
	let z = blockId.length || 0
	// console.log([x0, y0, z])
	let x1 = applyTimeFormats(next_pair[0]).length || 0
	let y1 = applyTimeFormats(next_pair[1]).length || 0
	let A = cur_match.raw.length || 0
	// console.log([x1, y1, z])
	return { success: true, content: new_text, offset: offset, 
		origin_set: {x:x0, a:A, y:y0, z:z}, 
		new_set: {x:x1, a:A, y:y1, z:z}
	}
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
	let selection = editor.listSelections()[0];
	let cursor = editor.getCursor();
	let set_cur = false;
	if (selection.head.ch == selection.anchor.ch && selection.head.line == selection.anchor.line)
		set_cur = true;
	const head = selection.head.line
	const anchor = selection.anchor.line
	let start_line = head;
	let end_line = anchor;
	if (start_line > end_line) {
		start_line = anchor;
		end_line = head;
	}
	for (let i = start_line; i <= end_line; i++) {
		const origin = editor.getLine(i);
		let r = { success: false, content: origin, offset: 0, origin_set:{x:0, y:0, a:0, z:0}, new_set:{x:0, y:0, a:0, z:0}}
		for (let i = 0; i < bindings.length; i++) {
			r = processOneLine(origin, sg_list[bindings[i]], -1, direction);
			if (r.success)
				break;
		}
		editor.setLine(i, r.content);

		if (i == cursor.line) {
			cursor = setupCursor(cursor, r.offset, r.origin_set, r.new_set)
		}
		if (i == head) {
			const head_cursor = setupCursor(selection.head, r.offset, r.origin_set, r.new_set)
			selection.head = head_cursor
		}
		if (i == anchor) {
			const anchor_cursor = setupCursor(selection.anchor, r.offset, r.origin_set, r.new_set)
			selection.anchor = anchor_cursor
		}
	}
	editor.setSelection(selection.anchor, selection.head)
	if (set_cur)
		editor.setCursor(cursor)
}

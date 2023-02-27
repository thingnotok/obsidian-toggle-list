import { App, Editor, MarkdownView, Scope, Modal, Notice, Plugin, PluginSettingTab, Setting, type Hotkey } from 'obsidian';
import ToggleList from "main";
import {genDiagramSVG} from "src/stateDiagram"




function getDate() {
	// Return Date in YYYY-MM-DD format.
	return new Date().toJSON().slice(0, 10)
}
function getTasksSuffix() {
	return " ✅ " + getDate()
}
const SUR_DICT = new Map([
	['{tasks-today}', getTasksSuffix],
]);

const REG_DICT = [
	{ rule: /\\{tasks-today\\}/, pattern: "✅ [0-9]{4}-[0-9]{2}-[0-9]{2}" }
]

const DEFAULT_STATEGROUP = [
	[
		'- ',
		'- [ ] ',
		'- [x] || {tasks-today}',
		'',
	],
	[
		'- [ ] ',
		'- [ ] #p1 ',
		'- [ ] #p2 ',
		'- [ ] #p3 ',
	],
	[
		'- ? ',
		'- ! ',
		'- ~ ',
	]
]

const DEFAULT_CMD = [
	{
		index: 0,
		pop: false,
		name: 'Task',
		tmp_name: 'Task',
		bindings: [0]
	},
	{
		index: 1,
		pop: false,
		name: 'Task Priority',
		tmp_name: 'Task Priority',
		bindings: [1]
	},
	{
		index: 2,
		pop: false,
		name: 'Call out',
		tmp_name: 'Call out',
		bindings: [2]
	},
	{
		index: 3,
		pop: false,
		name: 'Task + Callout',
		tmp_name: 'Task + Callout',
		bindings: [0, 2]
	}

]

const EMPTY_TOKEN = '{PARAGRAPH}'
const EMPTY_STATES = Array<string>()

export class PopState {
	popon: boolean; //flag to indicate popover suggestor is on
	hot: boolean; // flag to indicate suggestor is triggered by command
	incr: number; // counter to record number of consecutive triggers
	constructor(){
		this.popon = false;
		this.hot = false;
		this.incr = 0;
	}
}

export class Setup {
	index: number;
	states: Array<string>;
	sorteds: Array<string>;
	states_dict: Map<number, number>;
	all_states: string;
	constructor(STATES: Array<string>) {
		this.index = 0;
		this.states = [...STATES];
		updateSettingStates(this);
	}
}

export class Command {
	index: number;
	name: string;
	tmp_name: string;
	bindings: Array<number>;
	pop: boolean;
	constructor(index: number, name: string, bindings:Array<number>){
		this.index = index;
		this.name = name;
		this.tmp_name = name;
		this.bindings = bindings;
		this.pop = false;
	}
}

export class ToggleListSettings {
	setup_list: Array<Setup>;
	cmd_list: Array<Command>;
	cur_cmd: Command;
	cur_setup: Setup;
	pop_state: PopState;
	constructor(fromFile:any){
		this.pop_state = new PopState();
		this.cmd_list = fromFile?.cmd_list||[];
		this.setup_list = fromFile?.setup_list||[];
	}
	addGroup(){
		// console.log("ToggleList: + State Group")
		// Randomly add a state group from default
		const idx = Math.floor(Math.random() * DEFAULT_STATEGROUP.length);
		this.setup_list.push(new Setup(DEFAULT_STATEGROUP[idx]));
	}
	reset(){
		// Empty setup lists
		this.setup_list = []
		// Add setup_list with default groups
		DEFAULT_STATEGROUP.forEach(e => {
			this.setup_list.push(new Setup(e));
		})
		// Empty cmd_list
		this.cmd_list = []
		// Add command with default cmds
		DEFAULT_CMD.forEach(e => {
			this.cmd_list.push(new Command(e.index, e.name, e.bindings))
		})
	}
	updateListIndexs(){
		this.setup_list.forEach(
			(setup:Setup, idx:number) => setup.index = idx)
	}
	updateCmdList(removedIdx: number){
		this.cmd_list.forEach(cmd => {
			const nbinding = cmd.bindings.map(function (b){
				return (b > removedIdx) ? b-1 : (b==removedIdx) ? -1 : b
			})
			cmd.bindings = nbinding.filter(b=>b>=0)
		})
	}
	removeStateGroup(setup: Setup) {
		const index = setup.index;
		this.setup_list.splice(index, 1)[0];
	}
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

function processOneLine(text: string, setup: Setup, direction: number) {
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
	return { success: true, content: cur_pair[0], offset: cur_idx }
}

export function toggleAction(editor: Editor, view: MarkdownView, sg_list: Setup[], bindings: number[], direction: number) {
	// console.log('action')
	// console.log(setup)
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

export function updateSettingStates(setup: Setup) {
	// console.log('beg:updateSettingStates');
	// console.log(setup.states);
	setup.all_states = setup.states.join('\n')
	const ori_states = setup.states
	// setup.states_dict = new Map();
	const tmp = new Map();
	const new_tmp = new Map();
	ori_states.forEach((os, idx) => tmp.set(os, idx))
	setup.sorteds = ori_states.slice(0)
	setup.sorteds = setup.sorteds.sort((a: string, b: string) => b.length - a.length);
	setup.sorteds.forEach((ss, idx) => new_tmp.set(idx, tmp.get(ss)))
	setup.states_dict = new_tmp;
	// console.log('end:updateSettingStates');
	// console.log(setup)
	// console.log('--------')
}

export function getStateFromText(setup: Setup, rendered_text: string) {
	const text = rendered_text.replace(EMPTY_TOKEN, "")
	setup.all_states = text;
	setup.states = text.split('\n')
	updateSettingStates(setup);
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








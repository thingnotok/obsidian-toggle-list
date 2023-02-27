import { App, Editor, MarkdownView, Scope, Modal, Notice, Plugin, PluginSettingTab, Setting, type Hotkey } from 'obsidian';
import ToggleList from "src/main";
import {genDiagramSVG} from "src/stateDiagram"





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

export const EMPTY_TOKEN = '{PARAGRAPH}'
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





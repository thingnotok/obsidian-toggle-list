
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
	constructor(text: string) {
		///this.all_states = this.states.join('\n')
		this.index = 0;
		this.update(text)
	}
	update(text: string=""){
		this.all_states = text.replace(EMPTY_TOKEN, "")
		this.states = this.all_states.split('\n')
		const ori_states = this.states
		const tmp = new Map();
		const new_tmp = new Map();
		ori_states.forEach((os, idx) => tmp.set(os, idx))
		this.sorteds = ori_states.slice(0)
		this.sorteds = this.sorteds.sort((a: string, b: string) => b.length - a.length);
		this.sorteds.forEach((ss, idx) => new_tmp.set(idx, tmp.get(ss)))
		this.states_dict = new_tmp;
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
		// Randomly add a state group from default
		const idx = Math.floor(Math.random() * DEFAULT_STATEGROUP.length);
		const chosen = DEFAULT_STATEGROUP[idx]
		this.setup_list.push(new Setup(chosen.join('\n')));
	}
	reset(){
		// Initialize setup_list with default groups
		this.setup_list = DEFAULT_STATEGROUP.map((setup)=>{
			return new Setup(setup.join('\n'))
		})
		// Initialize cmd_list with default cmds
		this.cmd_list = DEFAULT_CMD.map((cmd)=>{
			return new Command(cmd.index, cmd.name, cmd.bindings)
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
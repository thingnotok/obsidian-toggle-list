
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
	isPopOver: boolean;
	constructor(cmd:any){
		this.index = cmd.index||0;
		this.name = cmd.name||"";
		this.tmp_name = this.name;
		this.bindings = cmd.bindings||Array<number>();
		this.isPopOver = cmd.isPopOver||false;
	}
}
interface PopContext{
	stateIdx: number;
	cmd: Command
	setup: Setup
}

export class ToggleListSettings {
	setup_list: Array<Setup>;
	cmd_list: Array<Command>;
	pop_context: PopContext;
	pop_state: PopState;
	plot: boolean;
	registedCmdName: Array<string>;
	constructor(fromFile:any){
		this.pop_state = new PopState();
		this.plot = false;
		this.cmd_list = fromFile?.cmd_list.map((cmd:any) => new Command(cmd));
		this.setup_list = fromFile?.setup_list?.map((setup:any) => 
			new Setup(setup?.all_states||"")
		);
		if(!this.setup_list){
			this.reset_setup_list();
		}
		if(!this.cmd_list){
			this.reset_cmd_list();
		}
		this.validate();

	}
	addStateGroup(){
		// Randomly add a state group from default
		const chosen = DEFAULT_STATEGROUP.at(
			Math.floor(Math.random() * DEFAULT_STATEGROUP.length)
			)||[]
		this.setup_list.push(new Setup(chosen.join('\n')));
	}
	validate(){
		this.cleanSetupList();
		this.cleanCmdList();
	}
	reset_setup_list(){
		// Initialize setup_list with default groups
		this.setup_list = DEFAULT_STATEGROUP.map((setup)=>{
			return new Setup(setup.join('\n'))
		})
	}
	reset_cmd_list(){
		// Initialize cmd_list with default cmds
		this.cmd_list = DEFAULT_CMD.map((cmd)=>{
			return new Command(cmd)
		})
	}
	reset(){
		this.reset_setup_list();
		this.reset_cmd_list();
		this.validate();
	}
	cleanSetupList(){
		//remove duplicated state
		this.setup_list = this.setup_list.map((setup)=>{
			const states = setup.states
			const states_ary = [...new Set(states)];
			return new Setup(states_ary.join('\n'))
		})
		this.setup_list.forEach(
			(setup:Setup, idx:number) => setup.index = idx
		)
	}
	cleanCmdList(){
		this.cmd_list.forEach(cmd => {
			cmd.bindings = cmd.bindings.filter(b=>b<this.setup_list.length);
		})
		this.cmd_list = this.cmd_list.filter(cmd =>cmd.bindings.length>0)
	}
	cleanCmdListAfterSetupRemoved(removedIdx: number){
		this.cmd_list.forEach(cmd => {
			const nbinding = cmd.bindings.map(function (b){
				return (b > removedIdx) ? b-1 : (b==removedIdx) ? -1 : b
			})
			cmd.bindings = nbinding.filter(b=>b>=0)
		})
	}
	removeSetup(setup: Setup) {
		const index = setup.index;
		this.cleanCmdListAfterSetupRemoved(index);
		this.setup_list.splice(index, 1)[0];
		this.validate();
	}
}
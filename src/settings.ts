import { App, Editor, MarkdownView, Scope, Modal, Notice, Plugin, PluginSettingTab, Setting, type Hotkey } from 'obsidian';
import smcat from "state-machine-cat";
import colormap from "colormap"
import ToggleList from "main";

function drawStateGroup(sg_list:Array<Setup>):string{
	let diagram = "";
	let sgs = Array<string>();
	for(let i = 0; i < sg_list.length-1; i++)
		sgs.concat(sg_list[i].states);
	sgs = sgs.map(renderEmptyLine)
	const states = [...new Set(sgs)];
	// console.log(states);
	for(let i = 0; i < states.length-1; i++)
		diagram += `"${states[i]}",`;
		diagram += `"${states[states.length-1]}";\n`;
	return diagram
}
function drawConnection(state_group:Array<string>, color:string):string{
	let diagram = "";
	const states = state_group.map(renderEmptyLine)
	for(let i = 0; i < states.length-1; i++) {
		diagram += `"${states[i]}" => "${states[i+1]}" [color="${color}"];\n`;
	}
	diagram += `"${states[states.length-1]}" -> "${states[0]}" [color="${color}"];\n`;
	return diagram
}

function removeRedundentConnection(scma_text:string){
	const lines = scma_text.split("\n");
	const line_ary = [...new Set(lines)];
	return line_ary.join('\n')
}

function drawDiagram(diagram_description:string, engine:string="fdp"):string{
	try {
		const lSVGInAString = smcat.render(
			diagram_description,
		  {
			outputType: "svg",
			direction: "top-down",
			engine: engine
		  }
		);
		// console.log(lSVGInAString);
		return lSVGInAString
	  } catch (pError) {
		console.error(pError);
		return ""
	  }
}

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

export class Setup {
	index: number;
	states: Array<string>;
	sorteds: Array<string>;
	states_dict: Map<number, number>;
	all_states: string;
	constructor(STATES: Array<string>) {
		this.index = 0;
		this.states = STATES;
		updateSettingStates(this);
	}
}

export class ToggleListSettingTab extends PluginSettingTab {
	plugin: ToggleList;

	constructor(app: App, plugin: ToggleList) {
		super(app, plugin);
		this.plugin = plugin;
	}


	display(): void {
		// const { containerEl } = this;
		this.containerEl.empty();
		let settings = this.plugin.settings
		// console.log("Redraw UI")
		addSettingUI(this, settings);
		const exp = this.containerEl.createEl('div', {cls:'togglelist_div'})
		exp.innerHTML= `<button class="togglelist_btn">
		<a href="https://github.com/thingnotok/obsidian-toggle-list">README</a>
		</button>`
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
	hot: boolean;
	cur_cmd: Command;
	cur_setup: Setup;
	constructor(){
		this.hot = false;
		this.setup_list = []
		this.cmd_list = []
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

function toggleAction(editor: Editor, view: MarkdownView, sg_list: Setup[], bindings: number[], direction: number) {
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

function registerAction(plugin: ToggleList, action: Command, sg_list: Array<Setup>) {
	const n_name = `${action.name}-Next`
	const p_name = `${action.name}-Prev`
	const pop_name = `${action.name}-POP`
	if(action.pop){
		plugin.addCommand({
			id: pop_name,
			name: pop_name,
			icon: 'top-arrow',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cur = editor.getCursor()
				const next = Object.assign({}, cur);
				plugin.settings.hot = true;
				plugin.settings.cur_cmd = action;
				editor.replaceRange(" ", cur);
				next.ch = cur.ch + 1
				editor.replaceRange("", cur, next)
			},
		});
	}
	else{
		plugin.addCommand({
			id: n_name,
			name: n_name,
			icon: 'right-arrow',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				toggleAction(editor, view, sg_list, action.bindings, 1)
			},
		});
		plugin.addCommand({
			id: p_name,
			name: p_name,
			icon: 'left-arrow',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				toggleAction(editor, view, sg_list, action.bindings, -1)
			},
		});
	}
}

export function registerActions(plugin: ToggleList) {
	const sg_list = plugin.settings.setup_list
	plugin.settings.cmd_list.forEach(cmd => {
		registerAction(plugin, cmd, sg_list)
	})
}

function unregistAction(plugin: ToggleList, cmd: Command) {
	if(cmd.pop){
		deleteObsidianCommand(this.app, `obsidian-toggle-list:${cmd.name}-POP`)
	}
	else {
		deleteObsidianCommand(this.app, `obsidian-toggle-list:${cmd.name}-Next`)
		deleteObsidianCommand(this.app, `obsidian-toggle-list:${cmd.name}-Prev`)
	}
}

function removeStateGroup(plugin: ToggleList, setup: Setup) {
	const index = setup.index;
	// console.log("Remove index " + index + " From list")
	// console.log(plugin.settings.setup_list)
	// console.log("New List")
	let sg = plugin.settings.setup_list.splice(index, 1)[0];
	// console.log(plugin.settings.setup_list)
	// console.log("With sg popout")
	// console.log(sg)
	plugin.saveSettings();
}

function getStateFromText(setup: Setup, rendered_text: string) {
	const text = rendered_text.replace(EMPTY_TOKEN, "")
	setup.all_states = text;
	setup.states = text.split('\n')
	updateSettingStates(setup);
}

function renderEmptyLine(text: string): string{
	const emptyline = EMPTY_TOKEN + '\n'
	const emptyline_last = '\n'+EMPTY_TOKEN
	let result = text.replace(/(^\n)/gm, emptyline)
	result = result.replace(/\n$/gm, emptyline_last)
	if(result == "")
		result = EMPTY_TOKEN
	return result
}

function addSetupUI(container: ToggleListSettingTab, setup: Setup): void {
	// console.log('Add new setup ui')
	let sg_ui = new Setting(container.containerEl).addButton((cb) => {
		cb.setIcon('trash')
			.setCta()
			.onClick(() => {
				removeStateGroup(container.plugin, setup)
				// Force refresh
				container.display();
			});
	});
	const renderedText = renderEmptyLine(setup.all_states)
	sg_ui.setName('State Group: ' + setup.index.toString())
		.addTextArea(text => text.setValue(renderedText)
			.onChange(async (text_value) => {
				getStateFromText(setup, text_value)
				await container.plugin.saveSettings();
			}
			));
}

function updateListIndexs(setup_list: Array<Setup>): void {
	setup_list.forEach((setup, idx) => setup.index = idx)
}

function reloadSetting(container: ToggleListSettingTab, settings: ToggleListSettings) {
	updateListIndexs(settings.setup_list)
	container.plugin.saveSettings();
	registerActions(container.plugin);
	// Force refresh
	container.display();
}


export function resetSetting(plugin: ToggleList) {
	const settings = plugin.settings
	// Empty setup lists
	settings.setup_list = []
	// Add setup_list with default groups
	DEFAULT_STATEGROUP.forEach(e => {
		settings.setup_list.push(new Setup(e));
	})
	updateListIndexs(settings.setup_list)
	// Unregister commands
	if (settings.cmd_list)
		settings.cmd_list.forEach(cmd => unregistAction(plugin, cmd))
	// Empty cmd_list
	settings.cmd_list = []
	// Add command with default cmds
	DEFAULT_CMD.forEach(e => {
		settings.cmd_list.push(e)
	})
}

function modifySVG(svg_text: string){
	let result = svg_text
	result = result.replace(/<g (id="node)/gs,
				 `<g class="togglelist_theme" $1`)
	return result
}

function addSettingUI(container: ToggleListSettingTab, settings: ToggleListSettings): void {
	container.containerEl.createEl('h2', { text: 'Setup The States to Toggle' })
	const setup_list = settings.setup_list
	// Add setup UI for each state group
	settings.setup_list.forEach(setup => {
		addSetupUI(container, setup);
	})
	// Button: Add a new state group
	const aa = new Setting(container.containerEl).addButton((cb) => {
		cb.setButtonText("+ State Group")
			.setCta()
			.onClick(() => {
				console.log("ToggleList: + State Group")
				// console.log(container.plugin.settings)
				settings = container.plugin.settings
				// Randomly add a state group from default
				const idx = Math.floor(Math.random() * DEFAULT_STATEGROUP.length);
				settings.setup_list.push(new Setup(DEFAULT_STATEGROUP[idx]));
				reloadSetting(container, settings)
			});
	});
	const cmd_list = settings.cmd_list;
	container.containerEl.createEl('h2', { text: 'Bind the Commands with State Groups' })
	container.containerEl.createEl('p', { text: 'Order of bindings matters if two SG share the same states' })
	for (let i = 0; i < cmd_list.length; i++) {
		const cmd_section = new Setting(container.containerEl)
			.setName(`${cmd_list[i].name}`)
			.setDesc(`[Command Name] [Binding State Groups]`)
			.addToggle((cb) => {
				cb.setValue(cmd_list[i].pop||false)
				cb.onChange((value) => {
					unregistAction(container.plugin, cmd_list[i])
					cmd_list[i].pop = value
					reloadSetting(container, settings)
				})
			})
			.addButton((cb) => {
				cb.setIcon('trash')
				cb.setCta()
				cb.onClick(() => {
					unregistAction(container.plugin, cmd_list[i])
					cmd_list.splice(i, 1)
					reloadSetting(container, settings)
				})
			})
			.addText((cb) => {
				cb.setValue(
					cmd_list[i].name
				)
				cb.setPlaceholder("Command Name")
				cb.onChange((value) => {
					cmd_list[i].tmp_name = value
				})
			})
			.addText((cb) => {
				cb.setValue(
					cmd_list[i].bindings.map(x => x.toString()).join(", ")
				)
				cb.setPlaceholder("Indes of State Groups: 0, 1, 2")
				cb.onChange((value) => {
					cmd_list[i].bindings = value.split(",").map(x => parseInt(x, 10))
					// console.log(cmd_list[i].bindings)
					container.plugin.saveSettings();
				})
			})
			.addButton((cb) => {
				cb.setIcon('checkmark')
				cb.setCta()
				cb.onClick(() => {
					// console.log(cmd_list[i])
					unregistAction(container.plugin, cmd_list[i])
					cmd_list[i].name = cmd_list[i].tmp_name
					cmd_list[i].bindings = cmd_list[i].bindings.filter(b => b < setup_list.length);
					cmd_list[i].bindings = [...new Set(cmd_list[i].bindings)];
					// console.log(cmd_list[i].bindings)
					reloadSetting(container, settings)
				})
			})
	}
	new Setting(container.containerEl).addButton((cb) => {
		cb.setButtonText('+ Command')
		cb.setCta()
		cb.onClick(() => {
			const name = `Command ${settings.cmd_list.length}`
			settings.cmd_list.push(new Command(settings.cmd_list.length, name, [0]))
			reloadSetting(container, settings);
		})
	})

	const other = new Setting(container.containerEl)
	// Button: goto hotkey setup page for togglelist
	other.addButton((cb) => {
		cb.setButtonText("🔥 Hotkeys")
			.setCta()
			.onClick(() => {
				// console.log("ToggleList: go to hotkey panel")
				this.app.setting.openTabById("hotkeys").setQuery("ToggleList")
			});
	});
	// Button: reset state groups to default groups
	other.addButton((cb) => {
		cb.setButtonText("↻ Reset")
			.setCta()
			.onClick(async () => {
				// console.log("ToggleList: Reset")
				// container.plugin.saveSettings("config.json");
				const stamp = (new Date()).toISOString()
				await this.app.vault.writeConfigJson(`plugins/obsidian-toggle-list/backup-${stamp}`, settings)
				new Notice(`ToggleList: Original config is saved in plugins/obsidian-toggle-list/backup-${stamp}.json`)
				resetSetting(container.plugin)
				reloadSetting(container, settings)
			});
	});
	// const state_diagram = new Setting(container.containerEl)
	const num = settings.cmd_list.length < 256 ? 256 : settings.cmd_list.length
	let colors = colormap({
		colormap: 'rainbow-soft',
		nshades: num,
		format: 'hex',
		alpha: 0.5
	})
	let svg_text = ""
	let text = ``
	for(let i = 0; i< settings.cmd_list.length-1;i++){
		const cmd = settings.cmd_list[i]
		const color_idx = (i/settings.cmd_list.length)*256 | 0
		text += `"${cmd.name}" [color="${colors[color_idx]}"],`
	}
	let i = settings.cmd_list.length-1
	let cmd = settings.cmd_list[i]
	let color_idx = (i/settings.cmd_list.length)*256 | 0
	text += `"${cmd.name}" [color="${colors[color_idx]}"];\n`
	svg_text += drawDiagram(text, 'dot')
	text = ``
	for(let i = 0; i< settings.cmd_list.length;i++){
		const cmd = settings.cmd_list[i]
		const color_idx = (i/settings.cmd_list.length)*256 | 0
		cmd.bindings.forEach((j)=>text+=drawConnection(settings.setup_list[j].states, colors[color_idx]))
	}
	svg_text += modifySVG(drawDiagram(removeRedundentConnection(text)))
	const svg_container = container.containerEl.createEl('div')
	svg_container.innerHTML = svg_text
}

// modified from https://github.com/chhoumann/quickadd/blob/master/src/utility.ts
function deleteObsidianCommand(app: App, commandId: string) {
	// console.log("Revoke Command=" + commandId)
	// @ts-ignore
	if (app.commands.findCommand(commandId)) {
		// @ts-ignore
		delete app.commands.commands[commandId];
		// @ts-ignore
		delete app.commands.editorCommands[commandId];
	}
}
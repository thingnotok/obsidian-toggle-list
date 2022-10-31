import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!
function getDate() {
	// Return Date in YYYY-MM-DD format.
	return new Date().toJSON().slice(0, 10)
}
function getTasksSuffix() {
	return " ✅ " + getDate()
}
const SUR_DICT = new Map([
	['tasks-today', getTasksSuffix],
]);

const DEFAULT_STATEGROUP = [
	['- ',
		'- [ ] ',
		'- [x] || {tasks-today}',
		'',],
	['- ? ',
		'- ! ',
		'- ~ ',
		'- ',
		'',]
]

const EMPTY_STATES = Array<string>()

class Setup {
	index: number;
	states: Array<string>;
	sorteds: Array<string>;
	states_dict: Map<string, number>;
	all_states: string;
	cmd_list: Array<string>;
	constructor(STATES: Array<string>) {
		this.index = 0;
		this.states = STATES;
		this.cmd_list = new Array<string>;
		updateSettingStates(this);
	}
}

class ToggleListSettingTab extends PluginSettingTab {
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
		this.containerEl.createEl('h2', { text: 'Setup The States to Toggle' })
		update_list_indexs(this.plugin.settings.setup_list)
		add_state_group_setting(this, settings);
		this.containerEl.createEl('h2', { text: 'Basic Usage' });
		this.containerEl.createEl('li', { text: 'All states are concatenated with \n in "States"' });
		this.containerEl.createEl('li', { text: 'You can add/delete states directly in "States" Field' });
		this.containerEl.createEl('li', { text: 'Leave the state field blank will make the line a "paragraph" in that state' });
		this.containerEl.createEl('h2', { text: 'Use with Suffix (support Tasks Plugin!)' });
		this.containerEl.createEl('li', { text: 'States including "||" will be separated into prefix and suffix' });
		this.containerEl.createEl('li', { text: 'Line{raw} will be decorated in form of "{prefix}{raw}{suffix}"' });
		this.containerEl.createEl('li', { text: 'Special type of suffix like "{tasks-today}" can be useful with Tasks Plugin' });
		this.containerEl.createEl('h2', { text: 'Rendering and Hotkey' });
		this.containerEl.createEl('li', { text: 'Non-standard markdown prefix(e.q. - [/]) reqires css setting to make it a bullet-like icon. Or you can find a theme which supports it (like Minimal).' });
		this.containerEl.createEl('li', { text: 'You may want to replace the hotkey (Cmd/Ctrl + Enter)\'s action from Official Toggle checkbox status to ToggleList-Next[index]' });
		this.containerEl.createEl('li', { text: '(also you can add hotkey (Cmd/Ctrl + Shift + Enter) to action ToggleList-Prev[index] to toggle with reverse order' });
		this.containerEl.createEl('h2', { text: 'Multiple State Groups' });
		this.containerEl.createEl('li', { text: 'You can add or delete state groups with buttons (x / add new state group)' });
		this.containerEl.createEl('li', { text: 'Each group can serve different purpose. Default groups demonstate Task management and Note highlighting, respectively.' });
	}
}


export default class ToggleList extends Plugin {
	settings: ToggleListSettings;

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ToggleListSettingTab(this.app, this));
		register_actions(this);
	}
	// onunload() {

	// }
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		for (let i = 0; i < this.settings.setup_list.length; i++) {
			updateSettingStates(this.settings.setup_list[i])
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

interface ToggleListSettings {
	setup_list: Array<Setup>;
	cmd_list: Array<string>;
}

const DEFAULT_SETTINGS: ToggleListSettings = {
	setup_list: [],
	cmd_list: []
}

function numberOfTabs(text: string) {
	let count = 0;
	let index = 0;
	while (text.charAt(index++) === "\t") {
		count++;
	}
	return count;
}



function parseSur(text: string) {
	const regex = /\{(.*)\}/;
	const ff = text.match(regex);
	const found = ff || [];
	let suffix = text
	if (found.length > 0) {
		suffix = (SUR_DICT.get(found[1]) || (() => ""))() || suffix;
	}
	return suffix
}

function ChangeState(text: string, prev: Array<string>, next: Array<string>) {
	// console.log("origin text: " + text)
	const prev_sur = parseSur(prev[1])
	const tmp = text.slice(prev[0].length, text.length - prev_sur.length)
	// console.log("raw text: " + tmp)
	const pre = next[0] || ""
	const sur = parseSur(next[1]) || ""
	return pre + tmp + sur
}

function getCurrentState(text: string, states: Array<string>): string {
	// console.log('InputText=' + text)
	for (let i = 0; i < states.length; i++) {
		const s = states[i].split('||')[0];
		// console.log('Compare=' + text.slice(0, s.length) + ',and,' + s)
		if (text.slice(0, s.length) == s) {
			// console.log('Matched')
			return states[i]
		}
	}
	return ''
}

function separatePreSur(state: string): Array<string> {
	const strings = state.split('||')
	strings.push('')
	return strings
}

function round_add(a: number, b: number, low: number, high: number): number {
	let result = a + b;
	if (result == high)
		result = low;
	if (result < low)
		result = high - 1;
	return result
}

function processOneLine(text: string, setup: Setup, direction: number) {
	const idents = numberOfTabs(text);
	const noident_text = text.slice(idents);
	const cur_state = getCurrentState(noident_text, setup.sorteds);
	const cur_idx = setup.states_dict.get(cur_state) || 0;
	const next_idx = round_add(cur_idx, direction, 0, setup.states.length)
	const cur_pair = separatePreSur(setup.states[cur_idx])
	const next_pair = separatePreSur(setup.states[next_idx])
	// console.log('Current State')
	// console.log(cur_pair)
	// console.log('Next State')
	// console.log(next_pair)
	let new_text = '\t'.repeat(idents) + ChangeState(noident_text, cur_pair, next_pair)
	// console.log('Curent state:' + cur_state + '"')
	// console.log('State=' + cur_state + '=>' + next_state)
	// console.log('LengthChangeFrom=' + cur_pair[0].length + "=To=" + next_pair[0].length)
	// console.log('Offset=' + (next_pair[0].length - cur_pair[0].length))
	return { content: new_text, offset: next_pair[0].length - cur_pair[0].length }
}

function toggleAction(editor: Editor, view: MarkdownView, setup: Setup, direction: number) {
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
		// console.log("Origin=" + origin)
		const r = processOneLine(origin, setup, direction);
		// const r = updateState(origin);
		editor.setLine(i, r.content);
		if (i == cursor.line) {
			cursor.ch = cursor.ch + r.offset;
		}
		// console.log("Processing=" + i + "=[" + start_line + "=]" + end_line)
		if (i == head) {
			// console.log('head with=' + r.offset)
			if (selection.head.ch < -r.offset)
				selection.head.ch = 0;
			else
				selection.head.ch = selection.head.ch + r.offset;
		}
		if (i == anchor) {
			// console.log('anchor with=' + r.offset)
			if (selection.anchor.ch < -r.offset)
				selection.anchor.ch = 0;
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

function updateSettingStates(setup: Setup) {
	// console.log('beg:updateSettingStates');
	// console.log(setup.states);
	setup.all_states = setup.states.join('\n')
	const ori_states = setup.states
	setup.states_dict = new Map();
	for (let i = 0; i < ori_states.length; i++) {
		setup.states_dict.set(ori_states[i], i)
	}
	setup.sorteds = ori_states.slice(0)
	setup.sorteds = setup.sorteds.sort((a: string, b: string) => b.length - a.length);
	// console.log('end:updateSettingStates');
	// console.log(setup)
	// console.log('--------')
}

function register_actions(plugin: ToggleList) {
	// console.log('Register Command')
	let setup_list = plugin.settings.setup_list
	for (let i = 0; i < setup_list.length; i++) {
		const setup = setup_list[i]
		const n_name = 'ToggleList[' + setup.index.toString() + ']-Next'
		const p_name = 'ToggleList[' + setup.index.toString() + ']-Prev'
		setup.cmd_list = [n_name, p_name]
		plugin.addCommand({
			id: n_name,
			name: n_name,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				toggleAction(editor, view, setup, 1)
			},
		});
		plugin.addCommand({
			id: p_name,
			name: p_name,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				toggleAction(editor, view, setup, -1)
			},
		});
		// console.log(setup.cmd_list)
	}
	// console.log('-------------------')
}

function unregist_action(plugin: ToggleList, sg: Setup) {
	for (let i = 0; i < sg.cmd_list.length; i++) {
		const name = sg.cmd_list[i]
		deleteObsidianCommand(this.app, `obsidian-toggle-list:${name}`)
	}
}

function removeStateGroup(plugin: ToggleList, setup: Setup) {
	const index = setup.index;
	let sg = plugin.settings.setup_list.splice(index, 1)[0];
	plugin.saveSettings();
	unregist_action(plugin, sg)
	// register_actions(plugin)
}

function getStateFromText(setup: Setup, text_value: string) {
	setup.all_states = text_value;
	setup.states = text_value.split('\n')
	updateSettingStates(setup);
}

function addSetupUI(container: ToggleListSettingTab, setup: Setup): void {
	// console.log('Add new setup ui')
	let sg_ui = new Setting(container.containerEl).addButton((cb) => {
		cb.setButtonText("x")
			.setCta()
			.onClick(() => {
				removeStateGroup(container.plugin, setup)
				// Force refresh
				container.display();
			});
	});
	sg_ui.setName('State Group: ' + setup.index.toString())
		.addTextArea(text => text.setValue(setup.all_states)
			.onChange(async (text_value) => {
				getStateFromText(setup, text_value)
				await container.plugin.saveSettings();
			}
			));
}

function update_list_indexs(setup_list: Array<Setup>): void {
	for (let i = 0; i < setup_list.length; i++)
		setup_list[i].index = i;
}

function add_state_group_setting(container: ToggleListSettingTab, settings: ToggleListSettings): void {
	const setup_list = settings.setup_list
	// console.log("Draw UI: ")
	// console.log(setup_list)
	for (let i = 0; i < setup_list.length; i++) {
		addSetupUI(container, settings.setup_list[i]);
	}

	let last = new Setting(container.containerEl).addButton((cb) => {
		cb.setButtonText("+ State Group")
			.setCta()
			.onClick(() => {
				// console.log(container.plugin.settings)
				settings = container.plugin.settings
				// Randomly add a state group from default
				const idx = Math.floor(Math.random() * DEFAULT_STATEGROUP.length);
				settings.setup_list.push(new Setup(DEFAULT_STATEGROUP[idx]));
				update_list_indexs(settings.setup_list)
				container.plugin.saveSettings();
				register_actions(container.plugin);
				// Force refresh
				container.display();
			});
	});
	last.addButton((cb) => {
		cb.setButtonText("↻ Reset")
			.setCta()
			.onClick(() => {
				console.log("Reset")
				settings = container.plugin.settings
				settings.setup_list.length = 0 // Empty setup lists
				for (let i = 0; i < DEFAULT_STATEGROUP.length; i++)
					settings.setup_list.push(new Setup(DEFAULT_STATEGROUP[i]));
				update_list_indexs(settings.setup_list)
				container.plugin.saveSettings();
				register_actions(container.plugin);
				// Force refresh
				container.display();
			});
	});
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
import { App, Editor, MarkdownView, Scope, Modal, Notice, Plugin, PluginSettingTab, Setting, type Hotkey } from 'obsidian';

// Remember to rename these classes and interfaces!
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
	{ rule: /{tasks-today}/, pattern: "✅ [0-9]{4}-[0-9]{2}-[0-9]{2}" }
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
		'- ',
		'- ? ',
		'- ! ',
		'- ~ ',
	]
]

const EMPTY_STATES = Array<string>()

class Setup {
	index: number;
	states: Array<string>;
	sorteds: Array<string>;
	states_dict: Map<number, number>;
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
		updateListIndexs(this.plugin.settings.setup_list)
		addSettingUI(this, settings);
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
	t = t.replace(/([\[,\],\?])/g, "\\$1")
	for (let i = 0; i < REG_DICT.length; i++)
		t = t.replace(REG_DICT[i].rule, REG_DICT[i].pattern)
	return t
}

function getCurrentState(text: string, states: Array<string>) {
	console.log('Using:' + states)
	for (let i = 0; i < states.length; i++) {
		console.log('Current:' + states[i])
		const s = states[i].split('||');
		const prefix = getRegExp(s[0])
		const suffix = getRegExp(s[1])
		console.log(prefix)
		console.log(suffix)
		let state_regex = new RegExp(`^${prefix}(.*)${suffix}$`);
		console.log(state_regex)
		const result = text.match(state_regex) || []
		if (result.length > 0) {
			console.log("MatchedResult:" + i + "<>" + result)
			console.log(result)
			return { sorted_idx: i, raw: result[1] }
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

function processOneLine(text: string, setup: Setup, direction: number) {
	console.log(setup)
	const idents = numberOfTabs(text);
	const noident_text = text.slice(idents);
	const cur_match = getCurrentState(noident_text, setup.sorteds);
	if (cur_match.sorted_idx < 0) {
		return { content: text, offset: 0 }
	}
	const cur_idx = setup.states_dict.get(cur_match.sorted_idx) || 0;
	const next_idx = roundAdd(cur_idx, direction, 0, setup.states.length)
	const cur_pair = separatePreSur(setup.states[cur_idx])
	const next_pair = separatePreSur(setup.states[next_idx])
	console.log('Current State')
	console.log(cur_pair)
	console.log('Next State')
	console.log(next_pair)
	let new_text = '\t'.repeat(idents) + ChangeState(cur_match.raw, cur_pair, next_pair)
	console.log('LengthChangeFrom=' + cur_pair[0].length + "=To=" + next_pair[0].length)
	console.log('Offset=' + (next_pair[0].length - cur_pair[0].length))
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

function registerActions(plugin: ToggleList) {
	console.log(plugin.settings.setup_list)
	plugin.settings.setup_list.forEach(setup => {
		const n_name = ' [' + setup.index.toString() + ']-Next'
		const p_name = ' [' + setup.index.toString() + ']-Prev'
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
	})
}

function unregistActions(plugin: ToggleList, sg: Setup) {
	// console.log(sg)
	// console.log(sg.cmd_list)
	sg.cmd_list.forEach(name => {
		deleteObsidianCommand(this.app, `obsidian-toggle-list:${name}`)
	})
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
	unregistActions(plugin, sg)
	plugin.saveSettings();
	// registerActions(plugin)
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

function addSettingUI(container: ToggleListSettingTab, settings: ToggleListSettings): void {
	const setup_list = settings.setup_list
	// Add setup UI for each state group
	settings.setup_list.forEach(setup => {
		addSetupUI(container, setup);
	})
	// Button: Add a new state group
	const other = new Setting(container.containerEl).addButton((cb) => {
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
	// Button: goto hotkey setup page for togglelist
	other.addButton((cb) => {
		cb.setButtonText("🔥 Hotkeys")
			.setCta()
			.onClick(() => {
				console.log("ToggleList: go to hotkey panel")
				this.app.setting.openTabById("hotkeys").setQuery("ToggleList")
			});
	});
	// Button: reset state groups to default groups
	other.addButton((cb) => {
		cb.setButtonText("↻ Reset")
			.setCta()
			.onClick(() => {
				console.log("ToggleList: Reset")
				settings = container.plugin.settings
				// Empty setup lists
				settings.setup_list.forEach(e => unregistActions(container.plugin, e))
				settings.setup_list = []
				DEFAULT_STATEGROUP.forEach(e => {
					settings.setup_list.push(new Setup(e));
				})
				reloadSetting(container, settings)
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

export default class ToggleList extends Plugin {
	settings: ToggleListSettings;

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ToggleListSettingTab(this.app, this));
		registerActions(this);
	}
	// onunload() {

	// }
	async loadSettings() {
		this.settings = Object.assign({}, await this.loadData());
		if (!this.settings.setup_list) {
			console.log("ToggleList: Create default setups")
			this.settings.setup_list = []
			DEFAULT_STATEGROUP.forEach(e => {
				this.settings.setup_list.push(new Setup(e));
			})
			updateListIndexs(this.settings.setup_list)
			this.saveSettings();
		}
		else {
			this.settings.setup_list.forEach(setup => updateSettingStates(setup))
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
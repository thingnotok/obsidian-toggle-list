import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

const DEFAULT_STATES = ['- ',
	'- [ ] ',
	'- [/] ',
	'',]

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
		this.containerEl.createEl('h3', { text: 'Setup The States to Toggle' })
		update_list_indexs(this.plugin.settings.setup_list)
		add_state_group_setting(this, settings);

		this.containerEl.createEl('p', { text: 'All states are concatenated with \n in "States"' });
		this.containerEl.createEl('p', { text: 'You can add/delete states directly in "States" Field' });
		this.containerEl.createEl('p', { text: 'States entries in settings will refresh after reopen.' });
		this.containerEl.createEl('p', { text: 'Leave the state field blank will make the line a "paragraph" in that state' });
		this.containerEl.createEl('p', { text: 'Non-standard markdown prefix(e.q. - [/]) reqires css setting to make it a bullet-like icon. Or you can find a theme which supports it (like Minimal).' });
		this.containerEl.createEl('p', { text: 'You may want to replace the hotkey (Cmd/Ctrl + Enter)\'s action from Official Toggle checkbox status to ToggleList-Next' });
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

function ChangeState(text: string, prev: string, next: string) {
	const tmp = text.slice(prev.length)
	// console.log('Text=' + text)
	// console.log('Prelen=' + prev.length)
	// console.log('PureText=' + tmp)
	return next + tmp
}

function getCurrentState(text: string, states: Array<string>): string {
	// console.log('InputText=' + text)
	for (let i = 0; i < states.length; i++) {
		const s = states[i];
		// console.log('Compare=' + text.slice(0, s.length) + ',and,' + s)
		if (text.slice(0, s.length) == s) {
			// console.log('Matched')
			return s
		}
	}
	return ''
}

function processOneLine(text: string, setup: Setup, direction: number) {
	const idents = numberOfTabs(text);
	const noident_text = text.slice(idents);
	const cur_state = getCurrentState(noident_text, setup.sorteds);
	// console.log(setup)
	const cur_idx = setup.states_dict.get(cur_state) || 0;
	let next_idx = cur_idx + direction;
	if (next_idx == setup.states.length)
		next_idx = 0;
	if (next_idx < 0)
		next_idx = setup.states.length - 1;
	const next_state = setup.states[next_idx]
	const new_text = '\t'.repeat(idents) + ChangeState(noident_text, cur_state, next_state)
	// console.log('Curent state:' + cur_state + '"')
	// console.log('State=' + cur_state + '=>' + next_state)
	// console.log('LengthChangeFrom=' + cur_state.length + "=To=" + next_state.length)
	return { content: new_text, offset: next_state.length - cur_state.length }
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
		plugin.addCommand({
			id: name,
			name: name,
			editorCallback: (editor: Editor, view: MarkdownView) => { }
		})
	}
}

function removeStateGroup(plugin: ToggleList, setup: Setup) {
	const index = setup.index;
	let sg = plugin.settings.setup_list.splice(index, 1)[0];
	plugin.saveSettings();
	unregist_action(plugin, sg)
	// register_actions(plugin)
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
			.onChange(async (value) => {
				setup.all_states = value;
				setup.states = value.split('\n')
				await container.plugin.saveSettings();
				updateSettingStates(setup);
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

	new Setting(container.containerEl).addButton((cb) => {
		cb.setButtonText("Add new States Group")
			.setCta()
			.onClick(() => {
				// console.log(container.plugin.settings)
				settings = container.plugin.settings
				const new_setup = new Setup(DEFAULT_STATES);
				settings.setup_list.push(new_setup);
				update_list_indexs(settings.setup_list)
				container.plugin.saveSettings();
				register_actions(container.plugin);
				// Force refresh
				container.display();
			});
	});
}

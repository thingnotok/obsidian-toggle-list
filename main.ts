import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

const DEFAULT_STATES = ['- ',
	'- [ ] ',
	'- [/] ',
	'',]

class Setup {
	states: Array<string>;
	sorteds: Array<string>;
	states_dict: Map<string, number>;
	all_states: string;
	constructor() {
		this.states = DEFAULT_STATES;
		this.all_states = '';
		this.states_dict = new Map();
	}
}

interface ToggleListSettings {
	setup_list: Array<Setup>;
}


const DEFAULT_SETTINGS: ToggleListSettings = {
	setup_list: []
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
	console.log('InputText=' + text)
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

function processOneLine(text: string, setting: ToggleListSettings, direction: number) {
	const setup = setting.setup_list[0]
	const idents = numberOfTabs(text);
	const noident_text = text.slice(idents);
	const cur_state = getCurrentState(noident_text, setup.sorteds);
	const cur_idx = setup.states_dict.get(cur_state) || 0;
	let next_idx = cur_idx + direction;
	if (next_idx == setup.states.length)
		next_idx = 0;
	if (next_idx < 0)
		next_idx = setup.states.length - 1;
	const next_state = setup.states[next_idx]
	const new_text = '\t'.repeat(idents) + ChangeState(noident_text, cur_state, next_state)
	// console.log('Curent state:' + cur_state + '"')
	console.log('State=' + cur_state + '=>' + next_state)
	// console.log('LengthChangeFrom=' + cur_state.length + "=To=" + next_state.length)
	return { content: new_text, offset: next_state.length - cur_state.length }
}

function toggleAction(editor: Editor, view: MarkdownView, setting: ToggleListSettings, direction: number) {
	let selection = editor.listSelections()[0];
	let cursor = editor.getCursor();
	let set_cur = false;
	if (selection.head.ch == selection.anchor.ch && selection.head.line == selection.anchor.line)
		set_cur = true;
	const head = selection.head.line
	const anchor = selection.anchor.line
	console.log("head=" + selection.head.ch)
	console.log("anchor=" + selection.anchor.ch)
	let start_line = head;
	let end_line = anchor;
	if (start_line > end_line) {
		start_line = anchor;
		end_line = head;
	}
	console.log("Origin=" + origin)
	for (let i = start_line; i <= end_line; i++) {
		const origin = editor.getLine(i);
		const r = processOneLine(origin, setting, direction);
		// const r = updateState(origin);
		editor.setLine(i, r.content);
		if (i == cursor.line) {
			cursor.ch = cursor.ch + r.offset;
		}
		console.log("Processing=" + i + "=[" + start_line + "=]" + end_line)
		if (i == head) {
			console.log('head with=' + r.offset)
			if (selection.head.ch < -r.offset)
				selection.head.ch = 0;
			else
				selection.head.ch = selection.head.ch + r.offset;
		}
		if (i == anchor) {
			console.log('anchor with=' + r.offset)
			if (selection.anchor.ch < -r.offset)
				selection.anchor.ch = 0;
			else
				selection.anchor.ch = selection.anchor.ch + r.offset;
		}
	}
	editor.setSelection(selection.anchor, selection.head)
	console.log("Nhead=" + selection.head.ch)
	console.log("Nanchor=" + selection.anchor.ch)
	if (set_cur)
		editor.setCursor(cursor)
	// console.log('NCursor@' + cursor.ch)
	// editor.setCursor(cursor)
}

function updateSettingStates(setup: Setup) {
	console.log(setup.states);
	const ori_states = setup.states
	for (let i = 0; i < ori_states.length; i++) {
		setup.states_dict.set(ori_states[i], i)
	}
	setup.sorteds = ori_states.slice(0)
	setup.sorteds = setup.sorteds.sort((a: string, b: string) => b.length - a.length);
}

export default class ToggleList extends Plugin {
	settings: ToggleListSettings;

	async onload() {
		await this.loadSettings();


		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'ToggleList-Next',
			name: 'ToggleList-Next',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				toggleAction(editor, view, this.settings, 1)
			},
		});
		this.addCommand({
			id: 'ToggleList-Prev',
			name: 'ToggleList-Prev',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				toggleAction(editor, view, this.settings, -1)
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ToggleListSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.settings.setup_list.push(new Setup())
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


function add_state_group_setting(container: ToggleListSettingTab, settings: ToggleListSettings): void {
	let default_setup = settings.setup_list[0];
	new Setting(container.containerEl)
		.setName('States')
		.addTextArea(text => text.setValue(default_setup.all_states)
			.onChange(async (value) => {
				default_setup.all_states = value;
				default_setup.states = value.split('\n')
				await container.plugin.saveSettings();
				updateSettingStates(default_setup);
			}
			));
	new Setting(container.containerEl).addButton((cb) => {
		cb.setButtonText("Add new hotkey for template")
			.setCta()
			.onClick(() => {
				const new_setup = new Setup();
				container.plugin.settings.setup_list.push(new_setup);
				// container.plugin.save_settings();
				// Force refresh
				container.display();
			});
	});
}


class ToggleListSettingTab extends PluginSettingTab {
	plugin: ToggleList;

	constructor(app: App, plugin: ToggleList) {
		super(app, plugin);
		this.plugin = plugin;
		let default_setup = this.plugin.settings.setup_list[0]
		default_setup.all_states = default_setup.states.join('\n');
		updateSettingStates(default_setup)
	}


	display(): void {
		// const { containerEl } = this;
		this.containerEl.empty();
		let settings = this.plugin.settings
		this.containerEl.createEl('h3', { text: 'Setup The States to Toggle' })
		add_state_group_setting(this, settings);

		this.containerEl.createEl('p', { text: 'All states are concatenated with \n in "States"' });
		this.containerEl.createEl('p', { text: 'You can add/delete states directly in "States" Field' });
		this.containerEl.createEl('p', { text: 'States entries in settings will refresh after reopen.' });
		this.containerEl.createEl('p', { text: 'Leave the state field blank will make the line a "paragraph" in that state' });
		this.containerEl.createEl('p', { text: 'Non-standard markdown prefix(e.q. - [/]) reqires css setting to make it a bullet-like icon. Or you can find a theme which supports it (like Minimal).' });
		this.containerEl.createEl('p', { text: 'You may want to replace the hotkey (Cmd/Ctrl + Enter)\'s action from Official Toggle checkbox status to ToggleList-Next' });
	}
}

import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface ToggleListSettings {
	states: Array<string>;
	sorteds: Array<string>;
	states_dict: object;
	all_states: string;
}

const DEFAULT_SETTINGS: ToggleListSettings = {
	states: [
		'- ',
		'- [ ] ',
		'- [/] ',
		'- [x] ',
		'',],
	all_states: '',
	states_dict: {},
	sorteds: []
}

function numberOfTabs(text: string) {
	var count = 0;
	var index = 0;
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
	for (var i = 0; i < states.length; i++) {
		var s = states[i];
		// console.log('Compare=' + text.slice(0, s.length) + ',and,' + s)
		if (text.slice(0, s.length) == s) {
			// console.log('Matched')
			return s
		}
	}
	return ''
}

function process_one_line(text: string, setting: ToggleListSettings) {
	const idents = numberOfTabs(text);
	const noident_text = text.slice(idents);
	const cur_state = getCurrentState(noident_text, setting.sorteds);
	const cur_idx = setting.states_dict[cur_state]
	var next_idx = cur_idx + 1;
	if (next_idx == setting.states.length)
		next_idx = 0;
	const next_state = setting.states[next_idx]
	const new_text = '\t'.repeat(idents) + ChangeState(noident_text, cur_state, next_state)
	// console.log('Curent state:' + cur_state + '"')
	console.log('State=' + cur_state + '=>' + next_state)
	console.log('LengthChangeFrom=' + cur_state.length + "=To=" + next_state.length)
	return { content: new_text, offset: next_state.length - cur_state.length }
}

function ToggleAction(editor: Editor, view: MarkdownView, setting: ToggleListSettings) {
	var selection = editor.listSelections()[0];
	var cursor = editor.getCursor();
	var set_cur = false;
	if (selection.head.ch == selection.anchor.ch && selection.head.line == selection.anchor.line)
		set_cur = true;
	const head = selection.head.line
	const anchor = selection.anchor.line
	console.log("head=" + selection.head.ch)
	console.log("anchor=" + selection.anchor.ch)
	var start_line = head;
	var end_line = anchor;
	if (start_line > end_line) {
		start_line = anchor;
		end_line = head;
	}
	console.log("Origin=" + origin)
	for (var i = start_line; i <= end_line; i++) {
		const origin = editor.getLine(i);
		const r = process_one_line(origin, setting);
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
			else if (selection.head.ch == 0)
				selection.head.ch = 0;
			else
				selection.head.ch = selection.head.ch + r.offset;
		}
		if (i == anchor) {
			console.log('anchor with=' + r.offset)
			if (selection.anchor.ch < -r.offset)
				selection.anchor.ch = 0;
			else if (selection.anchor.ch == 0)
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

function updateSettingStates(setting: ToggleListSettings) {
	console.log(setting.states);
	const ori_states = setting.states
	const state_dict = {}
	for (var i = 0; i < ori_states.length; i++) {
		state_dict[ori_states[i]] = i
	}
	setting.states_dict = state_dict;
	setting.sorteds = ori_states.slice(0)
	setting.sorteds = setting.sorteds.sort((a: string, b: string) => b.length - a.length);
}

export default class ToggleList extends Plugin {
	settings: ToggleListSettings;

	async onload() {
		await this.loadSettings();


		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');


		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'ToggleList-Next',
			name: 'ToggleList-Next',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				ToggleAction(editor, view, this.settings)
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ToggleListSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class ToggleListSettingTab extends PluginSettingTab {
	plugin: ToggleList;

	constructor(app: App, plugin: ToggleList) {
		super(app, plugin);
		this.plugin = plugin;
		this.plugin.settings.all_states = this.plugin.settings.states.join(';;');
		updateSettingStates(this.plugin.settings)
	}


	display(): void {
		const { containerEl } = this;
		var settings = this.plugin.settings
		containerEl.empty();
		containerEl.createEl('h3', { text: 'Setup The States to Toggle' });
		new Setting(containerEl)
			.setName('States')
			.addText(text => text
				.setValue(settings.all_states)
				.onChange(async (value) => {
					settings.all_states = value;
					settings.states = value.split(';;')
					await this.plugin.saveSettings();
					updateSettingStates(settings);
				}));
		containerEl.createEl('p', { text: 'All states are concatenated with ;; in "States"' });
		containerEl.createEl('p', { text: 'You can add/delete states directly in "States" Field' });
		containerEl.createEl('p', { text: 'States entries in settings will refresh after reopen.' });
		containerEl.createEl('p', { text: 'Leave the state field blank will make the line a "paragraph" in that state' });
		containerEl.createEl('p', { text: 'Non-standard markdown prefix(e.q. - [/]) reqires css setting to make it a bullet-like icon. Or you can find a theme which supports it (like Minimal).' });
		containerEl.createEl('p', { text: 'You may want to replace the hotkey (Cmd/Ctrl + Enter)\'s action from Official Toggle checkbox status to ToggleList-Next' });
	}
}

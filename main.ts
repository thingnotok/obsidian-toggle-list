import {Plugin} from 'obsidian';

import { EditorSuggestor } from 'src/suggester';
import {ToggleListSettings, ToggleListSettingTab, registerActions,
	resetSetting, updateSettingStates, Command} from 'src/settings';

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
		console.log("ToggleList: Loading settings:")
		this.settings = Object.assign({}, await this.loadData());
		// console.log(this.settings.cmd_list)
		if (!this.settings.setup_list) {
			// console.log("ToggleList: Create default setups")
			resetSetting(this)
			// this.settings.setup_list = []
			// DEFAULT_STATEGROUP.forEach(e => {
			// 	this.settings.setup_list.push(new Setup(e));
			// })
			// updateListIndexs(this.settings.setup_list)
			this.saveSettings();
		}
		else {
			this.settings.setup_list.forEach(setup => updateSettingStates(setup))
		}
		// This is for backbard compatibility
		if (!this.settings.cmd_list) {
			this.settings.cmd_list = Array<Command>();
			this.settings.cmd_list.push(
				new Command(0, 'command-0', [0]))
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
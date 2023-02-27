import {Plugin, App, Editor, MarkdownView} from 'obsidian';
import { EditorSuggestor } from 'src/suggester';
import {ToggleListSettings, Setup, 
	updateSettingStates, Command} from 'src/settings';
import {ToggleListSettingTab} from 'src/UI'
import {toggleAction, popAction } from 'src/tlAction';


function deleteObsidianCommand(app: App, commandId: string) {
	// modified from https://github.com/chhoumann/quickadd/blob/master/src/utility.ts
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
	tab: ToggleListSettingTab;
	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.tab = new ToggleListSettingTab(this.app, this);
		this.addSettingTab(this.tab);
		this.registerActions();
		this.registerEditorSuggest(new EditorSuggestor(this.app, this.settings))
	}
	async loadSettings() {
		const settings = await this.loadData();
		this.settings = new ToggleListSettings(settings);
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
	unregisterActions() {
		this.settings.cmd_list.forEach(cmd => 
			this.unregistAction(cmd))
	}
	unregistAction(cmd: Command) {
		if(cmd.pop){
			deleteObsidianCommand(this.app, `obsidian-toggle-list:${cmd.name}-POP`)
		}
		else {
			deleteObsidianCommand(this.app, `obsidian-toggle-list:${cmd.name}-Next`)
			deleteObsidianCommand(this.app, `obsidian-toggle-list:${cmd.name}-Prev`)
		}
	}
	registerActions() {
		const sg_list = this.settings.setup_list
		this.settings.cmd_list.forEach(cmd => {
			this.registerAction(cmd, sg_list)
		})
	}
	registerAction(action: Command, sg_list: Array<Setup>) {
		const n_name = `${action.name}-Next`
		const p_name = `${action.name}-Prev`
		const pop_name = `${action.name}-POP`
		if(action.pop){
			this.addCommand({
				id: pop_name,
				name: pop_name,
				icon: 'top-arrow',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					popAction(editor, action, this.settings)
				},
			});
		}
		else{
			this.addCommand({
				id: n_name,
				name: n_name,
				icon: 'right-arrow',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					toggleAction(editor, sg_list, action.bindings, 1)
				},
			});
			this.addCommand({
				id: p_name,
				name: p_name,
				icon: 'left-arrow',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					toggleAction(editor, sg_list, action.bindings, -1)
				},
			});
		}
	}
	reloadSettingUI() {
		this.settings.updateListIndexs()
		this.saveSettings();
		this.registerActions();
		this.tab.display();
	}
	reset() {
		this.unregisterActions();
		this.settings.reset();
	}
}
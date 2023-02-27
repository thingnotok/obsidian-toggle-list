import {Plugin, App, Editor, MarkdownView, Notice} from 'obsidian';
import { EditorSuggestor } from 'src/suggester';
import {ToggleListSettings, Setup, Command} from 'src/settings';
import {ToggleListSettingTab} from 'src/UI'
import {toggleAction, popAction } from 'src/tlAction';
import {drawDiagram} from 'src/stateDiagram';

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
		this.tab = new ToggleListSettingTab(this.app, this);
		this.addSettingTab(this.tab);
		this.registerActions();
		this.registerEditorSuggest(new EditorSuggestor(this.app, this.settings));
		drawDiagram("");
	}
	async loadSettings() {
		const settings = await this.loadData();
		this.settings = new ToggleListSettings(settings);
		this.saveSettings();
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
	unregisterActions() {
		this.settings.registedCmdName.forEach(cmd => this.unregistAction(`obsidian-toggle-list:${cmd}`));
		this.settings.registedCmdName = [];
	}
	unregistAction(cmd: string) {
		deleteObsidianCommand(this.app, cmd)
	}
	registerActions() {
		const sg_list = this.settings.setup_list
		const reg = Array<string>();
		this.settings.cmd_list.forEach(cmd => {
			this.registerAction(cmd, sg_list)
			if(cmd.isPopOver)
				reg.push(`${cmd.name}-POP`)
			else{
				reg.push(`${cmd.name}-Next`)
				reg.push(`${cmd.name}-Prev`)
			}
		})
		this.settings.registedCmdName = reg
	}
	registerAction(action: Command, sg_list: Array<Setup>) {
		const n_name = `${action.name}-Next`
		const p_name = `${action.name}-Prev`
		const pop_name = `${action.name}-POP`
		if(action.isPopOver){
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
	checkNreload(){
		this.settings.validate();
		this.unregisterActions();
		this.registerActions();
		this.saveSettings();
		this.reloadSettingUI();
	}
	reloadSettingUI() {
		this.tab.display();
	}
	reset(){
		this.unregisterActions();
		this.settings.reset();
	}
	sendNotify(text:string){
		new Notice(text);
	}
}
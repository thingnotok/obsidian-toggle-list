import { App, Editor, MarkdownView, Scope, Modal, Notice, Plugin, PluginSettingTab, Setting, type Hotkey } from 'obsidian';
import ToggleList from 'main';
import {ToggleListSettings, Setup, Command, renderEmptyLine, getStateFromText} from 'src/settings';
import {genDiagramSVG} from 'src/stateDiagram'

function addSettingUI(container: ToggleListSettingTab): void {
    const plugin = container.plugin
    const settings = plugin.settings
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
				settings.addGroup()
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
					plugin.unregistAction(cmd_list[i])
					cmd_list[i].pop = value
					reloadSetting(container, settings)
				})
			})
			.addButton((cb) => {
				cb.setIcon('trash')
				cb.setCta()
				cb.onClick(() => {
					plugin.unregistAction(cmd_list[i])
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
					plugin.unregistAction(cmd_list[i])
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
				plugin.resetSetting()
				reloadSetting(container, settings)
			});
	});
	// const state_diagram = new Setting(container.containerEl)
	
	const svg_container = container.containerEl.createEl('div')
	svg_container.innerHTML = genDiagramSVG(settings)
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
		// console.log("Redraw UI")
		addSettingUI(this);
		const exp = this.containerEl.createEl('div', {cls:'togglelist_div'})
		exp.innerHTML= `<button class="togglelist_btn">
		<a href="https://github.com/thingnotok/obsidian-toggle-list">README</a>
		</button>`
	}
}

function addSetupUI(container: ToggleListSettingTab, setup: Setup): void {
	// console.log('Add new setup ui')
	const plugin = container.plugin
	let sg_ui = new Setting(container.containerEl).addButton((cb) => {
		cb.setIcon('trash')
			.setCta()
			.onClick(() => {
                plugin.removeStateGroup(setup)
                plugin.updateListIndexs()
				plugin.updateCmdList(setup.index)
				plugin.settings.cmd_list.forEach(cmd =>{
					plugin.unregistAction(cmd)
				})
				plugin.settings.cmd_list = plugin.settings.cmd_list.filter(cmd => cmd.bindings.length > 0)
				plugin.registerActions()
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

function reloadSetting(container: ToggleListSettingTab, settings: ToggleListSettings) {
    const plugin = container.plugin
	plugin.updateListIndexs()
	container.plugin.saveSettings();
	plugin.registerActions();
	// Force refresh
	container.display();
}

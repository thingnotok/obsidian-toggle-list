import { App, Notice, PluginSettingTab, Setting} from 'obsidian';
import ToggleList from 'src/main';
import {ToggleListSettings, Setup, Command} from 'src/settings';
import {genDiagramSVG} from 'src/stateDiagram'
import {renderEmptyLine} from 'src/tlAction'

function genSGSection(tab:ToggleListSettingTab){
    const plugin = tab.plugin
    const settings = tab.plugin.settings
    tab.containerEl.createEl('h2', { text: 'Setup The States to Toggle' })
	const setup_list = settings.setup_list
	// Add setup UI for each state group
	settings.setup_list.forEach(setup => {
		addSetupUI(tab, setup);
	})
	// Button: Add a new state group
	new Setting(tab.containerEl).addButton((cb) => {
		cb.setButtonText("+ State Group")
			.setCta()
			.onClick(() => {
				settings.addGroup()
				plugin.reloadSettingUI()
			});
	});
}

function addCmdUI(tab:ToggleListSettingTab, cmd:Command, cmdIdx:number){
    const cmd_list = tab.plugin.settings.cmd_list
    const settings = tab.plugin.settings
    const plugin = tab.plugin
    const cmd_section = new Setting(tab.containerEl)
			.setName(`${cmd.name}`)
			.setDesc(`[Command Name] [Binding State Groups]`)
			.addToggle((cb) => {
				cb.setValue(cmd.pop||false)
				cb.onChange((value) => {
					plugin.unregistAction(cmd)
					cmd.pop = value
					plugin.reloadSettingUI();
				})
			})
			.addButton((cb) => {
				cb.setIcon('trash')
				cb.setCta()
				cb.onClick(() => {
					plugin.unregistAction(cmd)
					cmd_list.splice(cmdIdx, 1)
					plugin.reloadSettingUI();
				})
			})
			.addText((cb) => {
				cb.setValue(
					cmd.name
				)
				cb.setPlaceholder("Command Name")
				cb.onChange((value) => {
					cmd.tmp_name = value
				})
			})
			.addText((cb) => {
				cb.setValue(
					cmd.bindings.map(x => x.toString()).join(", ")
				)
				cb.setPlaceholder("Indes of State Groups: 0, 1, 2")
				cb.onChange((value) => {
					cmd.bindings = value.split(",").map(x => parseInt(x, 10))
					// console.log(cmd.bindings)
					tab.plugin.saveSettings();
				})
			})
			.addButton((cb) => {
				cb.setIcon('checkmark')
				cb.setCta()
				cb.onClick(() => {
					// console.log(cmd)
					plugin.unregistAction(cmd)
					cmd.name = cmd.tmp_name
					cmd.bindings = cmd.bindings.filter(b => b < settings.setup_list.length);
					cmd.bindings = [...new Set(cmd.bindings)];
					// console.log(cmd.bindings)
					plugin.reloadSettingUI()
				})
			})
}
function genCMDSection(tab:ToggleListSettingTab){
    tab.containerEl.createEl('h2', { text: 'Bind the Commands with State Groups' })
	tab.containerEl.createEl('p', { text: 'Order of bindings matters if two SG share the same states' })
    const cmd_list = tab.plugin.settings.cmd_list
	for (let i = 0; i < cmd_list.length; i++) {
		addCmdUI(tab, cmd_list[i], i)
	}
	new Setting(tab.containerEl).addButton((cb) => {
		cb.setButtonText('+ Command')
		cb.setCta()
		cb.onClick(() => {
			const name = `Command ${cmd_list.length}`
			cmd_list.push(new Command(cmd_list.length, name, [0]))
			tab.plugin.reloadSettingUI()
		})
	})

}
function genMISCSection(tab:ToggleListSettingTab){
    const cmd_list = tab.plugin.settings.cmd_list
    const settings = tab.plugin.settings
    const plugin = tab.plugin
    const other = new Setting(tab.containerEl)
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
				const stamp = (new Date()).toISOString()
				await this.app.vault.writeConfigJson(`plugins/obsidian-toggle-list/backup-${stamp}`, settings)
				new Notice(`ToggleList: Original config is saved in plugins/obsidian-toggle-list/backup-${stamp}.json`)
				plugin.reset()
				plugin.reloadSettingUI()
			});
	});
}
function genDiagramSection(tab: ToggleListSettingTab){
	if(tab.plugin.settings.cmd_list.length > 0){
		const svg_container = tab.containerEl.createEl('div')
		svg_container.innerHTML = genDiagramSVG(tab.plugin.settings)
	}
}
function genExplanation(tab: ToggleListSettingTab): void {
    const exp = tab.containerEl.createEl('div', {cls:'togglelist_div'})
		exp.innerHTML= `<button class="togglelist_btn">
		<a href="https://github.com/thingnotok/obsidian-toggle-list">README</a>
		</button>`
}
function addSetupUI(container: ToggleListSettingTab, setup: Setup): void {
	// console.log('Add new setup ui')
	const plugin = container.plugin
	let sg_ui = new Setting(container.containerEl).addButton((cb) => {
		cb.setIcon('trash')
			.setCta()
			.onClick(() => {
                plugin.settings.removeStateGroup(setup)
                plugin.settings.updateListIndexs()
				plugin.settings.updateCmdList(setup.index)
				plugin.settings.cmd_list.forEach(cmd =>{
					plugin.unregistAction(cmd)
				})
				plugin.settings.cmd_list = plugin.settings.cmd_list.filter(cmd => cmd.bindings.length > 0)
				plugin.registerActions();
				plugin.saveSettings();
				// Force refresh
				container.display();
			});
	});
	const renderedText = renderEmptyLine(setup.all_states)
	sg_ui.setName('State Group: ' + setup.index.toString())
		.addTextArea(text => text.setValue(renderedText)
			.onChange(async (text_value) => {
				setup.update(text_value);
				await container.plugin.saveSettings();
			}
			));
}


export class ToggleListSettingTab extends PluginSettingTab {
	plugin: ToggleList;

	constructor(app: App, plugin: ToggleList) {
		super(app, plugin);
		this.plugin = plugin;
	}
    addSettingUI(): void {
        genSGSection(this)
        genCMDSection(this)
        genMISCSection(this)
        genDiagramSection(this)
        genExplanation(this)
    }

	display(): void {
		this.containerEl.empty();
		this.addSettingUI();
	}
}
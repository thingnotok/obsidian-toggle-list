# ToggleList Plugin for Obsidian

ToggleList is a plugin for [Obsidian](https://obsidian.md) that provides an alternative way to toggle checkbox status and allows for easy toggling between frequently used attributes such as task states, task tags, highlighted lists, and more. This simple plugin overwrites the default toggle behavior in Obsidian, making it more customizable and user-friendly.


## Plugin Features

ToggleList provides the following features:

1. Hotkey toggling of list states within a state group:
	- For example, a state group might include the following states: [`""`, `- `, `- [ ] `, ` - [x] `]

2. Multiple state groups for different purpose
	- Task group: [`- [ ] `, ` - [/] `, ` - [x] `]
	- Highlight group: [`- [i] `, ` - [!] `, ` - [?] `]

3. Prefix and Suffix Support. State `PRE||SUF` can match `PRExxx line contents xxxSUF`.

4. Suggestion mode. 

	https://user-images.githubusercontent.com/29173832/221370021-9646a62b-ad31-4212-a850-71919d8a9db7.mov


	

5. States visualization

	![image](https://user-images.githubusercontent.com/29173832/221369660-5600d76d-b8ac-4354-b4cc-11457c1527db.png)


6. Togglelist works as a handy tool to setup contents in other plugins, check [Working with other Plugins](https://github.com/thingnotok/obsidian-toggle-list/doc/other_plugin.md) for more examples

Here's why checkboxes need more states and how to query these customized states:

| Project Use Case | Query Customized Items |
| :--------------: | :-------------------: |
| <img src="https://github.com/thingnotok/obsidian-toggle-list/blob/master/resources/example_project.png" width="300"> | <img src="https://github.com/thingnotok/obsidian-toggle-list/blob/master/resources/query_example.png" width="400"> |



## Installation

### From repositary

1. Download the folder and put in `Vault/.obsidian/plugin`.
1. Enable it from Installed Plugins

### From Community Plugins

1. Search for ToggleList in Commnity Plugins/Browse
1. Install and enable it from Installed Plugins

### From [BRAT](https://github.com/TfTHacker/obsidian42-brat)

1. Install [Obsidian 42 - BRAT] from Community Plugins
2. Add this repository in Obsidian 42 - BRAT/ Add Beta Plugin
	- Paste this url: `https://github.com/thingnotok/obsidian-toggle-list`
3. Enable this plugin from Installed Plugins


## Changelog
[1.0.6/7] - [[2023-02-26]]
---
- Clarity
	- State Diagram in setting tab to provide a better understanding of state groups.
	- Empty line is now rendered as `{PARAGRAPH}`.
- Suggestion Mode
	- Commands have suggestion mode now. A suggestion editor will pop when command/hotkey is triggered.
- Codebase reorganization
	- the project is reorganized to clarity.
- Many thanks to [engage-results](https://github.com/engage-results) and [replete](https://github.com/replete) for their valuable suggestions.
	
[1.0.5] - [[2022-11-08]]
---
- Toggles
    - Add support for indentation using spaces.
- Commands
    - Add contextual toggles support with same command
    - Allow user to modify command name
- Settings
    - Add a config backup before Reset command

[1.0.3/4] - [[2022-10-31]]
---
- Add suffix to support Tasks Plugin usage
- Add an additional default group to show List Callouts Plugin usage
- Add random state group selection to new group button
- Add Reset button to recover to default state groups
- Add Hotkey button to link to hotkey setup page
- Update Description in setting tab page


[1.0.1] - [[2022-10-25]]
---

### Added
- Allow multiple state groups

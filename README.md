# ToggleList Plugin for Obsidian

ToggleList is a plugin for [Obsidian](https://obsidian.md) that provides an alternative way to toggle checkbox status and allows for easy toggling between frequently used attributes such as task states, task tags, highlighted lists, and more. This simple plugin overwrites the default toggle behavior in Obsidian, making it more customizable and user-friendly.


## Plugin Features

ToggleList provides the following features:

1. Hotkey toggling of list states within a state group:
	- For example, a state group might include the following states: [`""`, `- `, `- [ ] `, ` - [x] `]

2. Multiple state groups for different purpose
	- Task group: [`- [ ] `, ` - [/] `, ` - [x] `]
	- Highlight group: [`- [i] `, ` - [!] `, ` - [?] `]

3. Prefix and Suffix Support. State `Prefix||Suffix` can match `Prefix line contents Suffix`.
	- Timestamp can be used in both **Prefix** and **Suffix**  using {time:: time-format}, e.q. {time:: YYYY-MM-DD}. Supported time format can be found in [Supported Time Format](https://github.com/thingnotok/obsidian-toggle-list/blob/master/doc/time_format.md).
	- Use cases
		- Task created / completed: `- [ ] || ➕[[{time:: YYYY-MM-DD}]]` / `- [ ] || ✅ {time:: YYYY-MM-DD}` ([Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks)' style)
		- [Interstitial journaling](https://nesslabs.com/interstitial-journaling): `- **{time:: hh:mm}** `


4. Suggestion window: turn on suggestion for commands so the whole state group with show in suggestion window for quick access. 

	https://user-images.githubusercontent.com/29173832/221370021-9646a62b-ad31-4212-a850-71919d8a9db7.mov


	

5. States visualization

	![image](https://user-images.githubusercontent.com/29173832/221369660-5600d76d-b8ac-4354-b4cc-11457c1527db.png)


6. Togglelist works as a handy tool to setup contents in other plugins, check [Working with other Plugins](https://github.com/thingnotok/obsidian-toggle-list/blob/master/doc/other_plugin.md) for more examples

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

[1.2.3]
---
- Add blockID support
	- toggling states will not mess with blockID now
	- Cursor location rule
		- if cursor is in prefix, it will be moved to the head of the content
		- if cursor is in content, it will stay at the same location w.r.t the content
		- if cursor is in surfix, it will be moved to the end of the content
		- if cursor is in blockID, it will be moved to the end of the line

[1.2.1]
---
- Time related update
	- Timestamps in states can now be customized with {time:: YYYY-MM-DD hh:mm:ss}
		- old settings `{tasks-today}` will be automatically converted to `✅ {time:: YYYY-MM-DD}`
	- Fix date error for #23 (possibly)

[1.2.0]
---
- merge suggesiton window action with regular action.
	- custom hotkey for pop command will be automatically assigned to Next action.
	- commands without iPopOver will not be affected.
	- If the upgrade break your setting, I'm really sorry, and please leave a issue so I can help you.

[1.1.3]
---
- resolve the performance issue #14
- update the suggestion window when hotkey is consectively triggered
- update UI 
- refactor main, setting, tlActions

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

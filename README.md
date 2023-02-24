# ToggleList Plugin for Obsidian

ToggleList is a plugin for [Obsidian](https://obsidian.md) that provides an alternative way to toggle checkbox status and allows for easy toggling between frequently used attributes such as task states, task tags, highlighted lists, and more. This simple plugin overwrites the default toggle behavior in Obsidian, making it more customizable and user-friendly.


## Plugin Features

ToggleList provides the following features:

1. Hotkey toggling of list states within a state group:
	- For example, a state group might include the following states: [`""`, `- `, `- [ ] `, ` - [x] `]

2. Support for multiple state groups:
	- You can set up multiple state groups with corresponding hotkeys for each group. This allows you to have separate groups for different purposes, such as:
		- Task group: [`- [ ] `, ` - [/] `, ` - [x] `]
		- Highlight group: [`- [i] `, ` - [!] `, ` - [?] `]

3. Prefix and Suffix Support for States: ToggleList also supports the use of prefixes and suffixes for list states, providing even greater flexibility. This feature can be used in a variety of scenarios, such as:

	- Working with the Tasks Plugin:
		- By adding {tasks-today} as a suffix in the "done" state, ToggleList can support the [Tasks plugin](https://github.com/obsidian-tasks-group/obsidian-tasks), allowing you to toggle a line through a paragraph, list, todo, or done state while keeping task attributes. Multiline support is also available.
		- Example:
			<img src="https://github.com/thingnotok/obsidian-toggle-list/blob/master/resources/example_tasks.png" width="440"> 

	- GTD task organization:
		- By adding category/location/tags as todo prefix/suffix, you can use ToggleList to quickly toggle through frequent categories with a single hotkey.
		- Example:
			<img src="https://github.com/thingnotok/obsidian-toggle-list/blob/master/resources/example_gtd.png" width="440"> 

	- Working with List Callouts:
		- Use [List Callouts](https://github.com/mgmeyers/obsidian-list-callouts) to highlight your customized list states, and use ToggleList to jump between states.
		- Example:
			<img src="https://github.com/thingnotok/obsidian-toggle-list/blob/master/resources/example_listcallout.png" width="440"> 

		

4. Other setup to make it better

	- Rendering for customized task state or tags
		- check this discussion: [Creating tasks that have three possible states instead of two](https://forum.obsidian.md/t/creating-tasks-that-have-three-possible-states-instead-of-two/24105/2)
		- Minimal themes supports many task states, check [advance setup](###advanced-setup-other-things-to-make-it-beautiful)
		- [List Callouots](https://github.com/mgmeyers/obsidian-list-callouts) for list highlighting.


	- [Dataview Queries](https://github.com/blacksmithgu/obsidian-dataview)
		
		- Query all task with tag `#p3`

		```dataview
		task 
		from "/"
		where !completed and contains(tags,"#p3")
		```

		- Summarize all comments in List Callout format

		```dataview
		TABLE WITHOUT ID Lists.text AS "highlight", link(Lists.link, meta(Lists.section).subpath) AS "Section" 
		WHERE file.path = this.file.path 
		FLATTEN file.lists AS Lists 
		WHERE contains(Lists.text, "? ") or contains(Lists.text, "~ ") or contains(Lists.text, "! ")
		```
		
		- Query tasks with state [>]

		```dataview
		task  from "Folder" 
		WHERE status = ">"
		sort file.mtime desc
		```

		- Summarize all comments in this note with label [i]

		```dataview
		task
		from "Path/to/this/note"
		where status = "i"
		```

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

# Manual

## Basic Usage

1. Enable the plugin in the Community Plugins tab.
2. Set up the states in the preference panel at Community Plugins > ToggleList > Options. Each state should be listed on a separate line, as shown in the example setup with 5 states:

	```

	- 
	- [ ] 
	- [/] 
	- [x] 
	```

	This setup represents the following states:

	1. Paragraphs - nothing but pure text, one of the best features Obsidian has over outline apps
	2. List
	3. Checkbox in todo state
	4. Checkbox in a custom state
	5. Checkbox in done state

	Note that the space after these prefixes is important. You need "- [ ] " to create a checkbox.

3. Set a hotkey for the plugin. For example, you can use `Cmd`/`Ctrl` + `Enter` for the task state group (you need to deactivate the hotkey of "Toggle checkbox status" first).


## Multiple State Groups

1. You can add or delete state groups in the ToggleList's options panel.
2. You can set up hotkeys for each state group in the hotkey panel.


## Commands

1. You can change the command name for better recognition.
2. You can bind multiple groups to a single command, so you can use a single hotkey to toggle through states based on the context of the current line.
3. Two commands are actually created: `${Command}`-Prev and `${Command}`-Next for one command field. They toggle states in different directions within the group.


## Suffix Support

__Note: This feature may be buggy as it has only been tested on my own flow. If it doesn't work for you, please leave an [Issue](https://github.com/thingnotok/obsidian-toggle-list/issues) so I can help.__

1. A state with prefix and suffix pair is in the format `{prefix}||{suffix}`.
	- Prefixes of states will always be located at the beginning of the line, and suffixes will be at the end.
2. A special type of suffix {tasks-today} can be used to indicate a [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks)-style completed decoration: `✅ YYYY-MM-DD`. You can find instructions on how to specify this in the default groups.
	- Leave an issue if there is any special format you would like to use.



## Buttons in options panel

- `+ State Group`: Adds a new state group.
- `+ Command Group`: Adds a new command group.
- `🔥 Hotkeys`: Navigates to the hotkey setting page for ToggleList commands.
- `↻ Reset`: Clears all the current state groups and replaces them with default groups. 
	- The default groups demonstrate all the supported features in the latest release.
	- This command will delete all the existing state groups. You should backup your data first.
		- Setting path: `vault/.obsidian/obsidian-toggle-list/data.json`


## Changelog
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

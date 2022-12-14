# ToggleList for Obsidian

This is a simple plugin for Obsidian (https://obsidian.md) to overwrite the default behavior of toggle checkbox status. Alos, it offers a simple way to toggle through frequently used attributes: task states, task tags, highlighted list, etc.

## What this plugin does?

1. Toggle the list states in a state group with hotkeys
	- For example: State group: [`""`, `- `, `- [ ] `, ` - [x] `]

2. Support multiple state groups

	- You can setup multiple state groups with corresponding hotkeys for each group. This allow you to have separate groups for different purposes. For example:
		- Task group: [`- [ ] `, ` - [/] `, ` - [x] `]
		- Highlight group: [`- [i] `, ` - [!] `, ` - [?] `]

3. States support Prefix and Suffix

	- State groups above can be considered as prefix for the raw text
	- Elevate list state to a prefix and suffix pair can achieve much more
	- Scanarios:
		- Work with Tasks Plugin:
			- by adding {tasks-today} as suffix in done state, this plugin can support [Tasks plugin](https://github.com/obsidian-tasks-group/obsidian-tasks). You can toggle a line through paragraph/list/todo/done while keeping task attributes. Also you can have multiline support.
			<img src="https://github.com/thingnotok/obsidian-toggle-list/blob/master/resources/example_tasks.png" width="440"> 
		- GTD task organize:
			- by adding category/location/tags as todo prefix/surfix, you can toggle through frequent catogories with single hotkey.
			<img src="https://github.com/thingnotok/obsidian-toggle-list/blob/master/resources/example_gtd.png" width="440"> 
		- Work with List Callouts
			- Use [List Callouots](https://github.com/mgmeyers/obsidian-list-callouts) to highlight your customized list states and use togglelist to jump between states.
			<img src="https://github.com/thingnotok/obsidian-toggle-list/blob/master/resources/example_listcallout.png" width="440"> 
		

3. Other setup to make it better

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

		- Summarize all comments I make in this note in List Callout format

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

		- Summarize all comments I make in this note with lable [i] 

		```dataview
		task
		from "Path/to/this/note"
		where status = "i"
		```
Here's why checkbox needs more states and how these customized can be queried

Project Usecase            |  Query Customized Items
:-------------------------:|:-------------------------:
<img src="https://github.com/thingnotok/obsidian-toggle-list/blob/master/resources/example_project.png" width="300"> |  <img src="https://github.com/thingnotok/obsidian-toggle-list/blob/master/resources/query_example.png" width="400">


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

1. Enable it in the community plugin tab.
2. You can setup the states in the preference panel/Community Plugins/ToggleList/Options. 
	Every states are listed one state per line. An example setup with 5 states is shown:

	```

	- 
	- [ ] 
	- [/] 
	- [x] 
	```
 	This setup represents for states:

	1. paragraphs, nothing but pure text, one of the best features obsidian beats roam-like apps
	2. list
	3. checkbox in todo state
	4. checkbox in a state for anything you want
	5. checkbox in done state

	Note that the space after these prefixes is important. You need "- [ ] " to make a checkbox.

3. Set the hotkey for this plugin 
	- For example, you can use `Cmd`/`Ctrl` + `Enter` for task state group. (you need to deactivate the hotkey of "Toggle checkbox status" first)


## Multiple State Groups

1. You can add/delete state groups in the ToggleList's optiona panel. 
2. You can setup hotkeys for each state groups in the hotkey panel.

## Commands

1. Change the command name for better recognition.
2. Bind multiple groups to a single command, so you can use single hotkey and toggle through states based on context (of current line).
3. Two commands are actually created, `${Command}`-Prev and `${Command}`-Next for one command field. They toggle states in different direction in the states.


## Suffix Support

__This feature may be buggy, I only test it on my own flow. If it doesn't work for your flow, please leave a [Issue](https://github.com/thingnotok/obsidian-toggle-list/issues) so I can help.__

1. A state with prefix and suffix pair is in format `{prefix}||{suffix}`.
	- Prefixes of states will always locate at the begining of line, and suffixes will be at the ending. 	
2. A special type of suffix {tasks-today} can be used to indicate a [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks)-style completed decoration: `??? YYYY-MM-DD`. You can find how to specify this in the default groups.
	- leave a issue if there are any special format you would like to use.

## Buttons

- `+ State Group`: Add new state group.
- `+ Command Group`: Add new state group.
- `???? Hotkeys`: navigate to hotkey setting page for ToggleList commands.
- `??? Reset`: clear all the current state groups and replace with default groups. 
	- The default groups demonstrte all the supported features in the latest release.
	- This command will wipe all the existing state groups. You should backup first.
		- setting path: `vault/.obsidian/obsidian-toggle-list/data.json`


## ~~Advanced setup~~ Other things to make it beautiful

As I mentioned, custom `css` are required to make those non-standard notations work. Here is an workcase of this plugin with [Minimal Theme](https://github.com/kepano/obsidian-minimal), You can enjoy the following rendered tasks with Minimal setup.

1. Replace the default states field with
  ```
  
    - 
	- [ ] 
	- [/] 
	- [x] 
	- [>] 
	- [?] 
	- [!] 
	- [-] 
  ```
How it looks like:

<img src="https://github.com/thingnotok/obsidian-toggle-list/blob/master/resources/minimal-supports.png" width="100">


~~While it's cool, I need to remind you that too many states will make you hard to get back. (9 key press requied to go back to the inital state in this example)~~ You can now setup hotkeys for next/prev states.


## Why this plugin?

### 1. Simple project and task management system

I want to use obsidian as a simple task management tool (as many others are doing), but the existing task management are a little too complex for me. They are still good plugins and thanks the contributors and all the youtubers who teach me how to use. I just want to make obsidian to serve as my __project management tool__ (which I plan the actions to achieve goals, and they are naturally in checkbox style) and __task management tool__ (yup, tasks are checkbox too). While actions should eventually become tasks, they usually are not in the first place. Separating them requires a lot of tagging, dataview query, etc, which I'm really not good at. All I need is a one same hotkey to make a thought to list or actions, and press again, I can make it to current focusing task today.

### 2. A simple fix to my naughty fingers

I triggers "Toggle checkbox" much more than multiple times, some are intentional but most are not. I'm not sure why obsidian team decides we cannot use the same hotkey to covert checkbox back to list or paragraphs, but that's not for me.

__Backgorund__
Toggle behavior of official implementation (Toggle checkbox status, `Cmd`/`Ctrl`+`Enter`) has only two states: `checked` and `unchecked`

```
  - [ ]
  - [x]
```


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

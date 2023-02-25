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
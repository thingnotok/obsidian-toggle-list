# ToggleList for Obsidian

This is a simple plugin for Obsidian (https://obsidian.md) to overwrite the default behavior of toggle checkbox status. 

## Fix the code for these suggestions


- [x] console.log('click', evt); this is boilerplate, you can remove it
- [x] this.registerInterval this is boilerplate, you can remove it
- [x] const statusBarItemEl = this.addStatusBarItem this is boilerplate, you can remove it
- [x] else if (selection.anchor.ch == 0) This code doesn't do anything
- [x] numberOfTabs This doesn't take into account lines indented with spaces
- [x] kapano this should be kepano
- [x] - ;;- [ ] ;;- [/] ;;- [x] ;;- [>] ;;- [?] ;;- [!] ;;- [-] ;; I suggest using \n as your delimiter instead so that users can put each form on its own line.
- [x] addText You should use a textarea instead.
- [x] Code Style nitpicks
	- [x] ToggleAction functions should be camelCase to distinguish them from ClassNames which are typically PascalCase
	- [x] process_one_line You should try to be consistent with the styling of function names (camelCase vs snake_case)
	- [x] var i = 0 You should avoid using var. Instead you should use let or const


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

## What this plugin does?

1. You can define your desire states to circle with `Cmd`/`Ctrl` + `Enter`.
2. Nothing else.
3. While I'm not going to implement this, the script in this discussion: [Creating tasks that have three possible states instead of two](https://forum.obsidian.md/t/creating-tasks-that-have-three-possible-states-instead-of-two/24105/2) I found on forum is going to make a perfect couple with this plugin. A simple customization for the selfdefined states.

Here's an example project page to show why checkbox needs more states and why using the same hotkey to circle through them are good ideas

![](resources/example_project.png)


## Installation
 
- Download the folder and put in `Vault/.obsidian/plugin`.
- Maybe I'll publish it on the official list someday.

## Usage

1. Enable it in the community plugin tab.
2. Setup the states you want in the states field. Every states are listed one state per line. The defaut setup is:

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

3. Set the hotkey `Cmd`/`Ctrl` + `Enter`for this plugin "ToggleList: ToggleList->Next".Since `Cmd`/`Ctrl` + `Enter` hotkey is occupied by the official toggle, you need to delete the hotkey of "Toggle checkbox status" first. 
	- You can also add a hotkey for "ToggleList: ToggleList->Prev" to toggle the states in reverse order.

Note that the space after these prefixes is important. You need "- [ ] " to make a checkbox.

## ~~Advanced setup~~ Other things to make it beautiful

As I mentioned, custom `css` are required to make those non-standard notations work. And after finishing this plugin, I surpriely find out the theme I'm using: [Minimal](https://github.com/kepano/obsidian-minimal) supports a lot of cool icons for special styled lists (love you [kapano](https://www.buymeacoffee.com/kepano) <3 ). Here's how you can enable them all.

1. Install and enable the "Minimal" Theme from Apperance.
2. Replace the default states field with
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

![](resources/minimal-supports.png)


While it's cool, I need to remind you that too many states will make you hard to get back. (9 hotkey press requied to go back to the inital state in this example)

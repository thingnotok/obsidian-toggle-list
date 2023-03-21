
- backup:
```
- 
- [>] 
- [x], ✅{today}

```

```
- ⚡️ 
- [>] #check/lu 
- 💬 
- 

```

```dataview
task 
from "Project/obsidian-toggle-list"
where !completed and contains(tags,"#p3")
```

```dataview
TABLE WITHOUT ID Lists.text AS "highlight", link(Lists.link, meta(Lists.section).subpath) AS "Section" 
WHERE file.path = this.file.path 
FLATTEN file.lists AS Lists 
WHERE contains(Lists.text, "? ") or contains(Lists.text, "~ ") or contains(Lists.text, "! ")
```

# Playground-TasksPlugin
---
example task 0
- example task 1
- [>] example task 2
- [x] example task 3 ✅ 2022-10-31

# Playground-GTD Organize
---
- [>] example task 2.1
	- [>] #p1 example task 2.2
	- [>] #p2 example task 2.3
	- [>] #p3 example task 2.4

- Task indent with Tab 
	- Task indent with Tab 
		- Task indent with Tab 
- Task indent with 0 space
  - Task indent with 2 space
    - Task indent with 4 space
      - Task indent with 6 space
- Parent List
   - [>] Child list 


# Playground-LineCallout
---
- list line 
- ? line with Question to lookup later
- ! Important line
- ~ Highlighted line

- [>] 
- Task item 
	- Task item 
		- Task item 
- [i] Callout List item
	- [i] Callout List item
		 - [i] Callout List item
1. Numbered List
	2. Numbered List
		3. Numbered List
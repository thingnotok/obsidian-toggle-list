## Working with other Plugins

### Using Prefix and Suffix to management list attributes

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

		

### Decorated lists for query and organization

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
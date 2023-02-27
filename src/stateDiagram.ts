// @ts-ignore
import smcat from "state-machine-cat";
// @ts-ignore
import colormap from "colormap"
import { ToggleListSettings, renderEmptyLine} from "./settings";

function drawConnection(state_group:Array<string>, color:string):string{
	let diagram = "";
	const states = state_group.map(renderEmptyLine)
	for(let i = 0; i < states.length-1; i++) {
		diagram += `"${states[i]}" => "${states[i+1]}" [color="${color}"];\n`;
	}
	diagram += `"${states[states.length-1]}" -> "${states[0]}" [color="${color}"];\n`;
	return diagram
}

function removeRedundentConnection(scma_text:string){
	const lines = scma_text.split("\n");
	const line_ary = [...new Set(lines)];
	return line_ary.join('\n')
}


function drawDiagram(diagram_description:string, engine:string="fdp"):string{
	try {
		const lSVGInAString = smcat.render(
			diagram_description,
		  {
			outputType: "svg",
			direction: "top-down",
			engine: engine
		  }
		);
		// console.log(lSVGInAString);
		return lSVGInAString
	  } catch (pError) {
		console.error(pError);
		return ""
	  }
}
function modifySVG(svg_text: string){
	let result = svg_text
	result = result.replace(/<g (id="node)/gs,
				 `<g class="togglelist_theme" $1`)
	return result
}
function genColorMap(samples:number){
	const num = samples < 256 ? 256 : samples
	const colors = colormap({
		colormap: 'rainbow-soft',
		nshades: num,
		format: 'hex',
		alpha: 0.5
	})
	return colors
}
export function genDiagramSVG(settings:ToggleListSettings): string{
    const colors = genColorMap(settings.cmd_list.length)
	let svg_text = ""
	let text = ``
	for(let i = 0; i< settings.cmd_list.length-1;i++){
		const cmd = settings.cmd_list[i]
		const color_idx = (i/settings.cmd_list.length)*256 | 0
		text += `"${cmd.name}" [color="${colors[color_idx]}"],`
	}
	let i = settings.cmd_list.length-1
	let cmd = settings.cmd_list[i]
	let color_idx = (i/settings.cmd_list.length)*256 | 0
	text += `"${cmd.name}" [color="${colors[color_idx]}"];\n`
	svg_text += drawDiagram(text, 'dot')
	text = ``
	for(let i = 0; i< settings.cmd_list.length;i++){
		const cmd = settings.cmd_list[i]
		const color_idx = (i/settings.cmd_list.length)*256 | 0
		cmd.bindings.forEach((j)=>text+=drawConnection(settings.setup_list[j].states, colors[color_idx]))
	}
	svg_text += modifySVG(drawDiagram(removeRedundentConnection(text)))
    return svg_text
}
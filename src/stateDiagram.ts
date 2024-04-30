// @ts-ignore
import colormap from "colormap";
import { ToggleListSettings } from "./settings";
import { renderEmptyLine } from "src/tlAction";

function drawConnection(state_group: Array<string>, color: string): string {
	let diagram = "";
	const states = state_group.map(renderEmptyLine);
	for (let i = 0; i < states.length - 1; i++) {
		diagram += `"${states[i]}" => "${states[i + 1]}" [color="${color}"];\n`;
	}
	diagram += `"${states[states.length - 1]}" -> "${
		states[0]
	}" [color="${color}"];\n`;
	return diagram;
}

function removeRedundentConnection(scma_text: string) {
	const lines = scma_text.split("\n");
	const line_ary = [...new Set(lines)];
	return line_ary.join("\n");
}

export async function drawDiagram(
	diagram_description: string,
	engine: string = "fdp"
): Promise<string> {
	let modifiedString = diagram_description.replace(/\["\]/g, "['']");
	try {
		const lSVGInAString = smcat.render(modifiedString, {
			outputType: "svg",
			direction: "top-down",
			engine: engine,
		});
		// console.log(lSVGInAString);
		return lSVGInAString;
	} catch (pError) {
		console.error(pError);
		return "";
	}
}
function modifySVG(svg_text: string) {
	let result = svg_text;
	result = result.replace(
		/<g (id="node)/gs,
		`<g class="togglelist_theme" $1`
	);
	return result;
}
function genColorMap(samples: number) {
	const num = samples < 256 ? 256 : samples;
	const colors = colormap({
		colormap: "rainbow-soft",
		nshades: num,
		format: "hex",
		alpha: 0.5,
	});
	return colors;
}

function drawConnectionForSG(state_group: string | any[], statesAry: string | any[], cmdIdx: any){
	const edgeList = [];
	const sgLen = state_group.length;
	let fromIdx =0; let toIdx=0;
	for (let j = 0; j < sgLen - 1; j++) {
		
		for(let k=0;k<statesAry.length;k++){
			if(state_group[j]==statesAry[k])
				fromIdx = k
			if(state_group[j+1]==statesAry[k])
				toIdx = k
		}
		edgeList.push({
			id: `edge${fromIdx}->${toIdx}`,
			fromNode: `${fromIdx}`,
			fromSide: "bottom",
			toNode: `${toIdx}`,
			toSide: "top",
			toEnd: 'arrow',
			color: `${cmdIdx}`
		})
	}
	fromIdx =0; toIdx=0;
	for(let k=0;k<statesAry.length;k++){
		if(state_group[sgLen-1]==statesAry[k])
			fromIdx = k
		if(state_group[0]==statesAry[k])
			toIdx = k
	}
	edgeList.push({
		id: `edge${fromIdx}->${toIdx}`,
		fromNode: `${fromIdx}`,
		fromSide: "bottom",
		toNode: `${toIdx}`,
		toSide: "left",
		toEnd: 'arrow',
		color: `${cmdIdx}`
	})
	return edgeList
}

export async function genDiagramCanvas(
	settings: ToggleListSettings,
	fileName: string
): Promise<void> {
	const colors = genColorMap(settings.cmd_list.length);
	let svg_text = "";
	let text = ``;
	// for(let i = 0; i< settings.cmd_list.length-1;i++){
	// 	const cmd = settings.cmd_list[i]
	// 	const color_idx = (i/settings.cmd_list.length)*256 | 0
	// 	text += `"${cmd.name}" [color="${colors[color_idx]}"],`
	// }
	// let i = settings.cmd_list.length-1
	// let cmd = settings.cmd_list[i]
	// let color_idx = (i/settings.cmd_list.length)*256 | 0
	// text += `"${cmd.name}" [color="${colors[color_idx]}"];\n`
	// console.log(text)
	// svg_text += await drawDiagram(text, 'dot')
	text = ``;
	let transitions: string[] = [];
	// settings.setup_list.forEach((s)=>{transitions.concat(s.states)})

	for (let i = 0; i < settings.cmd_list.length; i++) {
		const cmd = settings.cmd_list[i];
		cmd.bindings.forEach((cmdIdx) => {
			transitions = transitions.concat(
				settings.setup_list[cmdIdx].states
			);
		});
	}
	const statesSet = new Set(transitions);
	const statesAry = Array.from(statesSet)
	const nodes = statesAry.map((text, index) => ({
		id: `${index}`,
		x: index*120,
		y: index * 80,
		width: 150,
		height: 40,
		type: "text",
		text: text.trim(),
	}));
	let edgeList:any[] = []
	for (let i = 0; i < settings.cmd_list.length; i++) {
		const cmd = settings.cmd_list[i];
		cmd.bindings.forEach((cmdIdx) => {
			edgeList = edgeList.concat(drawConnectionForSG(settings.setup_list[cmdIdx].states, statesAry, i))
		});
	}
	await this.app.vault.create(
		fileName,
		JSON.stringify({
			nodes: nodes,
			edges: edgeList,
		})
	);
}

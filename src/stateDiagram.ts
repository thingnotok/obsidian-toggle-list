// @ts-ignore
import colormap from "colormap";
import { ToggleListSettings } from "./settings";
import { renderEmptyLine } from "src/tlAction";

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

function drawConnectionForSG(
	state_group: string | any[],
	statesAry: string | any[],
	cmdIdx: any
) {
	const edgeList = [];
	const sgLen = state_group.length;
	let fromIdx = 0;
	let toIdx = 0;
	for (let j = 0; j < sgLen - 1; j++) {
		for (let k = 0; k < statesAry.length; k++) {
			if (state_group[j] == statesAry[k]) fromIdx = k;
			if (state_group[j + 1] == statesAry[k]) toIdx = k;
		}
		edgeList.push({
			id: `edge${fromIdx}->${toIdx}`,
			fromNode: `${fromIdx}`,
			fromSide: "bottom",
			toNode: `${toIdx}`,
			toSide: "top",
			toEnd: "arrow",
			color: `${cmdIdx}`,
		});
	}
	fromIdx = 0;
	toIdx = 0;
	for (let k = 0; k < statesAry.length; k++) {
		if (state_group[sgLen - 1] == statesAry[k]) fromIdx = k;
		if (state_group[0] == statesAry[k]) toIdx = k;
	}
	edgeList.push({
		id: `edge${fromIdx}->${toIdx}`,
		fromNode: `${fromIdx}`,
		fromSide: "bottom",
		toNode: `${toIdx}`,
		toSide: "left",
		toEnd: "arrow",
		color: `${cmdIdx}`,
	});
	return edgeList;
}

export async function genDiagramCanvas(
	settings: ToggleListSettings,
	fileName: string
): Promise<void> {
	const colors = genColorMap(settings.cmd_list.length);
	let transitions: string[] = [];
	const cmdNodes = [];
	for (let i = 0; i < settings.cmd_list.length; i++) {
		const cmd = settings.cmd_list[i];
		cmd.bindings.forEach((cmdIdx) => {
			transitions = transitions.concat(
				settings.setup_list[cmdIdx].states
			);
		});
		cmdNodes.push({
			id: `cmd${i}`,
			x: i * 200,
			y: -100,
			width: 150,
			height: 40,
			type: "text",
			text: cmd.name,
			color: `${i}`
		});
	}
	const statesSet = new Set(transitions);
	const statesAry = Array.from(statesSet);
	const stateNodes = statesAry.map((state, index) => ({
		id: `${index}`,
		x: index * 120,
		y: index * 80,
		width: 150,
		height: 40,
		type: "text",
		text: state.trim(),
		color: `${-1}`
	}));
	let edgeList: any[] = [];
	for (let i = 0; i < settings.cmd_list.length; i++) {
		const cmd = settings.cmd_list[i];
		cmd.bindings.forEach((cmdIdx) => {
			edgeList = edgeList.concat(
				drawConnectionForSG(
					settings.setup_list[cmdIdx].states,
					statesAry,
					i
				)
			);
		});
	}
	await this.app.vault.create(
		fileName,
		JSON.stringify({
			nodes: cmdNodes.concat(stateNodes),
			edges: edgeList,
		})
	);
}

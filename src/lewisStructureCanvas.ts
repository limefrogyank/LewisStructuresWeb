
import { FASTElement, customElement, attr, html, ref, observable, Observable, when } from '@microsoft/fast-element';
import { PeriodicTableModal } from './periodicTableModal';
import { Vertex } from './vertex';
import { InteractionMode, SettingsService, BondType } from './service/settingsService';
import { provideFluentDesignSystem, fluentButton, fluentTextField, fluentDialog, fluentMenu, fluentMenuItem } from '@fluentui/web-components';
//import * as obm from './kekule/dist/extra/openbabel.js';
//import * as obm2 from './openbabel.js';
import { Kekule } from 'kekule';
import { Button, TextField } from '@fluentui/web-components';
import { obMolToCAN, obMolToInChI, obMolToKekule } from './openBabelStuff';
import { addLonePairsAndRedraw, transformLonePairsAndRedraw } from './redrawing';
import { SVG, extend as SVGextend, Element as SVGElement, Svg } from '@svgdotjs/svg.js'
import '@svgdotjs/svg.draggable.js'
import '@svgdotjs/svg.filter.js'
//import './openbabel.js'
import { Connector } from './connector';
import { BlindOutput, ComparisonOutput, ComparisonResult, CompressedWebworkOutput, IBlindOutput, IComparisonOutput, IComparisonResult, ICompressedWebworkOutput, Position } from './interfaces';
import { LonePair } from './lonePair';
import { mimeTests, samples } from './tests';
import { negativeCircleSvg, positiveCircleSvg } from './svgs';
import { getValence } from './valence';
import { FormalCharge } from './formalCharge';

import { container } from "tsyringe";
//import * as zlib from "zlib";
import {Buffer} from "buffer";
import * as pako from "pako/dist/pako.js";


Kekule;
//k; //loads kekule stuff, prevents tree-shaking.

declare global {
	interface Window {
		//Kekule: Kekule;
		OpenBabelModule(): OpenBabelModule;
	}
}
// if (import.meta.env.MODE === 'development') {
// 	Kekule.environment.setEnvVar('openbabel.scriptSrc', 'http://localhost:5173/src/openbabel.js');
// } else {
// 	Kekule.environment.setEnvVar('openbabel.scriptSrc', 'http://localhost:3000/openbabel.js');
// }

Kekule.environment.setEnvVar('openbabel.scriptSrc', 'https://cdn.jsdelivr.net/gh/limefrogyank/LewisStructuresWeb@latest/dist/openbabel.js');


Kekule.OpenBabel.enable(()=> console.log("OpenBabelModule Loaded!"));
//Kekule.OpenBabel.setModule(OpenBabelModule);
const loadModule = new Promise<void>((resolve,reject)=>{
	waitForModule(resolve);
});
function waitForModule(resolve:()=>void){
	setTimeout(()=>{
		
		if (window.OpenBabelModule !== undefined){
			resolve();
			return;
		} else {
			console.log("OpenBabelModule not loaded yet")
			waitForModule(resolve);
		}
	}, 100);
}

//(window as any).ob = Kekule.OpenBabel;
//(window as any).obm2 = window.OpenBabelModule();
export interface OpenBabelModule {
	//new():OpenBabelModule;
	OBMol: OpenBabelModule.OBMol;
	OBAtom: OpenBabelModule.OBAtom;
	OBBond: OpenBabelModule.OBBond;
	OBOp: OpenBabelModule.OBOp;
	ObConversionWrapper: OpenBabelModule.ObConversionWrapper;
	ObBaseHelper: OpenBabelModule.ObBaseHelper;
	ObConversion_Option_type: any;
	onRuntimeInitialized: () => void;


}
export namespace OpenBabelModule {
	export interface OBOp {
		FindType(type: string): OBOp;
		Do(mol: OBMol, options: string): boolean;
	}
	export interface ObBaseHelper {
		new(mol: OBMol): ObBaseHelper;
		getTitle(): string;
		getDataAt(index: number): any;
		getDataSize(): number;
	}

	export interface ObConversionWrapper {
		new(): ObConversionWrapper;
		setInFormat(mime: string, format: string);
		setOutFormat(mime: string, format: string);
		readString(mol: OBMol, data: string);
		writeString(mol: OBMol, trimWhiteSpace: boolean): string;
		delete(): void;
		addOption(empty: string, option: string, value: string | null): void;

		getSupportedInputFormatsStr(delimiter: string): string;
		getSupportedOutputFormatsStr(delimiter: string): string;

		OUTOPTIONS: string;
	}
	export interface OBMol {
		new(): OBMol;
		//AddAtom(mol:OBMol, atomicNumber:number):number;
		AddHydrogens(atom: OBAtom): boolean;

		GetAtom(index: number): OBAtom;
		GetBond(index: number): OBBond;
		NumAtoms(): number;
		NumBonds(): number;

		NewAtom(): OBAtom;
		NewBond(): OBBond;

	}
	export interface OBAtom {
		GetFormalCharge(): number;
		GetAtomicNum(): number;

		//1 for sp, 2 for sp2, 3 for sp3, 4 for sq. planar, 5 for trig. bipy, 6 for octahedral
		GetHyb(): number;
		SetAtomicNum(atomicNumber: number): void;
		SetHybAndGeom(hy: number): boolean;
		AddBond(bond: OBBond): void;
	}
	export interface OBBond {
		SetBegin(atom: OBAtom): void;
		SetEnd(atom: OBAtom): void;
		SetBondOrder(order: number): void;
	}
}



PeriodicTableModal;

provideFluentDesignSystem()
	.register(fluentButton())
	.register(fluentTextField())
	.register(fluentDialog())
	.register(fluentMenu())
	.register(fluentMenuItem());


//raph;


const template = html<LewisStructureCanvas>`  
 
<fluent-design-system-provider use-defaults>
<style>
.eventless{
	pointer-events:none;
}
g:focus{
	outline: none;
}
g:focus-visible{
	outline: -webkit-focus-ring-color auto 5px;
}
</style>
${when(x => !x.readonly, html<LewisStructureCanvas>`
	<div role="toolbar" ${ref("toolbarDiv")} style="display:flex;flex-wrap:wrap;" aria-label="Toolbar with button groups">

		<div style="display:flex;margin-right:5px;">
			<fluent-button appearance="accent" id='draw' class="toolButton">Draw</fluent-button>
			<fluent-button appearance="outline" id='move' class="toolButton">Move</fluent-button>
			<fluent-button appearance="outline" id='erase' class="toolButton">Erase</fluent-button>
		</div>

		<div style="display:flex;margin-right:5px;" class="btn-group me-2" role="group" >
			<fluent-button apearance="outline" class="elementButton" ${ref("periodicTableButton")} 
				@click="${(x, c) => { x.visibleElementSelector = !x.visibleElementSelector; }}"
				aria-label="Element Selector">
				Element Select
			</fluent-button>
			<fluent-text-field ${ref("elementTextField")} size="1" class="elementButton" readonly value="${x => x.settingsService.currentElement}"></fluent-text-field>
		</div>

		<div style="display:flex;margin-right:5px;" class="btn-group me-2" role="group" aria-label="Electrons button group">

			<fluent-button appearance="accent" id='single' class="electronButton" aria-label="Single Bond">
				<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M 0.17263349,14.53574 14.604793,0.1035801 15.968598,1.4673847 1.5019114,15.934071 Z"
					/>
				</svg>
			</fluent-button>
			<fluent-button appearance="outline" id='double' class="electronButton" aria-label="Double bond">
				<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M 0.11187782,11.695577 11.678321,0.09460633 13.042126,1.4584109 1.4411558,13.093908 Z"
					/>
					<path
						d="M 2.9948582,14.526764 14.561301,2.9257944 15.925106,4.289599 4.3241362,15.925096 Z"
					/>
				</svg>
			</fluent-button>
			<fluent-button appearance="outline" id='triple' class="electronButton" aria-label="Triple bond">
				<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M 0.11187782,10.418089 10.400833,0.09460636 11.764638,1.4584109 1.4411558,11.81642 Z"
					/>
					<path
						d="M 2.2180078,12.472426 12.506963,2.1489436 13.870768,3.5127482 3.5472858,13.870757 Z"
					/>
					<path
						d="M 4.2550831,14.544028 14.544038,4.2205455 15.907843,5.5843501 5.5843611,15.942359 Z"
					/>
				</svg>
			</fluent-button>
			<fluent-button appearance="outline" id='dashed' class="electronButton" aria-label="Dashed wedge bond">
				<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
					<path
						d="m 0.1009346,15.919433 2.0063376,-2.93919 0.9546284,0.952815 z" />
					<path
						d="M 3.2398821,11.397603 4.6475544,12.8026 6.1523075,11.75289 4.2430508,9.847261 Z" />
					<path
						d="M 7.7703217,10.68703 5.29476,8.2161722 6.4435501,6.520486 9.4692364,9.5404225 Z" />
					<path
						d="M 7.802682,4.55026 11.443214,8.1838735 12.883247,7.0695653 8.8220309,3.0160676 Z" />
					<path
						d="M 9.943689,1.3810679 14.553003,5.9903821 15.899544,5.092688 10.806856,2.3870958e-7 Z"/>
				</svg>
			</fluent-button>
			<fluent-button appearance="outline" id='solid' class="electronButton" aria-label="Solid wedge bond">
				<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
					<path
					d="M 0.10358009,15.916808 10.841383,0.0345267 15.899544,5.092688 Z"
					/>
				</svg>
			</fluent-button>
			<fluent-button appearance="outline" id='lonePair' class="electronButton" aira-label="Lone pair electrons">
				<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
					<circle
						r="2.3132887"
						cy="7.7685075"
						cx="4.1086769"
						id="path2067"
							/>
						<circle
						id="path2067-4"
						cx="12.153398"
						cy="7.6994534"
						r="2.3132887" />
				</svg>
			</fluent-button>
			<fluent-button appearance="outline" id='positive' class="electronButton" aria-label="Positive Formal Charge"
				:innerHTML="${x => positiveCircleSvg}">		
			</fluent-button>
			<fluent-button appearance="outline" id='negative' class="electronButton" aria-label="Negative Formal Charge" 
				:innerHTML="${x => negativeCircleSvg}">				
			</fluent-button>
		</div>

		${when(x => x.debug, html<LewisStructureCanvas>`
		<div style="display:flex;margin-right:5px;" role="group" >
			<fluent-button appearance="${x => x.settingsService.readAloudAtoms ? "accent" : "outline"}" class="readAloudButton" ${ref("readAloudButton")} aria-label="Read aloud toggle">
				🔊&#xFE0E;
			</fluent-button>
		</div>
		`)}
	</div>
	`)}
	<div id='svgContainer' ${ref("svgContainer")} style='width:${x => x.width}px;height:${x => x.height}px;border:black solid 1px;user-select:none;pointer-events:${x => x.readonly ? "none" : "auto"}'>

	</div>
	
	<periodic-table-modal 
		@change="${(x, c) => {
		x.settingsService.setElement((c.event as CustomEvent).detail);
		x.dismissPeriodicTable();
	}}"
		visible="${x => x.visibleElementSelector}" 
		@dismiss="${x => x.dismissPeriodicTable()}"
	>
	</periodic-table-modal>
${when(x => x.debug, html<LewisStructureCanvas>`
	<div role="toolbar" style="display:flex;flex-wrap:wrap;" aria-label="Toolbar with button groups">
		<div style="display:flex;margin-right:5px;">
			<fluent-button appearance="outline" @click="${async x => console.log(await x.compareMoleculeAsync())}">Compare</fluent-button>
			<fluent-button appearance="outline" @click="${x => console.log(x.getMolMime())}">Get MMime</fluent-button>
			<fluent-button appearance="outline" @click="${x => console.log(x.getKekuleMime())}">Get KMime</fluent-button>
			
			<fluent-button appearance="outline" @click="${x => x.compareMoleculeAsync2(x.smiles)}" >Check Molecule</fluent-button>
			<fluent-button appearance="outline" @click="${x => x.runTestsAsync()}">Run Tests</fluent-button>
			<fluent-button appearance="outline" @click="${x => x.loadOne()}">Load One</fluent-button>
		</div>
	</div>

<textarea >
${x => x.debugString}
</textarea>
`)}
</fluent-design-system-provider>
`;

// const unusedPiece = html<LewisStructureCanvas>`
// <fluent-button apearance="neutral" class="menuButton" ${ref("menuButton")} aria-label="Menu Button">
// ***
// </fluent-button>
// <div style="position: relative; width: 0; height: 0">
// 	<fluent-menu style="position:absolute;top:20px;height:max-content;width:max-content;z-index:1000;">
// 		<fluent-menu-item>Menu item 1</fluent-menu-item>
// 		<fluent-menu-item>Menu item 2</fluent-menu-item>
// 		<fluent-menu-item>Menu item 3</fluent-menu-item>
// 	</fluent-menu>
// </div>`;

// declare module 'fabric' {
// 	export namespace fabric {
// 		export interface ICanvasOptions {
// 			enablePointerEvents: boolean;
// 		}
// 		export interface Canvas {
// 			enablePointerEvents: boolean;
// 		}
// 	}
// }

//export var settingsService : SettingsService;
//settingsService.test = "setting new text";


//obm;
//(window as any).OpenBabelModule = obm;



// hack to make this work!
//let s = window.setInterval(()=>{
//console.log(window.OpenBabelModule);
// if (window.OpenBabelModule !== undefined){
// 	if (mod.OBMol !== undefined){
// 		let mod = window.OpenBabelModule();
// 		(window as any).mod = mod;
// 		let mol = new mod.OBMol();
// 		(window as any).mol = mol;
// 		window.clearInterval(s);
// 	}
// }
//}, 200);

@customElement({
	name: 'lewis-structure-canvas',
	template,
	shadowOptions: { mode: 'open' }
})
export class LewisStructureCanvas extends FASTElement {
	@attr height: number = 400;
	@attr width: number = 400;

	@attr visibleElementSelector: boolean = false;

	@observable debugString: string = "";
	@attr smiles: string;  // DEPRECATED - NOT USED ANYMORE
	@attr mol: string|null = null;
	@attr({ mode: 'boolean' }) readonly: boolean = false;

	@attr({mode:'boolean', attribute: 'explicit-lone-pairs'}) explicitLonePairs: boolean = false;
	@attr({ mode: 'boolean', attribute: 'show-formal-charges'}) useFormalCharge: boolean = false;
	@attr({ mode: 'boolean', attribute: 'flat'}) noPerspective: boolean = false;

	debug: boolean = false;

	periodicTableButton: HTMLButtonElement;
	periodicTableModal: PeriodicTableModal;
	//mainCanvas: HTMLCanvasElement;
	svgContainer: HTMLDivElement;
	settingsService: SettingsService = new SettingsService();
	elementTextField: TextField;
	keyboardDiv: HTMLDivElement;

	menuButton: HTMLButtonElement;
	readAloudButton: HTMLButtonElement;

	mainModal: HTMLDivElement;
	toolbarDiv: HTMLDivElement; //using for measuring canvas width

	molecule: Kekule.Molecule | null;

	mainSVG: Svg;


	public dismissPeriodicTable() {
		let s = SVG();

		this.visibleElementSelector = false;
		this.periodicTableButton.focus();
	}

	constructor() {
		super();

		//this.settingsService = new SettingsService();
		//settingsService = this.settingsService;
		this.molecule = new Kekule.Molecule();

	}

	public async loadMoleculeUsingSmilesAsync(smiles: string) {
		let tempKekuleMolecule = await this.loadSmilesAsync(smiles);
		addLonePairsAndRedraw(tempKekuleMolecule, { useFlat: false, showFormalCharges: this.useFormalCharge });
		this.clearMolecule();
		this.molecule = this.drawMolecule(tempKekuleMolecule, this.mainSVG, true);
	}

	public async loadMoleculeUsingMolAsync(molFile: string, generateCoords: boolean = false) {
		if (generateCoords){
			const kekule = await new Promise<Kekule.Molecule>((resolve, reject) => {
				//console.log("running load smiles!");
				let openBabel = window.OpenBabelModule();
				openBabel.onRuntimeInitialized = () => {
					//console.log("INitialized!");
					(window as any).ob = openBabel;
	
					let mol = new openBabel.OBMol();
					let conv = new openBabel.ObConversionWrapper();
					conv.setInFormat('', "mol");
					conv.readString(mol, molFile);
	
	
					let gen = openBabel.OBOp.FindType('gen2D');
					gen.Do(mol, '');
	
					let result = new Kekule.Molecule();
					obMolToKekule(openBabel, mol, result, null);
	
					resolve(result);
				};
			});
			if (this.explicitLonePairs){
				transformLonePairsAndRedraw(kekule, { useFlat: false, showFormalCharges: this.useFormalCharge });
			} else {
				addLonePairsAndRedraw(kekule, { useFlat: false, showFormalCharges: this.useFormalCharge });
			}
			this.clearMolecule();
			this.molecule = this.drawMolecule(kekule, this.mainSVG, true);
		} else {

		}
		
	}

	public async loadOne() {
		this.molecule = new Kekule.Molecule();
		let tempKekuleMolecule = await this.loadSmilesAsync('[CH3-]');
		addLonePairsAndRedraw(tempKekuleMolecule, { useFlat: false, showFormalCharges: this.useFormalCharge });
		this.clearMolecule();
		this.molecule = this.drawMolecule(tempKekuleMolecule, this.mainSVG, true);
	}

	public async runTestsAsync() {
		for (const mimeTest of mimeTests) {
			this.molecule = new Kekule.Molecule();
			let tempKekuleMolecule = await this.loadSmilesAsync(mimeTest.smiles);
			addLonePairsAndRedraw(tempKekuleMolecule, { useFlat: false, showFormalCharges: this.useFormalCharge });
			this.clearMolecule();
			this.molecule = this.drawMolecule(tempKekuleMolecule, this.mainSVG, true);
			let testIndex = 0;
			for (const unitTest of mimeTest.tests) {
				const moleculeToCompareWith = Kekule.IO.loadMimeData(unitTest.tryMatchWith, 'chemical/x-kekule-json');
				const result = this.compareStructure(this.molecule, moleculeToCompareWith);
				for (const key in result) {
					if (typeof result[key] !== "object") {
						if (result[key] !== unitTest.result[key]) {
							console.error(`%c KEY: ${key}`, `color: red;`);
							console.error(`%c Test failed for ${mimeTest.smiles} and ${unitTest.tryMatchWith}`, `color: red;`);
							console.error(`%c Expected ${unitTest.result[key]} but got ${result[key]}`, `color: red;`);
							console.error(unitTest.result);
							console.error(result);
							console.error("%c Test Index: " + testIndex, `color: red;`);
							break;
						}
					}
				}
				const badNodes = this.checkDashWedgeBonds(moleculeToCompareWith);
				if (badNodes.length > 0 && unitTest.perspectiveTest.pass) {
					console.error(`%cFor ${mimeTest.smiles}, index=${testIndex}, ${badNodes.length} node(s) did not have perspective drawn correctly.`, `color: red;`);
					console.error(badNodes);
				} else if (badNodes.length === 0 && !unitTest.perspectiveTest.pass) {
					console.warn(`For ${mimeTest.smiles}, index=${testIndex}, molecule should have failed the perspective test, but did not. `);
				}
				testIndex++;
			}


			//const compareResult = await this.compareMoleculeAsync(sample);
			let mime = Kekule.IO.saveMimeData(this.molecule, 'chemical/x-kekule-json');
			let svg = this.getSVG();
			let smiles = Kekule.IO.saveFormatData(this.molecule, 'smi');
			this.debugString += await this.exportCanonicalSmilesAsync(this.molecule);
			this.debugString += "\n\n";
		}
	}

	public async getCompressedWebworkOutputAsync(): Promise<ICompressedWebworkOutput> {
		if (this.molecule == null) {
			return new CompressedWebworkOutput({ programError: "No structure has been loaded." });
		}
		// Sometimes openBabel will add extra hydrogens when converting mol to smiles because of formal charges and valence rules
		// However, adding this explicit atoms option will create non-standard SMILES.  i.e. [NH4+] will output as [H][N+]([H])([H])[H]
		// So, we should check that the number of atoms is the same before and after conversion.  If not, add the option and redo the conversion.

		// let smiles = await this.exportCanonicalSmilesAsync(this.molecule);
		// if (smiles == null || smiles == "") {
		// 	return new CompressedWebworkOutput({ empty: true, programError: "Structure does not correspond to correct any valid structure." });
		// }

		// // create kekule structure for smiles determined and verify it has the same number of atoms, otherwise redo conversion with explicit atoms
		// let tempKekuleMolecule = await this.loadSmilesAsync(smiles);
		// if (tempKekuleMolecule.getNodeCount() !== this.molecule.getNodeCount()) {
		// 	smiles = await this.exportCanonicalSmilesAsync(this.molecule, true);
		// 	tempKekuleMolecule = await this.loadSmilesAsync(smiles);
		// }


		const output: ICompressedWebworkOutput = new CompressedWebworkOutput({perspectiveCorrect:true});
		const badNodes = this.checkDashWedgeBonds(this.molecule);
		if (badNodes.length > 0) {
			output.programError = "Perspective is not drawn correctly.";
			output.perspectiveCorrect = false;
			//output.perspectiveErrorAtom = badNodes.map(x => x.symbol);
		}
		// store original kekule structure as mime
		let rawkekule = this.getKekuleMime();
		let input = Buffer.from(rawkekule);
		let compressed = await new Promise<string>(
			(resolve, reject) => {
				const output :Uint8Array = pako.deflate(input);
				var len = output.byteLength;
				let binary = '';
				for (var i = 0; i < len; i++) {
					binary += String.fromCharCode( output[ i ] );
				}
				resolve(window.btoa( binary ));
			
				
			}
		);
		output.kekuleMimeCompressed = compressed;

		let json = JSON.parse(rawkekule);
		delete json["coordPos2D"];
		delete json["coordPos3D"];
		delete json["renderOptions"];
		delete json["parity"];
		if (json.hasOwnProperty("ctab")){
			for (const node of json["ctab"]["nodes"]){
				delete node["coordPos2D"];
				delete node["coordPos3D"];
				delete node["coord2D"];
				if (node["attachedMarkers"]){
					for (const markers of node["attachedMarkers"]){
						delete markers["coordPos2D"];
						delete markers["coordPos3D"];
						delete markers["isAttachedToParent"];
						delete markers["coord2D"];
						delete markers["parity"];
					}
				}
			}
			for (const connector of json["ctab"]["connectors"]){
				delete connector["coordPos2D"];
				delete connector["coordPos3D"];
				delete connector["coord2D"];
				delete connector["parity"];
				delete connector["isInAromaticRing"];
			}
		}
		delete json["anchorNodes"];
		

		output.simpleKekule = JSON.stringify(json);
		// console.log(LZ77);
		// // store original svg
		// let compressed2 = LZ77.compress(this.getSVG()); 
		// console.log("DONE COMPRESSING");
		// console.log(compressed2);
		// //output.svg = compressed2;
		// console.log(output);
		return output;
	}

	public async getBlindOutputAsync(): Promise<IBlindOutput> {
		if (this.molecule == null) {
			return new BlindOutput({ programError: "No structure has been loaded." });
		}
		// Sometimes openBabel will add extra hydrogens when converting mol to smiles because of formal charges and valence rules
		// However, adding this explicit atoms option will create non-standard SMILES.  i.e. [NH4+] will output as [H][N+]([H])([H])[H]
		// So, we should check that the number of atoms is the same before and after conversion.  If not, add the option and redo the conversion.

		let smiles = await this.exportCanonicalSmilesAsync(this.molecule);
		if (smiles == null || smiles == "") {
			return new BlindOutput({ empty: true, programError: "Structure does not correspond to correct any valid structure." });
		}

		// create kekule structure for smiles determined and verify it has the same number of atoms, otherwise redo conversion with explicit atoms
		let tempKekuleMolecule = await this.loadSmilesAsync(smiles);
		if (tempKekuleMolecule.getNodeCount() !== this.molecule.getNodeCount()) {
			smiles = await this.exportCanonicalSmilesAsync(this.molecule, true);
			tempKekuleMolecule = await this.loadSmilesAsync(smiles);
		}

		// unused, but maybe useful in the future.  
		const inchi = await this.exportInChIAsync(this.molecule);

		const mol = await this.exportMolAsync(this.molecule);

		const output: IBlindOutput = new BlindOutput({ smiles: smiles, inchi: inchi, mol: mol });
		const badNodes = this.checkDashWedgeBonds(this.molecule);
		if (badNodes.length > 0) {
			output.programError = "Perspective is not drawn correctly.";
			output.perspectiveCorrect = false;
			output.perspectiveErrorAtom = badNodes.map(x => x.symbol);
		}
		// store original kekule structure as mime
		output.kekuleMime = this.getKekuleMime();
		// store original svg
		output.svg = this.getSVG();
		// count atoms
		output.atomNums = this.molecule.nodes.filter(x=>x instanceof Kekule.Atom).map(x => (x as Kekule.Atom).atomicNumber);

		// add lone pairs, and compare with original
		addLonePairsAndRedraw(tempKekuleMolecule, { useFlat: false, showFormalCharges: this.useFormalCharge });
		const comparisonResult = this.compareStructure(this.molecule, tempKekuleMolecule);
		output.blindComparisonResult = ComparisonResult.toStringOutput(comparisonResult);
		if (output.blindComparisonResult.lonePairCountError) {
			if (output.programError !== "") {
				output.programError += "\n";
			}
			output.programError += "Lone pairs are not drawn correctly.";
		}

		return output;
	}



	public checkPerspective(): boolean {
		if (this.molecule == null) {
			return false;
		}
		const badNodes = this.checkDashWedgeBonds(this.molecule);
		if (badNodes.length > 0) {
			return false;
		}
		return true;
	}

	public async compareMoleculeAsync(): Promise<IComparisonOutput> {
		if (this.molecule == null) {
			return new ComparisonOutput({ empty: true });
		}
		if (this.smiles == "" || this.smiles == null) {
			return new ComparisonOutput({ programError: "Missing SMILES to compare molecule to." });
		}

		let output: IComparisonOutput = new ComparisonOutput({ smiles: this.smiles });

		let molToCompareWith = await this.loadSmilesAsync(this.smiles); //Kekule.IO.loadFormatData(smiles, "chemical/x-daylight-smiles");
		addLonePairsAndRedraw(molToCompareWith, { useFlat: false, showFormalCharges: this.useFormalCharge });
		
		output.comparisonResult = ComparisonResult.toStringOutput(this.compareStructure(this.molecule, molToCompareWith));

		const badNodes = this.checkDashWedgeBonds(this.molecule);
		if (badNodes.length > 0) {
			output.perspectiveCorrect = false;
			output.perspectiveErrorAtom = badNodes.map(x => x.symbol);
		}

		return output;
	}

	public async getMolecule(): Promise<string> {
		if (this.molecule == null) {
			return "";
		}
		//let res = await this.loadSmilesAsync('CC');

		let index = 1;
		let res = await this.loadSmilesAsync(samples[index]);
		console.log(res);
		let clone = res.clone();
		addLonePairsAndRedraw(clone, { useFlat: false, showFormalCharges: this.useFormalCharge });
		console.log(clone);
		this.molecule = this.drawMolecule(clone, this.mainSVG, true);

		let compareResult = await this.compareMoleculeAsync2(samples[index]);
		console.log(`They match?  ${compareResult}`);
		//Kekule.IO.loadFormatData

		let mime = Kekule.IO.saveMimeData(this.molecule, 'chemical/x-kekule-json');

		let svg = this.getSVG();
		return mime;
	}

	private verifyElectronCount(): boolean {
		if (this.molecule == null) {
			return false;
		}
		let atoms = this.molecule.nodes.filter(x => x instanceof Kekule.Atom).map(x => x as Kekule.Atom);
		let lonePairElectrons = 0;
		for (const atom of atoms) {
			const lonePairs = atom.getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet);
			lonePairElectrons += lonePairs.length * 2;
		}
		let bonds = this.molecule.connectors.filter(x => x instanceof Kekule.Bond).map(x => x as Kekule.Bond);
		let bondElectrons = 0;
		for (const bond of bonds) {
			bondElectrons += bond.bondOrder * 2;
		}

		let electronCount = 0;
		for (const atom of atoms) {
			electronCount += getValence(atom); // atom.getValence({ignoreCharge: true});
		}

		//while the getValence function adjusts the valence based on the charge, it won't account for whether a lone pair 
		//is present or not.  So, instead we ignore the charge and add or subtract electrons manually. (just like how we teach!)

		for (const atom of atoms) {
			const charges = atom.getMarkersOfType(Kekule.ChemMarker.Charge);
			for (const charge of charges) {
				electronCount -= charge.value;  //negative charge adds an electron
			}
		}

		return electronCount === (lonePairElectrons + bondElectrons);
	}

	private async getSMILESAsync() {
		if (this.molecule == null) {
			return "empty";
		}
		if (!this.verifyElectronCount()) {
			console.warn("Not a valid Lewis structure");
			return "invalid";
		}
		let smiles = await this.exportCanonicalSmilesAsync(this.molecule);
		return smiles;
	}

	public getKekuleMime() {
		if (this.molecule == null) {
			return "";
		}
		let mime = Kekule.IO.saveMimeData(this.molecule, 'chemical/x-kekule-json');
		return mime;
	}

	public getMolMime() {
		if (this.molecule == null) {
			return "";
		}
		let mime = Kekule.IO.saveMimeData(this.molecule, 'chemical/x-mdl-molfile');
		console.log(mime);
		return mime;
	}

	public loadKekule(kekule: string) {
		this.molecule = Kekule.IO.loadMimeData(kekule, 'chemical/x-kekule-json');
		this.drawMolecule(this.molecule, this.mainSVG, true);
	}

	public loadKekuleCompressed(kekuleCompressed: string) {
		let compressed = window.atob(kekuleCompressed);
		let input = new Uint8Array(compressed.length);
		for (let i = 0; i < compressed.length; i++) {
			input[i] = compressed.charCodeAt(i);
		}
		const output :Uint8Array = pako.inflate(input);
		const kekule = new TextDecoder().decode(output);
		this.molecule = Kekule.IO.loadMimeData(kekule, 'chemical/x-kekule-json');
		this.drawMolecule(this.molecule, this.mainSVG, true);
	}

	// Adapted from https://stackoverflow.com/a/58142441/1938624
	public async getImageAsync(){
		const imgData = await this.svgToPngAsync(this.mainSVG.svg());
		return imgData;
	}

	private async svgToPngAsync(svg) {
		const url = this.getSvgUrl(svg);
		const imgData = await this.svgUrlToPngAsync(url);
		URL.revokeObjectURL(url);
		return imgData;
	}

	private getSvgUrl(svg) {
		return  URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
	}
	private svgUrlToPngAsync(svgUrl) {
		const svgImage = document.createElement('img');
		// imgPreview.style.position = 'absolute';
		// imgPreview.style.top = '-9999px';
		document.body.appendChild(svgImage);
		const promise = new Promise((resolve, reject) => {
			svgImage.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = svgImage.clientWidth;
				canvas.height = svgImage.clientHeight;
				const canvasCtx = canvas.getContext('2d');
				if (canvasCtx == null){
					reject("canvasCtx is null");
				} else {
					canvasCtx.drawImage(svgImage, 0, 0);
					const imgData = canvas.toDataURL('image/webp', 0.1);
					resolve(imgData);
				}
				// document.body.removeChild(imgPreview);
			};
		});
		svgImage.src = svgUrl;
		return promise;
		
	 }

	private loadSmilesAsync(smiles: string): Promise<Kekule.Molecule> {
		return new Promise<Kekule.Molecule>((resolve, reject) => {
			//console.log("running load smiles!");
			let openBabel = window.OpenBabelModule();
			openBabel.onRuntimeInitialized = () => {
				//console.log("INitialized!");
				(window as any).ob = openBabel;

				let mol = new openBabel.OBMol();
				let conv = new openBabel.ObConversionWrapper();
				conv.setInFormat('', "smi");
				conv.readString(mol, smiles);


				let gen = openBabel.OBOp.FindType('gen2D');
				gen.Do(mol, '');

				let atomNum = mol.NumAtoms(); //without explicit hydrogens
				for (let i = 0; i < atomNum; i++) {
					let atom = mol.GetAtom(i + 1); //non-zero index
					mol.AddHydrogens(atom);
				}
				let result = new Kekule.Molecule();
				obMolToKekule(openBabel, mol, result, null);

				resolve(result);
			};
		});
	}

	private exportCanonicalSmilesAsync(molecule: Kekule.Molecule, outputExplicitHydrogensAsSuch:boolean=false): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			// We need to create a copy of the molecule and add correct formal charges based on explicit hydrogens and other atoms.
			// If we don't do this, drawing a single carbon atom will result in a SMILES of C instead of [C-4].

			const clone = molecule.clone();
			clone.nodes.forEach(node => {
				const atom = node as Kekule.Atom;
				const lonePairCount = atom.getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet).length;
				const bondOrderTotal = atom.getLinkedBonds().reduce((acc, bond) => acc + bond.bondOrder, 0);
				// if less than octet and greater than boron, add charge
				if (atom.atomicNumber > 5){
					const charge = getValence(atom) - (lonePairCount * 2 + bondOrderTotal);
					if (charge !== 0) {
						atom.setCharge(charge);
					}
				}
			});

			let molFile = Kekule.IO.saveMimeData(clone, 'chemical/x-mdl-molfile');
			let openBabel = window.OpenBabelModule();
			openBabel.onRuntimeInitialized = () => {
				//console.log("INitialized!");
				(window as any).ob = openBabel;

				let mol = new openBabel.OBMol();
				let conv = new openBabel.ObConversionWrapper();
				conv.setInFormat('', "mol");
				conv.readString(mol, molFile);

				
				const can = obMolToCAN(openBabel, mol, outputExplicitHydrogensAsSuch);

				resolve(can);
			};
		});
	}

	private exportInChIAsync(molecule: Kekule.Molecule): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let molFile = Kekule.IO.saveMimeData(molecule, 'chemical/x-mdl-molfile');
			let openBabel = window.OpenBabelModule();
			openBabel.onRuntimeInitialized = () => {
				//console.log("INitialized!");
				(window as any).ob = openBabel;

				let mol = new openBabel.OBMol();
				let conv = new openBabel.ObConversionWrapper();
				conv.setInFormat('', "mol");
				conv.readString(mol, molFile);

				const can = obMolToInChI(openBabel, mol);

				resolve(can);
			};
		});
	}

	private exportMolAsync(molecule: Kekule.Molecule): Promise<string> {
		let molFile = Kekule.IO.saveMimeData(molecule, 'chemical/x-mdl-molfile');
		return Promise.resolve(molFile);
	}

	public getSVG(): string {
		//let svg = this.mainSVG.node.outerHTML;
		//const copy = this.mainSVG.clone();
		let svg = this.mainSVG.svg((node)=>{
			//console.log(node);
			if (node.hasClass('interactive')){
				//console.log('found one to remove');
				node.remove();
			}
			if (node.type =="feGaussianBlur" || node.type == "filter"){
				//console.log('found one to remove2');
				node.remove();
			}
			if (node.node.hasAttribute('svgjs:data')){
				node.node.removeAttribute('svgjs:data');
			}
		});
		
		return svg;
	}

	public async compareMoleculeAsync2(smiles: string): Promise<boolean> {
		if (this.molecule == null) {
			return false;
		}
		//console.log(smiles);
		let molToCompareWith = await this.loadSmilesAsync(smiles); //Kekule.IO.loadFormatData(smiles, "chemical/x-daylight-smiles");
		addLonePairsAndRedraw(molToCompareWith, { useFlat: false, showFormalCharges: this.useFormalCharge });
		//console.log('Loaded');
		//console.log(this.molecule);
		//console.log(molToCompareWith);
		//console.log(this.molecule.nodes.map(v=> (v as Kekule.Atom).atomicNumber));
		//console.log(molToCompareWith.nodes.map(v=> (v as Kekule.Atom).atomicNumber))
		//const result2 = this.molecule.equalStructure(molToCompareWith, { 'level': 4,clearHydrogens: false });  // this gives structure only
		//console.log("OK initial result: " + result2);
		let result = this.compareStructure(this.molecule, molToCompareWith);
		//console.log(result);

		//console.log("OK");
		return true;

	}

	private checkDashWedgeBonds(mol: Kekule.Molecule): Kekule.Atom[] {
		// If done badly, the compareStructure function will mark stereochemistry wrong regardless.
		// However, ammonia is accepted by the compareStructure function as correct whether you
		// use three regular single bonds or 1 dash, 1 wedge, and 1 plain bond.  
		// So, we need to check for this case if enforcement of perspective drawing is needed.  
		let atoms = mol.nodes.filter(v => v instanceof Kekule.Atom) as Kekule.Atom[];
		const badStereoNodes: Kekule.Atom[] = [];
		for (const atom of atoms) {
			const bonds = atom.getLinkedBonds();
			const lonePairs = atom.getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet);
			switch (bonds.length + lonePairs.length) {
				case 0:  // maybe a cation?
				case 1:  // maybe a plain He atom?
				case 2:
				case 3:
					break;
				case 4:
					if (bonds.length <= 2) {
						break;
					} else {
						if (bonds.length == 3) {
							if (bonds.filter(x => x.stereo == Kekule.BondStereo.NONE).length == 1
								&& bonds.filter(x => x.stereo == Kekule.BondStereo.UP).length == 1
								&& bonds.filter(x => x.stereo == Kekule.BondStereo.DOWN).length == 1) {
								break;
							} else {
								badStereoNodes.push(atom);
								break;
							}
						} else if (bonds.length == 4) {
							// two scenarios: 1) two simple, 1 dash, 1 wedge
							//               2) two dash and two wedge
							if ((bonds.filter(x => x.stereo == Kekule.BondStereo.NONE).length == 2
								&& bonds.filter(x => x.stereo == Kekule.BondStereo.UP).length == 1
								&& bonds.filter(x => x.stereo == Kekule.BondStereo.DOWN).length == 1)
								||
								(bonds.filter(x => x.stereo == Kekule.BondStereo.UP).length == 2
									&& bonds.filter(x => x.stereo == Kekule.BondStereo.DOWN).length == 2)) {
								break;
							} else {
								badStereoNodes.push(atom);
								break;
							}
						} else {
							break;
						}
					}
				case 5:
					if (bonds.length <= 3) {
						break;
					} else {
						if (bonds.length == 4) {
							if (bonds.filter(x => x.stereo == Kekule.BondStereo.NONE).length == 2
								&& bonds.filter(x => x.stereo == Kekule.BondStereo.UP).length == 1
								&& bonds.filter(x => x.stereo == Kekule.BondStereo.DOWN).length == 1) {
								break;
							} else {
								badStereoNodes.push(atom);
								break;
							}
						} else if (bonds.length == 5) {
							if (bonds.filter(x => x.stereo == Kekule.BondStereo.NONE).length == 3
								&& bonds.filter(x => x.stereo == Kekule.BondStereo.UP).length == 1
								&& bonds.filter(x => x.stereo == Kekule.BondStereo.DOWN).length == 1) {
								break;
							} else {
								badStereoNodes.push(atom);
								break;
							}
						} else {
							break;
						}
					}
				case 6:
					if (bonds.length <= 3) {
						break;
					} else {
						if (bonds.length == 4) {
							// two scenarios: 4 simple or  2 dash, 2 wedge 
							if ((bonds.filter(x => x.stereo == Kekule.BondStereo.NONE).length == 4)
								||
								(bonds.filter(x => x.stereo == Kekule.BondStereo.UP).length == 2
									&& bonds.filter(x => x.stereo == Kekule.BondStereo.DOWN).length == 2)) {
								break;
							} else {
								badStereoNodes.push(atom);
								break;
							}
						} else if (bonds.length == 5) {
							// three scenarios: 4 simple + 1 dash, 4 simple + 1 wedge,  or  2 dash + 2 wedge + 1 simple
							if ((bonds.filter(x => x.stereo == Kekule.BondStereo.NONE).length == 4
								&& bonds.filter(x => x.stereo == Kekule.BondStereo.UP).length == 1)
								||
								(bonds.filter(x => x.stereo == Kekule.BondStereo.NONE).length == 4
									&& bonds.filter(x => x.stereo == Kekule.BondStereo.DOWN).length == 1)
								||
								(bonds.filter(x => x.stereo == Kekule.BondStereo.UP).length == 2
									&& bonds.filter(x => x.stereo == Kekule.BondStereo.DOWN).length == 2
									&& bonds.filter(x => x.stereo == Kekule.BondStereo.NONE).length == 1)) {
								break;
							} else {
								badStereoNodes.push(atom);
								break;
							}
						} else if (bonds.length == 6) {
							if ((bonds.filter(x => x.stereo == Kekule.BondStereo.UP).length == 2
								&& bonds.filter(x => x.stereo == Kekule.BondStereo.DOWN).length == 2
								&& bonds.filter(x => x.stereo == Kekule.BondStereo.NONE).length == 2)
								||
								(bonds.filter(x => x.stereo == Kekule.BondStereo.UP).length == 1
									&& bonds.filter(x => x.stereo == Kekule.BondStereo.DOWN).length == 1
									&& bonds.filter(x => x.stereo == Kekule.BondStereo.NONE).length == 4)) {
								break;
							} else {
								badStereoNodes.push(atom);
								break;
							}
						} else {
							break;
						}
					}
				default:
					break;
			}
		}
		return badStereoNodes;
	}

	private compareStructure(mol1: Kekule.Molecule, mol2: Kekule.Molecule): IComparisonResult<Kekule.Atom, Kekule.Bond> {
		let m1 = mol1.clone();
		let m2 = mol2.clone();
		//m1.setCanonicalizationIndex(null);
		//m2.setCanonicalizationIndex(null);
		m1 = Kekule.canonicalizer.canonicalize(m1, null);
		m2 = Kekule.canonicalizer.canonicalize(m2, null);
		m1 = Kekule.MolStandardizer.standardize(m1, { clearHydrogens: false });
		m2 = Kekule.MolStandardizer.standardize(m2, { clearHydrogens: false });
		//console.log("after standardizing");
		//console.log(m1.nodes.map(v=> (v as Kekule.Atom).atomicNumber));
		//console.log(m2.nodes.map(v=> (v as Kekule.Atom).atomicNumber))
		let options = {
			doStandardize: false,
			extraComparisonProperties: ['canonicalizationIndex', 'bondOrder'],
			method: Kekule.ComparisonMethod.CHEM_STRUCTURE,
			clearHydrogens: false
		};
		return this.compare(m1, m2, options);
		//return this.compare(m1,m1, options);
		//return m1.compareStructure(m2, options); // replace this!
	}



	private compare(mol1: Kekule.Molecule, mol2: Kekule.Molecule, options: any) {
		const U = Kekule.ObjComparer;
		// const v1 = U.getCompareValue(mol1, options);
		// const v2 = U.getCompareValue(mol2, options);
		// let result =  v1 - v2;
		let result = 0;
		const resultObj: IComparisonResult<Kekule.Atom, Kekule.Bond> = new ComparisonResult();
		if (mol1 && mol2) {
			if (result === 0)  // structure fragment, if with same node and connector count, compare nodes and connectors
			{
				var nodes1 = mol1.nodes; // obj1.getNodes();
				var nodes2 = mol2.nodes; // obj2.getNodes();
				result = nodes1.length - nodes2.length;
				if (result === 0) {
					for (var i = 0, l = nodes1.length; i < l; ++i) {
						result = U.compare(nodes1[i], nodes2[i], options);
						if (result !== 0) {
							//console.log("result was non-zero for nodes");
							//console.log(nodes1[i]);
							//console.log(nodes2[i]); 
							resultObj.nodeError = result;
							resultObj.node = nodes2[i] as Kekule.Atom;
							break;
						} else {
							//check lone pairs on current node
							const lps1 = nodes1[i].getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet);
							const lps2 = nodes2[i].getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet);
							if (lps1.length !== lps2.length) {
								resultObj.lonePairCountError = lps1.length - lps2.length;
								resultObj.lonePairNodeError = nodes2[i] as Kekule.Atom;
								break;
							}

							// Need to check stereochemistry per node.
							// Since connectors are checked here anyways (i.e. node has error if wrong number of bonds)
							// Standardization does NOT affect bond order by stereochemistry... so check it here.
							const stereoListForNode1: Kekule.BondStereo[] = nodes1[i].getLinkedBonds().map(x => x.stereo).sort();
							const stereoListForNode2: Kekule.BondStereo[] = nodes2[i].getLinkedBonds().map(x => x.stereo).sort();
							// if (stereoListForNode1.length === stereoListForNode2.length){
							// 	for (let i=0;i<stereoListForNode1.length;i++){
							// 		if (stereoListForNode1[i] !== stereoListForNode2[i]){
							// 			resultObj.connectorStereochemistryError ++;
							// 			resultObj.node = nodes2[i];
							// 		}
							// 	}
							// }

						}

					}
				} else {
					resultObj.nodeCountError = result;
				}
			}
			if (result === 0)  // structure fragment, if with same node, connector, and lonepair count, compare nodes and connectors
			{
				var connectors1 = mol1.connectors; // obj1.getNodes();
				var connectors2 = mol2.connectors; // obj2.getNodes();
				result = connectors1.length - connectors2.length;
				if (result === 0) {
					for (var i = 0, l = connectors1.length; i < l; ++i) {
						// NOT SURE WHAT THIS IS DOING DIFFERENTLY FROM OTHER CHECKS
						// having a double bond in place of a single bond throws a nodeError (above) 
						result = U.compare(connectors1[i], connectors2[i], options);
						if (result !== 0) {
							//console.log("result was non-zero for connectors");
							resultObj.connectorError = result;
							resultObj.connector = connectors2[i] as Kekule.Bond;
							break;
						}

					}
				} else {
					resultObj.connectorCountError = result;
				}
			}
			if (result === 0) {
				mol1.clearExplicitBondHydrogens(true);
				mol2.clearExplicitBondHydrogens(true);
				var connectors1 = mol1.connectors; // obj1.getNodes();
				var connectors2 = mol2.connectors; // obj2.getNodes();
				// check for stereochemistry
				const stereoListForMol1: Kekule.BondStereo[] = (mol1.connectors as Kekule.Bond[]).map(x => x.stereo).sort();
				const stereoListForMol2: Kekule.BondStereo[] = (mol2.connectors as Kekule.Bond[]).map(x => x.stereo).sort();
				if (stereoListForMol1.length === stereoListForMol2.length) {
					for (let i = 0; i < stereoListForMol1.length; i++) {
						if (stereoListForMol1[i] !== stereoListForMol2[i]) {
							resultObj.connectorStereochemistryError++;
						}
					}
				}
			}

		}
		return resultObj;
	}

	public clearMolecule() {
		if (this.molecule != null) {
			const molecule = this.molecule;
			let count = molecule.getNodeCount();
			for (let i = count - 1; i >= 0; i--) {
				let atom = <Kekule.Atom>molecule.getNodeAt(i);
				//atom.canvasVertex.dispose();
				//clearing the verteces should be enough.
			}
			this.molecule = null;
		}
		this.mainSVG.clear();
	}

	public loadMolecule(mime: string): Kekule.Molecule {
		this.clearMolecule();
		let deserializedMolecule = Kekule.IO.loadMimeData(mime, 'chemical/x-kekule-json');

		let drawnMolecule = this.drawMolecule(deserializedMolecule);
		return drawnMolecule;
	}


	public drawMolecule(molecule: Kekule.Molecule, svg: Svg = this.mainSVG, scaleAndShift: boolean = false): Kekule.Molecule {

		//let drawnMolecule = new Kekule.Molecule();		

		let minx = Infinity;
		let miny = Infinity;
		let maxx = -Infinity;
		let maxy = -Infinity;
		let max = -Infinity;
		let min = Infinity;
		let scale = 1;
		let shiftX = 0;
		let shiftY = 0;
		let centerx = 0;
		let centery = 0;
		if (scaleAndShift) {
			molecule.nodes.forEach(v => {
				centerx += v.coord2D.x;
				centery += v.coord2D.y;

				minx = Math.min(minx, v.coord2D.x);
				miny = Math.min(miny, v.coord2D.y);
				maxx = Math.max(maxx, v.coord2D.x);
				maxy = Math.max(maxy, v.coord2D.y);
			});
			centerx /= molecule.nodes.length;
			centery /= molecule.nodes.length;
			molecule.nodes.forEach(v => {
				(v as Kekule.Atom).setCoord2D({ x: v.coord2D.x - centerx, y: v.coord2D.y - centery });
			});
			// console.log(`x: ${centerx}  y: ${centery}`);
			// //let centerX = (centerx + centery) / 2;
			max = Math.max(maxx, maxy);
			min = Math.min(minx, miny);
			let total = max - min;
			total *= 1.2; // so it doesn't scale exactly to edges
			scale = +svg.width() / 2 / total;
			shiftX = +svg.width() / 2;
			shiftY = +svg.height() / 2;
		}
		// console.log(molecule.nodes.map(v=> v.coord2D));
		let verteces: Map<Kekule.Atom, Vertex> = new Map<Kekule.Atom, Vertex>();
		let connectors: Connector[] = [];

		for (let i = 0; i < molecule.getNodeCount(); i++) {
			let atom = <Kekule.Atom>molecule.getNodeAt(i);
			atom.coord2D = { x: atom.coord2D.x * scale + shiftX, y: atom.coord2D.y * scale + shiftY }
			let vertex = new Vertex({
				identity: atom.symbol,
				x: atom.coord2D.x,
				y: atom.coord2D.y,
				molecule: molecule,
				atom: atom,
				svg: this.mainSVG
			});

			// 	//svg.add(vertex);
			verteces.set(atom, vertex);
		}

		for (let i = 0; i < molecule.getConnectorCount(); i++) {
			let bond = <Kekule.Bond>molecule.getConnectorAt(i);
			let connected = bond.getConnectedChemNodes();
			if (connected.length == 2) {
				let bondType: BondType;
				if (bond.bondOrder == 1) {
					if (bond.stereo == Kekule.BondStereo.UP) {
						bondType = BondType.solid;
					} else if (bond.stereo == Kekule.BondStereo.DOWN) {
						bondType = BondType.dashed;
					} else {
						bondType = BondType.single;
					}
				} else if (bond.bondOrder == 2) {
					bondType = BondType.double;
				} else if (bond.bondOrder == 3) {
					bondType = BondType.triple;
				} else {
					bondType = BondType.single;
				}
				var connector = new Connector({
					vertex1: verteces.get(connected[0] as Kekule.Atom)!,
					vertex2: verteces.get(connected[1] as Kekule.Atom)!,
					bondType: bondType,
					molecule: molecule,
					bond: bond,
					svg: this.mainSVG
				});

				verteces.get(connected[0] as Kekule.Atom)?.addConnector(connector);
				verteces.get(connected[1] as Kekule.Atom)?.addConnector(connector);

			} else {
				throw "There should only be two atoms!";
			}

		}

		//draw all lone pairs (AND formal charges)
		for (const [atom, vertex] of verteces) {

			//console.log('getMarkersOfType error?');
			let electronSets = atom.getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet, false);
			//console.log(electronSets);
			for (let m = 0; m < electronSets.length; m++) {
				let electronSet = electronSets[m];
				let vertexCenter = vertex.Position;

				let vect: Position = { x: vertexCenter.x, y: vertexCenter.y };
				if (electronSet.coord2D !== undefined) {
					vect = { x: electronSet.coord2D.x - vertexCenter.x, y: electronSet.coord2D.y - vertexCenter.y };
				} else {
					//look at attached bonds and fill remaining space.

				}
				let coordinationNumber = vertex.bondCount() + electronSets.length;
				let newAngle = vertex.getAngleThatFits(coordinationNumber);
				//console.log(`ANGLE for coord ${coordinationNumber}: ${newAngle}`);

				let lonePair = new LonePair({
					radians: newAngle,
					owner: vertex,
					molecule: molecule,
					svg: this.mainSVG,
					electronSet: electronSet
				});
				vertex.addLonePair(lonePair);
			}
			let formalCharges = atom.getMarkersOfType(Kekule.ChemMarker.Charge, false);
			for (let m = 0; m < formalCharges.length; m++) {
				let formalChargeMarker = formalCharges[m];
				let vertexCenter = vertex.Position;
				let vect: Position = { x: vertexCenter.x, y: vertexCenter.y };
				if (formalChargeMarker.coord2D !== undefined) {
					vect = { x: formalChargeMarker.coord2D.x - vertexCenter.x, y: formalChargeMarker.coord2D.y - vertexCenter.y };
				}
				let charge = new FormalCharge({
					owner: vertex,
					molecule: molecule,
					svg: this.mainSVG,
					charge: formalChargeMarker,
					radians: 0
				});
				vertex.addFormalCharge(charge);
			}

		}
		// need to do lone pairs after connectors so that they fit properly.





		return molecule;
	}

	onResize() {
		this.mainSVG.height(this.height);
		this.mainSVG.width(this.width);
	}

	visibleElementSelectorChanged(oldValue: boolean, newValue: boolean) {
		//console.log('CHANGED: ' + newValue);
	}

	async connectedCallback() {
		super.connectedCallback();
		
		this.mainSVG = SVG();
		this.mainSVG.addTo(this.svgContainer);
		this.mainSVG.size(this.width, this.height);



		this.mainSVG.on('change', (e: any) => {
			this.$emit('change', e);
		});

		(this.mainSVG as any).tag = Symbol(); // hack to give svg a unique tag for dependency container 
		container.register<SettingsService>((this.mainSVG as any).tag, {useValue: this.settingsService});


		let onResize = this.onResize.bind(this);
		window.onresize = onResize;

		this.settingsService.keyboardDiv = this.keyboardDiv;

		if (this.readonly) {
			this.settingsService.setDrawMode(InteractionMode.none);
		}


		// click is acting weird, can't prevent it with stopPropagation
		this.mainSVG.mousedown((ev: MouseEvent) => {
			if (ev.button != 0) {
				ev.preventDefault();
				return;
			}

			if (this.settingsService.isDrawMode && this.molecule != null) {
				const bounds = this.mainSVG.node.getBoundingClientRect();
				var vertex = new Vertex({
					identity: this.settingsService.currentElement,
					x: ev.clientX - bounds.left,
					y: ev.clientY - bounds.top,
					molecule: this.molecule,
					svg: this.mainSVG
				});
			}
		});


		if (this.shadowRoot != null) {
			let modeButtons = this.shadowRoot.querySelectorAll<Button>(".toolButton");
			for (let i = 0; i < modeButtons.length; i++) {
				let input = (modeButtons.item(i) as Button);
				if (input) {
					input.onclick = (ev) => {
						let target = ev.target as Button;
						if (target.appearance != 'accent') {
							this.resetButtons(modeButtons);
							target.appearance = 'accent';
							let option = target.id;
							switch (option) {
								case 'draw':
									this.settingsService.setDrawMode(InteractionMode.draw);
									break;
								case 'move':
									this.settingsService.setDrawMode(InteractionMode.move);
									break;
								case 'erase':
									this.settingsService.setDrawMode(InteractionMode.erase);
									break;
							}
							//this.fabricCanvas.discardActiveObject();
							//this.fabricCanvas.renderAll();
						}
					};
				}
			}


			let elementButtons = this.shadowRoot.querySelectorAll(".elementButton");
			// for (let i=0; i< elementButtons.length; i++){
			// 	let input = (elementButtons.item(i) as HTMLInputElement);
			// 	if (input){
			// 		input.onchange = (ev) =>{
			// 			settingsService.currentElement = (ev.target as HTMLInputElement).value;
			// 		};
			// 	}
			// }

			if (this.readAloudButton != null) {
				this.readAloudButton.onclick = (ev) => {
					this.settingsService.readAloudAtoms = !this.settingsService.readAloudAtoms;
				};
			}

			let electronButtons = this.shadowRoot.querySelectorAll<Button>(".electronButton");
			for (let i = 0; i < electronButtons.length; i++) {
				let input = (electronButtons.item(i) as Button);
				if (input) {
					input.onclick = (ev) => {
						let target = ev.target as Button;
						if (target.appearance != 'accent') {
							this.resetButtons(electronButtons);
							target.appearance = 'accent';
							this.settingsService.currentBondType = BondType[target.id];
							if (BondType[target.value] == BondType.lonePair) {
								for (let i = 0; i < elementButtons.length; i++) {
									let input = (elementButtons.item(i) as HTMLInputElement);
									input.disabled = true;
								}
							} else {
								for (let i = 0; i < elementButtons.length; i++) {
									let input = (elementButtons.item(i) as HTMLInputElement);
									input.disabled = false;
								}
							}
						}
					};
				}
			}


			this.settingsService.whenMode.subscribe(mode => {
				if (mode == InteractionMode.draw) {
					if (this.settingsService.currentBondType !== BondType.lonePair) {
						for (let i = 0; i < elementButtons.length; i++) {
							let input = elementButtons.item(i);
							(input as any).disabled = false;
						}
					}
					for (let i = 0; i < electronButtons.length; i++) {
						let input = electronButtons.item(i);
						input.disabled = false;
					}
				} else {
					for (let i = 0; i < elementButtons.length; i++) {
						let input = (elementButtons.item(i) as HTMLInputElement);
						(input as any).disabled = true;
					}
					for (let i = 0; i < electronButtons.length; i++) {
						let input = electronButtons.item(i);
						input.disabled = true;
					}
				}
			});
			this.settingsService.whenElement.subscribe(element => {
				if (this.elementTextField !== undefined) {
					this.elementTextField.value = element;
				}
			});
		}

		await loadModule;
		// LOAD MOLECULE IF ATTR are set
		if (this.mol != null) {
			this.loadMoleculeUsingMolAsync(this.mol, true);
		}

	}

	resetButtons(buttons: NodeListOf<Button>) {
		for (let i = 0; i < buttons.length; i++) {
			buttons[i].appearance = "outline";
		}
	}
}

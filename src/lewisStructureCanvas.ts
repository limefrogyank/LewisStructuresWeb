
import { FASTElement, customElement, attr, html, ref, observable, Observable } from '@microsoft/fast-element';
import { PeriodicTableModal } from './periodicTableModal';
import { Vertex } from './vertex';
import { InteractionMode, SettingsService, BondType } from './service/settingsService';
import { provideFluentDesignSystem, fluentButton, fluentTextField, fluentDialog, fluentMenu, fluentMenuItem } from '@fluentui/web-components';
//import { Kekule } from './kekuleTypings';
//import * as k from './kekule/dist/kekule.min.js';
import * as obm from './kekule/dist/extra/openbabel.js';
//import { Connector } from './connector';
//import { LonePair } from './lonePair';
import { Button, TextField } from '@fluentui/web-components';
//import * as openchemlib from 'openchemlib';
import { obMolToCAN, obMolToKekule } from './openBabelStuff';
//import * as raph from 'raphael';
import { generateTerminalTetrahedralVectors, getAverageBondLength, getBondAngle, getTetrahedralVectors, getTrigonalPlanarVectors } from './angles';
import { addLonePairsAndRedraw } from './redrawing';
import { SVG, extend as SVGextend, Element as SVGElement, Svg } from '@svgdotjs/svg.js'
import '@svgdotjs/svg.draggable.js'
import '@svgdotjs/svg.filter.js'
import './openbabel.js'
import { Connector } from './connector';
import { ComparisonResult, IComparisonOutput, IComparisonResult, Position } from './interfaces';
import { LonePair } from './lonePair';

import { Kekule as k } from 'kekule';
import { mimeTests, samples } from './tests';
import { negativeCircleSvg, positiveCircleSvg } from './svgs';
k; //loads kekule stuff, prevents tree-shaking.

declare global {
	interface Window {
		//Kekule: Kekule;
		OpenBabelModule(): OpenBabelModule;
	}
}
export interface OpenBabelModule {
	//new():OpenBabelModule;
	OBMol: OpenBabelModule.OBMol;
	OBAtom: OpenBabelModule.OBAtom;
	OBBond: OpenBabelModule.OBBond;
	OBOp: OpenBabelModule.OBOp;
	ObConversionWrapper: OpenBabelModule.ObConversionWrapper;
	ObBaseHelper: OpenBabelModule.ObBaseHelper;
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
		addOption(empty: string, option: string, value: string|null): void;

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
	<div role="toolbar" ${ref("toolbarDiv")} style="display:flex;flex-wrap:wrap;" aria-label="Toolbar with button groups">

		<div style="display:flex;margin-right:5px;">
			<fluent-button appearance="accent" id='draw' class="toolButton">Draw</fluent-button>
			<fluent-button appearance="outline" id='move' class="toolButton">Move</fluent-button>
			<fluent-button appearance="outline" id='erase' class="toolButton">Erase</fluent-button>
		</div>

		<div style="display:flex;margin-right:5px;" class="btn-group me-2" role="group" >
			<fluent-button apearance="neutral" class="elementButton" ${ref("periodicTableButton")} 
				@click="${(x, c) => { x.visibleElementSelector = !x.visibleElementSelector; console.log("CLICKED"); }}"
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
				:innerHTML="${x=>positiveCircleSvg}">		
			</fluent-button>
			<fluent-button appearance="outline" id='negative' class="electronButton" aria-label="Negative Formal Charge" 
				:innerHTML="${x=>negativeCircleSvg}">				
			</fluent-button>
		</div>

		<div style="display:flex;margin-right:5px;" role="group" >
			<fluent-button appearance="${x => x.settingsService.readAloudAtoms ? "accent" : "outline"}" class="readAloudButton" ${ref("readAloudButton")} aria-label="Read aloud toggle">
				🔊&#xFE0E;
			</fluent-button>
		</div>
	</div>
	<div id='svgContainer' ${ref("svgContainer")} style='width:${x => x.width}px;height:${x => x.height}px;border:black solid 1px;user-select:none;'>

	</div>
	
	<periodic-table-modal 
		@change="${(x, c) => {
		settingsService.setElement((c.event as CustomEvent).detail);
		x.dismissPeriodicTable();
	}}"
		visible="${x => x.visibleElementSelector}" 
		@dismiss="${x => x.dismissPeriodicTable()}"
	>
	</periodic-table-modal>

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

export var settingsService = new SettingsService();
//settingsService.test = "setting new text";

//(window as any).op = openBabel;
//(Kekule as any).environment.setEnvVar('openbabel.scriptSrc', 'openbabel.js');
//(Kekule as any).environment.setEnvVar('kekule.scriptSrc', './kekule.min.js');
//Kekule.OpenBabel.getObPath = function(){return "/"};
//Kekule.OpenBabel.enable((er)=>console.log('loaded!!!!'));
obm;
(window as any).OpenBabelModule = obm;



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
	@attr smiles: string;

	periodicTableButton: HTMLButtonElement;
	periodicTableModal: PeriodicTableModal;
	//mainCanvas: HTMLCanvasElement;
	svgContainer: HTMLDivElement;
	settingsService: SettingsService;
	elementTextField: TextField;
	keyboardDiv: HTMLDivElement;

	menuButton: HTMLButtonElement;
	readAloudButton: HTMLButtonElement;

	mainModal: HTMLDivElement;
	toolbarDiv: HTMLDivElement; //using for measuring canvas width

	molecule: Kekule.Molecule | null;

	// fabricCanvas:fabric.Canvas;

	// invisibleCanvas:HTMLCanvasElement;
	// invisibleFabricCanvas:fabric.Canvas;
	mainSVG: Svg;



	public dismissPeriodicTable() {
		let s = SVG();
		//console.log('dismised!');
		this.visibleElementSelector = false;
		this.periodicTableButton.focus();
	}

	constructor() {
		super();

		this.settingsService = settingsService;
		this.molecule = new Kekule.Molecule();

	}

	public async loadOne() {
		this.molecule = new Kekule.Molecule();
		let tempKekuleMolecule = await this.loadSmilesAsync('[CH3-]');
		addLonePairsAndRedraw(tempKekuleMolecule, false);
		this.clearMolecule();
		this.molecule = this.drawMolecule(tempKekuleMolecule, this.mainSVG, true);
	}

	public async runTestsAsync() {
		for (const mimeTest of mimeTests) {
			this.molecule = new Kekule.Molecule();
			let tempKekuleMolecule = await this.loadSmilesAsync(mimeTest.smiles);
			addLonePairsAndRedraw(tempKekuleMolecule, false);
			this.clearMolecule();
			this.molecule = this.drawMolecule(tempKekuleMolecule, this.mainSVG, true);
			let testIndex = 0;
			for (const unitTest of mimeTest.tests) {
				const moleculeToCompareWith = Kekule.IO.loadMimeData(unitTest.tryMatchWith, 'chemical/x-kekule-json');
				const result = this.compareStructure(this.molecule, moleculeToCompareWith);
				for (const key in result) {
					if (typeof result[key] !== "object"){
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
				if (badNodes.length > 0 && unitTest.perspectiveTest.pass ) {
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

	public async compareMoleculeAsync():Promise<IComparisonOutput>{
		const output :IComparisonOutput={};
		if (this.molecule == null) {
			output.empty=true;
			return output;
		}
		if (this.smiles == "" || this.smiles == null){
			output.programError = "Missing SMILES to compare molecule to.";
			const smiles = await this.getSMILESAsync();
			console.log(smiles);
			return output;
		}
		if (this.smiles !== ""){
			let molToCompareWith = await this.loadSmilesAsync(this.smiles); //Kekule.IO.loadFormatData(smiles, "chemical/x-daylight-smiles");
			addLonePairsAndRedraw(molToCompareWith, false);
			
			const compareResult = this.compareStructure(this.molecule, molToCompareWith);
			const badNodes = this.checkDashWedgeBonds(molToCompareWith);
		}
				//console.log(result);
		const smiles = await this.getSMILESAsync();
		if (smiles !== "" && smiles !== null){
			output.smiles = smiles;
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
		addLonePairsAndRedraw(clone, false);
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
		let atoms = this.molecule.nodes.filter(x=>x instanceof Kekule.Atom).map(x=> x as Kekule.Atom);
		let lonePairElectrons = 0;
		for (const atom of atoms) {
			const lonePairs = atom.getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet);
			lonePairElectrons += lonePairs.length*2;
		}
		let bonds = this.molecule.connectors.filter(x=>x instanceof Kekule.Bond).map(x=> x as Kekule.Bond);
		let bondElectrons = 0;
		for (const bond of bonds) {
			bondElectrons += bond.bondOrder*2;
		}

		let electronCount = 0;
		for (const atom of atoms) {
			electronCount += atom.getValence({ignoreCharge: true});
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

	private async getSMILESAsync(){
		if (this.molecule == null) {
			return "";
		}
		if (!this.verifyElectronCount()){
			console.warn("Not a valid Lewis structure");
			return "";
		}
		let smiles = await this.exportCanonicalSmilesAsync(this.molecule);
		//let smiles = Kekule.IO.saveFormatData(this.molecule, 'smi');
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

	private exportCanonicalSmilesAsync(molecule: Kekule.Molecule): Promise<string> {
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
				
				const can = obMolToCAN(openBabel, mol);

				resolve(can);
			};
		});
	}

	public getSVG(): string {
		let svg = this.mainSVG.node.outerHTML;
		return svg;
	}

	public async compareMoleculeAsync2(smiles: string): Promise<boolean> {
		if (this.molecule == null) {
			return false;
		}
		//console.log(smiles);
		let molToCompareWith = await this.loadSmilesAsync(smiles); //Kekule.IO.loadFormatData(smiles, "chemical/x-daylight-smiles");
		addLonePairsAndRedraw(molToCompareWith, false);
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
		const badStereoNodes : Kekule.Atom[] = [];
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
								break;							}
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

	private compareStructure(mol1: Kekule.Molecule, mol2: Kekule.Molecule): ComparisonResult {
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
		const resultObj: IComparisonResult = new ComparisonResult();
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
							resultObj.node = nodes2[i];
							break;
						} else {
							//check lone pairs on current node
							const lps1 = nodes1[i].getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet);
							const lps2 = nodes2[i].getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet);
							if (lps1.length !== lps2.length) {
								resultObj.lonePairCountError = lps1.length - lps2.length;
								resultObj.lonePairNodeError = nodes2[i];
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
							resultObj.connector = connectors2[i];
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

		//draw all lone pairs
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

	connectedCallback() {
		super.connectedCallback();
		this.mainSVG = SVG();
		this.mainSVG.addTo(this.svgContainer);
		this.mainSVG.size(this.width, this.height);



		let onResize = this.onResize.bind(this);
		window.onresize = onResize;

		// this.mainCanvas.width  = this.width;
		// this.mainCanvas.height = this.height;

		settingsService.keyboardDiv = this.keyboardDiv;

		// this.fabricCanvas = new fabric.Canvas(this.mainCanvas, {
		// 	// width: this.clientWidth,
		// 	// height: this.clientHeight,
		// 	width: this.width,
		// 	height:this.height,  //square
		// 	selection: false,
		// 	enablePointerEvents: true

		// });

		// this.invisibleFabricCanvas = new fabric.Canvas(this.invisibleCanvas,{
		// 	width: this.width,
		// 	height:this.height,  //square
		// 	selection: false,
		// 	enablePointerEvents: false
		// });


		// click is acting weird, can't prevent it with stopPropagation
		this.mainSVG.mousedown((ev: MouseEvent) => {
			if (ev.button != 0){
				ev.preventDefault();
				return;
			}
			// if (ev.defaultPrevented){
			// 	return;
			// }

			// 	if (this.molecule == null){
			// 		return;
			// 	}
			// 	if (ev.pointer == null){
			// 		return;
			// 	}
			// 	// console.log('window pointerdown');
			//if ((ev.target === null ) && settingsService.isDrawMode){
			// 		// console.log(ev.target)
			// 		// console.log('window pointerdown no target');
			// 		// let canvasCoords = _canvas.getPointer(ev);
			//console.log("CLICK FROM MAIN!");
			if (settingsService.isDrawMode && this.molecule != null) {
				const bounds = this.mainSVG.node.getBoundingClientRect();
				var vertex = new Vertex({
					identity: settingsService.currentElement,
					x: ev.clientX - bounds.left,
					y: ev.clientY - bounds.top,
					molecule: this.molecule,
					svg: this.mainSVG
				});
			}
		});
		// 		this.fabricCanvas.add(vertex);
		// 	} else {
		// 		console.log(ev.target);
		// 	}

		// });

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
									settingsService.setDrawMode(InteractionMode.draw);
									break;
								case 'move':
									settingsService.setDrawMode(InteractionMode.move);
									break;
								case 'erase':
									settingsService.setDrawMode(InteractionMode.erase);
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

			this.readAloudButton.onclick = (ev) => {
				settingsService.readAloudAtoms = !settingsService.readAloudAtoms;
			};

			let electronButtons = this.shadowRoot.querySelectorAll<Button>(".electronButton");
			for (let i = 0; i < electronButtons.length; i++) {
				let input = (electronButtons.item(i) as Button);
				if (input) {
					input.onclick = (ev) => {
						let target = ev.target as Button;
						if (target.appearance != 'accent') {
							this.resetButtons(electronButtons);
							target.appearance = 'accent';
							settingsService.currentBondType = BondType[target.id];
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


			settingsService.whenMode.subscribe(mode => {
				if (mode == InteractionMode.draw) {
					if (settingsService.currentBondType !== BondType.lonePair) {
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
			settingsService.whenElement.subscribe(element => {
				this.elementTextField.value = element;
			});
		}
		//});
	}

	resetButtons(buttons: NodeListOf<Button>) {
		for (let i = 0; i < buttons.length; i++) {
			buttons[i].appearance = "outline";
		}
	}
}

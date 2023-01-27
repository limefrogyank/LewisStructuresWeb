
import { FASTElement, customElement, attr, html, ref, observable, Observable} from '@microsoft/fast-element';
import { PeriodicTableModal } from './periodicTableModal';
import { Vertex } from './vertex';
import { InteractionMode, SettingsService, BondType } from './service/settingsService';
import { provideFluentDesignSystem, fluentButton, fluentTextField, fluentDialog, fluentMenu, fluentMenuItem } from '@fluentui/web-components';
import { Kekule } from './kekuleTypings';
//import * as k from './kekule/dist/kekule.min.js';
import * as obm from './kekule/dist/extra/openbabel.js';
//import { Connector } from './connector';
//import { LonePair } from './lonePair';
import { Button, TextField } from '@fluentui/web-components';
//import * as openchemlib from 'openchemlib';
import { obMolToKekule } from './openBabelStuff';
//import * as raph from 'raphael';
import { generateTerminalTetrahedralVectors, getAverageBondLength, getBondAngle, getTetrahedralVectors, getTrigonalPlanarVectors } from './angles';
import { addLonePairsAndRedraw } from './redrawing';
import { SVG, extend as SVGextend, Element as SVGElement, Svg } from '@svgdotjs/svg.js'
import '@svgdotjs/svg.draggable.js'
import '@svgdotjs/svg.filter.js'
import './openbabel.js'
import { Connector } from './connector';
import { Position } from './interfaces';
import { LonePair } from './lonePair';

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

		getSupportedInputFormatsStr(delimiter: string): string;
		getSupportedOutputFormatsStr(delimiter: string): string;
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
			<fluent-button appearance="outline" @click="${x => x.getMolecule()}">Load Molecule</fluent-button>
			<fluent-text-field :value="${x => x.smiles}" @change="${(x,c)=> x.smiles = (c.event.target as TextField).value ?? '' }"></fluent-text-field>
			<fluent-button appearance="outline" @click="${x=> x.compareMoleculeAsync(x.smiles)}" >Check Molecule</fluent-button>
			<fluent-button appearance="outline" >B</fluent-button>
		</div>
	</div>
<div>${x => x.visibleElementSelector}</div>

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

declare module 'fabric' {
	export namespace fabric {
		export interface ICanvasOptions {
			enablePointerEvents: boolean;
		}
		export interface Canvas {
			enablePointerEvents: boolean;
		}
	}
}

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

	smiles:string;

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
		console.log('dismised!');
		this.visibleElementSelector = false;
		this.periodicTableButton.focus();
	}

	constructor() {
		super();

		this.settingsService = settingsService;
		this.molecule = new Kekule.Molecule();

	}

	public async getMolecule(): Promise<string> {
		if (this.molecule == null) {
			return "";
		}
		//let res = await this.loadSmilesAsync('CC');
		let samples = [
			'C=O',
			'N(=O)[O-]', //bent (from trigonal planar)
			'[CH3-]', //tetrahedral
			'FB(F)F',//trigonal planar
			'C(F)(F)C(F)(F)CCl',// complex tetrahedral
			'P(Cl)(Cl)(Cl)(Cl)Cl', //trigonal bipyramidal
			'S(F)(F)(F)F',//seesaw
			'Cl(F)(F)F',//t-shape
			'I[I-]I',//linear from trigonal bipyramidal
			'S(F)(F)(F)(F)(F)F', //octahedral
			'Br(F)(F)(F)(F)F',//square pyramid
			'[Xe](F)(F)(F)F' //square planar
		];
		let index = 0;
		let res = await this.loadSmilesAsync(samples[index]);

		addLonePairsAndRedraw(res, false);
		this.molecule = this.drawMolecule(res, this.mainSVG, true);

		// let bridge = new Kekule.Render.RaphaelRendererBridge();
		// let canvas = document.createElement('div');
		// let context = bridge.createContext(canvas, 400,400);
		// let renclass= Kekule.Render.get2DRendererClass(res);
		// let renderer = new renclass(res, bridge);

		// let configObj = Kekule.Render.Render2DConfigs.getInstance();
		// let options = Kekule.Render.RenderOptionsUtils.convertConfigsToPlainHash(configObj);

		// renderer.draw(context,{x:200,y:200},options);


		// console.log(mol.getNumberOfHydrogens());
		// //mol.removeExplicitHydrogens(false);
		// mol.addImplicitHydrogens();
		// console.log(mol.toSVG(200,300));
		// console.log(mol.toMolfile());
		let compareResult = await this.compareMoleculeAsync(samples[index]);
		console.log(`They match?  ${compareResult}`);
		//Kekule.IO.loadFormatData

		let mime = Kekule.IO.saveMimeData(this.molecule, 'chemical/x-kekule-json');
		let svg = this.exportSVG();
		return mime;
	}

	private loadSmilesAsync(smiles: string): Promise<Kekule.Molecule> {
		return new Promise<Kekule.Molecule>((resolve, reject) => {
			console.log("running load smiles!");
			let openBabel = window.OpenBabelModule();
			openBabel.onRuntimeInitialized = () => {
				console.log("INitialized!");
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

					// if (atom.GetHyb() == 3 && atom.GetFormalCharge() == -1){
					// 	let fakeAtom= mol.NewAtom();
					// 	let fakeBond = mol.NewBond();
					// 	fakeAtom.SetAtomicNum(86);  // use He
					// 	fakeBond.SetBondOrder(1);
					// 	fakeAtom.AddBond(fakeBond);
					// 	atom.AddBond(fakeBond);
					// 	fakeBond.SetBegin(atom);
					// 	fakeBond.SetEnd(fakeAtom);
					// }

					//console.log("number: " + atom.GetAtomicNum() + "  with hybridization: " + atom.GetHyb()) + "  with bonds: " + atom.get;
				}


				//let r = conv.getSupportedOutputFormatsStr('\n');
				// let r2 = conv.getSupportedInputFormatsStr('\n');
				// let result = conv.writeString(mol,false);
				let result = new Kekule.Molecule();
				obMolToKekule(openBabel, mol, result, null);



				resolve(result);
			};
		});
	}

	public exportSVG(): string {
		let svg = this.mainSVG.node.outerHTML;
		return svg;
	}

	public async compareMoleculeAsync(smiles: string): Promise<boolean> {
		if (this.molecule == null) {
			return false;
		}
		console.log(smiles);
		let molToCompareWith = await this.loadSmilesAsync(smiles); //Kekule.IO.loadFormatData(smiles, "chemical/x-daylight-smiles");
		console.log('Loaded');
		console.log(this.molecule);
		console.log(molToCompareWith);
		const result = this.molecule.equalStructure(molToCompareWith, { 'level': 4 });  // this gives structure only
		console.log("OK initial result: " + result);

		let result1 = this.molecule.search(molToCompareWith, { 'level': 1 });
		//let result1 = Kekule.ChemStructureSearcher.findSubStructure(this.molecule, molToCompareWith, { exactMatch: false });
		console.log(result1);
		// if (result1 != undefined){
		// 	for (let i =0; i< result1.length; i++){
		// 		let item = result1[i];
		// 		if (item.CLASS_NAME === "Kekule.Atom"){
		// 			//check for hydrogens
		// 			console.log("GOT AN ATOM");
		// 		} else if (item.CLASS_NAME === "Kekule.Bond"){
		// 			console.log("got a bond");
		// 		}
		// 	}
		// }


		// let result2 = molToCompareWith.search(this.molecule, { 'level': 1 });
		// //let result2 = Kekule.ChemStructureSearcher.findSubStructure(molToCompareWith, this.molecule, { exactMatch: false });
		// console.log(result2);
		
		//const hydr = this.molecule.getHydrogenCount();
		// for lone pairs, need to check manually
		// for stereochemistry, need to check manually.
		// this will return true even if missing hydrogens
		console.log(result);
		return result;

	}

	private compareStructure(mol1: Kekule.Molecule, mol2: Kekule.Molecule){
		let m1 = mol1.clone();
		let m2 = mol2.clone();
		m1.setCanonicalizationIndex(null);
		m2.setCanonicalizationIndex(null);
		m1 = Kekule.MolStandardizer.standardize(m1, {});
		m2 = Kekule.MolStandardizer.standardize(m2, {});
		let options = {doStandardize: true, extraComparisonProperties: 'canonicalizationIndex'};

		return Kekule.ObjComparer.compare(m1,m1, options);
		//return m1.compareStructure(m2, options); // replace this!
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

		for (const [atom, vertex] of verteces) {

			let electronSets = atom.getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet, false);
			console.log(electronSets);
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
				console.log(`ANGLE for coord ${coordinationNumber}: ${newAngle}`);

				let lonePair = new LonePair({
					radians: newAngle,
					owner: vertex,
					molecule: molecule,
					svg: this.mainSVG
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
		console.log('CHANGED: ' + newValue);
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

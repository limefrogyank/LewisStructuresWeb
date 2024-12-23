declare module Class {
	export const create: (name: any, func: any)=>void;
}

declare module Kekule {

	export enum ComparisonMethod {
		DEFAULT = 0,
		PROPERTIES = 1,
		CHEM_STRUCTURE = 10,
		SPECTRUM_DATA = 30
	}

	class ChemMarker {
		Charge: Kekule.ChemMarker.Charge;
		UnbondedElectronSet: Kekule.ChemMarker.UnbondedElectronSet;
	}

	export let CustomCanonicalizer: any;
	export const CanonicalizationNodeSorter: ()=>any;

	export enum StructureComparationLevel {
		SKELETAL = 1,
		CONSTITUTION = 2,
		CONFIGURATION = 3,
		EXACT = 4,
		DEFAULT = 4
	}

	export class UnivChemStructObjComparer{
		static getCompareValue(obj: ChemObject, options:any):number;
		static compare(obj:ChemObject, obj2:ChemObject, options:any):number;
	}

	export interface Render {
		RaphaelRendererBridge: Render.RaphaelRendererBridge;
		get2DRendererClass(mol: Kekule.Molecule): Renderer2DClass;
		Render2DConfigs: Render.Render2DConfigs;
		RenderOptionsUtils: Render.RenderOptionUtils;
	}
	interface Renderer2DClass {
		new(mol: Kekule.Molecule, bridge: Kekule.Render.RaphaelRendererBridge): Renderer2D;
	}
	interface Renderer2D {
		draw(context: any, position: { 'x': number, 'y': number }, options: any);
	}

	export namespace Render {
		export interface Render2DConfigs {
			getInstance(): any;
		}
		export interface RenderOptionUtils {
			convertConfigsToPlainHash(config: any): any;
		}
		export interface RaphaelRendererBridge {
			new(): RaphaelRendererBridge;
			createContext(element: HTMLElement, width: number, height: number): any;
		}
	}

	export interface OpenBabel {
		enable(callback?: (error?: any) => void): void;
		getObPath(): string;
	}
	export interface ChemStructureSearcher {
		findSubStructure(subStructure: StructureFragment, sourceMol: StructureFragment, options: FindSubStructureOptions)
	}

	export interface FindSubStructureOptions {
		doStandardize?: boolean;
		exactMatch?: boolean;
		structureLevel?: StructureComparationLevel;
		atom?: boolean;
		mass?: boolean;
		charge?: boolean;
		bondOrder?: boolean;
		stereo?: boolean;
	}

	export class canonicalizer{
		static canonicalize(mol: Kekule.StructureFragment, options:any|null);
	}

	export class IO {
		static loadFormatData(mimeData: string, format: string): Kekule.Molecule;
		static loadMimeData(mimeData: string, mimeType: string): Kekule.Molecule;

		static saveFormatData(mol: Kekule.Molecule, format: string): string;
		static saveMimeData(mol: Kekule.Molecule, mimeType: string): string;
	}

	export class ObjComparer {
		static compare(obj1: ChemObject, obj2: ChemObject, option: any);
	}

	export class MolStandardizer {
		static standardize(molecule: Molecule, option: any): Molecule;
	}

	export class ObjectEx {
		addEventListener(eventName: string, listener: Function, thisArg: Object): Object;
		addOnceEventListener(eventName: string, listener: Function, thisArg: Object): Object;
		afterInitialization();
		assign(srcObj: ObjectEx);
		assignTo(srcObj: ObjectEx);

		off(eventName: string, listener: Function, thisArg: Object);
		on(eventName: string, listener: Function, thisArg: Object): Object;

	}

	export class ChemObject extends ObjectEx {
		constructor(id?: string);
		id: string;
		interactMode: number;
		scalarAttribs: any[];
		info: any;
		parent: ChemObject;
		owner: ChemObject;
		srcInfo: Object;

		appendMarker(marker: ChemObject);
		clearMarkers();
		getMarkerCount(): number;

		getMarkersOfType(classType: any, exactMatch?: boolean): any[];
		removeMarker(marker: ChemObject);
		removeMarkerAt(index: number);
		replaceMarker(oldMarker: ChemObject, newMarker: ChemObject);

	}
	export interface MolecularFormula extends ObjectEx {
		new(parent: StructureFragment): MolecularFormula;
		parent: StructureFragment;
		charge: number;
		radical: number;
		sections: Object[];
	}
	export interface StructureConnectionTable extends ObjectEx {
		new(owner: any, parent: StructureFragment): StructureConnectionTable;
		owner: any;
		parent: StructureFragment;
		nodes: ChemStructureNode[];
		anchorNodes: ChemStructureNode[];//	Nodes that can have bond connected to other structure nodes.
		connectors: ChemStructureConnector[];	//Connectors (usually bonds) in this container.
		nonHydrogenNodes: ChemStructureNode[];//	All structure nodes except hydrogen atoms in this fragment.
		nonHydrogenConnectors: ChemStructureConnector[];//	Connectors except ones connected to hydrogen atoms in this fragment.
	}
	export interface StructureFragmentShadow extends ObjectEx {
		new(srcFragment: StructureFragment): StructureFragmentShadow;
		shadowToSourceMap: any;
		sourceToShadowMap: any;
		shadowFragment: Kekule.StructureFragment;
	}
	export class StructureFragment extends ChemStructureNode {
		formula: MolecularFormula;//	Formula of this container. Usually used for some simple structures (such as inorganic molecules). Formual can also be calculated from Kekule.StructureConnectionTable.
		ctab: StructureConnectionTable;	//Connection table of this container. Usually used for some complex structures (such as organic molecules).
		nodes: ChemStructureNode[];//	All structure nodes in this fragment.
		anchorNodes: ChemStructureNode[];//	Nodes that can have bond connected to other structure nodes.
		connectors: ChemStructureConnector[];	//Connectors (usually bonds) in this container.
		readonly crossConnectors: ChemStructureConnector[];//	Connectors outside the fragment connected to nodes inside fragment. Read only.
		nonHydrogenNodes: ChemStructureNode[];//	All structure nodes except hydrogen atoms in this fragment.
		nonHydrogenConnectors: ChemStructureConnector[];//	Connectors except ones connected to hydrogen atoms in this fragment.
		flattenedShadow: Kekule.StructureFragmentShadow;//	A shadow that "flatten" this structure fragment, unmarshalling all subgroups. Some algorithms (e.g., stereo detection) need to be carried out on flattened structure, this shadow may prevent the original structure from being modified.
		clearExplicitBondHydrogens(dontClearFlags?: boolean);
		getAttachedMarkers():Kekule.ChemMarker[];
		

		getConnectorCount(): number;
		getConnectorById(id: string): ChemStructureConnector;
		getConnectorAt(index: number): ChemStructureConnector;

		getNodeCount(): number;
		getNodeById(id: string): ChemStructureNode;
		getNodeAt(index: number): ChemStructureNode;

		search(mol2: StructureFragment, options: any): any;
	}

	export class Molecule extends StructureFragment {
		constructor(id?: string, name?: string, withCtab?: boolean);
		name: string;
		appendNode(atom: Atom);
		appendConnector(bond: Bond);
		appendBond(atomIndexes: number[], bondOrder: number);
		clearConnectors();
		clearNodes();
		clone(): Molecule;
		setCanonicalizationIndex(option: any | null);

		finalize();

		getConnectorTo(obj: ChemStructureObject): ChemStructureConnector;

		removeChild(childObj: ChemStructureNode | ChemStructureConnector);
		removeConnector(connector: ChemStructureConnector, preserveConnectedObjs?: boolean);
		removeNode(node: ChemStructureNode, preserveLinkedConnectors?: boolean);

		replaceNode(oldNode: ChemStructureNode, newNode: ChemStructureNode);

		setName(name: string);
		getInfo(b: boolean): any;
	}
	export class BaseStructureNode extends ChemStructureObject {
		id: string;
		coord2D: Coordinates2D;
		coord3D: Coordinates3D;
		absCoord2D: Coordinates2D;
		absCoord3D: Coordinates3D;
		zIndex2D: number;
		constructor(id: string, coord2D: Coordinates2D, coord3D: Coordinates3D);
	}

	export class ChemStructureNode extends BaseStructureNode {
		getLinkedBonds(bondType?: number): Bond[];
		getLinkedChemNodes(ignoreHydrogenAtoms?: boolean): ChemStructureNode[];
		getLinkedDoubleBonds(): Bond[];
		getLinkedMultipleBonds(): Bond[];
	}
	export class AbstractAtom extends ChemStructureNode {
		constructor(id: string, coord2D: Coordinates2D, coord3D: any);
		explicityHydrogenCount: number;
	}
	export class Atom extends AbstractAtom {
		isotope: Isotope;
		symbol: string;
		charge: number;
		atomicNumber: number;
		massNumber: number;
		atomType: any;
		hybridizationType: number;
        linkedSiblings: Kekule.Atom[];
		constructor(id?: string, symbol?: string, massNumber?: number);
		setSymbol(element: string): Atom;
		setCoord2D(coords: Coordinates2D): Atom;
		setMassNumber(massNumber: number): Atom;
		setIsotopeId(isotopeId: string): Atom;

		getCharge():number;
		setCharge(charge:number):void;

		getValence(options?:any): number;
		getImplicitValence(): number;
		getExplicitValence(): number;
		//canvasVertex: Vertex;
	}
	export class Psuedoatom extends AbstractAtom {

	}
	export class VariableAtom extends AbstractAtom {

	}
	export class Element extends ChemObject {
		constructor(symbolOrAtomicNumber: string | number);
		readonly atomicNumber: number; //The atomic number of element. Read only.
		readonly symbol: String; //	The symbol of element. Read only.
		readonly name: String; //	Name of element. Read only.
		readonly group: number; //	Group of element. Read only.
		readonly period: number; //	Period of element. Read only.
		series: String; //	Series of element, e.g. nonmetal.
		naturalMass: number; //	Natural mass of element.


	}
	export interface Isotope extends Element {
		new(symbolOrAtomicNumber: string | number, massNumber: number): Isotope;
		readonly massNumber: number;//	The mass number of isotope. Read only. Setting to null means a genenral element.
		readonly exactMass: number;//	Read only.
		readonly naturalAbundance: number;//	Read only.
		readonly isotopeAlias: String;//	Alias of isotope (such as D for H2). Read only.
	}
	export class ChemStructureObject extends ChemObject {
		appendConnectedObj(obj: ChemStructureObject);
		appendLinkedConnector(connector: ChemStructureConnector);
		assertConnectedObjLegal(obj: ChemStructureObject): boolean;
		clearConnectedObjs();
		clearStructureFlags();
		compareStructure(targetObj: ChemObject, options: any): number;
		equalStructure(targetObj: ChemObject, options: any): boolean;

		getConnectedChemNodes(): ChemStructureNode[];

		getLinkedConnectorAt(index: number): ChemStructureConnector;
		getLinkedConnectorCount(): number;
		getLinkedHydrogenAtoms(): ChemStructureObject[];
		getLinkedNonHydrogenConnectors(): ChemStructureConnector[];
		getLinkedNonHydrogenObjs(): ChemStructureObject[];
		getLinkedObjsOnConnector(): ChemStructureObject[];

		removeLinkedConnector(connector: ChemStructureConnector);
		removeLinkedConnectorAt(index: number);
		removeThisFromLinkedConnector();


	}
	export class BaseStructureConnector extends ChemStructureObject {

	}
	export class ChemStructureConnector extends BaseStructureConnector {


	}
	export class Bond extends ChemStructureConnector {
		constructor(id?: string, connectedObjs?: ChemStructureObject[], bondOrder?: number, electronCount?: number, bondType?: string);
		bondForm: Kekule.BondForm;//	Form of bond, single, double or other.
		bondType: String;//	Type of bond, value from Kekule.BondType.
		bondOrder: number;//	Order of bond. Values should be retrieved from Kekule.BondOrder.
		bondValence: number;//	Valence comsumed of an atom to connect to this bond. Note this value is different from Kekule.Bond#bondOrder, For example, bondOrder value for Kekule.BondOrder.EXPLICIT_AROMATIC is 10, but the valence is 1.5. This property is read only.
		electronCount: number;//	Count of electrons in this set. Note that there may be partial electron in set, so a float value is used here.
		stereo: number;//	Stereo type of bond.
		isInAromaticRing: boolean;//	A flag to indicate the bond is in a aromatic ring and is a aromatic bond. User should not set this property directly, instead, this value will be marked in aromatic detection routine.
		setBondOrder(order: number): Bond;
		setBondType(bondType: BondType): Bond;
		setConnectedObjs(atomArray: Atom[]): Bond;

		//canvasConnector: Connector;
	}

	export class ElectronSet extends ChemObject {
		constructor(electronCount?: number);
		electronCount: number;
	}
	export class BondForm extends ElectronSet {
		constructor(bondOrder: number, electronCount?: number, bondType?: string);
		bondType: String;//	Type of bond, a value from Kekule.BondType.
		bondOrder: number;//	Order of bond. Values should be retrieved from Kekule.BondOrder.
		bondValence: number;//	Valence comsumed of an atom to connect to this bond. Note this value is different from Kekule.BondForm#bondOrder, For example, bondOrder value for Kekule.BondOrder.EXPLICIT_AROMATIC is 10, but the valence is 1.5. This property is read only.
	}

	export module ChemMarker {
		// BaseMarker:BaseMarker;
		// ChemMarkerProperty:ChemMarkerProperty;
		// Charge:Charge;
		export class BaseMarker extends ChemObject {

		}

		export class ChemPropertyMarker extends BaseMarker {
			value: any;
		}

		export class Charge extends ChemPropertyMarker {
			coord2D: Coordinates2D;
		}

		export class UnbondedElectronSet extends BaseMarker {

			coord2D: Coordinates2D; //hack... doesn't appear on any base classes, but appears in javascript...

			//canvasLonePair: LonePair;
		}
	}

	export enum BondStereo {
		NONE,
		UP,
		UP_INVERTED,
		DOWN
	}

	export type BondType = 'COVALENT' | 'IONIC' | 'COORDINATE' | 'METALLIC' | 'HYDROGEN';

	export interface Coordinates2D {
		x: number;
		y: number;
	}
	export interface Coordinates3D extends Coordinates2D {
		z: number;
	}
	//}


}

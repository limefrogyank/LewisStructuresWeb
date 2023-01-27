//import { Kekule as k} from './kekule/dist/kekule.js';
import {Kekule as k} from 'kekule';
// import {Vertex} from './vertex';
// import {Connector} from './connector';
// import {LonePair} from './lonePair';

declare global{
	interface Window{
		Kekule: Kekule;
		
	}
} 


export interface Kekule{
	Molecule:Kekule.Molecule;
	Atom:Kekule.Atom;
	Bond:Kekule.Bond;
	Element: Kekule.Element;
	IO:Kekule.IO;
	MolStandardizer:Kekule.MolStandardizer;
	ObjComparer: Kekule.ObjComparer;
	ChemMarker:ChemMarker;
	BondStereo:Kekule.BondStereo;
	OpenBabel: Kekule.OpenBabel;
	ChemStructureSearcher: Kekule.ChemStructureSearcher;
	Render:Kekule.Render;

	
}


interface ChemMarker{
	Charge:Kekule.ChemMarker.Charge;
	UnbondedElectronSet:Kekule.ChemMarker.UnbondedElectronSet;
}

enum StructureComparationLevel{
	SKELETAL =1,
	CONSTITUTION=2,
	CONFIGURATION=3,
	EXACT=4,
	DEFAULT=4
};


export namespace Kekule{

	export interface Render{
		RaphaelRendererBridge: Render.RaphaelRendererBridge;
		get2DRendererClass(mol: Kekule.Molecule):Renderer2DClass;
		Render2DConfigs: Render.Render2DConfigs;
		RenderOptionsUtils:Render.RenderOptionUtils;
	}
	interface Renderer2DClass{
		new(mol:Kekule.Molecule, bridge: Kekule.Render.RaphaelRendererBridge):Renderer2D;
	}
	interface Renderer2D{
		draw(context:any, position: {'x': number, 'y': number}, options:any);
	}

	export namespace Render{
		export interface Render2DConfigs{
			getInstance():any;
		}
		export interface RenderOptionUtils{
			convertConfigsToPlainHash(config:any):any;
		}
		export interface RaphaelRendererBridge{
			new():RaphaelRendererBridge;
			createContext(element:HTMLElement,width:number,height:number):any;
		}
	}
	
	export interface OpenBabel{
		enable(callback?: (error?:any)=>void):void;
		getObPath():string;
	}
	export interface ChemStructureSearcher{
		findSubStructure(subStructure: StructureFragment, sourceMol: StructureFragment, options: FindSubStructureOptions )
	}

	export interface FindSubStructureOptions {
		doStandardize? :boolean;
		exactMatch?: boolean;
		structureLevel?: StructureComparationLevel;
		atom?: boolean;
		mass?: boolean;
		charge?: boolean;
		bondOrder?: boolean;
		stereo?:boolean;
	}

	export interface IO{
		loadFormatData(mimeData:string, format:string): Kekule.Molecule;
		loadMimeData(mimeData:string, mimeType:string): Kekule.Molecule;

		saveFormatData(mol:Kekule.Molecule, format:string ):string;
		saveMimeData(mol:Kekule.Molecule, mimeType:string ):string;
	}

	export interface ObjComparer{
		compare(obj1: Molecule, obj2:Molecule, option:any);
	}

	export interface MolStandardizer{
		standardize(molecule: Molecule, option: any):Molecule;
	}
	
	export interface ObjectEx{
		addEventListener(eventName:string, listener:Function, thisArg:Object):Object;
		addOnceEventListener(eventName:string, listener:Function, thisArg:Object) :Object;
		afterInitialization();
		assign(srcObj:ObjectEx);
		assignTo(srcObj:ObjectEx);

		off(eventName:string, listener:Function, thisArg:Object);
		on(eventName:string, listener:Function, thisArg:Object):Object;

	}
	export interface ChemObject extends ObjectEx{
		new(id?:string);
		id:string;
		interactMode:number;
		scalarAttribs:any[];
		info:any;
		parent:ChemObject;
		owner:ChemObject;
		srcInfo:Object;

		appendMarker(marker:ChemObject);
		clearMarkers();
		getMarkerCount():number;
		getMarkersOfType<T>(classType: T, exactMatch?: boolean): T[];
		removeMarker(marker:ChemObject);
		removeMarkerAt(index:number);
		replaceMarker(oldMarker:ChemObject,newMarker:ChemObject);

	}
	export interface MolecularFormula extends ObjectEx{
		new(parent:StructureFragment):MolecularFormula;
		parent:StructureFragment;
		charge:number;
		radical:number;
		sections:Object[];
	}
	export interface StructureConnectionTable extends ObjectEx{
		new(owner:any,parent:StructureFragment):StructureConnectionTable;
		owner:any;
		parent:StructureFragment;
		nodes:ChemStructureNode[];
		anchorNodes:	ChemStructureNode[];//	Nodes that can have bond connected to other structure nodes.
		connectors:	ChemStructureConnector[];	//Connectors (usually bonds) in this container.
		nonHydrogenNodes: ChemStructureNode[];//	All structure nodes except hydrogen atoms in this fragment.
		nonHydrogenConnectors	:ChemStructureConnector[];//	Connectors except ones connected to hydrogen atoms in this fragment.
	}
	export interface StructureFragmentShadow extends ObjectEx{
		new(srcFragment:StructureFragment):StructureFragmentShadow;
		shadowToSourceMap:	any;	
		sourceToShadowMap:	any;	
		shadowFragment:	Kekule.StructureFragment;	
	}
	export interface StructureFragment extends ChemStructureNode{
		formula:	MolecularFormula;//	Formula of this container. Usually used for some simple structures (such as inorganic molecules). Formual can also be calculated from Kekule.StructureConnectionTable.
		ctab:	StructureConnectionTable;	//Connection table of this container. Usually used for some complex structures (such as organic molecules).
		nodes:	ChemStructureNode[];//	All structure nodes in this fragment.
		anchorNodes:	ChemStructureNode[];//	Nodes that can have bond connected to other structure nodes.
		connectors:	ChemStructureConnector[];	//Connectors (usually bonds) in this container.
		readonly crossConnectors:	ChemStructureConnector[];//	Connectors outside the fragment connected to nodes inside fragment. Read only.
		nonHydrogenNodes: ChemStructureNode[];//	All structure nodes except hydrogen atoms in this fragment.
		nonHydrogenConnectors	:ChemStructureConnector[];//	Connectors except ones connected to hydrogen atoms in this fragment.
		flattenedShadow:	Kekule.StructureFragmentShadow;//	A shadow that "flatten" this structure fragment, unmarshalling all subgroups. Some algorithms (e.g., stereo detection) need to be carried out on flattened structure, this shadow may prevent the original structure from being modified.
	
		getConnectorCount():number;
		getConnectorById(id:string):ChemStructureConnector;
		getConnectorAt(index:number):ChemStructureConnector;

		getNodeCount():number;
		getNodeById(id:string):ChemStructureNode;
		getNodeAt(index:number):ChemStructureNode;

		search(mol2: StructureFragment, options:any) : any;
	}

	export interface Molecule extends StructureFragment{
		new(id?:string,name?:string,withCtab?:boolean): Molecule;
		name:string;
		appendNode(atom:Atom);
		appendConnector(bond:Bond);
		appendBond(atomIndexes:number[], bondOrder:number);
		clearConnectors();
		clearNodes();
		clone():Molecule;
		setCanonicalizationIndex(option: any|null);

		finalize();
		
		getConnectorTo(obj:ChemStructureObject):ChemStructureConnector;

		removeChild(childObj:ChemStructureNode|ChemStructureConnector);
		removeConnector(connector:ChemStructureConnector, preserveConnectedObjs?:boolean);
		removeNode(node:ChemStructureNode, preserveLinkedConnectors?:boolean);

		replaceNode(oldNode:ChemStructureNode, newNode:ChemStructureNode);

		setName(name:string);
		getInfo(b:boolean):any;
	}
	export interface BaseStructureNode extends ChemStructureObject{
		id:string;
		coord2D:Coordinates2D;
		coord3D:Coordinates3D;
		absCoord2D:Coordinates2D;
		absCoord3D:Coordinates3D;
		zIndex2D:number;
		new(id:string, coord2D:Coordinates2D, coord3D:Coordinates3D):BaseStructureNode;
	}

	export interface ChemStructureNode extends BaseStructureNode{
		getLinkedBonds(bondType?: number) : Bond[];
		getLinkedChemNodes(ignoreHydrogenAtoms?:boolean): ChemStructureNode[];
		getLinkedDoubleBonds():Bond[];
		getLinkedMultipleBonds():Bond[];
	}
	export interface AbstractAtom extends ChemStructureNode{
		new(id:string, coord2D: Coordinates2D, coord3D: any):AbstractAtom;
		explicityHydrogenCount:number;
	}
	export interface Atom extends AbstractAtom {
		isotope:Isotope;
		symbol:string;
        charge:number;
		atomicNumber:number;
		massNumber:number;
		atomType:any;
		hybridizationType:number;
		new(id?:string,symbol?:string,massNumber?:number):Atom;
		setSymbol(element:string):Atom;
		setCoord2D(coords:Coordinates2D):Atom;
		setMassNumber(massNumber:number):Atom;
		setIsotopeId(isotopeId:string):Atom;

		//canvasVertex: Vertex;
	}
	export interface Psuedoatom extends AbstractAtom {
		
	}
	export interface VariableAtom extends AbstractAtom {

	}
	export interface Element extends ChemObject {
		new(symbolOrAtomicNumber: string|number):Element;
		readonly atomicNumber: number; //The atomic number of element. Read only.
		readonly symbol: String; //	The symbol of element. Read only.
		readonly name: String; //	Name of element. Read only.
		readonly group: number; //	Group of element. Read only.
		readonly period: number; //	Period of element. Read only.
		series: String; //	Series of element, e.g. nonmetal.
		naturalMass: number; //	Natural mass of element.

		
	}
	export interface Isotope extends Element{
		new(symbolOrAtomicNumber:string|number, massNumber:number):Isotope;
		readonly massNumber:number;//	The mass number of isotope. Read only. Setting to null means a genenral element.
		readonly exactMass:	number;//	Read only.
		readonly naturalAbundance:	number;//	Read only.
		readonly isotopeAlias:	String;//	Alias of isotope (such as D for H2). Read only.
	}
	export interface ChemStructureObject extends ChemObject{
		appendConnectedObj(obj: ChemStructureObject);
		appendLinkedConnector(connector:ChemStructureConnector);
		assertConnectedObjLegal(obj:ChemStructureObject):boolean;
		clearConnectedObjs();
		clearStructureFlags();
		compareStructure(targetObj:ChemObject, options:any):number;
		equalStructure(targetObj:ChemObject, options:any):boolean;

		getConnectedChemNodes(): ChemStructureNode[];

		getLinkedConnectorAt(index:number):ChemStructureConnector;
		getLinkedConnectorCount():number;
		getLinkedHydrogenAtoms():ChemStructureObject[];
		getLinkedNonHydrogenConnectors(): ChemStructureConnector[];
		getLinkedNonHydrogenObjs():ChemStructureObject[];
		getLinkedObjsOnConnector():ChemStructureObject[];

		removeLinkedConnector(connector:ChemStructureConnector);
		removeLinkedConnectorAt(index:number);
		removeThisFromLinkedConnector();


	}
	export interface BaseStructureConnector extends ChemStructureObject{

	}
	export interface ChemStructureConnector extends BaseStructureConnector{

		
	}
	export interface Bond extends ChemStructureConnector{
		new(id?:string, connectedObjs?:ChemStructureObject[], bondOrder?:number, electronCount?:number, bondType?:string):Bond;
		bondForm:	Kekule.BondForm;//	Form of bond, single, double or other.
		bondType:	String;//	Type of bond, value from Kekule.BondType.
		bondOrder:	number;//	Order of bond. Values should be retrieved from Kekule.BondOrder.
		bondValence:	number;//	Valence comsumed of an atom to connect to this bond. Note this value is different from Kekule.Bond#bondOrder, For example, bondOrder value for Kekule.BondOrder.EXPLICIT_AROMATIC is 10, but the valence is 1.5. This property is read only.
		electronCount:	number;//	Count of electrons in this set. Note that there may be partial electron in set, so a float value is used here.
		stereo	:number;//	Stereo type of bond.
		isInAromaticRing:	boolean;//	A flag to indicate the bond is in a aromatic ring and is a aromatic bond. User should not set this property directly, instead, this value will be marked in aromatic detection routine.
		setBondOrder(order:number):Bond;
		setBondType(bondType:BondType):Bond;
		setConnectedObjs(atomArray: Atom[]):Bond;

		//canvasConnector: Connector;
	}

	export interface ElectronSet extends ChemObject{
		new(electronCount?:number);
		electronCount:number;
	}
	export interface BondForm extends ElectronSet {
		new(bondOrder:number, electronCount?:number, bondType?:string):BondForm;
		bondType:	String;//	Type of bond, a value from Kekule.BondType.
		bondOrder:	number;//	Order of bond. Values should be retrieved from Kekule.BondOrder.
		bondValence:	number;//	Valence comsumed of an atom to connect to this bond. Note this value is different from Kekule.BondForm#bondOrder, For example, bondOrder value for Kekule.BondOrder.EXPLICIT_AROMATIC is 10, but the valence is 1.5. This property is read only.
	}

	export namespace ChemMarker {
		// BaseMarker:BaseMarker;
		// ChemMarkerProperty:ChemMarkerProperty;
		// Charge:Charge;
		export interface BaseMarker extends ChemObject {

		}
	
		export interface ChemPropertyMarker extends BaseMarker{
			value: any;
		}
	
		export interface Charge extends ChemPropertyMarker{
	
		}

		export interface UnbondedElectronSet extends BaseMarker {
	
			coord2D:Coordinates2D; //hack... doesn't appear on any base classes, but appears in javascript...

			//canvasLonePair: LonePair;
		}
	}

	export interface BondStereo  {
		NONE: number,
		UP:number,
		UP_INVERTED:number,
		DOWN:number
	}
	
	export type BondType = 'COVALENT'|'IONIC'|'COORDINATE'|'METALLIC'|'HYDROGEN';
	
	export interface Coordinates2D{
		x:number;
		y:number;
	}
	export interface Coordinates3D extends Coordinates2D{
		z:number;
	}
}



export const Kekule : Kekule = k;



console.log(Kekule);
(window as any).Kekule = Kekule;
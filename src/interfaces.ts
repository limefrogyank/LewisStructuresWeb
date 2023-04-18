export interface IDisposable {
	dispose: ()=>void;
}

export interface Position {
	x: number;
	y: number;
}

export interface ICompressedWebworkOutput{
	programError?: string;
	empty:boolean;
	simpleKekule:string;
	kekuleMimeCompressed:string;
	// svg:string;
	perspectiveCorrect:boolean;
}

export class CompressedWebworkOutput implements ICompressedWebworkOutput{
	programError?: string;
	empty:boolean;
	simpleKekule:string;
	kekuleMimeCompressed:string;
	// svg:string;
	perspectiveCorrect:boolean;

	constructor(init?:Partial<IBlindOutput>){
		this.empty = false;
		this.simpleKekule="";
		this.kekuleMimeCompressed="";
		// this.svg="";
		this.perspectiveCorrect=false;
		Object.assign(this, init);
	}
}


export interface IBlindOutput{
	programError?: string;
	empty:boolean;
	smiles:string;
	inchi:string;
	mol:string;
	kekuleMime:string;
	svg:string;
	atomNums:number[];
	perspectiveCorrect:boolean;
	perspectiveErrorAtom?:string[];
	blindComparisonResult:IComparisonResult<string,string>;
}
export class BlindOutput implements IBlindOutput{
	programError?: string;
	empty:boolean;
	smiles:string;
	inchi:string;
	mol:string;
	kekuleMime:string;
	svg:string;
	atomNums: number[];
	perspectiveCorrect:boolean;
	blindComparisonResult:IComparisonResult<string,string>;


	constructor(init?:Partial<IBlindOutput>){
		this.empty = false;
		this.smiles="";
		this.inchi="";
		this.mol="";
		this.kekuleMime="";
		this.svg="";
		this.atomNums=[];
		this.perspectiveCorrect=true;

		Object.assign(this, init);
	}
}

export interface IComparisonOutput extends IBlindOutput{
	comparisonResult?:IComparisonResult<string,string>;
}
export class ComparisonOutput implements IComparisonOutput{
	programError?: string;
	empty:boolean;
	smiles:string;
	inchi:string;
	mol:string;
	kekuleMime:string;
	svg:string;
	atomNums: number[];
	perspectiveCorrect:boolean;
	comparisonResult?: IComparisonResult<string,string>;
	blindComparisonResult:IComparisonResult<string,string>;

	constructor(init?:Partial<IComparisonOutput>){
		this.empty = false;
		this.smiles="";
		this.inchi="";
		this.mol="";
		this.kekuleMime="";
		this.svg="";
		this.atomNums=[];
		this.perspectiveCorrect=true;
		
		Object.assign(this, init);
	}
}

export interface IComparisonResult<TNode,TConnector> {
	node: TNode|null;
	nodeError: number;
	nodeCountError:number;
	connector: TConnector|null;
	connectorError: number;
	connectorCountError:number;
	lonePairCountError:number;
	lonePairNodeError:TNode|null;
	connectorStereochemistryError:number;
}
export class ComparisonResult implements IComparisonResult<Kekule.Atom,Kekule.Bond>{
	node: Kekule.Atom|null;
	nodeError: number;
	nodeCountError:number;
	connector: Kekule.Bond|null;
	connectorError: number;
	connectorCountError:number;
	lonePairCountError:number;
	lonePairNodeError:Kekule.Atom|null;
	connectorStereochemistryError:number;

	static toStringOutput(input: IComparisonResult<Kekule.Atom,Kekule.Bond>): IComparisonResult<string,string>{
		return {
			node: input.node?input.node.symbol:"",
			nodeError: input.nodeError,
			nodeCountError: input.nodeCountError,
			connector: input.connector?input.connector.getConnectedChemNodes().map(x=>(x as Kekule.Atom).symbol).join(','):"",
			connectorError: input.connectorError,
			connectorCountError: input.connectorCountError,
			lonePairCountError: input.lonePairCountError,
			lonePairNodeError: input.lonePairNodeError ? input.lonePairNodeError.symbol : "",
			connectorStereochemistryError: input.connectorStereochemistryError
		}
	}

	constructor(init?:Partial<IComparisonResult<Kekule.Atom,Kekule.Bond>>){
		this.node = null;
		this.nodeError = 0;
		this.nodeCountError = 0;
		this.connector = null;
		this.connectorError = 0;
		this.connectorCountError=0;
		this.lonePairCountError=0;
		this.lonePairNodeError=null;
		this.connectorStereochemistryError=0;
		Object.assign(this, init);
	}
}




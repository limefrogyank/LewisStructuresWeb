export interface IDisposable {
	dispose: ()=>void;
}

export interface Position {
	x: number;
	y: number;
}

export interface IComparisonResult {
	node: Kekule.ChemStructureNode|null;
	nodeError: number;
	nodeCountError:number;
	connector: Kekule.ChemStructureConnector|null;
	connectorError: number;
	connectorCountError:number;
	lonePairCountError:number;
	lonePairNodeError:Kekule.ChemStructureNode|null;
	connectorStereochemistryError:number;
}
export class ComparisonResult implements IComparisonResult{
	node: Kekule.ChemStructureNode|null;
	nodeError: number;
	nodeCountError:number;
	connector: Kekule.ChemStructureConnector|null;
	connectorError: number;
	connectorCountError:number;
	lonePairCountError:number;
	lonePairNodeError:Kekule.ChemStructureNode|null;
	connectorStereochemistryError:number;

	constructor(init?:Partial<IComparisonResult>){
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




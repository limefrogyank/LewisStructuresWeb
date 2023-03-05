import { Vertex, IVertexOptions } from "./vertex";
import { settingsService } from './lewisStructureCanvas';
import { BondType } from './service/settingsService';
import { Subscription, Observable, BehaviorSubject, Subject, combineLatest, observable } from "rxjs";
import { SVG, Line as SvgLine, Defs as SvgDefs, Pattern as SvgPattern, Polygon as SvgPolygon, ForeignObject as SvgForeignObject, Ellipse as SvgEllipse, Circle as SvgCircle, G as SvgGroup, Svg, Text as SvgText, Element, Shape } from '@svgdotjs/svg.js';
import { IDisposable, Position, Position as Vector2 } from "./interfaces";
import { isNullOrWhiteSpace } from "@microsoft/fast-web-utilities";
import { hoverColor } from "./constants";

interface IConnectorOptions {
	vertex1: Vertex;
	vertex2: Vertex;
	bondType: BondType;
	molecule: Kekule.Molecule;
	bond?: Kekule.Bond;
	svg: Svg;
}



export class Connector implements IDisposable {

	//_testVariable:number;
	//_ellipse:fabric.Ellipse;
	_svg: Svg;
	_group: SvgGroup;
	_selectableCircle: SvgEllipse;
	_line1: SvgLine | null;
	_line2: SvgLine | null;
	_line3: SvgLine | null;
	_polygon: SvgPolygon | null;
	_pattern: SvgPattern;
	_div: Element;
	_foreignObject: SvgForeignObject;

	//_bondType:BondType;
	_vertex1: Vertex;
	_vertex2: Vertex;
	_vertex1PositionSubscription: Subscription;
	_vertex2PositionSubscription: Subscription;
	_vertex1SymbolSubscription: Subscription;
	_vertex2SymbolSubscription: Subscription;

	_center: Vector2;
	_lastEndpoints: [Vector2,Vector2];

	_molecule: Kekule.Molecule;
	public bond: Kekule.Bond;

	_bondType: BehaviorSubject<BondType>;
	public BondType: Observable<BondType>;
	private _runner: import("@svgdotjs/svg.js").Runner;
	public get CurrentBondType() {
		return this._bondType?.value;
	}

	_vertexChange: Subject<Vertex>;
	public VertexChange$: Observable<Vertex>;

	// public get bondType(): BondType{
	// 	return this._bondType;
	// }

	constructor(options: IConnectorOptions) {

		// options.stroke = options.stroke || 'black';
		// options.strokeWidth = options.strokeWidth || 2;
		// options.selectable = options.selectable|| false;
		// options.moveCursor = options.moveCursor || 'none';
		// options.evented = options.evented || false;
		// options.originX = options.originX || 'center';
		// options.originY = options.originY || 'center';
		// options.hoverCursor='null';
		// options.lockMovementX=true;
		// options.lockMovementY=true;
		// options.padding=15;


		this._bondType = new BehaviorSubject<BondType>(options.bondType);
		this.BondType = this._bondType.asObservable();

		// THIS IS NOT NECESSARY RIGHT NOW. ONLY FOR ARIA LABEL CHANGES ON PREVIOUS VERSION.
		this._vertexChange = new Subject();
		this.VertexChange$ = this._vertexChange.asObservable();

		//this._bondType=options.bondType;
		this._vertex1 = options.vertex1;
		this._vertex2 = options.vertex2;


		// creating a new bond or just recreating from Kekule structure?
		if (options.bond) {
			this.bond = options.bond;
			//this.bond.canvasConnector = this;
		} else {
			this._molecule = options.molecule;
			this.bond = new Kekule.Bond();
			//this.bond.canvasConnector = this;
			this.bond.setConnectedObjs([options.vertex1.atom, options.vertex2.atom]);
			this._molecule.appendConnector(this.bond);
		}

		this._bondType.subscribe(x => {
			//this.setBondType(x);
			switch (x) {
				case BondType.single:
					this.bond.setBondOrder(1);
					this.bond.stereo = Kekule.BondStereo.NONE;
					break;
				case BondType.solid:
					this.bond.setBondOrder(1);
					this.bond.stereo = Kekule.BondStereo.UP;
					break;
				case BondType.dashed:
					this.bond.setBondOrder(1);
					this.bond.stereo = Kekule.BondStereo.DOWN;
					break;
				case BondType.double:
					this.bond.setBondOrder(2);
					this.bond.stereo = Kekule.BondStereo.NONE;
					break;
				case BondType.triple:
					this.bond.setBondOrder(3);
					this.bond.stereo = Kekule.BondStereo.NONE;
					break;
			}

		});
		//let center = this.getCenterPoints();
		//let linePoints = this.calcLinePoints();
		//let distance = Math.sqrt(Math.pow(linePoints.x2 - linePoints.x1,2) + Math.pow(linePoints.y2-linePoints.y1,2));
		//let angle = Math.atan2(linePoints.y2-linePoints.y1, linePoints.x2-linePoints.x1);

		this._svg = options.svg;
		this._group = this._svg.group().cx(0).cy(0).attr("tabindex","0").attr("aria-label", "Bond");;//.transform({translateX: options.v})

		this._selectableCircle = this._group.ellipse()
			.attr({ 'fill-opacity': 0.0, fill: hoverColor})
			.stroke({ color: hoverColor, width: 1, opacity: 0 })
			.filterWith((add) => {
				add.gaussianBlur(2, 2);
			});
		this.adjustSelectableCircle();

		this._line1 = this._group.line(this._vertex1.Position.x, this._vertex1.Position.y, this._vertex2.Position.x, this._vertex2.Position.y)
			.stroke("#000000").attr("pointer-events", "none");


		combineLatest([this._vertex1.Position$, this._vertex2.Position$]).subscribe(endpoints => {
			this.moveLine(endpoints);
			this.adjustSelectableCircle();
			this._lastEndpoints = endpoints;
		});


		//this.on('added', ev =>{

		//this.canvas?.add(this._selectableCircle);
		this._selectableCircle.mouseover(this.mouseOverObject.bind(this));
		this._selectableCircle.mouseout(this.mouseOutObject.bind(this));
		//this._selectableCircle.bringToFront();
		this._selectableCircle.mousedown(this.mouseDown.bind(this));

		this._molecule = options.molecule;

		this._vertex1 = options.vertex1;
		this._vertex2 = options.vertex2;

		this._vertex1SymbolSubscription = options.vertex1.Symbol$.subscribe(symbol => {
			this._vertexChange.next(options.vertex1);
		});

		this._vertex1PositionSubscription = options.vertex1.Position$.subscribe(point => {
			this._vertexChange.next(options.vertex1);
		});

		this._vertex2SymbolSubscription = options.vertex2.Symbol$.subscribe(symbol => {
			this._vertexChange.next(options.vertex2);
		});

		this._vertex2PositionSubscription = options.vertex2.Position$.subscribe(point => {
			this._vertexChange.next(options.vertex2);
		});
	}

	public getAngleFrom(from:Vertex){
		let to: Vertex;
		if (this._vertex1 == from){
			to = this._vertex2;
		} else if (this._vertex2 == from){
			to = this._vertex1;
		} else {
			// vertex is not part of this connector
			return 0;
		}
		return Math.atan2(to.Position.y - from.Position.y, to.Position.x - from.Position.x);
	}

	private adjustSelectableCircle(){
		const v1p = this._vertex1.Position;
		const v2p = this._vertex2.Position;
		let distance = Math.sqrt(Math.pow(v2p.x - v1p.x,2) + Math.pow(v2p.y-v1p.y,2));
		let angle = Math.atan2(v2p.y-v1p.y,v2p.x-v1p.x);
		let center :Position= {x:(v2p.x + v1p.x)/2, y:(v2p.y + v1p.y)/2};

		distance = (distance > (2*Vertex.circleRadius) ? distance-(2*Vertex.circleRadius) : distance*2/3);
		this._selectableCircle.width(distance).height(14).cx(center.x).cy(center.y);
		this._selectableCircle.untransform().rotate(angle*360/2/Math.PI);
	}

	// this will move line to new coords.  If coords omitted, will "redraw" line with current bondtype and same position.
	private moveLine(endpoints?: [Vector2, Vector2]) {
		if (endpoints === undefined){
			endpoints = this._lastEndpoints;
		}
		let vector: Vector2 = { x: endpoints[1].x - endpoints[0].x, y: endpoints[1].y - endpoints[0].y };
		let length = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
		let normVector: Vector2 = { x: vector.x / length, y: vector.y / length };
		let perpVector: Vector2 = { x: normVector.y, y: -normVector.x };
		let dashArray = `0 ${Vertex.circleRadius} ${Math.floor(length - (Vertex.circleRadius * 3)).toString()}`;
		let normLength = Vertex.circleRadius;
		if (length < Vertex.circleRadius * 3) {
			dashArray = `0 ${Vertex.circleRadius / 2} ${Math.floor(length - (Vertex.circleRadius * 3 / 2)).toString()}`;
			normLength = normLength/2;
		}
		//let length = Math.sqrt(Math.pow(endpoints[0].x-endpoints[1].x,2) + Math.pow(endpoints[0].y-endpoints[1].y,2));
		switch (this._bondType.value) {
			case BondType.single:
				if (this._line2 != null) {
					this._line2.remove();
					this._line2 = null;
				}
				if (this._line3 != null) {
					this._line3.remove();
					this._line3 = null;
				}
				if (this._line1 == null) {
					this._line1 = this._group.line(endpoints[0].x, endpoints[0].y, endpoints[1].x, endpoints[1].y)
					.stroke("#000000")
					.attr("pointer-events", "none");
				} else {
					this._line1.plot(endpoints[0].x, endpoints[0].y, endpoints[1].x, endpoints[1].y);
				}
				this._line1.attr("stroke-dasharray", dashArray);
				if (this._polygon != null) {
					this._polygon.remove();
					this._polygon = null;
				}
				break;
			case BondType.double:
				perpVector = { x: perpVector.x * 4, y: perpVector.y * 4 };
				if (this._line1 == null) {
					this._line1 = this._group.line(
						endpoints[0].x + perpVector.x,
						endpoints[0].y + perpVector.y,
						endpoints[1].x + perpVector.x,
						endpoints[1].y + perpVector.y).attr("pointer-events", "none");;
				} else {
					this._line1.plot(
						endpoints[0].x + perpVector.x,
						endpoints[0].y + perpVector.y,
						endpoints[1].x + perpVector.x,
						endpoints[1].y + perpVector.y);
				}
				this._line1.attr("stroke-dasharray", dashArray);
				if (this._line2 == null) {
					this._line2 = this._group.line(
						endpoints[0].x - perpVector.x,
						endpoints[0].y - perpVector.y,
						endpoints[1].x - perpVector.x,
						endpoints[1].y - perpVector.y).attr("pointer-events", "none");;
				} else {
					this._line2.plot(
						endpoints[0].x - perpVector.x,
						endpoints[0].y - perpVector.y,
						endpoints[1].x - perpVector.x,
						endpoints[1].y - perpVector.y);
				}
				this._line2.stroke("#000000");
				this._line2.attr("stroke-dasharray", dashArray);
				if (this._line3 != null) {
					this._line3.remove();
					this._line3 = null;
				}
				if (this._polygon != null) {
					this._polygon.remove();
					this._polygon = null;
				}
				break;
			case BondType.triple:
				perpVector = { x: perpVector.x * 6, y: perpVector.y * 6 };
				if (this._line1 == null) {
					this._line1 = this._group.line(endpoints[0].x, endpoints[0].y, endpoints[1].x, endpoints[1].y);
				} else {
					this._line1.plot(endpoints[0].x, endpoints[0].y, endpoints[1].x, endpoints[1].y);
				}
				this._line1.attr("stroke-dasharray", dashArray);
				if (this._line2 == null) {
					this._line2 = this._group.line(
						endpoints[0].x - perpVector.x,
						endpoints[0].y - perpVector.y,
						endpoints[1].x - perpVector.x,
						endpoints[1].y - perpVector.y).attr("pointer-events", "none");;
				} else {
					this._line2.plot(
						endpoints[0].x - perpVector.x,
						endpoints[0].y - perpVector.y,
						endpoints[1].x - perpVector.x,
						endpoints[1].y - perpVector.y);
				}
				this._line2.stroke("#000000");
				this._line2.attr("stroke-dasharray", dashArray);
				if (this._line3 == null) {
					this._line3 = this._group.line(
						endpoints[0].x + perpVector.x,
						endpoints[0].y + perpVector.y,
						endpoints[1].x + perpVector.x,
						endpoints[1].y + perpVector.y).attr("pointer-events", "none");;
				} else {
					this._line3.plot(
						endpoints[0].x + perpVector.x,
						endpoints[0].y + perpVector.y,
						endpoints[1].x + perpVector.x,
						endpoints[1].y + perpVector.y);
				}
				this._line3.stroke("#000000");
				this._line3.attr("stroke-dasharray", dashArray);
				if (this._polygon != null) {
					this._polygon.remove();
					this._polygon = null;
				}
				break;
			case BondType.dashed:
				let angle = Math.atan2(perpVector.x,perpVector.y);
				perpVector = { x: perpVector.x * 6, y: perpVector.y * 6 };
				if (this._pattern != null){
					this._pattern.remove();
				}
				this._pattern = this._svg.pattern(8,8,add=>{
					add.rect(4,8).fill('#000000');
					add.rect(4,8).move(4,0).fill('#ffffff00');
				}).rotate(-angle*360/2/Math.PI);
				if (this._line1 != null) {
					this._line1.remove();
					this._line1 = null;
				}
				if (this._line2 != null) {
					this._line2.remove();
					this._line2 = null;
				}
				if (this._line3 != null) {
					this._line3.remove();
					this._line3 = null;
				}
				if (this._polygon == null) {
					this._polygon = this._group.polygon(`
						${endpoints[0].x + (normVector.x * normLength)},${endpoints[0].y + (normVector.y * normLength)}, 
						${endpoints[1].x - (normVector.x * normLength) + perpVector.x},${endpoints[1].y - (normVector.y * normLength) + perpVector.y},
						${endpoints[1].x - (normVector.x * normLength) - perpVector.x},${endpoints[1].y - (normVector.y * normLength) - perpVector.y}`)
						.attr("pointer-events", "none");

				} else {
					this._polygon.plot(`
						${endpoints[0].x + (normVector.x * normLength)},${endpoints[0].y + (normVector.y * normLength)}, 
						${endpoints[1].x - (normVector.x * normLength) + perpVector.x},${endpoints[1].y - (normVector.y * normLength) + perpVector.y},
						${endpoints[1].x - (normVector.x * normLength) - perpVector.x},${endpoints[1].y - (normVector.y * normLength) - perpVector.y}`);
				}
				this._polygon.fill(this._pattern);
				break;
			case BondType.solid:
				perpVector = { x: perpVector.x * 6, y: perpVector.y * 6 };
				if (this._line1 != null) {
					this._line1.remove();
					this._line1 = null;
				}
				if (this._line2 != null) {
					this._line2.remove();
					this._line2 = null;
				}
				if (this._line3 != null) {
					this._line3.remove();
					this._line3 = null;
				}
				if (this._polygon == null) {
					this._polygon = this._group.polygon(`
						${endpoints[0].x + (normVector.x * normLength)},${endpoints[0].y + (normVector.y * normLength)}, 
						${endpoints[1].x - (normVector.x * normLength) + perpVector.x},${endpoints[1].y - (normVector.y * normLength) + perpVector.y},
						${endpoints[1].x - (normVector.x * normLength) - perpVector.x},${endpoints[1].y - (normVector.y * normLength) - perpVector.y}`)
						.attr("pointer-events", "none");

				} else {
					this._polygon.plot(`
						${endpoints[0].x + (normVector.x * normLength)},${endpoints[0].y + (normVector.y * normLength)}, 
						${endpoints[1].x - (normVector.x * normLength) + perpVector.x},${endpoints[1].y - (normVector.y * normLength) + perpVector.y},
						${endpoints[1].x - (normVector.x * normLength) - perpVector.x},${endpoints[1].y - (normVector.y * normLength) - perpVector.y}`);
				}
				this._polygon.fill("#000000");
				
				break;

		}
		let bboxElement : Shape|null = this._line1;
		if (this._line1 == null && this._polygon != null){
			bboxElement = this._polygon;
		} 
		if (bboxElement == null){
			return;
		}
		// const bbox = bboxElement.bbox();
		//this._foreignObject.size(bbox.width, bbox.height).cx(bbox.cx).cy(bbox.cy);

	}


	// private calculateCenter(a:) : Position {
	// 	if (this._vertex1== null && this._vertex2 == null){
	// 		return {x:0,y:0};
	// 	} else if (this._vertex1 == null){
	// 		return {x:this._vertex2?.Position$}
	// 	}
	// }

	public setBondType(bondType: BondType) {
		//this._bondType=bondType;
		this._bondType.next(bondType);
		this.moveLine();
	}

	public dispose() {
		this._molecule.removeConnector(this.bond);
		this._vertex1?.removeAttachment(this);
		this._vertex2?.removeAttachment(this);
		this._line1?.remove();
		this._line2?.remove();
		this._line3?.remove();
		this._polygon?.remove();
		this._pattern?.remove();
		this._group?.remove();
		this._vertex1PositionSubscription.unsubscribe();
		this._vertex2PositionSubscription.unsubscribe();
		this._vertex1SymbolSubscription.unsubscribe();
		this._vertex2SymbolSubscription.unsubscribe();
		// this._vertex1=null;
		// this._vertex2=null;
	}

	// public setEvented(isEvented: boolean) {
	// 	console.log("set evented on selectableCircle");
	// 	// this._selectableCircle.set({
	// 	// 	evented: isEvented
	// 	// });
	// }

	mouseDown(ev:MouseEvent){
		//console.log("mousedown on connector!");
		ev.stopPropagation();
		if (settingsService.isEraseMode){
			this.dispose();
		} else if (settingsService.isDrawMode){
			// change bond order
			if (settingsService.currentBondType === BondType.lonePair){
				// don't change a bond into a lone pair.
				return;
			}
			if (this._bondType.value !== settingsService.currentBondType){
				this._bondType.next(settingsService.currentBondType);
				this.moveLine(); // just a way to redraw the line
				//this._bondType = settingsService.currentBondType;
				
			}

		}
	}

	// toSVG(reviver?: Function): string {
	// 	let p = this.calcLinePoints();

	// 	let vector = new fabric.Point(p.x2-p.x1, p.y2-p.y1);
	// 	let length = Math.sqrt(Math.pow(vector.x,2) + Math.pow(vector.y,2));
	// 	let normVector = new fabric.Point(vector.x/length, vector.y/length);
	// 	let perpVector = new fabric.Point(normVector.y, -normVector.x);
	// 	let svg = "";
	// 	switch (this._bondType.value){
	// 		case BondType.single:
	// 			return super.toSVG(reviver);
	// 		case BondType.double:
	// 			perpVector = new fabric.Point(perpVector.x * 4, perpVector.y * 4);
	// 			svg += `<path d="M${p.x1 + (normVector.x * 15) + perpVector.x + this.left!} ${p.y1 + (normVector.y * 15) + perpVector.y + this.top!} `; 
	// 			svg += `L${p.x2 - (normVector.x * 15) + perpVector.x + this.left!} ${p.y2 - (normVector.y * 15) + perpVector.y + this.top!} `;
	// 			svg += `Z" stroke='black' stroke-width='${this.strokeWidth}' />`; 
	// 			svg += `<path d="M${p.x1 + (normVector.x * 15) - perpVector.x + this.left!} ${p.y1 + (normVector.y * 15) - perpVector.y + this.top!} `; 
	// 			svg += `L${p.x2 - (normVector.x * 15) - perpVector.x + this.left!} ${p.y2 - (normVector.y * 15) - perpVector.y + this.top!} `;
	// 			svg += `Z" stroke='black' stroke-width='${this.strokeWidth}' />`; 
	// 			return svg;
	// 		default:
	// 			return super.toSVG(reviver);
	// 	}
	// }


	mouseOverObject(ev:MouseEvent){
		if (this._runner != null){
			this._runner.finish();
		}
		this._runner = this._selectableCircle.animate().attr('fill-opacity','0.5');
	}

	mouseOutObject(ev:MouseEvent){
		if (this._runner != null){
			this._runner.finish();
		}
		this._runner = this._selectableCircle.animate().attr('fill-opacity','0');//, {
	} 
}




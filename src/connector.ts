import { copiedTextStyle } from "fabric/fabric-impl";
import { Vertex, IVertexOptions } from "./vertex";
import { settingsService } from './lewisStructureCanvas';
import { BondType } from './service/settingsService';
import { Subscription, Observable, BehaviorSubject, Subject, combineLatest, observable } from "rxjs";
import { Kekule } from './kekuleTypings';
import { SVG, Line as SvgLine, Defs as SvgDefs, Pattern as SvgPattern, Polygon as SvgPolygon, ForeignObject as SvgForeignObject, Ellipse as SvgEllipse, Circle as SvgCircle, G as SvgGroup, Svg, Text as SvgText, Element } from '@svgdotjs/svg.js';
import { Position as Vector2 } from "./interfaces";
import { isNullOrWhiteSpace } from "@microsoft/fast-web-utilities";

interface IConnectorOptions {
	vertex1: Vertex;
	vertex2: Vertex;
	bondType: BondType;
	molecule: Kekule.Molecule;
	bond?: Kekule.Bond;
	svg: Svg;
}



export class Connector {

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

	private _bondType: BehaviorSubject<BondType>;
	public BondType: Observable<BondType>;
	public get CurrentBondType() {
		return this._bondType?.value;
	}

	private _vertexChange: Subject<Vertex>;
	public VertexChange: Observable<Vertex>;

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
		this.VertexChange = this._vertexChange.asObservable();

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
		this._group = this._svg.group().cx(0).cy(0);//.transform({translateX: options.v})
		//this._defs = this._group.defs();
		this._line1 = this._group.line(this._vertex1.Position.x, this._vertex1.Position.y, this._vertex2.Position.x, this._vertex2.Position.y).stroke("#000000");


		this._selectableCircle = this._group.ellipse();

		combineLatest([this._vertex1.Position$, this._vertex2.Position$]).subscribe(endpoints => {
			this.moveLine(endpoints);
			this._lastEndpoints = endpoints;
		});
		// {
		// 	rx: distance/3,
		// 	ry: 10,
		// 	left: center.x,
		// 	top: center.y,
		// 	centeredRotation:true,
		// 	angle:angle * 360 / 2 / Math.PI,
		// 	originX:'center',
		// 	originY:'center',
		// 	fill:'transparent',
		// 	stroke:'black',
		// 	opacity:0,
		// 	strokeWidth:2,
		// 	strokeDashArray: [5,5],
		// 	selectable:false,
		// 	hasControls:false,
		// 	evented:false,
		// 	hoverCursor:'null'
		// });

		//this.on('added', ev =>{

		//this.canvas?.add(this._selectableCircle);
		//this._selectableCircle.on('mouseover', this.mouseOverObject.bind(this));
		//this._selectableCircle.on('mouseout', this.mouseOutObject.bind(this));
		//this._selectableCircle.bringToFront();
		//this._selectableCircle.on('mousedown', this.mouseDown.bind(this));


		//});
		// this.on('removed', ev =>{
		// 	console.log('removed connector');
		// 	this.canvas?.remove(this._selectableCircle);
		// });
		this._vertex1 = options.vertex1;
		this._vertex2 = options.vertex2;


		// if (options.vertex1 !== null) {
		this._vertex1SymbolSubscription = options.vertex1.Symbol$.subscribe(symbol => {
			this._vertexChange.next(options.vertex1);
		});

		this._vertex1PositionSubscription = options.vertex1.Position$.subscribe(point => {
			this._vertexChange.next(options.vertex1);
			// (this as fabric.Line).set({
			// 	x1: point.x,
			// 	y1: point.y,
			// 	dirty:true
			// });
			// let center = this.getCenterPoint();
			// let linePoints = this.calcLinePoints();
			// let distance = Math.sqrt(Math.pow(linePoints.x2 - linePoints.x1,2) + Math.pow(linePoints.y2-linePoints.y1,2));
			// let angle = Math.atan2(linePoints.y2-linePoints.y1, linePoints.x2-linePoints.x1);

			// this._selectableCircle.set({
			// 	left:center.x,
			// 	top:center.y,
			// 	rx: distance/3,
			// 	angle:angle * 360 / 2 / Math.PI,
			// 	dirty:true
			// });
			// this.setCoords();
			// this._selectableCircle.setCoords();
			// if (this.canvas !== undefined) {
			// 	this.canvas.renderAll();
			// }
		});
		// }
		// if (options.vertex2 !== null){
		this._vertex2SymbolSubscription = options.vertex2.Symbol$.subscribe(symbol => {
			this._vertexChange.next(options.vertex2);
		});

		this._vertex2PositionSubscription = options.vertex2.Position$.subscribe(point => {
			this._vertexChange.next(options.vertex2);
			// (this as fabric.Line).set({
			// 	x2: point.x,
			// 	y2: point.y,
			// 	dirty:true
			// });
			// let center = this.getCenterPoint();
			// let linePoints = this.calcLinePoints();
			// let distance = Math.sqrt(Math.pow(linePoints.x2 - linePoints.x1,2) + Math.pow(linePoints.y2-linePoints.y1,2));
			// let angle = Math.atan2(linePoints.y2-linePoints.y1, linePoints.x2-linePoints.x1);

			// //console.log('center coords: ' + center);
			// this._selectableCircle.set({
			// 	left:center.x,
			// 	top:center.y,
			// 	rx: distance/3,
			// 	angle:angle * 360 / 2 / Math.PI,
			// 	dirty:true
			// });
			// this.setCoords();
			// this._selectableCircle.setCoords();
			// if (this.canvas !== undefined) {
			// 	this.canvas.renderAll();
			// }
		});
		// }
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
					this._line1 = this._group.line(endpoints[0].x, endpoints[0].y, endpoints[1].x, endpoints[1].y);
				} else {
					this._line1.plot(endpoints[0].x, endpoints[0].y, endpoints[1].x, endpoints[1].y);
				}
				this._line1.attr("stroke-dasharray", dashArray);
				break;
			case BondType.double:
				perpVector = { x: perpVector.x * 4, y: perpVector.y * 4 };
				if (this._line1 == null) {
					this._line1 = this._group.line(
						endpoints[0].x + perpVector.x,
						endpoints[0].y + perpVector.y,
						endpoints[1].x + perpVector.x,
						endpoints[1].y + perpVector.y);
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
						endpoints[1].y - perpVector.y);
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
						endpoints[1].y - perpVector.y);
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
						endpoints[1].y + perpVector.y);
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
					add.rect(4,8).move(4,0).fill('#ffffff');
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
					${endpoints[1].x - (normVector.x * normLength) - perpVector.x},${endpoints[1].y - (normVector.y * normLength) - perpVector.y}`);

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
					${endpoints[1].x - (normVector.x * normLength) - perpVector.x},${endpoints[1].y - (normVector.y * normLength) - perpVector.y}`);

				} else {
					this._polygon.plot(`
						${endpoints[0].x + (normVector.x * normLength)},${endpoints[0].y + (normVector.y * normLength)}, 
						${endpoints[1].x - (normVector.x * normLength) + perpVector.x},${endpoints[1].y - (normVector.y * normLength) + perpVector.y},
						${endpoints[1].x - (normVector.x * normLength) - perpVector.x},${endpoints[1].y - (normVector.y * normLength) - perpVector.y}`);
				}
				this._polygon.fill("#000000");
				
				break;

		}
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
		this._line1?.remove();
		this._line2?.remove();
		this._line3?.remove();
		this._polygon?.remove();
		this._pattern?.remove();
		this._group?.remove();
		this._molecule.removeConnector(this.bond);
		this._vertex1PositionSubscription.unsubscribe();
		this._vertex2PositionSubscription.unsubscribe();
		this._vertex1SymbolSubscription.unsubscribe();
		this._vertex2SymbolSubscription.unsubscribe();
		// this._vertex1=null;
		// this._vertex2=null;
	}

	public setEvented(isEvented: boolean) {
		console.log("set evented on selectableCircle");
		// this._selectableCircle.set({
		// 	evented: isEvented
		// });
	}

	// mouseDown(ev:fabric.IEvent){
	// 	console.log("mousedown!");

	// 	if (settingsService.isEraseMode){
	// 		this._vertex1?.removeAttachment(this);
	// 		this._vertex2?.removeAttachment(this);
	// 		//this._vertex1.dispose();
	// 		//this._vertex2.dispose();
	// 		//this._vertex1Subscription.unsubscribe();
	// 		//this._vertex2Subscription.unsubscribe();
	// 		//this.canvas.remove(this);
	// 		this.dispose();
	// 	} else if (settingsService.isDrawMode){
	// 		// change bond order
	// 		if (settingsService.currentBondType === BondType.lonePair){
	// 			// don't change a bond into a lone pair.
	// 			return;
	// 		}
	// 		if (this._bondType.value !== settingsService.currentBondType){
	// 			this._bondType.next(settingsService.currentBondType);
	// 			//this._bondType = settingsService.currentBondType;
	// 			(this as fabric.Line).set({dirty:true});
	// 			this.canvas?.renderAll();
	// 		}

	// 	}
	// }

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


	// public _render(ctx:CanvasRenderingContext2D){
	// 	let p = this.calcLinePoints();
	// 	let vector = new fabric.Point(p.x2-p.x1, p.y2-p.y1);
	// 	let length = Math.sqrt(Math.pow(vector.x,2) + Math.pow(vector.y,2));
	// 	let normVector = new fabric.Point(vector.x/length, vector.y/length);
	// 	let perpVector = new fabric.Point(normVector.y, -normVector.x);


	// 	switch (this._bondType.value){
	// 		case BondType.single:
	// 			super._render(ctx);
	// 			break;
	// 		case BondType.double:
	// 			perpVector = new fabric.Point(perpVector.x * 4, perpVector.y * 4);
	// 			ctx.beginPath();
	// 			ctx.moveTo(p.x1 + (normVector.x * 15) + perpVector.x, p.y1 + (normVector.y * 15) + perpVector.y);
	// 			ctx.lineTo(p.x2 - (normVector.x * 15) + perpVector.x, p.y2 - (normVector.y * 15) + perpVector.y);
	// 			ctx.closePath();
	// 			ctx.lineWidth = this.strokeWidth != null ? this.strokeWidth : 0;
	// 			ctx.strokeStyle = 'black';
	// 			ctx.stroke();
	// 			ctx.beginPath();
	// 			ctx.moveTo(p.x1 + (normVector.x * 15) - perpVector.x, p.y1 + (normVector.y * 15) - perpVector.y);
	// 			ctx.lineTo(p.x2 - (normVector.x * 15) - perpVector.x, p.y2 - (normVector.y * 15) - perpVector.y);
	// 			ctx.closePath();
	// 			ctx.lineWidth = this.strokeWidth != null ? this.strokeWidth : 0;
	// 			ctx.strokeStyle = 'black';
	// 			ctx.stroke();
	// 			break;
	// 		case BondType.triple:
	// 			perpVector = new fabric.Point(perpVector.x * 6, perpVector.y * 6);
	// 			ctx.beginPath();
	// 			ctx.moveTo(p.x1 + (normVector.x * 15) + perpVector.x, p.y1 + (normVector.y * 15) + perpVector.y);
	// 			ctx.lineTo(p.x2 - (normVector.x * 15) + perpVector.x, p.y2 - (normVector.y * 15) + perpVector.y);
	// 			ctx.closePath();
	// 			ctx.lineWidth = this.strokeWidth != null ? this.strokeWidth : 0;
	// 			ctx.strokeStyle = 'black';
	// 			ctx.stroke();
	// 			ctx.beginPath();
	// 			ctx.moveTo(p.x1 + (normVector.x * 15) - perpVector.x, p.y1 + (normVector.y * 15) - perpVector.y);
	// 			ctx.lineTo(p.x2 - (normVector.x * 15) - perpVector.x, p.y2 - (normVector.y * 15) - perpVector.y);
	// 			ctx.closePath();
	// 			ctx.lineWidth = this.strokeWidth != null ? this.strokeWidth : 0;
	// 			ctx.strokeStyle = 'black';
	// 			ctx.stroke();
	// 			super._render(ctx);
	// 			break;
	// 		case BondType.lonePair:
	// 			//no bond
	// 			break;
	// 		case BondType.solid:
	// 			perpVector = new fabric.Point(perpVector.x * 6, perpVector.y * 6);
	// 			ctx.beginPath();
	// 			ctx.moveTo(p.x1 + (normVector.x * 15), p.y1 + (normVector.y * 15));
	// 			ctx.lineTo(p.x2 - (normVector.x * 15) + perpVector.x, p.y2 - (normVector.y * 15) + perpVector.y);
	// 			ctx.lineTo(p.x2 - (normVector.x * 15) - perpVector.x, p.y2 - (normVector.y * 15) - perpVector.y);
	// 			ctx.closePath();
	// 			ctx.fillStyle = 'black';
	// 			ctx.fill();

	// 			break;	
	// 		case BondType.dashed:
	// 			perpVector = new fabric.Point(perpVector.x * 6, perpVector.y * 6);
	// 			ctx.beginPath();
	// 			ctx.moveTo(p.x1 + (normVector.x * 15), p.y1 + (normVector.y * 15));
	// 			ctx.lineTo(p.x2 - (normVector.x * 15) + perpVector.x, p.y2 - (normVector.y * 15) + perpVector.y);
	// 			ctx.lineTo(p.x2 - (normVector.x * 15) - perpVector.x, p.y2 - (normVector.y * 15) - perpVector.y);
	// 			ctx.closePath();
	// 			let gradient = ctx.createLinearGradient(p.x2 - (normVector.x * 15), p.y2 - (normVector.y * 15),p.x1 + (normVector.x * 15), p.y1 + (normVector.y * 15));
	// 			gradient.addColorStop(0, 'black');
	// 			gradient.addColorStop(0.1, 'black');
	// 			gradient.addColorStop(0.1, 'white');
	// 			gradient.addColorStop(0.2, 'white');
	// 			gradient.addColorStop(0.2, 'black');
	// 			gradient.addColorStop(0.3, 'black');
	// 			gradient.addColorStop(0.3, 'white');
	// 			gradient.addColorStop(0.4, 'white');
	// 			gradient.addColorStop(0.4, 'black');
	// 			gradient.addColorStop(0.5, 'black');
	// 			gradient.addColorStop(0.5, 'white');
	// 			gradient.addColorStop(0.6, 'white');
	// 			gradient.addColorStop(0.6, 'black');
	// 			gradient.addColorStop(0.7, 'black');
	// 			gradient.addColorStop(0.7, 'white');
	// 			gradient.addColorStop(0.8, 'white');
	// 			gradient.addColorStop(0.8, 'black');
	// 			gradient.addColorStop(0.9, 'black');
	// 			gradient.addColorStop(0.9, 'white');
	// 			gradient.addColorStop(1, 'white');
	// 			ctx.fillStyle = gradient
	// 			ctx.fill();

	// 			break;
	// 		default:
	// 			super._render(ctx);
	// 			break;
	// 	}
	// }

	// mouseOverObject(ev:fabric.IEvent){

	// 	console.log('mouse over connector');
	// 	// this.canvas.add(this._ellipse);
	// 	// this._ellipse.sendToBack();
	// 	let canvas = this.canvas;
	// 	this._selectableCircle.animate('opacity',1, {
	// 		from:0,
	// 		duration:100,
	// 		onChange: canvas?.renderAll.bind(canvas)
	// 	});

	// }

	// mouseOutObject(ev:fabric.IEvent){

	// 	this._selectableCircle.animate('opacity',0, {
	// 		from:1,
	// 		duration:100,
	// 		onChange: this.canvas?.renderAll.bind(this.canvas)

	// 	});

	// } 
}




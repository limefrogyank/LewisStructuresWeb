import { Subject, BehaviorSubject, Observable, Subscription } from 'rxjs';
import { Connector } from "./connector";
//import { settingsService } from './lewisStructureCanvas';
import { Vertex } from './vertex';
import { BondType, InteractionMode, SettingsService } from './service/settingsService';
//import { SettingsService} from './service/settingsService';
import { SVG, ForeignObject as SvgForeignObject, Ellipse as SvgEllipse, Circle as SvgCircle, G as SvgGroup, Runner, Svg, Text as SvgText, Element }
    from '@svgdotjs/svg.js';
import { IDisposable, Position } from './interfaces';
import { hoverColor } from './constants';
import { LonePair } from './lonePair';
import { container } from 'tsyringe';

export interface IFormalChargeOptions {
    owner: Vertex;
    radians?: number;
    molecule: Kekule.Molecule;
    svg: Svg;
    charge: Kekule.ChemMarker.Charge;
}

export class FormalCharge implements IDisposable {

    static circleRadius: number = 6;
    static chargeDistance: number = 5;

    //static longRadius: number = 15;
    static extraMargin: number = 2; //8

    public owner: Vertex;
    private _ownerSubscription: Subscription;

    private _svg: Svg;
    private _group: SvgGroup;
    private _circle: SvgCircle;
    private _text: SvgText;
    private _selectionCircle: SvgCircle;
    public radians: number;

    private _mouseMoveEventRef;
    private _mouseUpEventRef;

    private _position$: Subject<Position>;
    public Position$: Observable<Position>;

    private _molecule: Kekule.Molecule;
    private _charge: Kekule.ChemMarker.Charge;

    private settingsService: SettingsService;// = container.resolve(SettingsService);

    constructor(options: IFormalChargeOptions) {

        
        this._svg = options.svg;
        this.settingsService = container.resolve<SettingsService>((this._svg as any).tag);

        // this._svg.circle(FormalCharge.circleRadius * 2)
        //     .cx(0)
        //     .cy(FormalCharge.chargeDistance)
        //     .stroke('#000000')
        //     .fill('#ffffff')
        //     .attr({'stroke-width':1}) ;
        // this._svg.text(options.charge.value.toString())
        //     .font({size:8})
        //     .x(0)
        //     .cy(FormalCharge.chargeDistance )
        //     .stroke('#000000')

        //     .attr({'text-anchor':'middle', 'alignment-baseline':'middle'});


        this._group = this._svg.group().attr("aria-label", "Formal Charge");
        this._circle = this._group.circle(FormalCharge.circleRadius * 2)
            .cx(0)
            .cy(FormalCharge.chargeDistance)
            .stroke('#000000')
            .fill('#ffffff00')
            .attr({ 'stroke-width': 0.5 });
        this._text = this._group.text(this.numberToCharge(options.charge.value))
            .font({ size: 9, family: 'sans-serif' })
            .x(0)
            .cy(FormalCharge.chargeDistance)
            //.stroke('#000000')
            .attr({ 'text-anchor': 'middle', 'alignment-baseline': 'middle' });

        this._selectionCircle = this._group.circle(FormalCharge.circleRadius * 2 + 1)
            .cx(0)
            .cy(FormalCharge.chargeDistance)
            .attr({ 'fill-opacity': 0 })
            .stroke({ color: hoverColor, width: 1, opacity: 0 })
            .filterWith((add) => {
                add.gaussianBlur(1, 1);
            });
        this._selectionCircle.addClass("interactive");

        this.owner = options.owner;
        this.radians = options.radians != null ? options.radians : 0;
        this._molecule = options.molecule;
        //this._electrons = new Kekule.ChemMarker.UnbondedElectronSet();
        this._charge = options.charge;
        //this.owner.atom.appendMarker(this._electrons);  // GOING TO ADD LONE PAIR TO KEKULE MODEL BEFORE USING THIS CLASS.

        this.moveUsingRadians(this.radians);




        this._ownerSubscription = this.owner.Position$.subscribe(position => {
            if (this.radians == null) {
                return;
            }
            //console.log(this.radians);
            let vect: Position = { x: Math.cos(this.radians), y: Math.sin(this.radians) };



            this._group
                .untransform()
                .rotate(this.radians / Math.PI / 2 * 360)
                .translate(position.x, position.y)
                .translate(vect.x * (LonePair.extraMargin + Vertex.circleRadius), vect.y * (LonePair.extraMargin + Vertex.circleRadius));



            this._charge.coord2D = {
                x: position.x + (vect.x * (LonePair.extraMargin + Vertex.circleRadius)),
                y: position.y + (vect.y * (LonePair.extraMargin + Vertex.circleRadius))
            };

            //this._svg.fire('change', this);

        });



        this._group.mouseover(this.mouseOver.bind(this));
        this._group.mouseout(this.mouseOut.bind(this));

        this._group.mousedown(this.mouseDown.bind(this));
        //this._group.move(this.onObjectMoving.bind(this));


    }

    private numberToCharge(number: number): string {
        if (number == 0) {
            return "";
        } else if (number == 1) {
            return "+";
        } else if (number == -1) {
            return "-"
        } else if (number > 1) {
            return number.toString() + "+";
        } else {
            return Math.abs(number).toString() + "-";
        }

    }

    public updateCharge(charge: number) {

        this._text.text(this.numberToCharge(charge));
    }

    public updateKekulePosition(x: number, y: number) {
        this._charge.coord2D = { x: x, y: y };
    }


    dispose() {
        this.owner.removeAttachment(this);
        this.owner.atom.removeMarker(this._charge);

        this._circle.remove();
        this._text.remove();
        this._group.remove();
    }

    mouseDown(ev: MouseEvent) {
        if (ev.button != 0) {
            ev.preventDefault();
            return;
        }
        ev.stopPropagation();
        console.log("formal charge mousedown!");


        if (this.settingsService.isMoveable) {
            this._mouseMoveEventRef = this.mouseMoveBondDrawing.bind(this);
            window.addEventListener('pointermove', this._mouseMoveEventRef);
            this._mouseUpEventRef = this.mouseUp.bind(this);
            window.addEventListener('pointerup', this._mouseUpEventRef);

        } else if (this.settingsService.isEraseMode) {
            this.owner.removeAttachment(this);
            this._ownerSubscription.unsubscribe();
            this.dispose();
            this._svg.fire("change", this);
        } else {
            // normally, you'd update via vertex, but it makes sense to change charge on the formal charge, too.
            this._charge.value += this.settingsService.currentBondType == BondType.positive ? 1 : -1;
            this.owner.atom.setCharge(this._charge.value);
            //console.log(chargeMarker.value);
            if (this._charge.value == 0) {
                //this.atom.removeMarker(chargeMarker);
                this.dispose();
            } else {
                this.updateCharge(this._charge.value);
            }
            this._svg.fire("change", this);
        }

    }


    mouseMoveBondDrawing(ev: PointerEvent) {
        const bounds = this._svg.node.getBoundingClientRect();
        let canvasCoords: Position = { x: ev.clientX - bounds.left, y: ev.clientY - bounds.top };
        if (canvasCoords == null) {
            return;
        }
        //this._position.next(new fabric.Point(canvasCoords.x, canvasCoords.y));
        //console.log(`lonepair pointermove: ${canvasCoords.x}, ${canvasCoords.y} `);
        if (this.settingsService.isMoveable) {

            let vertexCenter = this.owner.Position;
            let vect = { x: canvasCoords.x - vertexCenter.x, y: canvasCoords.y - vertexCenter.y };
            let length = Math.sqrt(Math.pow(vect.x, 2) + Math.pow(vect.y, 2));
            let normVect = { x: vect.x / length, y: vect.y / length };
            let angle = Math.atan2(normVect.y, normVect.x);
            this.radians = angle;

            this._group
                .untransform()
                .rotate(this.radians / Math.PI / 2 * 360)
                .translate(vertexCenter.x, vertexCenter.y)
                .translate(normVect.x * (LonePair.extraMargin + Vertex.circleRadius), normVect.y * (LonePair.extraMargin + Vertex.circleRadius));

            this._text.untransform();
            this._text.rotate(-this.radians / Math.PI / 2 * 360);

            this._charge.coord2D = { x: vertexCenter.x + (normVect.x * (LonePair.extraMargin + Vertex.circleRadius)), y: vertexCenter.y + (normVect.y * (LonePair.extraMargin + Vertex.circleRadius)) };
        } else {
            // this._tempLine.setLineEndpoint(canvasCoords.x, canvasCoords.y);

        }

    }

    public moveUsingCoord(pos: Position) {
        let vertexCenter = this.owner.Position;
        let vect = { x: pos.x - vertexCenter.x, y: pos.y - vertexCenter.y };
        let length = Math.sqrt(Math.pow(vect.x, 2) + Math.pow(vect.y, 2));
        let normVect = { x: vect.x / length, y: vect.y / length };
        let angle = Math.atan2(normVect.y, normVect.x);
        this.radians = angle;

        this._group
            .untransform()
            .rotate(this.radians / Math.PI / 2 * 360)
            .translate(vertexCenter.x, vertexCenter.y)
            .translate(normVect.x * (LonePair.extraMargin + Vertex.circleRadius), normVect.y * (LonePair.extraMargin + Vertex.circleRadius));

        this._charge.coord2D = { x: vertexCenter.x + (normVect.x * (LonePair.extraMargin + Vertex.circleRadius)), y: vertexCenter.y + (normVect.y * (LonePair.extraMargin + Vertex.circleRadius)) };
    }

    public moveUsingRadians(radians: number) {
        this.radians = radians;
        let center = this.owner.Position;
        let normx = Math.cos(radians);
        let normy = Math.sin(radians);


        this._group
            .untransform()
            .rotate(this.radians / Math.PI / 2 * 360)
            .translate(center.x, center.y)
            .translate(normx * (LonePair.extraMargin + Vertex.circleRadius), normy * (LonePair.extraMargin + Vertex.circleRadius));

        this._charge.coord2D = {
            x: center.x + (normx * (LonePair.extraMargin + Vertex.circleRadius)),
            y: center.y + (normy * (LonePair.extraMargin + Vertex.circleRadius))
        };
    }

    // public reportPositionChanged(x :number, y:number){
    // 	this._position.next(new fabric.Point(x, y));
    // }

    mouseUp(ev: PointerEvent) {
        window.removeEventListener('pointermove', this._mouseMoveEventRef);
        window.removeEventListener('pointerup', this._mouseUpEventRef);
        this._svg.fire('change', this);

    }

    mouseOver(ev: MouseEvent) {
        this._selectionCircle.animate(200, 0, 'now').attr({ 'stroke-opacity': 1 });
    }

    mouseOut(ev: MouseEvent) {
        this._selectionCircle.animate(200, 0, 'now').attr({ 'stroke-opacity': 0 });
    }
}


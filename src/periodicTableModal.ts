import {FASTElement, customElement, attr, html, ref, css,when} from '@microsoft/fast-element';
import { ColumnDefinition } from '@microsoft/fast-foundation';
import { provideFluentDesignSystem,fluentButton, Button, fluentDialog, Dialog, fluentDataGrid, DataGrid, fluentDataGridRow, DataGridRow, DataGridCell, fluentDataGridCell } from '@fluentui/web-components';
import {periodicTableData} from './elements';
import {ChemicalElementButton, chemicalElementButton} from './elementButton';
import {FluentDialogEx} from './FAST/fluentDialogEx';


provideFluentDesignSystem()
.register(fluentButton())
.register(fluentDialog())
.register(fluentDataGrid())
.register(fluentDataGridRow())
.register(fluentDataGridCell())
.register(chemicalElementButton());

Button;
Dialog;
FluentDialogEx;
DataGrid;
ChemicalElementButton;

const template = html<PeriodicTableModal>`
<!-- <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-+0n0xVW2eSR5OomGNYDnhzAbDsOXxcvSN1TPprVMTNDbiYZCxYbOOl7+AMvyTG2x" crossorigin="anonymous" /> -->

<fluent-design-system-provider use-defaults>
	<fluent-dialog ${ref("mainModal")} modal ?hidden="${x=>!x.visible}" style="width:auto;"> 
		<div class="modal-header">
        	<h5 class="modal-title" id="exampleModalLabel">Periodic Table Element Picker</h5>
      	</div>

		<div class="modal-body" >
			<div style="margin-left:auto;margin-right:auto;">
				<fluent-data-grid ${ref("periodicTableGrid")} grid-template-columns="34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px" ></fluent-data-grid>
			</div>
		</div>
		<div class="modal-footer">
			<fluent-button class="btn btn-primary" appearance="accent" primary @click="${x=>x.cancelClick()}">Close</fluent-button>
		</div>
	</fluent-dialog-ex>


</fluent-design-system-provider>
`;

const styles = css`
  .hidden {
    display: none;
  }

`;

@customElement({
	name: 'periodic-table-modal',
	template,
	styles 
})
export class PeriodicTableModal extends FASTElement {
	@attr({ mode: 'boolean' }) visible: boolean = false;
	@attr({mode: 'boolean'}) hideTransitionMetals:boolean=true;

	cancelButton!: HTMLButtonElement;

	overlay!: HTMLDivElement;
	mainModal!:HTMLDivElement;

	periodicTableGrid!: DataGrid;

	connectedCallback(){
		super.connectedCallback();

		this.overlay = this.ownerDocument.createElement('div');
		this.overlay.classList.add('modal-backdrop');
		this.overlay.classList.add('fade');

		let elementButtons = this.querySelectorAll(".element");
		// for (let i=0; i < elementButtons.length; i++){
		// 	elementButtons.item(i).addEventListener('click', )
		// }
		// this.cancelButton.onclick = (ev) => {
		// 	this.visible=false;
		// 	this.$emit('dismiss');
		// };
		

		let elements = periodicTableData.elements;
		var sortedElements = new Array<any>();
		var row = new Map<number,any>();
		let groupMapping: Map<number,string> = new Map<number,string>([
			[1,'IA'],
			[2,'IIA'],
			[3,'IIIB'],
			[4,'IVB'],
			[5,'VB'],
			[6,'VIB'],
			[7,'VIIB'],
			[8,'VIIIB'],
			[9,'VIIIB'],
			[10,'VIIIB'],
			[11,'IB'],
			[12,'IIB'],
			[13,'IIIA'],
			[14,'IVA'],
			[15,'VA'],
			[16,'VIA'],
			[17,'VIIA'],
			[18,'VIIIA']
		]);
		for (let period = 1; period < (this.hideTransitionMetals ? 7 : 11); period++){
			for (let group = 1; group<=18; group++){
				let found = elements.find(x=>x.xpos == group && x.ypos == period);
				if (found !== undefined){
					console.log(found);
					row.set(group,found);
				}else{
					row.set(group, {'number': -1});
				}
			}
			sortedElements.push(row);
			row = new Map<number,any>();
		}

		this.periodicTableGrid.rowsData = sortedElements;

		const buttonCellTemplate = html<DataGridCell>`
			<template>
				${when(y =>
				y.rowData === null || y.columnDefinition === null || y.columnDefinition.columnDataKey === null
				? false
				: y.columnDefinition.columnDataKey != "0"&& (y.rowData as Map<number,any>).get(+y.columnDefinition.columnDataKey) != null && (y.rowData as Map<number,any>).get(+y.columnDefinition.columnDataKey).number != -1, html<DataGridCell>`
				<fluent-element-button style="padding:0;" @click="${x=> x.rowData === null || x.columnDefinition === null || x.columnDefinition.columnDataKey === null
							? null
							: this.$emit('change', (x.rowData as Map<number,any>).get(+x.columnDefinition.columnDataKey).symbol) }">
						${x =>
							x.rowData === null || x.columnDefinition === null || x.columnDefinition.columnDataKey === null
							? null
							: (x.rowData as Map<number,any>).get(+x.columnDefinition.columnDataKey).symbol}
				</fluent-element-button>
				`)}
			</template>
			`;
			

			const customCellItemTemplate = html`
			<fluent-data-grid-cell
				style="padding:0;"
				grid-column="${(x, c) => c.index + 1}"
				:rowData="${(x, c) => c.parent.rowData}"
				:columnDefinition="${x => x}"
			></fluent-data-grid-cell>
			`;

		const customRowItemTemplate = html`
		<fluent-data-grid-row
					style="padding:0;border-bottom:0;"
			:rowData="${x => x}"
			:cellItemTemplate="${(x, c) => c.parent.cellItemTemplate}"
			:headerCellItemTemplate="${(x, c) => c.parent.headerCellItemTemplate}"
		></fluent-data-grid-row>
		`;

		const headerCellTemplate = html`
			<fluent-data-grid-cell style="width:32px;"
				cell-type="columnheader"
				grid-column="${(x, c) => c.index + 1}"
				:columnDefinition="${x => x}"
			></fluent-data-grid-cell>
		`;

		let colDefs:ColumnDefinition[];
		if (this.hideTransitionMetals){
			colDefs = [	
				{
					
					columnDataKey: '1',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '2',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '0',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '13',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '14',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '15',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '16',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '17',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '18',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				}
			];
		}else {
			colDefs = [	
				{
					
					columnDataKey: '1',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '2',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '3',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '4',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '5',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '6',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '7',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '8',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '9',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '10',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '11',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '12',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '13',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '14',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '15',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '16',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '17',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				},
				{
					columnDataKey: '18',
					cellTemplate: buttonCellTemplate,
					cellFocusTargetCallback: this.getFocusTarget
				}
			];
		}
		this.periodicTableGrid.columnDefinitions = colDefs;
		this.periodicTableGrid.rowItemTemplate = customRowItemTemplate;
		this.periodicTableGrid.cellItemTemplate = customCellItemTemplate;
		this.periodicTableGrid.headerCellItemTemplate = headerCellTemplate;
		
	// 	this.periodicTableGrid.cellItemTemplate = html`
	// 	<fluent-data-grid-cell 
	// 		grid-column="${(x,c)=> c.index + 1}"
	// 		:rowData="${(x,c) => {console.log(x);console.log(c.parent.rowData); return c.parent.rowData;}}"
	// 		:columnDefinition="${x => x}"
	// 	>
		
	// </fluent-data-grid-cell>
	// 	`;
	}

	visibleChanged(oldValue:boolean, newValue:boolean){
		if (this.overlay != null){
			if (newValue){		
				
				this.periodicTableGrid.focus();
				//this.ownerDocument?.body?.appendChild(this.overlay);
				//let forceReflow = this.overlay.offsetHeight;
				//this.overlay.onclick = this.mousedown.bind(this);
				//this.overlay.classList.add('show');
				//this.mainModal.classList.add('show');
			
			}else{
				//this.ownerDocument?.body?.removeChild(this.overlay);
				//let forceReflow = this.overlay.offsetHeight;
				//this.overlay.onclick= null;
				//this.overlay.classList.remove('show');
				//this.mainModal.classList.remove('show');
			}
		}
	}

	getFocusTarget(cell: DataGridCell): HTMLElement {
		return cell.querySelector('fluent-element-button') as HTMLElement;
		//return cell.querySelector('chemical-element-button') as HTMLElement;
	  }

	mousedown(ev:Event){
		this.cancelClick();
	}

	cancelClick(){
		this.visible=false;
		this.$emit('dismiss');
	}
}
  
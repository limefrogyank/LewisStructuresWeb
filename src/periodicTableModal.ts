import { FASTElement, customElement, attr, html, ref, css, when } from '@microsoft/fast-element';
import { ColumnDefinition } from '@microsoft/fast-foundation';
import "@fluentui/web-components/button.js";
import "@fluentui/web-components/dialog.js";
import { Button, Dialog } from '@fluentui/web-components';
import { periodicTableData } from './elements';
import { ChemicalElementButton } from './elementButton';
import { FluentDialogEx } from './FAST/fluentDialogEx';
import { Grid, h, html as gridHTML } from "gridjs";

// provideFluentDesignSystem()
// .register(fluentButton())
// .register(fluentDialog())
// .register(fluentDataGrid())
// .register(fluentDataGridRow())
// .register(fluentDataGridCell())
// .register(chemicalElementButton());

Button;
Dialog;
FluentDialogEx;
Grid;
ChemicalElementButton;

const template = html<PeriodicTableModal>`
<!-- <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-+0n0xVW2eSR5OomGNYDnhzAbDsOXxcvSN1TPprVMTNDbiYZCxYbOOl7+AMvyTG2x" crossorigin="anonymous" /> -->

	<fluent-dialog ${ref("mainModal")} modal  style="width:auto;"> 
		<fluent-dialog-body>
		<div class="modal-header">
        	<h5 class="modal-title" id="exampleModalLabel">Periodic Table Element Picker</h5>
      	</div>

		<div class="modal-body" >
			<div style="margin-left:auto;margin-right:auto;">
				<div ${ref("periodicTableGrid")} grid-template-columns="34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px 34px" ></div>
			</div>
		</div>
		<div class="modal-footer">
			<fluent-button class="btn btn-primary" appearance="accent" primary @click="${x => x.cancelClick()}">Close</fluent-button>
		</div>
		<fluent-dialog-body>
	</fluent-dialog>


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
	@attr({ mode: 'boolean' }) hideTransitionMetals: boolean = false;

	cancelButton!: HTMLButtonElement;

	overlay!: HTMLDivElement;
	mainModal!: Dialog;

	periodicTableGrid!: HTMLDivElement;

	connectedCallback() {
		super.connectedCallback();

		this.overlay = this.ownerDocument.createElement('div');
		this.overlay.classList.add('modal-backdrop');
		this.overlay.classList.add('fade');

		let elementButtons = this.querySelectorAll(".element");

		let elements = periodicTableData.elements;
		var sortedElements = new Array<any>();
		var row = new Array<any>();
		let groupMapping: Map<number, string> = new Map<number, string>([
			[1, 'IA'],
			[2, 'IIA'],
			[3, 'IIIB'],
			[4, 'IVB'],
			[5, 'VB'],
			[6, 'VIB'],
			[7, 'VIIB'],
			[8, 'VIIIB'],
			[9, 'VIIIB'],
			[10, 'VIIIB'],
			[11, 'IB'],
			[12, 'IIB'],
			[13, 'IIIA'],
			[14, 'IVA'],
			[15, 'VA'],
			[16, 'VIA'],
			[17, 'VIIA'],
			[18, 'VIIIA']
		]);
		// up to group 11, so that we can make group 12 an artificial space in the shortened periodic table.
		for (let period = 1; period < (this.hideTransitionMetals ? 7 : 11); period++) {
			for (let group = 1; group <= 18; group++) {
				if (this.hideTransitionMetals && group >= 3 && group <= 11) {
					continue;
				}
				let found = elements.find(x => x.xpos == group && x.ypos == period);
				if (found !== undefined) {
					row.push(found)
				} else {
					row.push({ symbol: "*" })
				}
			}
			sortedElements.push(row);
			row = new Array<any>();
		}

		const clickElementHandler = (ev: Event) => {
			this.$emit('change', (ev.target as Button).getAttribute('data-symbol'));
		};

		const formatter = (num: number) => {
			return {
				name: num !== 0 ? num.toString() : ".",
				formatter: (cell, row) => {
					if (num === 0) {
						// shortened periodic table, so we need to add a blank column between main groups.
						return gridHTML(`<div style="width:30px;height:30px;"></div>`);
					}
					if (cell.symbol === "*") {
						// blank cells like between H and He 
						return gridHTML(`<div style="width:30px;height:30px;"></div>`);
					}
					try {

						return h('element-button', {
							onClick: clickElementHandler,
							'data-symbol': cell.symbol
						}, cell.symbol);
					} catch (e) {
						return "test";
					}
					//gridHTML(`<element-button data-symbol="${cell.symbol}" @click="${clickElementHandler}" style="padding:0;width:30px;height:30px;" aria-label="${cell.name}">${cell.symbol}</element-button>`);
					// 				${x =>
					// 					x.rowData === null || x.columnDefinition === null || x.columnDefinition.columnDataKey === null
					// 					? null
					// 					: (x.rowData as Map<number,any>).get(+x.columnDefinition.columnDataKey).symbol>${cell.symbol}</element-button>`);
				}
			}
		};

		const grid = new Grid({
			style: {
				table: {
					borderSpacing: '0px'
				}
			},

			columns: this.hideTransitionMetals ?
				[formatter(1), formatter(2), formatter(0), formatter(13), formatter(14), formatter(15), formatter(16), formatter(17), formatter(18)]
				:
				[formatter(1), formatter(2), formatter(3), formatter(4), formatter(5), formatter(6), formatter(7), formatter(8), formatter(9), formatter(10), formatter(11), formatter(12), formatter(13), formatter(14), formatter(15), formatter(16), formatter(17), formatter(18)],
			data: sortedElements
		}).render(this.periodicTableGrid);

		this.periodicTableGrid.addEventListener('keydown', this.keydown.bind(this));


	}



	public show() {
		this.mainModal?.show();
	}
	public hide() {
		this.mainModal?.hide();
	}

	visibleChanged(oldValue: boolean, newValue: boolean) {
		if (this.overlay != null) {
			if (newValue) {

				this.periodicTableGrid.focus();
				//this.ownerDocument?.body?.appendChild(this.overlay);
				//let forceReflow = this.overlay.offsetHeight;
				//this.overlay.onclick = this.mousedown.bind(this);
				//this.overlay.classList.add('show');
				//this.mainModal.classList.add('show');

			} else {
				//this.ownerDocument?.body?.removeChild(this.overlay);
				//let forceReflow = this.overlay.offsetHeight;
				//this.overlay.onclick= null;
				//this.overlay.classList.remove('show');
				//this.mainModal.classList.remove('show');
			}
		}
	}

	// getFocusTarget(cell: DataGridCell): HTMLElement {
	// 	return cell.querySelector('fluent-element-button') as HTMLElement;
	// 	//return cell.querySelector('chemical-element-button') as HTMLElement;
	//   }
	keydown(ev: KeyboardEvent) {
		if (!ev.target || !(ev.target as HTMLElement)) return;
		const cell = (ev.target as HTMLElement).closest('td');
		if (!cell) return;

		const row = cell.parentElement as HTMLTableRowElement;
		const tbody = row.parentElement as HTMLTableSectionElement;
		const rowIndex = row.rowIndex;
		const cellIndex = cell.cellIndex;
		let target;
		let currentCellIndex;
		let currentRowIndex;
		switch (ev.key) {
			case "ArrowLeft":
				currentCellIndex = cellIndex - 1;
				while (!target && currentCellIndex >=0 ){
					target = row.cells[currentCellIndex] as HTMLElement;
					target = target.querySelector('element-button') as ChemicalElementButton;
					currentCellIndex--;
				}
				break;
			case "ArrowRight":
				currentCellIndex = cellIndex + 1;
				while (!target && currentCellIndex < row.cells.length ){
					target = row.cells[currentCellIndex] as HTMLElement;
					target = target.querySelector('element-button') as ChemicalElementButton;
					currentCellIndex++;
				}
				break;
			case "ArrowUp":
				// weirdly, rowIndex starts at 1 instead of 0, unlike cellIndex
				currentRowIndex = rowIndex - 2; // zero based array, so subtract 2 to get the row above the current one.
				while (!target && currentRowIndex >=0 ){
					target = tbody.rows[currentRowIndex].cells[cellIndex] as HTMLElement;
					target = target.querySelector('element-button') as ChemicalElementButton;
					currentRowIndex--;
				}
				break;
			case "ArrowDown":
				currentRowIndex = rowIndex;
				while (!target && currentRowIndex < tbody.rows.length ) {
					target = tbody.rows[currentRowIndex].cells[cellIndex] as HTMLElement;
					target = target.querySelector('element-button') as ChemicalElementButton;
					currentRowIndex++;
				}
				break;
		}
		if (target) {
			ev.preventDefault();
			//get button inside the cell and focus it
			// const button = target.querySelector('element-button') as ChemicalElementButton;
			// if (!button) return;

			target.focus();


		}
	}



	mousedown(ev: Event) {
		this.cancelClick();
	}

	cancelClick() {
		this.visible = false;
		this.$emit('dismiss');
	}
}

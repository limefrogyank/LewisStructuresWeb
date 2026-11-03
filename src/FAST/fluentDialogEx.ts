import { FASTElement, customElement, attr, html, ref, css, when, ElementStyles } from '@microsoft/fast-element';
import { dialogTemplate as template } from '@microsoft/fast-foundation';
import { Dialog, DialogStyles as styles } from '@fluentui/web-components';



Dialog;


@customElement({
  name: 'fluent-dialog-ex',
  template: html`
        <fluent-dialog>
            <slot></slot>
        </fluent-dialog>
    `,
  styles: `
  fluent-dialog {
    display: none;
  }
  fluent-dialog{
	  overflow-x:scroll;
  }  
`
})
export class FluentDialogEx extends FASTElement {


}

import {FASTElement, customElement, attr, html, ref, css,when, ElementStyles} from '@microsoft/fast-element';
import { dialogTemplate as template  } from '@microsoft/fast-foundation';
import { Dialog, dialogStyles as styles } from '@fluentui/web-components';



Dialog;

const style = css`
  .hidden {
    display: none;
  }
  .control{
	  overflow-x:scroll;
  }
  
`;

@customElement({
	name: 'fluent-dialog-ex',
 })
export class FluentDialogEx extends Dialog {


}
  
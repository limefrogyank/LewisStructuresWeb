import { ButtonStyles as oldstyles, Button} from '@fluentui/web-components';
import {  buttonTemplate as template, ButtonOptions, ElementDefinitionContext} from '@microsoft/fast-foundation';
import {FASTElement, customElement, html, css, ref, attr} from '@microsoft/fast-element';


@customElement({
    name: 'element-button',
    template: html<ChemicalElementButton>`
        <fluent-button ${ref("internalButton")}>
            <slot></slot>
        </fluent-button>
    `,
    styles: `
        fluent-button {
            min-width: 30px;
            width:30px;
            height: 30px;
            min-height:30px;
        }

        fluent-button::part(control) {
            padding: 0;
        }
    `
})
export class ChemicalElementButton extends FASTElement {
  internalButton!: Button;

  connectedCallback() {
    super.connectedCallback();

    const label = this.getAttribute("aria-label");

    if (label) {
        this.shadowRoot
            ?.querySelector("fluent-button")
            ?.setAttribute("aria-label", label);
    }
}

  focus(){
    this.internalButton.focus();
  }
}


